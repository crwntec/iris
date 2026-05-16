package config

import (
	"os"

	"github.com/crwntec/iris/backend/internal/untis"
	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	ServerPort string
	ValkeyURL  string
	JWTSecret  string
	AESKey     string

	UntisConfig     untis.Config
	VAPIDPublicKey  string
	VAPIDPrivateKey string
}

func Load() Config {
	jwtSecret := mustGetEnv("JWT_SECRET")
	aesKey := mustGetEnv("AES_KEY")
	// AES-256 braucht exakt 32 Bytes
	if len(aesKey) != 32 {
		panic("AES_KEY must be exactly 32 characters")
	}
	return Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		ValkeyURL:  getEnv("VALKEY_URL", ""),
		JWTSecret:  jwtSecret,
		AESKey:     aesKey,
		UntisConfig: untis.Config{
			BaseURL:    mustGetEnv("BASE_URL"),
			SchoolName: mustGetEnv("SCHOOL_NAME"),
		},
		VAPIDPublicKey:  mustGetEnv("VAPID_PUBLIC_KEY"),
		VAPIDPrivateKey: mustGetEnv("VAPID_PRIVATE_KEY"),
	}
}

func mustGetEnv(key string) string {
	val, ok := os.LookupEnv(key)
	if !ok || val == "" {
		panic("missing required env var: " + key)
	}
	return val
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
