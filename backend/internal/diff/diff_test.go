package diff

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/crwntec/iris/backend/internal/untis"
)

func lesson(start, end time.Time, subject, teacher, status string, ids ...int) untis.Lesson {
	return untis.Lesson{
		Start:  start,
		End:    end,
		Status: status,
		IDs:    ids,
		Subject: untis.ChangableEntry{
			Planned: untis.VariableString{Long: subject},
		},
		Teacher: untis.ChangableEntry{
			Current: untis.VariableString{Long: teacher},
		},
	}
}

// lessonWithNotes is like lesson but with the Notes field set.
func lessonWithNotes(start, end time.Time, subject, teacher, status, notes string, ids ...int) untis.Lesson {
	l := lesson(start, end, subject, teacher, status, ids...)
	l.Notes = notes
	return l
}

func mustTime(s string) time.Time {
	layouts := []string{
		"2006-01-02T15:04",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}

	panic("invalid time format: " + s)
}

// findPartialChange returns the FieldPartialChange entry from a LessonDiff, or
// (zero, false) if none is present.
func findPartialChange(d LessonDiff) (LessonChange, bool) {
	for _, c := range d.Changes {
		if c.Field == FieldPartialChange {
			return c, true
		}
	}
	return LessonChange{}, false
}

// parseAfterSegments unmarshals the After JSON payload of a partialChange into
// a slice of SegmentSummary values so tests can make precise assertions.
func parseAfterSegments(t *testing.T, partial LessonChange) []SegmentSummary {
	t.Helper()
	var segs []SegmentSummary
	if err := json.Unmarshal([]byte(partial.After), &segs); err != nil {
		t.Fatalf("partialChange.After is not valid JSON: %v\nraw: %s", err, partial.After)
	}
	return segs
}

func TestTeacherRemoval(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T08:25"),
						"E-GK3",
						"",
						"CHANGED",
						1,
					),
				},
			},
		},
	}
	diff := Compare(old, new)
	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}
	t.Logf("%+v", diff)

}

func TestPartialCancellation(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}

	new := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T08:25"),
						"E-GK3",
						"HO",
						"CANCELLED",
						1,
					),
					lesson(
						mustTime("2026-06-03T08:25"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}

	diff := Compare(old, new)

	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	t.Logf("%+v", diff)
}
func TestPartialFakeCancellation(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}

	new := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T08:25"),
						"E-GK3",
						"E.V.A.",
						"CHANGED",
						1,
					),
					lesson(
						mustTime("2026-06-03T08:25"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}

	diff := Compare(old, new)

	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	t.Logf("%+v", diff)
}

func TestFullCancellation(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"HO",
						"REGULAR",
						1,
					),
				},
			},
		},
	}

	new := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3",
						"E.V.A.",
						"CHANGED",
						1,
					),
				},
			},
		},
	}

	diff := Compare(old, new)

	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	t.Logf("%+v", diff)
}
func TestNoChange(t *testing.T) {
	timetable := untis.Timetable{
		Days: []untis.TimetableDay{
			{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(
						mustTime("2026-06-03T07:40"),
						mustTime("2026-06-03T09:10"),
						"E-GK3", "HO", "REGULAR", 1,
					),
				},
			},
		},
	}
	diff := Compare(timetable, timetable)
	if len(diff.Changes) != 0 {
		t.Fatalf("expected no changes, got %+v", diff.Changes)
	}
}

func TestSubstitutionTeacher(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "CHANGED", 1),
			},
		}},
	}
	diff := Compare(old, new)
	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}
	hasStatus := false
	for _, c := range diff.Changes[0].Changes {
		if c.Field == FieldStatus && c.Before == "REGULAR" && c.After == "CHANGED" {
			hasStatus = true
		}
	}
	if !hasStatus {
		t.Errorf("expected status change REGULAR→CHANGED, got %+v", diff.Changes[0].Changes)
	}
}

