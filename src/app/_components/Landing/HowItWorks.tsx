"use client";

import { CalendarDays, ClipboardCheck, Link2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const steps = [CalendarDays, Link2, Video, ClipboardCheck];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" className="scroll-mt-24 border-y border-slate-200 bg-meetor-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading align="center" kicker={t("landing.how.kicker")} title={t("landing.how.title")} />

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((Icon, i) => (
            <Reveal as="li" key={i} delay={i * 100} className="h-full">
              <article className="h-full rounded-3xl border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-meetor-mist text-meetor-cyan-dark">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-bold text-slate-300">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{t(`landing.how.s${i + 1}Title`)}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{t(`landing.how.s${i + 1}Text`)}</p>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
