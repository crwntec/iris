import { api } from "@/api/client";
import { StatCard } from "@/components/Absences";
import { cn } from "@/util";
import { type ApiError, getErrorMessage, ErrorState } from "@/components/Error";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Activity,
  Zap,
} from "lucide-react";

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

// ─────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  children,
  highlight = false,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 space-y-3 backdrop-blur",
        highlight
          ? "border-rose-500/20 bg-rose-500/[0.04]"
          : "border-zinc-800/80 bg-zinc-900/60",
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            size={15}
            className={highlight ? "text-rose-400" : "text-zinc-500"}
          />
        )}
        <h2
          className={cn(
            "text-xs font-bold uppercase tracking-widest",
            highlight ? "text-rose-400/80" : "text-zinc-500",
          )}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini tile
// ─────────────────────────────────────────────────────────────
function MiniTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-zinc-800/40 rounded-2xl p-3 space-y-1.5 border border-zinc-800/60">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-200 tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

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
    if (!data?.changeStats?.day?.kinds) return [];
    return Object.entries(data.changeStats.day.kinds).map(([name, value]) => ({
      name,
      value,
    }));
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

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            Aktualisierung…
          </div>
        )}
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

      {/* System */}
      {data && (
        <Section title="Systemstatus" icon={Activity}>
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
            <MiniTile label="EVA" value={data.eva} icon={Zap} color="#8b5cf6" />
            <MiniTile
              label="Teams"
              value={data.teams}
              icon={Users}
              color="#10b981"
            />
          </div>
        </Section>
      )}

      {/* Top failures */}
      {data && (
        <Section title="Häufigste Ausfälle" icon={AlertTriangle} highlight>
          <div className="space-y-3">
            <div className="bg-zinc-800/30 rounded-2xl p-3.5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Lehrer
                </span>
                <span className="text-xs font-bold text-rose-400 tabular-nums">
                  {data.mostCancelledTeacher.count}×
                </span>
              </div>
              <p className="text-lg font-bold">
                {data.mostCancelledTeacher.teacher}
              </p>
            </div>

            <div className="bg-zinc-800/30 rounded-2xl p-3.5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Fach
                </span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">
                  {data.mostCancelledSubject.count}×
                </span>
              </div>
              <p className="text-lg font-bold">
                {data.mostCancelledSubject.subject}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* Pie chart */}
      {data && pieData.length > 0 && (
        <Section title="Heutige Verteilung" icon={Activity}>
          <div className="flex items-center gap-4">
            <div className="h-40 w-40">
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
            </div>

            <div className="flex-1 space-y-2">
              {pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-zinc-400">{entry.name}</span>
                  <span className="text-xs font-semibold tabular-nums">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Details */}
      {data && (
        <Section title="Detailansicht" icon={BookOpen}>
          <div className="text-xs text-zinc-500">
            Verteilung der Änderungen über verschiedene Zeiträume wird hier
            zusammengefasst.
          </div>
        </Section>
      )}
    </div>
  );
}
