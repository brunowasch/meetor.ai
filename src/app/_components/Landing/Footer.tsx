"use client";

import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

type FooterProps = {
  signUpUrl: string;
  connectSkillsUrl: string;
};

export function Footer({ signUpUrl, connectSkillsUrl }: FooterProps) {
  const { t } = useTranslation();

  const navLinks = [
    { label: t("landing.nav.how"), href: "#how" },
    { label: t("landing.nav.features"), href: "#features" },
    { label: t("landing.nav.audiences"), href: "#audiences" },
    { label: t("landing.nav.faq"), href: "#faq" },
  ];

  const columnTitle = "text-xs font-bold uppercase tracking-[0.2em] text-meetor-cyan";

  return (
    <footer className="bg-meetor-ink text-white">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/meetor-logo-horizontal-white.svg" alt="Meetor" className="h-9 w-auto" />
            <p className="mt-6 text-2xl font-bold">{t("landing.footer.tagline")}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">{t("landing.footer.desc")}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-6">
            <div>
              <p className={columnTitle}>{t("landing.footer.nav")}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-white/75 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={columnTitle}>{t("landing.footer.product")}</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={connectSkillsUrl} className="text-white/75 transition-colors hover:text-white">
                    {t("landing.footer.goToCs")}
                  </a>
                </li>
                <li>
                  <a href={signUpUrl} className="text-white/75 transition-colors hover:text-white">
                    {t("landing.footer.signUp")}
                  </a>
                </li>
                <li>
                  <a href="/login" className="text-white/75 transition-colors hover:text-white">
                    {t("landing.login")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/15 pt-6 text-sm text-white/50 sm:flex-row sm:items-center">
          <p>
            Meetor © {new Date().getFullYear()}. {t("landing.footer.rights")}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 font-semibold text-white/75 transition-colors hover:text-white cursor-pointer"
          >
            {t("landing.footer.backToTop")}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 group-hover:border-white">
              <ArrowUp className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
