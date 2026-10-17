"use client";

import { ArrowUpRight, CalendarCheck, FileText, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "./Reveal";

const items = [KeyRound, CalendarCheck, FileText];

export function Ecosystem({ connectSkillsUrl }: { connectSkillsUrl: string }) {
  const { t } = useTranslation();

  return (
    <section className="bg-white pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="grid overflow-hidden rounded-3xl bg-meetor-ink text-white lg:grid-cols-12">
            <div className="flex flex-col justify-center border-b border-white/10 p-8 sm:p-12 lg:col-span-5 lg:border-r lg:border-b-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/cs-icon.png" alt="Connect Skills" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-meetor-cyan">{t("landing.ecosystem.kicker")}</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("landing.ecosystem.title")}</h2>
              <p className="mt-5 max-w-md text-white/70">{t("landing.ecosystem.desc")}</p>
              <a
                href={connectSkillsUrl}
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-meetor-ink transition-colors hover:bg-meetor-mist"
              >
                {t("landing.ecosystem.cta")}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <ol className="space-y-8 p-8 sm:p-12 lg:col-span-7 lg:self-center">
              {items.map((Icon, i) => (
                <li key={i} className="flex gap-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 text-meetor-cyan">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold">{t(`landing.ecosystem.i${i + 1}Title`)}</p>
                    <p className="mt-1 leading-relaxed text-white/65">{t(`landing.ecosystem.i${i + 1}Text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
