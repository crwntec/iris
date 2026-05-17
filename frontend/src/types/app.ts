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

export type LessonDiff = {
  start: string; // ISO datetime string
  end: string; // ISO datetime string
  subject: string;
  changes: LessonChange[];
};

export type LessonChange = {
  field: LessonField;
  before: string;
  after: string;
};

export type LessonField =
  | "status"
  | "teacher"
  | "subject"
  | "room"
  | "notes"
  | "startTime"
  | "endTime"
  | "type";
export interface ChangeLogEntry {
  detectedAt: Date;
  changes: LessonDiff[];
}
