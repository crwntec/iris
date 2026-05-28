package model

import "time"

type ChangeKind string
type ChangeSeverity string

const (
	ChangeKindCancelled    ChangeKind = "cancelled"
	ChangeKindSubstitution ChangeKind = "substitution"
	ChangeKindRoom         ChangeKind = "room-change"
	ChangeKindTime         ChangeKind = "time-change"
	ChangeKindNotes        ChangeKind = "notes"
	ChangeKindGeneric      ChangeKind = "generic"
)

const (
	ChangeSeverityDanger  ChangeSeverity = "danger"
	ChangeSeverityWarning ChangeSeverity = "warning"
	ChangeSeverityInfo    ChangeSeverity = "info"
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
