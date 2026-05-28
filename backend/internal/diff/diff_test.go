package diff

import (
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

func TestPartialCancellation(t *testing.T) {
	// 	old := untis.Timetable{
	// 		Days: []untis.TimetableDay{
	// 			{
	// 				Date: mustTime("2026-06-03"),
	// 				Lessons: []untis.Lesson{
	// 					lesson(
	// 						mustTime("2026-06-03T07:40"),
	// 						mustTime("2026-06-03T09:10"),
	// 						"E-GK3",
	// 						"HO",
	// 						"REGULAR",
	// 						1,
	// 					),
	// 				},
	// 			},
	// 		},
	// 	}

	// 	new := untis.Timetable{
	// 		Days: []untis.TimetableDay{
	// 			{
	// 				Date: mustTime("2026-06-03"),
	// 				Lessons: []untis.Lesson{
	// 					lesson(
	// 						mustTime("2026-06-03T07:40"),
	// 						mustTime("2026-06-03T08:25"),
	// 						"E-GK3",
	// 						"HO",
	// 						"CANCELLED",
	// 						1,
	// 					),
	// 					lesson(
	// 						mustTime("2026-06-03T08:25"),
	// 						mustTime("2026-06-03T09:10"),
	// 						"E-GK3",
	// 						"HO",
	// 						"REGULAR",
	// 						1,
	// 					),
	// 				},
	// 			},
	// 		},
	// 	}

	// 	diff := Compare(old, new)

	// 	if len(diff.Changes) == 0 {
	// 		t.Fatal("expected changes, got none")
	// 	}

	//		t.Logf("%+v", diff)
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
