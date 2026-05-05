interface Absence {
  canEdit: boolean;
  createDate: number;
  createdUser: string;
  endDate: number;
  endTime: number;
  excuse: Excuse;
  excuseStatus: string;
  id: number;
  interruptions: [];
  isExcused: boolean;
  lastUpdate: number;
  reason: string;
  reasonId: number;
  startDate: number;
  startTime: number;
  studentName: string;
  text: string;
  updatedUser: string;
}
interface Absences {
  absenceReasons: [];
  absences: Absence[];
  excuseStatuses: boolean;
  showAbsenceReasonChange: boolean;
  showCreateAbsence: boolean;
}
interface Excuse {
  excuseDate: number;
  excuseStatus: string;
  id: number;
  isExcused: boolean;
  text: string;
  userId: number;
  username: string;
}
export { Absence, Absences, Excuse };
