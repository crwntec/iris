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
