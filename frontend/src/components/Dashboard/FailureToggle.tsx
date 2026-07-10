import { cn } from "@/util";
import type { FailureView } from "@/pages/Dashboard";

export function FailureToggle({
  value,
  onChange,
}: {
  value: FailureView;
  onChange: (v: FailureView) => void;
}) {
  const options: { value: FailureView; label: string }[] = [
    { value: "teacher", label: "Lehrer" },
    { value: "subject", label: "Fächer" },
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
              ? "bg-rose-500/20 text-rose-300"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
