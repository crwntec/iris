import { Bell, BellOff, Send, RefreshCw } from "lucide-react";
import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { api } from "@/api/client";
import { type ApiError, ErrorState, getErrorMessage } from "@/components/Error";
import { useQuery } from "@tanstack/react-query";
import { getChangeLabel } from "@/util/alerts";
import moment from "moment-timezone";

export default function Alerts() {
  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["changes"],
      queryFn: () => api.getChangeLog(),
      staleTime: 1000 * 60 * 10,
      retry: (failureCount, err: ApiError) => {
        const { recoverable } = getErrorMessage(err);
        return recoverable && failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

  const [enabled, setEnabled] = useState(
    "Notification" in window && Notification.permission === "granted",
  );
  const [isDenied, setIsDenied] = useState(
    "Notification" in window && Notification.permission === "denied",
  );
  const [testLoading, setTestLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const { subscribe, unsubscribe } = usePushSubscription();

  const handleSubscribe = async () => {
    const sub = await subscribe();
    if (!sub) return;
    await api.savePushSubscription(sub.toJSON());
    setEnabled(true);
    setIsDenied(false);
  };

  const askUser = async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") {
      setIsDenied(true);
      return;
    }

    if (Notification.permission === "granted") {
      await handleSubscribe();
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await handleSubscribe();
    } else if (permission === "denied") {
      setIsDenied(true);
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    setEnabled(false);
  };

  const sendTest = async () => {
    setTestLoading(true);
    try {
      await api.testPush();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.error("Test failed:", err);
    } finally {
      setTestLoading(false);
    }
  };

  if (error && !data) {
    return <ErrorState error={error as ApiError} onRetry={() => refetch()} />;
  }

  // eslint-disable-next-line react-hooks/purity
  const isStale = Date.now() - dataUpdatedAt > 1000 * 60 * 10;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header Section */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Benachrichtigungen
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Push-Benachrichtigungen verwalten
            </p>
          </div>
          {isFetching && (
            <RefreshCw size={16} className="text-zinc-500 animate-spin" />
          )}
        </div>

        {/* Status Card */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {enabled ? (
                <Bell size={24} className="text-emerald-400" />
              ) : (
                <BellOff size={24} className="text-zinc-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white">
                {enabled
                  ? "Benachrichtigungen aktiviert"
                  : "Benachrichtigungen deaktiviert"}
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">
                {enabled
                  ? "Du erhältst Push-Nachrichten bei Änderungen an deinem Stundenplan."
                  : "Bitte erlaube Push-Benachrichtigungen, um über Änderungen informiert zu werden."}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {enabled ? (
              <>
                <button
                  className="w-full py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50"
                  onClick={sendTest}
                  disabled={testLoading}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Send size={16} />
                    {testLoading
                      ? "Wird gesendet..."
                      : testSent
                        ? "Gesendet!"
                        : "Test senden"}
                  </span>
                </button>
                <button
                  className="w-full py-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 hover:text-white active:scale-[0.98] transition-all"
                  onClick={handleUnsubscribe}
                >
                  Deaktivieren
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40"
                  onClick={askUser}
                  disabled={isDenied}
                >
                  Erlauben
                </button>
                {isDenied && (
                  <p className="text-xs text-zinc-500 text-center leading-relaxed px-2">
                    Benachrichtigungen wurden blockiert. Bitte erlaube sie in
                    den iOS-Einstellungen.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Changes Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Änderungen</h2>
          {isStale && data && (
            <button
              onClick={() => refetch()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Aktualisieren
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="relative rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 animate-pulse"
              >
                <div className="h-5 w-32 bg-zinc-800 rounded" />
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-2/3 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data
              .sort(
                (a, b) =>
                  new Date(b.detectedAt).getTime() -
                  new Date(a.detectedAt).getTime(),
              )
              .map((entry, idx) => (
                <div
                  key={idx}
                  className="relative rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 hover:bg-zinc-900/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {new Date(entry.detectedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">
                      {entry.changes.length} Änderung
                      {entry.changes.length !== 1 ? "en" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {entry.changes && entry.changes.length > 0 ? (
                      entry.changes.map((lessonChange, cIdx) => (
                        <div key={cIdx} className="text-sm text-zinc-300">
                          <span className="font-medium text-white">
                            {lessonChange.subject}
                          </span>
                          <span className="text-zinc-500 mx-1.5">•</span>
                          <span className="text-zinc-400">
                            {moment(lessonChange.start).format("dd")}{" "}
                            {moment(lessonChange.start).format("DD.MM")} (
                            {moment(lessonChange.start).format("HH:mm")} –{" "}
                            {moment(lessonChange.end).format("HH:mm")})
                          </span>
                          {lessonChange.changes &&
                            lessonChange.changes.length > 0 && (
                              <div className="flex items-center gap-2 text-zinc-400">
                                {lessonChange.changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-zinc-400"
                                  >
                                    {getChangeLabel(change).icon}
                                    <span
                                      className={getChangeLabel(change).color}
                                    >
                                      {getChangeLabel(change).text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div>
                        <p className="text-zinc-500 text-sm">
                          Keine Änderungen vorhanden
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-3xl border border-zinc-800 bg-zinc-900/30">
            <p className="text-zinc-500 text-sm">Keine Änderungen vorhanden</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw size={12} />
              Aktualisieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
