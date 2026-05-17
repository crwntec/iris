import { PRESETS, cn } from "@/util";

export default function PresetButtons({
  activePreset,
  setActivePreset,
  isLoading,
}: {
  activePreset: string;
  setActivePreset: (preset: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex gap-2 w-full">
      {PRESETS.map((label) => (
        <button
          key={label}
          onClick={() => setActivePreset(label)}
          disabled={isLoading}
          className={cn(
            "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-all disabled:opacity-50 text-center",
            activePreset === label
              ? "bg-zinc-100 text-zinc-900 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
