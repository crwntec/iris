import { cn } from "@/util";
import type { Period } from "../../pages/Dashboard";

// ─────────────────────────────────────────────────────────────
// Segmented toggles
// ─────────────────────────────────────────────────────────────
export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "day", label: "Heute" },
    { value: "week", label: "Woche" },
    { value: "month", label: "Monat" },
  ];
  return (
    <div className="flex gap-1 bg-zinc-800/50 rounded-full p-0.5 shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors",
            value === opt.value
              ? "bg-zinc-700 text-white"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
