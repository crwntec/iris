export interface SubjectStats {
  subject: string;
  total: number;
  cancelled: number;
  substitute: number;
  homework: number;
  cancelRate: number; // cancelled / total
}

export interface TeacherStats {
  teacher: string;
  total: number;
  cancelled: number;
  substitute: number;
  homework: number;
  cancelRate: number;
}

export interface Stats {
  totalLessons: number;
  totalCancelled: number;
  totalSubstitute: number;
  totalHomework: number;
  mostCancelledDay: {
    date: string;
    count: number;
  };
  mostCancelledPeriod: number; // welche Stunde (1-6) fällt am meisten aus
  bySubject: SubjectStats[];
  byTeacher: TeacherStats[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type ChangeField =
  | "status"
  | "teacher"
  | "subject"
  | "room"
  | "notes"
  | "startTime"
  | "endTime"
  | "unknown";

export type ChangeSeverity = "danger" | "warning" | "info" | "info-italic";
export type ChangeKind =
  | "cancelled"
  | "substitution"
  | "room-change"
  | "time-change"
  | "notes"
  | "generic"
  | "restored";
export type LessonField =
  | "status"
  | "teacher"
  | "subject"
  | "room"
  | "notes"
  | "startTime"
  | "endTime"
  | "unknown";
export interface ChangeLogEntry {
  detectedAt: string;
  changes: ChangeGroup[];
}

export interface ChangeGroup {
  start: string;
  end: string;
  subject: string;
  events: ChangeEvent[];
}

export interface ChangeEvent {
  field: ChangeField;
  before: string;
  after: string;
  kind: ChangeKind;
  severity: ChangeSeverity;
  label: string;
}

export interface DashboardData {
  userCount: number;
  pushSubCount: number;
  lastPoll: string;
  totalChanges: number;
  changeStats: ChangeStats;
  mostCancelledTeacher: { teacher: string; count: number };
  mostCancelledSubject: { subject: string; count: number };
  eva: number;
  teams: number;
}
export interface ChangeStats {
  day: TimeframeStats;
  week: TimeframeStats;
  month: TimeframeStats;
}
export interface TimeframeStats {
  totalChanges: number;
  kinds: Record<ChangeKind, number>;
}
