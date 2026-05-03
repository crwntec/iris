package api

import (
	"net/http"

	"github.com/crwntec/iris/backend/internal/api/handler"
	"github.com/crwntec/iris/backend/internal/api/middleware"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/valkey-io/valkey-go"
)

func NewRouter(vk valkey.Client, config config.Config) http.Handler {
	mux := http.NewServeMux()

	authHandler := handler.NewAuthHandler(vk, config)
	untisHandler := handler.NewUntisHandler(vk, config)

	// Public
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /auth/login", authHandler.Login)

	// Protected
	mux.Handle("GET /untis/timetable", middleware.AuthMiddleware(http.HandlerFunc(untisHandler.GetTimetable), config))
	mux.Handle("GET /untis/absences", middleware.AuthMiddleware(http.HandlerFunc(untisHandler.GetAbsences), config))
	return middleware.CORS(mux)
}
