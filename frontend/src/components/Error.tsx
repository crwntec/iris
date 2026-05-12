// ─────────────────────────────────────────────────────────────
// Error Handling Helpers

import { AlertCircle, RefreshCw } from "lucide-react";

// ─────────────────────────────────────────────────────────────
export type ApiError = Error & { status?: number; code?: string };

// eslint-disable-next-line react-refresh/only-export-components
export function getErrorMessage(error: ApiError | null): {
  title: string;
  message: string;
  recoverable: boolean;
} {
  if (!error) return { title: "", message: "", recoverable: false };

  const msg = error.message.toLowerCase();

  // Network errors
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection")
  ) {
    return {
      title: "Verbindungsproblem",
      message:
        "Bitte überprüfe deine Internetverbindung und versuche es erneut.",
      recoverable: true,
    };
  }

  // Auth errors
  if (
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("token")
  ) {
    return {
      title: "Sitzung abgelaufen",
      message:
        "Bitte melde dich erneut an, um auf deine Fehlzeiten zuzugreifen.",
      recoverable: false, // Requires full re-auth
    };
  }

  // Rate limiting
  if (msg.includes("429") || msg.includes("rate limit")) {
    return {
      title: "Zu viele Anfragen",
      message: "Bitte warte kurz und versuche es dann erneut.",
      recoverable: true,
    };
  }

  // Server errors
  if (msg.includes("500") || msg.includes("internal")) {
    return {
      title: "Server-Fehler",
      message:
        "Ein internes Problem ist aufgetreten. Bitte versuche es später erneut.",
      recoverable: true,
    };
  }

  // Default
  return {
    title: "Ladefehler",
    message: error.message || "Ein unbekannter Fehler ist aufgetreten.",
    recoverable: true,
  };
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
