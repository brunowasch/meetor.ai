"use client";

import { Check, Clock, Copy, LogIn, Mic, MonitorUp, PhoneOff, ShieldCheck, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "./Reveal";

type HeroProps = {
  loading: boolean;
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
};

export function Hero({ loading, onCreateMeeting, onJoinMeeting }: HeroProps) {
  const { t } = useTranslation();
  const points = [t("landing.hero.point1"), t("landing.hero.point2"), t("landing.hero.point3")];

  return (
    <section className="bg-white pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-6">
          <h1 className="text-[2.4rem] font-extrabold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl">
            <Reveal as="span" className="block">
              {t("landing.hero.title1")}
            </Reveal>
            <Reveal as="span" delay={100} className="block text-meetor-cyan-dark">
              {t("landing.hero.title2")}
            </Reveal>
          </h1>

          <Reveal delay={200}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">{t("landing.hero.subtitle")}</p>
          </Reveal>

          <Reveal delay={280} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onCreateMeeting}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-meetor-ink px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-meetor-ink-dark disabled:opacity-60 cursor-pointer"
            >
              <Video className="h-5 w-5" />
              {loading ? t("landing.generating") : t("landing.createMeeting")}
            </button>
            <button
              onClick={onJoinMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-meetor-ink transition-colors hover:border-meetor-ink cursor-pointer"
            >
              <LogIn className="h-5 w-5" />
              {t("landing.joinWithLink")}
            </button>
          </Reveal>

          <Reveal delay={360}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-meetor-mist text-meetor-cyan-dark">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={150} className="min-w-0 lg:col-span-6">
          <MeetingMockup />
        </Reveal>
      </div>
    </section>
  );
}

// Ilustração da sala de reunião: duas câmeras, controles e o painel de avaliação do especialista
function MeetingMockup() {
  const { t } = useTranslation();

  const scores = [
    { label: t("landing.mock.behavioral"), value: 86 },
    { label: t("landing.mock.technical"), value: 78 },
    { label: t("landing.mock.general"), value: 82 },
  ];

  const participants = [
    { name: "Eduarda G.", role: t("landing.mock.specialist"), avatar: "/img/landing/avatar-eduarda-g.svg" },
    { name: "John Doe", role: t("landing.mock.candidate"), avatar: "/img/landing/avatar-john-doe.svg" },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-meetor-surface">
      {/* Barra superior da sala */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-meetor-cyan-dark" />
          <span className="truncate text-sm font-bold text-slate-900">{t("landing.mock.room")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-meetor-mist px-3 py-1 text-xs font-semibold text-meetor-cyan-dark">
            <Clock className="h-3.5 w-3.5" />
            {t("landing.mock.timer")}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
            <Copy className="h-3.5 w-3.5" />
            {t("landing.mock.copyLink")}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_15rem]">
        {/* Câmeras */}
        <div className="grid gap-3">
          {participants.map((p) => (
            <div key={p.name} className="relative flex aspect-video items-center justify-center rounded-2xl bg-meetor-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt={p.name} className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/40 px-2.5 py-1 text-xs font-semibold text-white">
                {p.name} · {p.role}
              </span>
            </div>
          ))}
        </div>

        {/* Painel de avaliação */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-900">{t("landing.mock.panelTitle")}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("landing.mock.panelPrivate")}</p>
          <ul className="mt-5 space-y-4">
            {scores.map((s) => (
              <li key={s.label}>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{s.label}</span>
                  <span className="text-meetor-ink">{s.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-meetor-surface">
                  <div className="h-full rounded-full bg-meetor-cyan" style={{ width: `${s.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-meetor-mist px-3 py-2 text-xs font-semibold text-meetor-cyan-dark">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
            {t("landing.mock.aiCheck")}
          </p>
        </aside>
      </div>

      {/* Controles da chamada */}
      <div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white py-3" aria-hidden="true">
        {[Mic, Video, MonitorUp].map((Icon, i) => (
          <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600">
            <Icon className="h-4 w-4" />
          </span>
        ))}
        <span className="flex h-10 w-14 items-center justify-center rounded-full bg-red-500 text-white">
          <PhoneOff className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
