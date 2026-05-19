package polling

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/diff"
	"github.com/crwntec/iris/backend/internal/store"
	"github.com/crwntec/iris/backend/internal/untis"
)

type NotificationSender interface {
	SendNotification(ctx context.Context, username, title, body string) error
}
type Service struct {
	ctx          context.Context
	store        *store.Store
	pollInterval time.Duration
	config       config.Config
	notifier     NotificationSender
}

func NewService(ctx context.Context, config config.Config, store *store.Store, notifier NotificationSender, pollInterval time.Duration) *Service {
	return &Service{
		ctx:          ctx,
		store:        store,
		pollInterval: pollInterval,
		config:       config,
		notifier:     notifier,
	}
}

const maxChangeLogEntries = 20

type ChangeLogEntry struct {
	DetectedAt time.Time         `json:"detectedAt"`
	Changes    []diff.LessonDiff `json:"changes"`
}

func (s *Service) appendChanges(username string, d diff.TimetableDiff) error {
	entry := ChangeLogEntry{
		DetectedAt: time.Now(),
		Changes:    d.Changes,
	}
	encoded, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("marshalling change entry: %w", err)
	}
	return s.store.AppendChange(s.ctx, "changes:"+username, encoded, maxChangeLogEntries)
}

func (s *Service) processUser(username string) error {
	session, err := untis.AuthenticatedSessionFromStore(
		s.ctx,
		s.store,
		s.config.UntisBaseURL,
		s.config.UntisSchoolName,
		s.config.AESKey,
		username,
	)
	if err != nil {
		return err
	}

	start := todayStr()
	end := time.Now().AddDate(0, 0, 7).Format("2006-01-02")

	tt, err := session.Client.GetTimetable(s.ctx, session.Info, start, end)
	if err != nil {
		return err
	}

	encoded, err := json.Marshal(tt)
	if err != nil {
		return fmt.Errorf("marshalling timetable: %w", err)
	}

	newHash := fmt.Sprintf("%x", sha256.Sum256(encoded))

	hashKey := "timetable_hash:" + username
	ttKey := "timetable:" + username

	prevHash, err := s.store.Get(s.ctx, hashKey)
	if err != nil {
		// First run: store snapshot and exit.
		slog.Info("storing initial timetable snapshot", "username", username)

		if err := s.store.Set(s.ctx, hashKey, newHash, 0); err != nil {
			return fmt.Errorf("storing timetable hash: %w", err)
		}

		if err := s.store.Set(s.ctx, ttKey, string(encoded), 0); err != nil {
			return fmt.Errorf("storing timetable: %w", err)
		}

		return nil
	}

	if prevHash == newHash {
		slog.Debug("timetable unchanged", "username", username)
		return nil
	}

	prevTTString, err := s.store.Get(s.ctx, ttKey)
	if err != nil {
		return fmt.Errorf("getting previous timetable: %w", err)
	}

	var prevTimetable untis.Timetable
	if err := json.Unmarshal([]byte(prevTTString), &prevTimetable); err != nil {
		return fmt.Errorf("parsing previous timetable: %w", err)
	}

	var newTimetable untis.Timetable
	if err := json.Unmarshal(encoded, &newTimetable); err != nil {
		return fmt.Errorf("parsing new timetable: %w", err)
	}

	timetableDiff := diff.Compare(prevTimetable, newTimetable)

	if len(timetableDiff.Changes) == 0 {
		slog.Debug(
			"timetable changed but no relevant lesson changes detected",
			"username", username,
		)

		// still update snapshot/hash
		if err := s.store.Set(s.ctx, hashKey, newHash, 2*s.pollInterval); err != nil {
			return fmt.Errorf("updating timetable hash: %w", err)
		}

		if err := s.store.Set(s.ctx, ttKey, string(encoded), 2*s.pollInterval); err != nil {
			return fmt.Errorf("updating timetable: %w", err)
		}

		return nil
	}

	slog.Info(
		"timetable changed",
		"username", username,
		"changes", timetableDiff,
	)

	if err := s.store.Set(s.ctx, hashKey, newHash, 2*s.pollInterval); err != nil {
		return fmt.Errorf("updating timetable hash: %w", err)
	}

	if err := s.store.Set(s.ctx, ttKey, string(encoded), 2*s.pollInterval); err != nil {
		return fmt.Errorf("updating timetable: %w", err)
	}

	if err := s.appendChanges(username, timetableDiff); err != nil {
		return fmt.Errorf("appending changes: %w", err)
	}

	msg, ok := diff.ToMessage(timetableDiff)
	if ok {
		if err := s.notifier.SendNotification(
			s.ctx,
			username,
			msg.Title,
			msg.Body,
		); err != nil {
			slog.Error(
				"failed to send push notification",
				"username", username,
				"error", err,
			)
		}
	}

	return nil
}

func (s *Service) Start() {
	slog.Info("starting timetable polling service", "poll_interval", s.pollInterval)
	ticker := time.NewTicker(s.pollInterval)
	defer ticker.Stop()
	s.poll()
	for {
		select {
		case <-ticker.C:
			s.poll()
		case <-s.ctx.Done():
			slog.Info("stopping timetable polling service")
			return
		}
	}
}

func (s *Service) poll() {
	subscribedUsers, err := s.store.Keys(s.ctx, "push:*")
	slog.Info("polling timetable for changes", "subscribed_users", len(subscribedUsers))
	if err != nil {
		slog.Error("failed to get subscribed users", "error", err)
		return
	}

	var wg sync.WaitGroup
	for _, userKey := range subscribedUsers {
		wg.Add(1)
		go func(userKey string) {
			defer wg.Done()
			username := userKey[len("push:"):]
			if err := s.processUser(username); err != nil {
				slog.Error("failed to process user", "username", username, "error", err)
			}
		}(userKey)
	}
	wg.Wait()
}

func todayStr() string {
	return time.Now().Format("2006-01-02")
}
