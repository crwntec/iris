import { cn } from "@/util";
import { getErrorMessage, type ApiError } from "../Error";
import { AlertCircle, RefreshCw } from "lucide-react";

function StatCardSkeleton() {
  return (
    <div className="flex-1 min-w-[100px] bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 animate-pulse">
      <div className="h-7 w-10 bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
    </div>
  );
}
export function StatCard({
  label,
  value,
  colorClass,
  loading = false,
}: {
  label: string;
  value?: number;
  colorClass: string;
  loading?: boolean;
}) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="flex-1 min-w-[100px] bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
      <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
function ChartSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-4 w-12 bg-zinc-800 rounded" />
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}
export function SectionSkeleton() {
  return (
    <section className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800">
      <div className="h-3 w-24 bg-zinc-800 rounded mb-4" />
      <ChartSkeleton />
    </section>
  );
}
export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError | null;
  onRetry: () => void;
}) {
  const { title, message, recoverable } = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="text-rose-400" size={40} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-400 mt-1">{message}</p>
        </div>
        {recoverable && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Erneut versuchen
          </button>
        )}
        {!recoverable && (
          <p className="text-xs text-zinc-500">
            Bei anhaltenden Problemen wende dich bitte an den Support.
          </p>
        )}
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  highlight = false,
  loading = false,
}: {
  title: string;
  children?: React.ReactNode;
  highlight?: boolean;
  loading?: boolean;
}) {
  if (loading) return <SectionSkeleton />;

  return (
    <section
      className={cn(
        "bg-zinc-900 rounded-2xl px-4 py-4 border",
        highlight ? "border-rose-900/60" : "border-zinc-800",
      )}
    >
      <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}
