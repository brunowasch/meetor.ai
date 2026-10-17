"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../LanguageSwitcher";

export type LandingUser = {
  email?: string;
  nome?: string;
  sobrenome?: string;
  foto_perfil?: string;
  tipo?: string;
};

type HeaderProps = {
  currentUser: LandingUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onCreateMeeting: () => void;
};

export function Header({ currentUser, onLogin, onLogout, onCreateMeeting }: HeaderProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: t("landing.nav.how"), href: "#how" },
    { label: t("landing.nav.features"), href: "#features" },
    { label: t("landing.nav.audiences"), href: "#audiences" },
    { label: t("landing.nav.faq"), href: "#faq" },
  ];

  const userName = currentUser
    ? [currentUser.nome, currentUser.sobrenome].filter(Boolean).join(" ") || currentUser.email
    : "";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white transition-colors duration-300 ${scrolled || open ? "border-b border-slate-200" : "border-b border-transparent"
        }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <a href="#" onClick={() => setOpen(false)} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/meetor-logo-horizontal.svg" alt="Meetor" className="h-8 w-auto sm:h-9" />
        </a>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-meetor-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {currentUser ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 py-1.5 pr-3 pl-1.5 sm:flex">
                {currentUser.foto_perfil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.foto_perfil} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-meetor-ink text-white">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="max-w-[12rem] truncate text-sm font-semibold text-meetor-ink">{userName}</span>
              </div>
              <button
                onClick={onLogout}
                title={t("landing.logout")}
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-meetor-ink sm:inline-flex cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {t("landing.logout")}
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="hidden items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-meetor-ink transition-colors hover:bg-meetor-surface sm:inline-flex cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              {t("landing.login")}
            </button>
          )}

          <button
            onClick={onCreateMeeting}
            className="hidden rounded-full bg-meetor-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-meetor-ink-dark sm:inline-flex cursor-pointer"
          >
            {t("landing.createMeeting")}
          </button>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? t("landing.nav.closeMenu") : t("landing.nav.openMenu")}
            aria-expanded={open}
            className="rounded-full p-2.5 text-meetor-ink transition-colors hover:bg-meetor-surface lg:hidden cursor-pointer"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-lg font-semibold text-slate-700 hover:bg-meetor-surface"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {currentUser ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="rounded-full border border-slate-300 px-4 py-3 font-semibold text-meetor-ink cursor-pointer"
                >
                  {t("landing.logout")}
                </button>
              ) : (
                <button onClick={onLogin} className="rounded-full border border-slate-300 px-4 py-3 font-semibold text-meetor-ink cursor-pointer">
                  {t("landing.login")}
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateMeeting();
                }}
                className="rounded-full bg-meetor-ink px-4 py-3 font-semibold text-white cursor-pointer"
              >
                {t("landing.createMeeting")}
              </button>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4">
              <LanguageSwitcher align="left" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
