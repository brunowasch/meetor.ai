"use client";

import { ClipboardCheck, Globe, ShieldCheck, Star, Timer, UserX, Video, WandSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const features = [Video, ShieldCheck, Timer, ClipboardCheck, WandSparkles, UserX, Star, Globe];

export function Features() {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <SectionHeading kicker={t("landing.features.kicker")} title={t("landing.features.title")} />
          <Reveal delay={100}>
            <p className="text-lg leading-relaxed text-slate-600 lg:pb-2">{t("landing.features.desc")}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((Icon, i) => (
            <Reveal key={i} delay={(i % 4) * 80} className="h-full">
              <article className="group h-full rounded-3xl border border-slate-200 bg-white p-7 transition-colors duration-300 hover:border-meetor-ink/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-meetor-mist text-meetor-cyan-dark transition-colors duration-300 group-hover:bg-meetor-ink group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{t(`landing.features.f${i + 1}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`landing.features.f${i + 1}Text`)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
