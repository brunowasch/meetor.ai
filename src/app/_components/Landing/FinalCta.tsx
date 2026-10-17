"use client";

import { LogIn, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "./Reveal";

type FinalCtaProps = {
  loading: boolean;
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
};

export function FinalCta({ loading, onCreateMeeting, onJoinMeeting }: FinalCtaProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-meetor-surface pb-20 lg:pb-28">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center sm:px-12 lg:py-24">
          <h2 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            {t("landing.final.title1")} <span className="text-meetor-cyan-dark">{t("landing.final.title2")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">{t("landing.final.desc")}</p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={onCreateMeeting}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-meetor-ink px-8 py-4 font-semibold text-white transition-colors hover:bg-meetor-ink-dark disabled:opacity-60 cursor-pointer"
            >
              <Video className="h-5 w-5" />
              {loading ? t("landing.generating") : t("landing.createMeeting")}
            </button>
            <button
              onClick={onJoinMeeting}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-8 py-4 font-semibold text-meetor-ink transition-colors hover:border-meetor-ink cursor-pointer"
            >
              <LogIn className="h-5 w-5" />
              {t("landing.joinWithLink")}
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
