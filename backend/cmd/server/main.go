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
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/valkey-io/valkey-go"
)

func main() {
	cfg := config.Load()
	client, err := valkey.NewClient(valkey.ClientOption{InitAddress: []string{cfg.ValkeyURL}})
	if err != nil {
		panic(err)
	}
	defer client.Close()

	if err != nil {
		slog.Error("failed to create valkey client", "err", err)
		os.Exit(1)
	}
	slog.Info("valkey client created", "url", cfg.ValkeyURL)
	handler := api.NewRouter(client, cfg)
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: handler,
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
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
