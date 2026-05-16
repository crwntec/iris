package api

import (
	"log/slog"
	"net/http"

	"github.com/crwntec/iris/backend/internal/api/handler"
	"github.com/crwntec/iris/backend/internal/api/middleware"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/valkey-io/valkey-go"
)

func NewRouter(vk valkey.Client, config config.Config) http.Handler {
	mux := http.NewServeMux()

	authHandler := handler.NewAuthHandler(vk, config)
	untisHandler := handler.NewUntisHandler(vk, config)
	pushHandler := handler.NewPushHandler(store.New(vk), config)

	// Public
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /auth/login", authHandler.Login)

	// Protected
	mux.Handle("GET /untis/timetable", middleware.AuthMiddleware(http.HandlerFunc(untisHandler.GetTimetable), config))
	mux.Handle("GET /untis/absences", middleware.AuthMiddleware(http.HandlerFunc(untisHandler.GetAbsences), config))
	mux.Handle("POST /push/subscribe", middleware.AuthMiddleware(http.HandlerFunc(pushHandler.Subscribe), config))
	mux.Handle("POST /push/unsubscribe", middleware.AuthMiddleware(http.HandlerFunc(pushHandler.Unsubscribe), config))
	mux.Handle(
		"POST /push/test",
		middleware.AuthMiddleware(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				username, _ := r.Context().Value("username").(string)
				slog.Info("sending test notification to: " + username)
				err := pushHandler.SendNotification(
					r.Context(),
					username,
					"Test Notification",
					"Push works!",
				)

				if err != nil {
					http.Error(w, err.Error(), 500)
					return
				}

				w.WriteHeader(http.StatusNoContent)
			}),
			config,
		),
	)
	return middleware.CORS(mux)
}
