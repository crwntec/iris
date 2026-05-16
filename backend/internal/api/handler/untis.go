package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/crwntec/iris/backend/internal"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/crwntec/iris/backend/internal/untis"
	"github.com/golang-jwt/jwt/v5"
	"github.com/valkey-io/valkey-go"
)

// ── gemeinsame Basis ──────────────────────────────────────────

type base struct {
	store *store.Store
	conf  config.Config
}

func (b *base) clientFromRequest(r *http.Request) (*untis.Client, untis.UntisInfo, error) {
	username, ok := r.Context().Value("username").(string)
	if !ok {
		return nil, untis.UntisInfo{}, fmt.Errorf("unauthorized")
	}
	result, err := b.store.HGetAll(r.Context(), "user:"+username)
	if err != nil {
		return nil, untis.UntisInfo{}, fmt.Errorf("session not found")
	}
	decoded, err := base64.StdEncoding.DecodeString(result["password"])
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	password, err := internal.DecryptAES(decoded, []byte(b.conf.AESKey))
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	client, err := untis.ClientFromSession(
		b.conf.UntisConfig,
		result["token"], result["sessionID"], result["schoolID"],
		username, string(password),
	)
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	userID, _ := strconv.Atoi(result["userID"])
	return client, untis.UntisInfo{UserID: userID}, nil
}

func (b *base) updateSession(ctx context.Context, username string, client *untis.Client) {
	b.store.HSet(ctx, "user:"+username, map[string]string{
		"sessionID": client.Session.SessionID,
		"token":     client.Session.Token,
	})
}

// ── AuthHandler ───────────────────────────────────────────────

type AuthHandler struct{ base }

func NewAuthHandler(vk valkey.Client, conf config.Config) *AuthHandler {
	return &AuthHandler{base{store: store.New(vk), conf: conf}}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var d struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.Username == "" || d.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	client, err := untis.NewClient(h.conf.UntisConfig)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := client.Login(d.Username, d.Password); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	info, err := client.GetStaticInfo()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	ciphered, err := internal.EncryptAES([]byte(d.Password), []byte(h.conf.AESKey))
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	fields := map[string]string{
		"sessionID": client.Session.SessionID,
		"token":     client.Session.Token,
		"password":  base64.StdEncoding.EncodeToString(ciphered),
		"schoolID":  client.Session.SchoolID,
		"userID":    fmt.Sprintf("%d", info.UserID),
	}
	if err := h.store.HSet(r.Context(), "user:"+d.Username, fields); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username":  d.Username,
		"sessionID": client.Session.SessionID,
	}).SignedString([]byte(h.conf.JWTSecret))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "token": token})
}

// ── UntisHandler ──────────────────────────────────────────────

type UntisHandler struct{ base }

func NewUntisHandler(vk valkey.Client, conf config.Config) *UntisHandler {
	return &UntisHandler{base{store: store.New(vk), conf: conf}}
}

func (h *UntisHandler) GetTimetable(w http.ResponseWriter, r *http.Request) {
	start, end := r.URL.Query().Get("start"), r.URL.Query().Get("end")
	if !validDate(start) || !validDate(end) {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}
	client, info, err := h.clientFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	tt, err := client.GetTimetable(r.Context(), info, start, end)
	if err != nil {
		http.Error(w, "internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	username, _ := r.Context().Value("username").(string)
	h.updateSession(r.Context(), username, client)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tt)
}

func (h *UntisHandler) GetAbsences(w http.ResponseWriter, r *http.Request) {
	start, end := r.URL.Query().Get("start"), r.URL.Query().Get("end")
	startP, err1 := time.Parse("2006-01-02", start)
	endP, err2 := time.Parse("2006-01-02", end)
	if err1 != nil || err2 != nil {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}
	client, info, err := h.clientFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	absences, err := client.GetAbsences(r.Context(), info,
		startP.Format("20060102"), endP.Format("20060102"))
	if err != nil {
		http.Error(w, "internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	username, _ := r.Context().Value("username").(string)
	h.updateSession(r.Context(), username, client)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(absences)
}

func validDate(s string) bool {
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}
