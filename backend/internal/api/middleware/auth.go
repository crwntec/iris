package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/crwntec/iris/backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.Handler, conf config.Config, adminRequired bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if !strings.HasPrefix(token, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(token, "Bearer ")
		if tokenStr == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		parsed, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(conf.JWTSecret), nil
		})
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, ok := parsed.Claims.(jwt.MapClaims)
		if !ok || !parsed.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), "username", claims["username"])
		isAdmin := claims["username"] == conf.AdminName
		if adminRequired && !isAdmin {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if isAdmin {
			ctx = context.WithValue(ctx, "admin", true)
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
