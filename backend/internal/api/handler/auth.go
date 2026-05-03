package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/crwntec/iris/backend/internal"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/untis"
	"github.com/golang-jwt/jwt/v5"
	"github.com/valkey-io/valkey-go"
)

type AuthData struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
type AuthHandler struct {
	vk   valkey.Client
	conf config.Config
}

func NewAuthHandler(vk valkey.Client, conf config.Config) *AuthHandler {
	return &AuthHandler{vk: vk, conf: conf}
}

/* Route handler for logging into WebUntis and storing the session in the database */
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var d AuthData
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if d.Username == "" || d.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}
	// Create WebUntis client and log in
	client, err := untis.NewClient(h.conf.UntisConfig)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = client.Login(d.Username, d.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	sessionID := client.Session.SessionID
	info, err := client.GetStaticInfo()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	cypheredPassword, err := internal.EncryptAES([]byte(d.Password), []byte(h.conf.AESKey))
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	encodedPassword := base64.StdEncoding.EncodeToString(cypheredPassword)
	err = h.vk.Do(r.Context(), h.vk.B().Hset().Key("user:"+d.Username).
		FieldValue().
		FieldValue("sessionID", sessionID).
		FieldValue("token", client.Session.Token).
		FieldValue("password", encodedPassword).
		FieldValue("schoolID", client.Session.SchoolID).
		FieldValue("userID", fmt.Sprintf("%d", info.UserID)).
		Build()).Error()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Encode information in JWT
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username":  d.Username,
		"sessionID": sessionID,
	}).SignedString([]byte(h.conf.JWTSecret))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"token":  token,
	})
}
