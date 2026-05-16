import { Bell, BellOff, Send } from "lucide-react";
import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { api } from "@/api/client";

export default function Alerts() {
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

  return (
    <div className="flex flex-1 w-full items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 max-w-50 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {enabled ? (
            <Bell size={28} className="text-zinc-500" />
          ) : (
            <BellOff size={28} className="text-zinc-500" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium text-white">
            {enabled
              ? "Benachrichtigungen aktiviert"
              : "Benachrichtigungen deaktiviert"}
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {enabled
              ? "Du erhältst Push-Nachrichten bei Änderungen an deinem Stundenplan."
              : "Bitte erlaube Push-Benachrichtigungen, um über Änderungen informiert zu werden."}
          </p>
        </div>

        {enabled ? (
          <div className="flex flex-col gap-2 w-full mt-1">
            <button
              className="w-full py-2.5 rounded-2xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
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
              className="w-full py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors"
              onClick={handleUnsubscribe}
            >
              Deaktivieren
            </button>
          </div>
        ) : (
          <>
            <button
              className="w-full mt-1 py-2.5 rounded-2xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
              onClick={askUser}
              disabled={isDenied}
            >
              Erlauben
            </button>
            {isDenied && (
              <p className="text-xs text-zinc-600 leading-relaxed">
                Benachrichtigungen wurden blockiert. Bitte erlaube sie in den
                iOS-Einstellungen.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
