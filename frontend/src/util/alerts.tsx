import type { ChangeEvent } from "@/types/app";
import {
  ArrowRightLeft,
  DoorOpen,
  Clock,
  NotepadText,
  AlertTriangle,
  PartyPopper,
} from "lucide-react";

const CHANGE_META = {
  cancelled: {
    icon: <PartyPopper />,
    color: "text-emerald-400",
  },
  restored: {
    icon: <AlertTriangle />,
    color: "text-amber-400",
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
  "partial-change": {
    icon: <ArrowRightLeft />,
    color: "text-amber-400",
  },
};
export function getChangeLabel(change: ChangeEvent) {
  const meta = CHANGE_META[change.kind];

  return {
    text: change.label,
    icon: meta?.icon ?? <ArrowRightLeft />,
    color:
      (meta?.color ?? "text-zinc-400") +
      (change.severity == "info-italic" ? " italic" : ""),
  };
}
