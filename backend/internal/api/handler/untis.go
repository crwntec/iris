package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/crwntec/iris/backend/internal"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/crwntec/iris/backend/internal/untis"
	"github.com/golang-jwt/jwt/v5"
	"github.com/valkey-io/valkey-go"
)

// ── shared base ───────────────────────────────────────────────

type base struct {
	store *store.Store
	conf  config.Config
}

func (b *base) session(r *http.Request) (*untis.AuthenticatedSession, error) {
	username, ok := r.Context().Value("username").(string)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}
	return untis.AuthenticatedSessionFromStore(
		r.Context(),
		b.store,
		b.conf.UntisBaseURL,
		b.conf.UntisSchoolName,
		b.conf.AESKey,
		username,
	)
}

func (b *base) persistSession(ctx context.Context, s *untis.AuthenticatedSession) {
	b.store.HSet(ctx, "user:"+s.Username, map[string]string{
		"sessionID": s.Client.Session.SessionID,
		"token":     s.Client.Session.Token,
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

	client, err := untis.NewClient(untis.Config{
		BaseURL:    h.conf.UntisBaseURL,
		SchoolName: h.conf.UntisSchoolName,
	})
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

	if err := h.store.HSet(r.Context(), "user:"+d.Username, map[string]string{
		"sessionID": client.Session.SessionID,
		"token":     client.Session.Token,
		"password":  base64.StdEncoding.EncodeToString(ciphered),
		"schoolID":  client.Session.SchoolID,
		"userID":    fmt.Sprintf("%d", info.UserID),
	}); err != nil {
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

func NewUntisHandler(st *store.Store, conf config.Config) *UntisHandler {
	return &UntisHandler{base{store: st, conf: conf}}
}

func (h *UntisHandler) GetTimetable(w http.ResponseWriter, r *http.Request) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	if _, err := time.Parse("2006-01-02", start); err != nil {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}
	if _, err := time.Parse("2006-01-02", end); err != nil {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}

	s, err := h.session(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	tt, err := s.Client.GetTimetable(r.Context(), s.Info, start, end)
	if err != nil {
		http.Error(w, "internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	h.persistSession(r.Context(), s)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tt)
}

func (h *UntisHandler) GetAbsences(w http.ResponseWriter, r *http.Request) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	startParsed, err := time.Parse("2006-01-02", start)
	if err != nil {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}
	endParsed, err := time.Parse("2006-01-02", end)
	if err != nil {
		http.Error(w, "Malformed request", http.StatusBadRequest)
		return
	}

	s, err := h.session(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	absences, err := s.Client.GetAbsences(r.Context(), s.Info,
		startParsed.Format("20060102"),
		endParsed.Format("20060102"),
	)
	if err != nil {
		http.Error(w, "internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	h.persistSession(r.Context(), s)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(absences)
}

func (h *UntisHandler) GetChanges(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value("username").(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	raw, err := h.store.GetChanges(r.Context(), "changes:"+username)
	if err != nil {
		http.Error(w, "internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Decode each stored JSON string into a real value so the response
	// is a proper JSON array, not an array of escaped strings.
	entries := make([]json.RawMessage, len(raw))
	for i, s := range raw {
		entries[i] = json.RawMessage(s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}
