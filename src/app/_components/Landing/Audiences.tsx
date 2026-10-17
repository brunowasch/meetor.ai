"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

type AudiencesProps = {
  signUpUrl: string;
  connectSkillsUrl: string;
};

export function Audiences({ signUpUrl, connectSkillsUrl }: AudiencesProps) {
  const { t } = useTranslation();

  const tiles = [
    { key: "specialist", dark: true, href: signUpUrl },
    { key: "candidate", dark: false, href: connectSkillsUrl },
  ];

  return (
    <section id="audiences" className="scroll-mt-24 bg-white pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker={t("landing.audiences.kicker")} title={t("landing.audiences.title")} />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {tiles.map((tile, i) => (
            <Reveal key={tile.key} delay={i * 120} className="h-full min-w-0">
              <a
                href={tile.href}
                className={`group flex h-full flex-col rounded-3xl p-8 transition-colors duration-300 sm:p-12 ${tile.dark
                  ? "bg-meetor-ink text-white hover:bg-meetor-ink-dark"
                  : "border border-slate-200 bg-meetor-mist text-slate-900 hover:border-meetor-ink/40"
                  }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <h3 className="min-w-0 text-[2rem] font-extrabold uppercase leading-[0.9] tracking-tight sm:text-5xl lg:text-[2.6rem] xl:text-5xl">
                    <span className={`block text-lg font-bold tracking-[0.25em] ${tile.dark ? "text-meetor-cyan" : "text-meetor-cyan-dark"}`}>
                      {t("landing.audiences.for")}
                    </span>
                    {t(`landing.audiences.${tile.key}Title`)}
                  </h3>
                  <span
                    className={`hidden h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 sm:flex ${tile.dark ? "bg-white text-meetor-ink" : "bg-meetor-ink text-white"
                      }`}
                  >
                    <ArrowUpRight className="h-6 w-6" />
                  </span>
                </div>

                <p className={`mt-8 max-w-md text-lg leading-relaxed ${tile.dark ? "text-white/75" : "text-slate-600"}`}>
                  {t(`landing.audiences.${tile.key}Desc`)}
                </p>

                <ul className="mt-8 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-3 font-medium">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tile.dark ? "bg-white/10 text-meetor-cyan" : "bg-white text-meetor-cyan-dark"
                          }`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {t(`landing.audiences.${tile.key}${n}`)}
                    </li>
                  ))}
                </ul>

                <span className={`mt-auto inline-flex items-center gap-2 pt-10 font-bold ${tile.dark ? "text-meetor-cyan" : "text-meetor-ink"}`}>
                  {t(`landing.audiences.${tile.key}Cta`)}
                  <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-14" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
