package model

import "time"

type Lesson struct {
	ID        int       `json:"id"`
	Subject   string    `json:"subject"`
	Room      string    `json:"room"`
	Teacher   string    `json:"teacher"`
	Start     time.Time `json:"start"`
	End       time.Time `json:"end"`
	Cancelled bool      `json:"cancelled"`
	Changed   bool      `json:"changed"`
}

type Timetable struct {
	Date    string   `json:"date"`
	Lessons []Lesson `json:"lessons"`
}

type TimetableDiff struct {
	Added    []Lesson       `json:"added"`
	Removed  []Lesson       `json:"removed"`
	Modified []LessonChange `json:"modified"`
}

type LessonChange struct {
	Old Lesson `json:"old"`
	New Lesson `json:"new"`
}
