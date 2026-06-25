package model

import "time"

type ChangeKind string
type ChangeSeverity string

const (
	ChangeKindCancelled    ChangeKind = "cancelled"
	ChangeKindSubstitution ChangeKind = "substitution"
	ChangeKindRestored     ChangeKind = "restored"
	ChangeKindRoom         ChangeKind = "room-change"
	ChangeKindTime         ChangeKind = "time-change"
	ChangeKindNotes        ChangeKind = "notes"
	ChangeKindGeneric      ChangeKind = "generic"
)

const (
	ChangeSeverityDanger     ChangeSeverity = "danger"
	ChangeSeveritySuccess    ChangeSeverity = "success"
	ChangeSeverityWarning    ChangeSeverity = "warning"
	ChangeSeverityInfo       ChangeSeverity = "info"
	ChangeSeverityInfoItalic ChangeSeverity = "info-italic"
)

type ChangeField string

type ChangeLogEntry struct {
	DetectedAt time.Time     `json:"detectedAt"`
	Changes    []ChangeGroup `json:"changes"`
}

type ChangeGroup struct {
	Start   time.Time     `json:"start"`
	End     time.Time     `json:"end"`
	Subject string        `json:"subject"`
	Events  []ChangeEvent `json:"events"`
}

type ChangeEvent struct {
	Field    ChangeField    `json:"field"`
	Before   string         `json:"before"`
	After    string         `json:"after"`
	Kind     ChangeKind     `json:"kind"`
	Severity ChangeSeverity `json:"severity"`
	Label    string         `json:"label"`
}

// Dashboard
type Dashboard struct {
	UserCount    int    `json:"userCount"`
	PushSubCount int    `json:"pushSubCount"`
	LastPoll     string `json:"lastPoll"`
	TotalChanges int    `json:"totalChanges"`
	ChangeStats  struct {
		Day   TimeFrameStats `json:"day"`
		Week  TimeFrameStats `json:"week"`
		Month TimeFrameStats `json:"month"`
	} `json:"changeStats"`
	MostCancelledTeacher struct {
		Teacher string `json:"teacher"`
		Count   int    `json:"count"`
	} `json:"mostCancelledTeacher"`
	MostCancelledSubject struct {
		Subject string `json:"subject"`
		Count   int    `json:"count"`
	} `json:"mostCancelledSubject"`
	EVA   int `json:"eva"`
	TEAMS int `json:"teams"`
}

type TimeFrameStats struct {
	TotalChanges int                `json:"totalChanges"`
	Kinds        map[ChangeKind]int `json:"kinds"`
}
