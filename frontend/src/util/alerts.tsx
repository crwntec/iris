import type { LessonChange } from "@/types/app";
import {
  UserX,
  ArrowRightLeft,
  AlertTriangle,
  DoorOpen,
  Clock,
} from "lucide-react";

const FAKE_TEACHERS = new Set(["E.V.A", "TEAMS", ""]);

function isFakeCancellation(teacher: string): boolean {
  return FAKE_TEACHERS.has(teacher.trim());
}

export function getChangeLabel(change: LessonChange): {
  text: string;
  icon: React.ReactNode;
  color: string;
} {
  switch (change.field) {
    case "status":
      if (change.after === "CANCELLED") {
        return {
          text: "Fällt aus",
          icon: <UserX size={14} />,
          color: "text-rose-400",
        };
      }
      return {
        text: "Geändert",
        icon: <ArrowRightLeft size={14} />,
        color: "text-amber-400",
      };

    case "teacher":
      if (isFakeCancellation(change.after)) {
        return {
          text: `Fällt aus (als ${change.after} deklariert)`,
          icon: <AlertTriangle size={14} />,
          color: "text-rose-400",
        };
      }
      return {
        text: `Vertretung: ${change.after}`,
        icon: <UserX size={14} />,
        color: "text-amber-400",
      };

    case "room":
      return {
        text: `Raum: ${change.before} → ${change.after}`,
        icon: <DoorOpen size={14} />,
        color: "text-blue-400",
      };

    case "startTime":
      return {
        text: `Startzeit: ${change.before} → ${change.after}`,
        icon: <Clock size={14} />,
        color: "text-blue-400",
      };
    case "endTime":
      return {
        text: `Endzeit: ${change.before} → ${change.after}`,
        icon: <Clock size={14} />,
        color: "text-blue-400",
      };

    default:
      return {
        text: `${change.field}: ${change.before} → ${change.after}`,
        icon: <ArrowRightLeft size={14} />,
        color: "text-zinc-400",
      };
  }
}
