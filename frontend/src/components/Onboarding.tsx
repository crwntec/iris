import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  BarChart2,
  BellIcon,
  ChevronRight,
  Check,
  X,
  Share,
} from "lucide-react";
import { cn } from "@/util";

// ─── Storage key ─────────────────────────────────────────────

const ONBOARDING_KEY = "iris_onboarding_v1";

// ─── Platform helpers ─────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

function isSafariBrowser(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

// ─── Tab definitions ──────────────────────────────────────────

const TABS = [
  {
    Icon: ClipboardList,
    label: "Fehlstunden",
    accent: "text-emerald-400",
    ringColor: "border-emerald-500/25 bg-emerald-500/8",
    desc: "Übersicht aller Abwesenheiten mit Filtermöglichkeiten nach Status, Entschuldigung und Zeitraum.",
  },
  {
    Icon: BarChart2,
    label: "Statistiken",
    accent: "text-sky-400",
    ringColor: "border-sky-500/25 bg-sky-500/8",
    desc: "Detaillierte Auswertungen zu Ausfällen, Vertretungen und Hausaufgaben nach Fach und Lehrkraft.",
  },
  {
    Icon: BellIcon,
    label: "Nachrichten",
    accent: "text-amber-400",
    ringColor: "border-amber-500/25 bg-amber-500/8",
    desc: "Benachrichtigungen zu Stundenplanänderungen und wichtigen Ereignissen in Echtzeit.",
  },
] as const;

// ─── Step: Welcome ────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-[22px] bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl shadow-black/60">
          <img src="/favicon.ico" alt="IRIS" className="w-12 h-12" />
        </div>
        {/* subtle glow ring */}
        <div className="absolute inset-0 rounded-[22px] ring-1 ring-white/5 pointer-events-none" />
      </div>

      <div className="space-y-2">
        <h1 className="text-[2rem] font-bold tracking-tight text-white leading-tight">
          Willkommen bei IRIS
        </h1>
        <p className="text-zinc-400 text-[0.9375rem] leading-relaxed max-w-70 mx-auto">
          Das, was WebUntis dir nicht zeigt – jetzt auf einen Blick.
        </p>
      </div>

      <div className="w-full space-y-2">
        {[
          "Fehlstunden & Entschuldigungen",
          "Stundenplan-Statistiken",
          "Echtzeit-Push-Benachrichtigungen",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl px-4 py-3"
          >
            <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Check size={9} className="text-emerald-400" strokeWidth={3} />
            </div>
            <span className="text-[0.875rem] text-zinc-200 text-left">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step: Features ───────────────────────────────────────────

function StepFeatures() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-white">Features</h2>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {TABS.map(({ Icon, label, accent, ringColor, desc }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border p-3.5 space-y-2.5 flex flex-col",
              ringColor,
            )}
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className={accent} strokeWidth={1.75} />
              <span className={cn("text-xs font-semibold", accent)}>
                {label}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step: PWA Install ────────────────────────────────────────

function StepInstall({
  deferredPrompt,
  onInstalled,
}: {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstalled: () => void;
}) {
  const ios = isIOSDevice();
  const safari = isSafariBrowser();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") onInstalled();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center space-y-1.5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3.5">
          <span className="text-2xl select-none">{ios ? "📲" : "⬇️"}</span>
        </div>
        <h2 className="text-xl font-bold text-white">Als App installieren</h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-70 mx-auto">
          {ios
            ? "Auf dem iPhone funktionieren Push-Benachrichtigungen nur, wenn IRIS auf dem Home-Bildschirm installiert ist."
            : "Installiere IRIS für schnellen Zugriff und Hintergrund-Benachrichtigungen."}
        </p>
      </div>

      {ios ? (
        <>
          {!safari && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
              <p className="text-xs text-amber-300 text-center leading-relaxed">
                Öffne diese Seite in{" "}
                <strong className="text-amber-200">Safari</strong>, um IRIS zu
                installieren.
              </p>
            </div>
          )}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-4">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Schritt für Schritt
            </p>
            {[
              {
                num: "1",
                content: (
                  <span className="text-sm text-zinc-300 leading-relaxed flex items-center justify-center">
                    Tippe auf{" "}
                    <span className="inline-flex items-center gap-0.5 align-middle mx-1">
                      <span className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] px-1.5 py-0.5 rounded-lg font-medium inline-flex items-center gap-1">
                        <Share size={12} strokeWidth={2} />
                      </span>
                    </span>{" "}
                    in der Safari-Menüleiste
                  </span>
                ),
              },
              {
                num: "2",
                content: (
                  <span className="text-sm text-zinc-300 leading-relaxed">
                    Wähle{" "}
                    <span className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] px-2 py-0.5 rounded-lg font-medium inline">
                      Zum Home-Bildschirm
                    </span>
                  </span>
                ),
              },
              {
                num: "3",
                content: (
                  <span className="text-sm text-zinc-300 leading-relaxed">
                    Öffne IRIS über das neue Icon –{" "}
                    <strong className="text-white">fertig!</strong>
                  </span>
                ),
              },
            ].map(({ num, content }) => (
              <div key={num} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {num}
                </span>
                <div>{content}</div>
              </div>
            ))}
          </div>
        </>
      ) : deferredPrompt ? (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full py-3.5 rounded-2xl bg-white text-black text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {installing ? "Wird installiert…" : "IRIS installieren"}
        </button>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <p className="text-sm text-zinc-400 text-center leading-relaxed">
            Öffne IRIS in Chrome oder Edge auf Android, um die Installation
            anzubieten.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step: Notifications ──────────────────────────────────────

function StepNotifications({ onGranted }: { onGranted: () => void }) {
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied",
  );
  const [requesting, setRequesting] = useState(false);

  const request = async () => {
    if (!("Notification" in window)) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") onGranted();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center space-y-1.5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3.5">
          <BellIcon size={24} className="text-amber-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl font-bold text-white">
          Push-Benachrichtigungen
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-70 mx-auto">
          Erhalte eine Mitteilung, sobald eine Stunde ausfällt oder ein Lehrer
          wechselt – direkt auf dein Gerät.
        </p>
      </div>

      {permission === "granted" ? (
        <div className="flex items-center gap-2.5 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl px-4 py-3.5">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-300">
            Benachrichtigungen aktiviert
          </span>
        </div>
      ) : permission === "denied" ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <p className="text-sm text-zinc-400 text-center leading-relaxed">
            Benachrichtigungen wurden blockiert. Erlaube sie in den
            Browser-Einstellungen, dann richte sie in{" "}
            <span className="text-white font-medium">Nachrichten</span> ein.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={request}
            disabled={requesting}
            className="w-full py-3.5 rounded-2xl bg-white text-black text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {requesting
              ? "Warte auf Erlaubnis…"
              : "Benachrichtigungen erlauben"}
          </button>
          <p className="text-center text-[11px] text-zinc-600">
            Du kannst das später in der Nachrichten-Seite aktivieren.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Step: Done ───────────────────────────────────────────────

function StepDone() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
          <Check size={28} className="text-emerald-400" strokeWidth={2.5} />
        </div>
        {/* pulse ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Du bist startklar</h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-65 mx-auto">
          Alle Einstellungen findest du jederzeit unter{" "}
          <span className="text-white font-medium">Nachrichten</span>.
        </p>
      </div>

      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BellIcon size={14} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-sm text-zinc-400">Push-Benachrichtigungen</span>
        </div>
        <ChevronRight size={14} className="text-zinc-600" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    "Notification" in window && Notification.permission === "granted",
  );
  const [pwaInstalled, setPwaInstalled] = useState(isStandaloneMode());
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Show only on first visit
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  // Capture Chrome/Android install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Build step list dynamically
  const steps: string[] = ["welcome", "features"];
  if (!pwaInstalled) steps.push("install");
  if (!notifGranted) steps.push("notifications");
  steps.push("done");

  const totalSteps = steps.length;
  const currentKey = steps[step];
  const isLast = step === totalSteps - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      setExiting(true);
      setTimeout(() => {
        localStorage.setItem(ONBOARDING_KEY, "1");
        setVisible(false);
      }, 280);
      return;
    }
    // Cross-fade transition
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 140);
  }, [isLast]);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(ONBOARDING_KEY, "1");
      setVisible(false);
    }, 280);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-zinc-950 transition-opacity duration-300",
        exiting ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      {/* Top bar: step counter + skip */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-xs text-zinc-600 tabular-nums font-medium">
          {step + 1} / {totalSteps}
        </span>
        <button
          onClick={dismiss}
          className="flex items-center gap-1.5 text-zinc-500 text-sm hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-xl"
        >
          <X size={13} strokeWidth={2} />
          Überspringen
        </button>
      </div>

      {/* Dot progress bar */}
      <div className="px-5">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === step
                  ? "flex-3 bg-white"
                  : i < step
                    ? "flex-1 bg-zinc-600"
                    : "flex-1 bg-zinc-800",
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div
        className={cn(
          "flex-1 flex items-center justify-center px-6 py-6 transition-opacity duration-140",
          transitioning ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="w-full max-w-sm">
          {currentKey === "welcome" && <StepWelcome />}
          {currentKey === "features" && <StepFeatures />}
          {currentKey === "install" && (
            <StepInstall
              deferredPrompt={deferredPrompt}
              onInstalled={() => setPwaInstalled(true)}
            />
          )}
          {currentKey === "notifications" && (
            <StepNotifications onGranted={() => setNotifGranted(true)} />
          )}
          {currentKey === "done" && <StepDone />}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-10 pt-2">
        <button
          onClick={goNext}
          className={cn(
            "w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2",
            "active:scale-[0.98] transition-transform",
            isLast
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-white text-black hover:bg-zinc-100",
          )}
        >
          {isLast ? (
            <>
              <Check size={15} strokeWidth={2.5} />
              Los geht's
            </>
          ) : (
            <>
              Weiter
              <ChevronRight size={15} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
