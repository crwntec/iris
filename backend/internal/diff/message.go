package diff

import (
	"fmt"
	"strings"
)

type PushMessage struct {
	Title string
	Body  string
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

func ToMessage(d TimetableDiff) (PushMessage, bool) {
	if len(d.Changes) == 0 {
		return PushMessage{}, false
	}

	var sb strings.Builder
	for _, lesson := range d.Changes {
		fmt.Fprintf(&sb, "%s · %s · %s–%s\n",
			lesson.Start.Format("Mo, 02.01."),
			lesson.Subject,
			lesson.Start.Format("15:04"),
			lesson.End.Format("15:04"),
		)
		for _, c := range lesson.Changes {
			fmt.Fprintln(&sb, "  ➤", changeLabel(c))
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

func changeLabel(c LessonChange) string {
	switch c.Field {
	case "status":
		if c.After == "CANCELLED" {
			return "Fällt aus"
		}
		return "Geändert"
	case "teacher":
		if isFakeCancellation(c.After) {
			// School marks this as a substitution to protect their stats,
			// but there is effectively no teacher — treat it as cancelled.
			return "Fällt aus (als Vertretung deklariert)"
		}
		return "Vertretung: " + c.After
	case "room":
		return fmt.Sprintf("Raum: %s → %s", c.Before, c.After)
	default:
		return fmt.Sprintf("%s: %s → %s", c.Field, c.Before, c.After)
	}
}