func TestStartTimeShift(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T08:00"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	diff := Compare(old, new)
	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}
	hasStartTime := false
	for _, c := range diff.Changes[0].Changes {
		if c.Field == FieldStartTime {
			hasStartTime = true
		}
	}
	if !hasStartTime {
		t.Errorf("expected startTime change, got %+v", diff.Changes[0].Changes)
	}
}

func TestEndTimeShift(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:55"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	diff := Compare(old, new)
	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}
	hasEndTime := false
	for _, c := range diff.Changes[0].Changes {
		if c.Field == FieldEndTime {
			hasEndTime = true
		}
	}
	if !hasEndTime {
		t.Errorf("expected endTime change, got %+v", diff.Changes[0].Changes)
	}
}

func TestMultipleLessonsOnlyOneChanges(t *testing.T) {
	mkDay := func(mathStatus, engStatus string) untis.Timetable {
		return untis.Timetable{
			Days: []untis.TimetableDay{{
				Date: mustTime("2026-06-03"),
				Lessons: []untis.Lesson{
					lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:25"), "Mathe", "MU", mathStatus, 1),
					lesson(mustTime("2026-06-03T08:25"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", engStatus, 2),
				},
			}},
		}
	}
	diff := Compare(mkDay("REGULAR", "REGULAR"), mkDay("CANCELLED", "REGULAR"))
	if len(diff.Changes) != 1 {
		t.Fatalf("expected exactly 1 changed lesson, got %d: %+v", len(diff.Changes), diff.Changes)
	}
	if diff.Changes[0].Subject != "Mathe" {
		t.Errorf("expected Mathe to have changed, got %s", diff.Changes[0].Subject)
	}
}

func TestDifferentDayNotCompared(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-04"), // different day
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-04T07:40"), mustTime("2026-06-04T09:10"), "E-GK3", "HO", "CANCELLED", 1),
			},
		}},
	}
	diff := Compare(old, new)
	if len(diff.Changes) != 0 {
		t.Fatalf("expected no changes across different days, got %+v", diff.Changes)
	}
}

func TestPartialCancellationField(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:25"), "E-GK3", "HO", "CANCELLED", 1),
				lesson(mustTime("2026-06-03T08:25"), mustTime("2026-06-03T09:10"), "E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	diff := Compare(old, new)
	if len(diff.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}
	hasPartial := false
	for _, c := range diff.Changes[0].Changes {
		if c.Field == FieldPartialChange {
			hasPartial = true
		}
	}
	if !hasPartial {
		t.Errorf("expected partialChange field, got %+v", diff.Changes[0].Changes)
	}
}

// ── New tests ─────────────────────────────────────────────────────────────────

// TestPartialLessonNotes: a single block splits in two; the second half gains
// notes while both halves remain REGULAR. The diff must surface a
// FieldPartialChange whose After payload carries the note on the matching
// segment.
func TestPartialLessonNotes(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:25"),
					"E-GK3", "HO", "REGULAR", 1),
				lessonWithNotes(mustTime("2026-06-03T08:25"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", "Hausaufgaben S. 42", 1),
			},
		}},
	}

	d := Compare(old, new)

	if len(d.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	partial, ok := findPartialChange(d.Changes[0])
	if !ok {
		t.Fatalf("expected FieldPartialChange, got %+v", d.Changes[0].Changes)
	}

	segs := parseAfterSegments(t, partial)

	// Segments are chronological: 07:40 first, 08:25 second.
	if len(segs) != 2 {
		t.Fatalf("expected 2 segments in After, got %d: %+v", len(segs), segs)
	}
	if segs[0].Notes != "" {
		t.Errorf("first segment should have no notes, got %q", segs[0].Notes)
	}
	if segs[1].Notes != "Hausaufgaben S. 42" {
		t.Errorf("second segment notes: want %q, got %q", "Hausaufgaben S. 42", segs[1].Notes)
	}

	t.Logf("%+v", d)
}

