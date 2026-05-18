package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/crwntec/iris/backend/internal/api"
	"github.com/crwntec/iris/backend/internal/api/handler"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/polling"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/valkey-io/valkey-go"
)

func main() {
	cfg := config.Load()

	client, err := valkey.NewClient(
		valkey.ClientOption{
			InitAddress: []string{cfg.ValkeyURL},
		},
	)
	if err != nil {
		slog.Error("failed to connect to valkey", "err", err)
		os.Exit(1)
	}
	defer client.Close()

	slog.Info("valkey client created", "url", cfg.ValkeyURL)

	st := store.New(client)

	router := api.NewRouter(client, cfg)

	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			if err == http.ErrServerClosed {
				return
			}

			slog.Error("failed to start HTTP server", "err", err)
		}
	}()

	slog.Info("server started", "port", cfg.ServerPort)

	pushHandler := handler.NewPushHandler(st, cfg)

	pollingService := polling.NewService(
		context.Background(),
		cfg,
		st,
		pushHandler,
		5*time.Minute,
	)

	go pollingService.Start()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("failed to shutdown server", "err", err)
	}
}
