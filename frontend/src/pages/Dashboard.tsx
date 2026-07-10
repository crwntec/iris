import { api } from "@/api/client";
import { StatCard } from "@/components/Absences";
import { cn } from "@/util";
import { type ApiError, getErrorMessage, ErrorState } from "@/components/Error";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Zap,
  Bell,
} from "lucide-react";
import { Leaderboard } from "@/components/Dashboard/Leaderboard";
import { Section } from "@/components/Dashboard/Section";
import { MiniTile } from "@/components/Dashboard/MiniTile";
import { PeriodToggle } from "@/components/Dashboard/PeriodToggle";
import { FailureToggle } from "@/components/Dashboard/FailureToggle";

const CHART_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export type Period = "day" | "week" | "month";
export type FailureView = "teacher" | "subject";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `Vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Vor ${hrs} Std.`;
  return `Vor ${Math.floor(hrs / 24)} Tagen`;
}

function LoadOverview({
  day,
  week,
  month,
}: {
  day: number;
  week: number;
  month: number;
}) {
  const weekAvg = week / 7;
  const monthAvg = month / 30;
  const ratio = weekAvg > 0 ? day / weekAvg : day > 0 ? 2 : 1;
  const delta = Math.round((ratio - 1) * 100) || 0;

  const tone =
    ratio < 0.85
      ? {
          text: "text-emerald-400",
          bar: "from-emerald-600 to-emerald-400",
          chip: "bg-emerald-500/10 border-emerald-500/30",
          label: "Ruhiger Tag",
        }
      : ratio <= 1.25
        ? {
            text: "text-amber-400",
            bar: "from-amber-600 to-amber-400",
            chip: "bg-amber-500/10 border-amber-500/30",
            label: "Normale Auslastung",
          }
        : {
            text: "text-rose-400",
            bar: "from-rose-600 to-rose-400",
            chip: "bg-rose-500/10 border-rose-500/30",
            label: "Erhöhtes Ausfallaufkommen",
          };

  const fillPct =
    weekAvg > 0
      ? Math.min(100, (day / (weekAvg * 2)) * 100)
      : day > 0
        ? 100
        : 0;

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
            Änderungen heute
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums leading-none",
              tone.text,
            )}
          >
            {day}
          </p>
        </div>
        {weekAvg > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border",
              tone.text,
              tone.chip,
            )}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </div>
        )}
      </div>

      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            tone.bar,
          )}
          style={{ width: `${fillPct}%` }}
        />
        {weekAvg > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3.5 bg-zinc-400/50"
            style={{ left: "50%" }}
            title="Wochendurchschnitt"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-medium", tone.text)}>{tone.label}</span>
        <span className="text-zinc-600 tabular-nums">
          Ø Woche {weekAvg.toFixed(1)}/Tag · Ø Monat {monthAvg.toFixed(1)}/Tag
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("day");
  const [failureView, setFailureView] = useState<FailureView>("teacher");

  const { error, data, refetch, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    retry: (failureCount, err: ApiError) => {
      if (err?.status === 401) return false;
      const { recoverable } = getErrorMessage(err);
      return recoverable && failureCount < 3;
    },
  });

  useEffect(() => {
    if ((error as ApiError)?.status === 401) {
      navigate("/absences", { replace: true });
    }
  }, [error, navigate]);

  const pieData = useMemo(() => {
    const kinds = data?.changeStats?.[period]?.kinds;
    if (!kinds) return [];
    return Object.entries(kinds)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [data, period]);

  const periodTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData],
  );

  const isStale =
    !!data?.lastPoll &&
    // eslint-disable-next-line react-hooks/purity
    Date.now() - new Date(data.lastPoll).getTime() > 30 * 60 * 1000;

  const activationRate = useMemo(() => {
    if (!data || !data.userCount) return null;
    return Math.round((data.pushSubCount / data.userCount) * 100);
  }, [data]);

  if (error && !data) {
    return <ErrorState error={error as ApiError} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Übersicht</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {data ? `Aktualisiert ${timeAgo(data.lastPoll)}` : "Lade Daten..."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            Aktualisierung…
          </div>
        ) : data ? (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border",
              isStale
                ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isStale ? "bg-amber-400" : "bg-emerald-400 animate-pulse",
              )}
            />
            {isStale ? "Verzögert" : "Live"}
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {isLoading ? (
          <>
            <StatCard label="Nutzer" loading />
            <StatCard label="Push-Abos" loading />
          </>
        ) : data ? (
          <>
            <StatCard value={data.userCount} label="Nutzer" />
            <StatCard value={data.pushSubCount} label="Push-Abos" />
          </>
        ) : null}
      </div>

      {/* Load overview */}
      {data && (
        <LoadOverview
          day={data.changeStats?.day?.totalChanges ?? 0}
          week={data.changeStats?.week?.totalChanges ?? 0}
          month={data.changeStats?.month?.totalChanges ?? 0}
        />
      )}

      {/* System */}
      {data && (
        <Section title="Systemstatus" icon={Activity}>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <MiniTile
                label="Letzte Aktualisierung"
                value={formatDateTime(data.lastPoll)}
                icon={Clock}
                color="#f59e0b"
              />
              <MiniTile
                label="Gesamtänderungen"
                value={data.totalChanges.toLocaleString("de-DE")}
                icon={TrendingUp}
                color="#0ea5e9"
              />
              <MiniTile
                label="EVA"
                value={data.eva}
                icon={Zap}
                color="#8b5cf6"
              />
              <MiniTile
                label="Teams"
                value={data.teams}
                icon={Users}
                color="#10b981"
              />
            </div>
            {activationRate !== null && (
              <MiniTile
                label="Push-Aktivierung (Nutzer mit Abo)"
                value={`${activationRate}%`}
                icon={Bell}
                color="#ec4899"
              />
            )}
          </div>
        </Section>
      )}

      {/* Top failures */}
      {data && (
        <Section
          title="Häufigste Ausfälle"
          icon={AlertTriangle}
          highlight
          actions={
            <FailureToggle value={failureView} onChange={setFailureView} />
          }
        >
          <Leaderboard
            entries={
              failureView === "teacher"
                ? data.teacherCancels
                : data.subjectCancels
            }
            unit={failureView === "teacher" ? "Ausfälle" : "Entfälle"}
          />
        </Section>
      )}

      {/* Pie chart */}
      {data && (
        <Section
          title="Verteilung nach Art"
          icon={Activity}
          actions={<PeriodToggle value={period} onChange={setPeriod} />}
        >
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold tabular-nums">
                    {periodTotal}
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                    Gesamt
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {pieData.map((entry, i) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums shrink-0">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 py-6 text-center">
              Keine Änderungen in diesem Zeitraum.
            </p>
          )}
        </Section>
      )}
    </div>
  );
}
