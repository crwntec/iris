package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/crwntec/iris/backend/internal/config"
	"github.com/crwntec/iris/backend/internal/diff"
	"github.com/crwntec/iris/backend/internal/model"
	"github.com/crwntec/iris/backend/internal/polling"
	"github.com/crwntec/iris/backend/internal/store"
)

type DashboardHandler struct {
	store *store.Store
	conf  config.Config
}

func NewDashboardHandler(s *store.Store, conf config.Config) *DashboardHandler {
	return &DashboardHandler{store: s, conf: conf}
}

func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	dash, err := h.build(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dash)
}

func (h *DashboardHandler) build(ctx context.Context) (model.Dashboard, error) {
	var d model.Dashboard

	userKeys, err := h.store.Keys(ctx, "user:*")
	if err != nil {
		return d, err
	}
	d.UserCount = len(userKeys)

	pushKeys, err := h.store.Keys(ctx, "push:*")
	if err != nil {
		return d, err
	}
	d.PushSubCount = len(pushKeys)
	d.LastPoll, _ = h.store.Get(ctx, "last_poll")

	changeKeys, err := h.store.Keys(ctx, "changes:*")
	if err != nil {
		return d, err
	}
	now := time.Now()
	cutoffs := [3]time.Time{
		now.Add(-24 * time.Hour),      // day
		now.Add(-7 * 24 * time.Hour),  // week
		now.Add(-30 * 24 * time.Hour), // month
	}
	d.ChangeStats.Day = newTimeFrameStats()
	d.ChangeStats.Week = newTimeFrameStats()
	d.ChangeStats.Month = newTimeFrameStats()
	frames := [3]*model.TimeFrameStats{
		&d.ChangeStats.Day,
		&d.ChangeStats.Week,
		&d.ChangeStats.Month,
	}

	teacherCancels := map[string]int{}
	subjectCancels := map[string]int{}

	for _, key := range changeKeys {
		entries, err := h.store.GetChanges(ctx, key)
		if err != nil {
			continue
		}
		for _, raw := range entries {
			var pollingEntry polling.ChangeLogEntry
			if err := json.Unmarshal([]byte(raw), &pollingEntry); err != nil {
				continue
			}

			apiEntry := diff.ToAPIChangeLog(
				diff.TimetableDiff{Changes: pollingEntry.Changes},
				pollingEntry.DetectedAt,
			)
			inFrame := [3]bool{
				apiEntry.DetectedAt.After(cutoffs[0]),
				apiEntry.DetectedAt.After(cutoffs[1]),
				apiEntry.DetectedAt.After(cutoffs[2]),
			}
			for _, group := range apiEntry.Changes {
				d.TotalChanges++
				for i, f := range frames {
					if inFrame[i] {
						f.TotalChanges++
					}
				}
				groupCancelled := false
				cancelTeacher := ""
				for _, event := range group.Events {
					for i, f := range frames {
						if inFrame[i] {
							f.Kinds[event.Kind]++
						}
					}
					switch event.Field {
					case model.ChangeField(diff.FieldTeacher):
						switch event.After {
						case "E.V.A.":
							d.EVA++
						case "TEAMS":
							d.TEAMS++
						}

						if event.Kind == model.ChangeKindCancelled && event.Before != "" {
							cancelTeacher = event.Before
						}
					case model.ChangeField(diff.FieldPartialChange):
						var segs []diff.SegmentSummary
						if err := json.Unmarshal([]byte(event.After), &segs); err == nil {
							for _, seg := range segs {
								switch seg.Teacher {
								case "E.V.A.":
									d.EVA++
								case "TEAMS":
									d.TEAMS++
								}
							}
						}
					}
					if event.Kind == model.ChangeKindCancelled {
						groupCancelled = true
					}
				}
				if groupCancelled == true {
					subjectCancels[group.Subject]++
					if cancelTeacher != "" {
						teacherCancels[cancelTeacher]++
					}
				}
			}
		}
	}

	for teacher, count := range teacherCancels {
		if count > d.MostCancelledTeacher.Count {
			d.MostCancelledTeacher.Teacher = teacher
			d.MostCancelledTeacher.Count = count
		}
	}
	for subject, count := range subjectCancels {
		if count > d.MostCancelledSubject.Count {
			d.MostCancelledSubject.Subject = subject
			d.MostCancelledSubject.Count = count
		}
	}
	return d, nil
}

func newTimeFrameStats() model.TimeFrameStats {
	return model.TimeFrameStats{
		Kinds: make(map[model.ChangeKind]int),
	}
}
