package diff

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/crwntec/iris/backend/internal/untis"
)

type TimetableDiff struct {
	Changes []LessonDiff
}

type LessonDiff struct {
	Start   time.Time      `json:"start"`
	End     time.Time      `json:"end"`
	Subject string         `json:"subject"`
	Changes []LessonChange `json:"changes"`
}

type LessonChange struct {
	Field  LessonField `json:"field"`
	Before string      `json:"before"`
	After  string      `json:"after"`
}

type LessonField string

const (
	FieldStatus        LessonField = "status"
	FieldTeacher       LessonField = "teacher"
	FieldSubject       LessonField = "subject"
	FieldPartialChange LessonField = "partialChange"
	FieldRoom          LessonField = "room"
	FieldNotes         LessonField = "notes"
	FieldStartTime     LessonField = "startTime"
	FieldEndTime       LessonField = "endTime"
	FieldType          LessonField = "type"
)

type NormalizedLesson struct {
	Start    time.Time
	End      time.Time
	Subject  string
	Teacher  string
	IDs      []int
	Segments []Segment
}

type Segment struct {
	Start   time.Time
	End     time.Time
	Status  string
	Teacher string
}
type SegmentSummary struct {
	Start   string `json:"start"`
	End     string `json:"end"`
	Status  string `json:"status"`
	Teacher string `json:"teacher"`
}

func segmentsToJSON(segs []Segment) string {
	summaries := make([]SegmentSummary, len(segs))
	for i, s := range segs {
		summaries[i] = SegmentSummary{
			Start:   s.Start.Format(time.RFC3339),
			End:     s.End.Format(time.RFC3339),
			Status:  s.Status,
			Teacher: s.Teacher,
		}
	}
	b, _ := json.Marshal(summaries)
	return string(b)
}

func findDay(t untis.Timetable, date time.Time) untis.TimetableDay {
	for _, d := range t.Days {
		if d.Date == date {
			return d
		}
	}
	return untis.TimetableDay{}
}

func normalizeLessons(lessons []untis.Lesson) []NormalizedLesson {
	// We build by adjacency, NOT by IDs or equality assumptions.
	var result []NormalizedLesson

	slices.SortFunc(lessons, func(a, b untis.Lesson) int {
		if a.Start.Before(b.Start) {
			return -1
		}
		if a.Start.After(b.Start) {
			return 1
		}
		return 0
	})

	for _, l := range lessons {
		merged := false

		for i := range result {
			nl := &result[i]

			if sameLesson(nl, l) && isAdjacentOrOverlapping(nl.End, l.Start) {
				nl.Segments = append(nl.Segments, Segment{
					Start:   l.Start,
					End:     l.End,
					Status:  l.Status,
					Teacher: l.Teacher.Current.Long,
				})

				if l.Start.Before(nl.Start) {
					nl.Start = l.Start
				}
				if l.End.After(nl.End) {
					nl.End = l.End
				}

				nl.IDs = append(nl.IDs, l.IDs...)
				merged = true
				break
			}
		}

		if !merged {
			result = append(result, NormalizedLesson{
				Start:   l.Start,
				End:     l.End,
				Subject: l.Subject.Planned.Long,
				Teacher: l.Teacher.Planned.Long,
				IDs:     append([]int{}, l.IDs...),
				Segments: []Segment{
					{
						Start:   l.Start,
						End:     l.End,
						Status:  l.Status,
						Teacher: l.Teacher.Current.Long,
					},
				},
			})
		}
	}

	return result
}

func sameLesson(nl *NormalizedLesson, l untis.Lesson) bool {
	return nl.Subject == l.Subject.Planned.Long &&
		nl.Teacher == l.Teacher.Planned.Long
}

func isAdjacentOrOverlapping(aEnd, bStart time.Time) bool {
	if bStart.Before(aEnd) || bStart.Equal(aEnd) {
		return true
	}
	return bStart.Sub(aEnd) <= 5*time.Minute
}

func Compare(oldT, newT untis.Timetable) TimetableDiff {
	var d TimetableDiff

	for _, day := range oldT.Days {
		oldLessons := normalizeLessons(day.Lessons)
		newDay := findDay(newT, day.Date)
		newLessons := normalizeLessons(newDay.Lessons)

		for _, o := range oldLessons {
			n, ok := findBySignature(newLessons, o)
			if !ok {
				fmt.Printf("[findBySignature] no match for %s/%s\n", o.Subject, o.Teacher)
				continue
			}

			changes := diffNormalized(o, n)
			if len(changes) == 0 {
				continue
			}

			d.Changes = append(d.Changes, LessonDiff{
				Subject: o.Subject,
				Start:   o.Start,
				End:     o.End,
				Changes: changes,
			})
		}
	}

	return d
}

func findBySignature(lessons []NormalizedLesson, target NormalizedLesson) (NormalizedLesson, bool) {
	for _, l := range lessons {
		if l.Subject == target.Subject && l.Teacher == target.Teacher {
			return l, true
		}
	}
	return NormalizedLesson{}, false
}
func formatSegments(segs []Segment) string {
	var sb strings.Builder
	for _, s := range segs {
		sb.WriteString(
			fmt.Sprintf("[%s–%s:%s] %s",
				s.Start.Format("15:04"),
				s.End.Format("15:04"),
				s.Status,
				s.Teacher,
			),
		)
	}
	return strings.TrimSpace(sb.String())
}
func diffNormalized(old, new NormalizedLesson) []LessonChange {
	var out []LessonChange

	fmt.Printf(
		"\n[diffNormalized]\nSubject: %s\nIDs: %v\nOld: %s → %s\nNew: %s → %s\nOldSegments: %s\nNewSegments: %s\n",
		old.Subject,
		old.IDs,
		old.Start.Format("15:04"),
		old.End.Format("15:04"),
		new.Start.Format("15:04"),
		new.End.Format("15:04"),
		formatSegments(old.Segments),
		formatSegments(new.Segments),
	)

	// Handle regular case
	if len(old.Segments) == 1 && len(new.Segments) == 1 {
		so := old.Segments[0]
		sn := new.Segments[0]
		if so.Status != sn.Status {
			out = append(out, LessonChange{
				Field:  FieldStatus,
				Before: so.Status,
				After:  sn.Status,
			})
		}
		if !so.Start.Equal(sn.Start) {
			out = append(out, LessonChange{
				Field:  FieldStartTime,
				Before: so.Start.Format(time.RFC3339),
				After:  sn.Start.Format(time.RFC3339),
			})
		}
		if !so.End.Equal(sn.End) {
			out = append(out, LessonChange{
				Field:  FieldEndTime,
				Before: so.End.Format(time.RFC3339),
				After:  sn.End.Format(time.RFC3339),
			})
		}
	}
	// Handle partial changes
	if len(old.Segments) == 1 && len(new.Segments) > 1 {
		out = append(out, LessonChange{
			Field:  FieldPartialChange,
			Before: segmentsToJSON(old.Segments),
			After:  segmentsToJSON(new.Segments),
		})
	}
	return out
}
