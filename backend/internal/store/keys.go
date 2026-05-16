package store

import "fmt"

func PushSubKey(username string) string {
	return "push:" + username
}

func TimetableKey(username string, date string) string {
	return fmt.Sprintf("timetable:%s:%s", username, date)
}

func LastCheckKey(username string) string {
	return "lastcheck:" + username
}

func AbsencesKey(username string, start, end string) string {
	return fmt.Sprintf("absences:%s:%s:%s", username, start, end)
}
