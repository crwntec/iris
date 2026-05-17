package api

import (
	"net/http"

	"github.com/crwntec/iris/backend/internal/api/handler"
	"github.com/crwntec/iris/backend/internal/api/middleware"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/valkey-io/valkey-go"
)

func NewRouter(vk valkey.Client, config config.Config) http.Handler {
	mux := http.NewServeMux()
	st := store.New(vk)

	authHandler := handler.NewAuthHandler(vk, config)
	untisHandler := handler.NewUntisHandler(st, config)
	pushHandler := handler.NewPushHandler(st, config)

	// Public
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /auth/login", authHandler.Login)

	// Protected
	protected := func(h http.HandlerFunc) http.Handler {
		return middleware.AuthMiddleware(http.HandlerFunc(h), config)
	}
	mux.Handle("GET /untis/timetable", protected(untisHandler.GetTimetable))
	mux.Handle("GET /untis/absences", protected(untisHandler.GetAbsences))
	mux.Handle("GET /untis/changelog", protected(untisHandler.GetChanges))
	mux.Handle("POST /push/subscribe", protected(pushHandler.Subscribe))
	mux.Handle("POST /push/unsubscribe", protected(pushHandler.Unsubscribe))
	mux.Handle("POST /push/test", protected(pushHandler.Test))

	return middleware.CORS(mux)
}
