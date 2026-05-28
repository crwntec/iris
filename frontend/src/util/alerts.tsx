import type { ChangeEvent } from "@/types/app";
import {
  UserX,
  ArrowRightLeft,
  DoorOpen,
  Clock,
  NotepadText,
} from "lucide-react";

const CHANGE_META = {
  cancelled: {
    icon: <UserX />,
    color: "text-rose-400",
  },

  substitution: {
    icon: <ArrowRightLeft />,
    color: "text-amber-400",
  },

  "room-change": {
    icon: <DoorOpen />,
    color: "text-blue-400",
  },
  "time-change": {
    icon: <Clock />,
    color: "text-blue-400",
  },
  notes: {
    icon: <NotepadText />,
    color: "text-blue-400",
  },
  generic: {
    icon: <ArrowRightLeft />,
    color: "text-zinc-400",
  },
};
export function getChangeLabel(change: ChangeEvent) {
  const meta = CHANGE_META[change.kind];

  return {
    text: change.label,
    icon: meta?.icon ?? <ArrowRightLeft />,
    color: meta?.color ?? "text-zinc-400",
  };
}
