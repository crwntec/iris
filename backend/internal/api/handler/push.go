package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/store"
)

type PushHandler struct {
	store  *store.Store
	Config config.Config
}

type PushSubscription struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
}

func NewPushHandler(s *store.Store, conf config.Config) *PushHandler {
	return &PushHandler{store: s, Config: conf}
}

func (h *PushHandler) Subscribe(w http.ResponseWriter, r *http.Request) {
	username, _ := r.Context().Value("username").(string)
	var sub PushSubscription
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.store.SetJSON(r.Context(), store.PushSubKey(username), sub, 0); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *PushHandler) Unsubscribe(w http.ResponseWriter, r *http.Request) {
	username, _ := r.Context().Value("username").(string)
	if err := h.store.Del(r.Context(), store.PushSubKey(username)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *PushHandler) SendNotification(ctx context.Context, username, title, body string) error {
	var sub webpush.Subscription
	if err := h.store.GetJSON(ctx, store.PushSubKey(username), &sub); err != nil {
		return fmt.Errorf("getting push subscription: %w", err)
	}

	payload, _ := json.Marshal(map[string]string{"title": title, "body": body})
	resp, err := webpush.SendNotification(payload, &sub, &webpush.Options{
		Subscriber:      "https://iris-dev.tlynk.org",
		VAPIDPublicKey:  h.Config.VAPIDPublicKey,
		VAPIDPrivateKey: h.Config.VAPIDPrivateKey,
		TTL:             60,
		Urgency:         webpush.UrgencyHigh,
	})
	if err != nil {
		return fmt.Errorf("sending notification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		slog.Error("push notification failed", "status", resp.StatusCode, "body", string(b))
	}
	return nil
}

func (h *PushHandler) Test(w http.ResponseWriter, r *http.Request) {
	username, _ := r.Context().Value("username").(string)
	if err := h.SendNotification(r.Context(), username, "Test Notification", "Push works!"); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (h *PushHandler) GetVapidPublicKey(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(map[string]string{
    "publicKey": h.Config.VAPIDPublicKey,
  })
}