// TestPartialLessonOneCancelled: a single block splits in two; the first half
// is cancelled while the second remains REGULAR. The After payload must contain
// exactly one CANCELLED segment and one non-cancelled segment.
func TestPartialLessonOneCancelled(t *testing.T) {
	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:25"),
					"E-GK3", "HO", "CANCELLED", 1),
				lesson(mustTime("2026-06-03T08:25"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}

	d := Compare(old, new)

	if len(d.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	partial, ok := findPartialChange(d.Changes[0])
	if !ok {
		t.Fatalf("expected FieldPartialChange, got %+v", d.Changes[0].Changes)
	}

	segs := parseAfterSegments(t, partial)

	if len(segs) != 2 {
		t.Fatalf("expected 2 segments in After, got %d: %+v", len(segs), segs)
	}

	cancelledCount := 0
	for _, s := range segs {
		if s.Status == "CANCELLED" {
			cancelledCount++
		}
	}
	if cancelledCount != 1 {
		t.Errorf("expected exactly 1 CANCELLED segment, got %d: %+v", cancelledCount, segs)
	}

	// Specifically the first (earlier) half should be the cancelled one.
	if segs[0].Status != "CANCELLED" {
		t.Errorf("expected first segment CANCELLED, got %q", segs[0].Status)
	}
	if segs[1].Status == "CANCELLED" {
		t.Errorf("expected second segment not cancelled, got %q", segs[1].Status)
	}

	t.Logf("%+v", d)
}

// TestPartialLessonCancelledAndNotes: a single block splits in two; the first
// half is cancelled AND the second half gains notes simultaneously. Both
// changes must appear together inside a single FieldPartialChange – there
// should be no separate FieldStatus or FieldNotes entries because the lesson
// as a whole is treated as a partial change.
func TestPartialLessonCancelledAndNotes(t *testing.T) {
	const wantNote = "Rest: Aufgaben für Zuhause"

	old := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", 1),
			},
		}},
	}
	new := untis.Timetable{
		Days: []untis.TimetableDay{{
			Date: mustTime("2026-06-03"),
			Lessons: []untis.Lesson{
				lesson(mustTime("2026-06-03T07:40"), mustTime("2026-06-03T08:25"),
					"E-GK3", "HO", "CANCELLED", 1),
				lessonWithNotes(mustTime("2026-06-03T08:25"), mustTime("2026-06-03T09:10"),
					"E-GK3", "HO", "REGULAR", wantNote, 1),
			},
		}},
	}

	d := Compare(old, new)

	if len(d.Changes) == 0 {
		t.Fatal("expected changes, got none")
	}

	partial, ok := findPartialChange(d.Changes[0])
	if !ok {
		t.Fatalf("expected FieldPartialChange, got %+v", d.Changes[0].Changes)
	}

	// The partial change must be the only entry – not a mix of partialChange +
	// separate status/notes fields – because diffNormalized short-circuits when
	// the old lesson has one segment and the new has more than one.
	if len(d.Changes[0].Changes) != 1 {
		t.Errorf("expected exactly 1 change entry (partialChange), got %d: %+v",
			len(d.Changes[0].Changes), d.Changes[0].Changes)
	}

	segs := parseAfterSegments(t, partial)

	if len(segs) != 2 {
		t.Fatalf("expected 2 segments in After, got %d: %+v", len(segs), segs)
	}

	// First segment: cancelled, no notes.
	if segs[0].Status != "CANCELLED" {
		t.Errorf("first segment status: want CANCELLED, got %q", segs[0].Status)
	}
	if segs[0].Notes != "" {
		t.Errorf("first segment should have no notes, got %q", segs[0].Notes)
	}

	// Second segment: regular, carries the note.
	if segs[1].Status == "CANCELLED" {
		t.Errorf("second segment should not be cancelled")
	}
	if segs[1].Notes != wantNote {
		t.Errorf("second segment notes: want %q, got %q", wantNote, segs[1].Notes)
	}

	t.Logf("%+v", d)
}
