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

	authHandler := handler.NewAuthHandler(st, config)
	untisHandler := handler.NewUntisHandler(st, config)
	pushHandler := handler.NewPushHandler(st, config)
	dashboardHandler := handler.NewDashboardHandler(st, config)

	// Public
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.HandleFunc("GET /push/vapid-public-key", pushHandler.GetVapidPublicKey)

	// Protected
	protected := func(h http.HandlerFunc, admin bool) http.Handler {
		return middleware.AuthMiddleware(http.HandlerFunc(h), config, admin)
	}
	mux.Handle("GET /untis/timetable", protected(untisHandler.GetTimetable, false))
	mux.Handle("GET /untis/absences", protected(untisHandler.GetAbsences, false))
	mux.Handle("GET /untis/changelog", protected(untisHandler.GetChanges, false))
	mux.Handle("POST /push/subscribe", protected(pushHandler.Subscribe, false))
	mux.Handle("POST /push/unsubscribe", protected(pushHandler.Unsubscribe, false))
	mux.Handle("POST /push/test", protected(pushHandler.Test, false))
	// Admin Protected
	mux.Handle("GET /admin/dashboard", protected(dashboardHandler.Get, true))
	return middleware.CORS(mux)
}
