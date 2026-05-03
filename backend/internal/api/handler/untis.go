package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/crwntec/iris/backend/internal"
	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/untis"
	"github.com/valkey-io/valkey-go"
)

type UntisHandler struct {
	vk     valkey.Client
	Config config.Config
}

func NewUntisHandler(vk valkey.Client, conf config.Config) *UntisHandler {
	return &UntisHandler{vk: vk, Config: conf}
}

func (h *UntisHandler) clientFromRequest(r *http.Request) (*untis.Client, untis.UntisInfo, error) {
	username, ok := r.Context().Value("username").(string)
	if !ok {
		return nil, untis.UntisInfo{}, fmt.Errorf("unauthorized")
	}
	result, err := h.vk.Do(r.Context(), h.vk.B().Hgetall().Key("user:"+username).Build()).AsStrMap()
	if err != nil {
		return nil, untis.UntisInfo{}, fmt.Errorf("session not found")
	}
	decoded, err := base64.StdEncoding.DecodeString(result["password"])
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	password, err := internal.DecryptAES(decoded, []byte(h.Config.AESKey))
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	client, err := untis.ClientFromSession(
		h.Config.UntisConfig,
		result["token"],
		result["sessionID"],
		result["schoolID"],
		username,
		string(password),
	)
	if err != nil {
		return nil, untis.UntisInfo{}, err
	}
	userID, _ := strconv.Atoi(result["userID"])
	return client, untis.UntisInfo{UserID: userID}, nil
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

	client, info, err := h.clientFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	tt, err := client.GetTimetable(r.Context(), info, start, end)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

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

	client, info, err := h.clientFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	absences, err := client.GetAbsences(r.Context(), info,
		startParsed.Format("20060102"),
		endParsed.Format("20060102"),
	)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(absences)
}
