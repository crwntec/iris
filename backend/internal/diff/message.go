package diff

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/crwntec/iris/backend/internal/model"
)

type PushMessage struct {
	Title string
	Body  string
}

type SemanticChange struct {
	Label    string
	Kind     model.ChangeKind
	Severity model.ChangeSeverity
}

var weekdays = [...]string{
	"So",
	"Mo",
	"Di",
	"Mi",
	"Do",
	"Fr",
	"Sa",
}

func formatGermanDay(t time.Time) string {
	return weekdays[t.Weekday()]
}

// fakeTeachers are substitutes that indicate a de-facto cancellation
// disguised as a change to avoid affecting school statistics.
var fakeTeachers = map[string]bool{
	"E.V.A.": true,
	"TEAMS":  true,
	"":       true,
}

func isFakeCancellation(teacher string) bool {
	return fakeTeachers[strings.TrimSpace(teacher)]
}
func parseUntisTime(s string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04",
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unsupported time format: %q", s)
}
func formatTimeHuman(raw string) string {
	t, err := parseUntisTime(raw)
	if err != nil {
		return raw // fallback safe
	}
	return t.Format("15:04")
}
func interpretChange(c LessonChange) SemanticChange {
	switch c.Field {

	case FieldStatus:
		if c.After == "CANCELLED" || isFakeCancellation(c.After) {
			return SemanticChange{
				Label:    "Fällt aus",
				Kind:     model.ChangeKindCancelled,
				Severity: model.ChangeSeveritySuccess,
			}
		}
		if c.Before == "CANCELLED" || isFakeCancellation(c.Before) {
			return SemanticChange{
				Label:    "Findet statt",
				Kind:     model.ChangeKindRestored,
				Severity: model.ChangeSeverityDanger,
			}
		}
		return SemanticChange{
			Label:    "Geändert",
			Kind:     model.ChangeKindSubstitution,
			Severity: model.ChangeSeverityWarning,
		}

	case FieldTeacher:
		if isFakeCancellation(c.After) {
			return SemanticChange{
				Label:    fmt.Sprintf("Fällt aus (als %s deklariert)", c.After),
				Kind:     model.ChangeKindCancelled,
				Severity: model.ChangeSeverityDanger,
			}
		}
		if c.After == "" {
			return SemanticChange{
				Label:    "Fällt aus (kein Lehrer hinterlegt)",
				Kind:     model.ChangeKindCancelled,
				Severity: model.ChangeSeverityDanger,
			}
		}
		if c.Before == "" {
			return SemanticChange{
				Label:    "Vertretung hinzugefügt: " + c.After,
				Kind:     model.ChangeKindSubstitution,
				Severity: model.ChangeSeverityWarning,
			}
		}
		return SemanticChange{
			Label:    "Vertretung: " + c.After,
			Kind:     model.ChangeKindSubstitution,
			Severity: model.ChangeSeverityWarning,
		}

	case FieldPartialChange:
		var newSegs []SegmentSummary
		_ = json.Unmarshal([]byte(c.After), &newSegs)

		var parts []string
		for _, s := range newSegs {
			start, _ := parseUntisTime(s.Start)
			end, _ := parseUntisTime(s.End)
			slot := fmt.Sprintf("%s–%s", start.Format("15:04"), end.Format("15:04"))

			if isFakeCancellation(s.Teacher) || s.Status == "CANCELLED" {
				parts = append(parts, slot+": fällt aus")
			} else if s.Teacher != "" {
				parts = append(parts, slot+": "+s.Teacher)
			}
		}

		return SemanticChange{
			Label:    "Teilweise: " + strings.Join(parts, ", "),
			Kind:     model.ChangeKindSubstitution,
			Severity: model.ChangeSeverityWarning,
		}

	case FieldRoom:
		return SemanticChange{
			Label:    fmt.Sprintf("Raum: %s → %s", c.Before, c.After),
			Kind:     model.ChangeKindRoom,
			Severity: model.ChangeSeverityInfo,
		}

	case FieldStartTime, FieldEndTime:
		labelPrefix := "Start"
		if c.Field == FieldEndTime {
			labelPrefix = "Ende"
		}

		return SemanticChange{
			Label: fmt.Sprintf(
				"%s: %s → %s",
				labelPrefix,
				formatTimeHuman(c.Before),
				formatTimeHuman(c.After),
			),
			Kind:     model.ChangeKindTime,
			Severity: model.ChangeSeverityInfo,
		}

	case FieldNotes:
		if c.After == "" {
			return SemanticChange{
				Label:    "Notizen gelöscht",
				Kind:     model.ChangeKindNotes,
				Severity: model.ChangeSeverityInfoItalic,
			}
		}
		return SemanticChange{
			Label:    c.After,
			Kind:     model.ChangeKindNotes,
			Severity: model.ChangeSeverityInfo,
		}

	default:
		return SemanticChange{
			Label:    fmt.Sprintf("%s: %s → %s", c.Field, c.Before, c.After),
			Kind:     model.ChangeKindGeneric,
			Severity: model.ChangeSeverityInfo,
		}
	}
}

func ToMessage(d TimetableDiff) (PushMessage, bool) {
	if len(d.Changes) == 0 {
		return PushMessage{}, false
	}

	var sb strings.Builder

	for _, lesson := range d.Changes {

		fmt.Fprintf(&sb, "%s · %s, %s · %s–%s\n",
			lesson.Subject,
			formatGermanDay(lesson.Start),
			lesson.Start.Format("02.01."),
			lesson.Start.Format("15:04"),
			lesson.End.Format("15:04"),
		)

		for _, c := range lesson.Changes {
			s := interpretChange(c)
			fmt.Fprintln(&sb, "  •", s.Label)
		}

		sb.WriteRune('\n')
	}

	n := len(d.Changes)
	title := fmt.Sprintf("%d Stundenplanänderung", n)
	if n > 1 {
		title += "en"
	}

	return PushMessage{
		Title: title,
		Body:  strings.TrimSpace(sb.String()),
	}, true
}

func ToAPIChangeLog(d TimetableDiff, detectedAt time.Time) model.ChangeLogEntry {
	groups := make([]model.ChangeGroup, 0, len(d.Changes))

	for _, lesson := range d.Changes {

		events := make([]model.ChangeEvent, 0, len(lesson.Changes))

		for _, c := range lesson.Changes {

			s := interpretChange(c)

			events = append(events, model.ChangeEvent{
				Field:    model.ChangeField(c.Field),
				Before:   c.Before,
				After:    c.After,
				Label:    s.Label,
				Kind:     s.Kind,
				Severity: s.Severity,
			})
		}

		groups = append(groups, model.ChangeGroup{
			Start:   lesson.Start,
			End:     lesson.End,
			Subject: lesson.Subject,
			Events:  events,
		})
	}

	return model.ChangeLogEntry{
		DetectedAt: detectedAt,
		Changes:    groups,
	}
}
