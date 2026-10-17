"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

export function Faq() {
  const { t } = useTranslation();
  const items = [1, 2, 3, 4, 5, 6];

  return (
    <section id="faq" className="scroll-mt-24 border-t border-slate-200 bg-meetor-surface py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading kicker={t("landing.faq.kicker")} title={t("landing.faq.title")} description={t("landing.faq.desc")} />
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
          {items.map((n, i) => (
            <Reveal key={n} delay={i * 50}>
              <details className="group py-2" name="faq">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-bold text-slate-900 transition-colors hover:text-meetor-cyan-dark sm:text-xl [&::-webkit-details-marker]:hidden">
                  {t(`landing.faq.q${n}`)}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 text-meetor-ink transition duration-300 group-open:rotate-45 group-open:border-meetor-ink group-open:bg-meetor-ink group-open:text-white">
                    <Plus className="h-5 w-5" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-16 leading-relaxed text-slate-600">{t(`landing.faq.a${n}`)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
