import {
  LinkIcon,
  Clock,
  BarChart3,
  Bell,
  History,
  Smartphone,
  Cpu,
  Code,
} from "lucide-react";

import pjson from "@/../package.json";

export default function About() {
  const features = [
    {
      title: "Absence Tracking",
      desc: "Anzeige und Filterung von entschuldigten / unentschuldigten Fehlstunden mit Zeiträumen.",
      icon: Clock,
    },
    {
      title: "Timetable Statistics",
      desc: "Analyse von Ausfällen, Vertretungen und fach-/lehrerspezifischen Mustern.",
      icon: BarChart3,
    },
    {
      title: "Push Notifications",
      desc: "Web Push (VAPID) Benachrichtigungen bei echten Stundenplanänderungen.",
      icon: Bell,
    },
    {
      title: "Change Log",
      desc: "Chronologische Historie aller erkannten Stundenplanänderungen (Hash-basiertes Diffing).",
      icon: History,
    },
    {
      title: "PWA + Background Polling",
      desc: "Installierbar auf iOS/Android. Backend pollt WebUntis alle 5 Minuten und erkennt Änderungen serverseitig.",
      icon: Smartphone,
    },
  ];

  const techStack = [
    "React 19",
    "TypeScript",
    "Vite",
    "Tailwind",
    "Go 1.25",
    "Valkey",
    "JWT",
    "Web Push (VAPID)",
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Über IRIS</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mt-0.5">
            Insights for WebUntis
          </p>
        </div>

        {/* Project Card */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-6 backdrop-blur-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">IRIS</h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Eine Progressive Web App zur Erweiterung von WebUntis mit
              Echtzeit-Änderungsbenachrichtigungen, Absenzen-Tracking und
              Statistiken.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-3.5">
              <p className="text-zinc-500 text-xs font-medium">Version</p>
              <p className="text-zinc-200 font-semibold mt-0.5">
                {pjson?.version || "1.0.0"}
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-3.5">
              <p className="text-zinc-500 text-xs font-medium">Maintainer</p>
              <p className="text-zinc-200 font-semibold mt-0.5 truncate">
                {pjson?.author || "crwntec"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 mt-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
          Features
        </h3>

        <div className="space-y-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex gap-4 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-5 backdrop-blur-sm dynamic-island-hover"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Icon size={20} />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-200">{feature.title}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech / Stack */}
      <div className="px-4 mt-8">
        <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <Cpu size={16} className="text-zinc-500" />
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Tech Stack
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {techStack.map((tech, idx) => (
              <span
                key={idx}
                className="text-xs bg-zinc-900 text-zinc-300 border border-zinc-800/60 px-2.5 py-1 rounded-xl font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Links */}
      <div className="px-4 mt-6 space-y-4">
        <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-300">Repository</h3>
          </div>
          <a
            href="https://github.com/crwntec/iris"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium self-start sm:self-auto"
          >
            github.com/crwntec/iris
            <LinkIcon size={14} />
          </a>
        </div>

        <div className="text-center text-xs text-zinc-600 font-medium tracking-wide pt-2">
          Licensed under GPL-3.0
        </div>
      </div>
    </div>
  );
}
