"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Header, type LandingUser } from "./_components/Landing/Header";
import { Hero } from "./_components/Landing/Hero";
import { HowItWorks } from "./_components/Landing/HowItWorks";
import { Features } from "./_components/Landing/Features";
import { Audiences } from "./_components/Landing/Audiences";
import { Ecosystem } from "./_components/Landing/Ecosystem";
import { Faq } from "./_components/Landing/Faq";
import { FinalCta } from "./_components/Landing/FinalCta";
import { Footer } from "./_components/Landing/Footer";

const CONNECT_SKILLS_URL = process.env.NEXT_PUBLIC_CONNECT_SKILLS_URL || "http://localhost:3000";
const SIGN_UP_URL = "/api/auth/register";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [currentUser, setCurrentUser] = useState<LandingUser | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const stored = localStorage.getItem("mc_user");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    setCurrentUser(parsed);

    if (parsed?.email) {
      const statusUrl = `/api/auth/refresh-profile?email=${encodeURIComponent(parsed.email)}`;

      fetch(statusUrl)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data?.exists) return;
          const updated = {
            ...parsed,
            nome:        data.nome        ?? parsed.nome,
            sobrenome:   data.sobrenome   ?? parsed.sobrenome,
            foto_perfil: data.foto_perfil ?? parsed.foto_perfil,
          };
          localStorage.setItem("mc_user", JSON.stringify(updated));
          setCurrentUser(updated);
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mc_user");
    setCurrentUser(null);
  };

  const handleJoinMeeting = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinLink.trim()) return;
    const url = joinLink.trim();
    // Extrai o token se for link completo ou usa o próprio texto se for só o token
    const tokenStr = url.includes("/meeting/") ? url.split("/meeting/")[1].split(/[/?#]/)[0] : url.split(/[/?#]/)[0];
    router.push(`/meeting/${tokenStr}`);
  };

  const handleCreateMeeting = () => {
    if (!currentUser) {
      setRegisterModalOpen(true);
      return;
    }
    setLoading(true);
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    router.push(`/meeting/${token}?host=true`);
  };

  const openJoin = () => setJoinModalOpen(true);

  return (
    <div className="min-h-screen bg-white">
      <Header
        currentUser={currentUser}
        onLogin={() => router.push("/login")}
        onLogout={() => setLogoutModalOpen(true)}
        onCreateMeeting={handleCreateMeeting}
      />

      <main>
        <Hero loading={loading} onCreateMeeting={handleCreateMeeting} onJoinMeeting={openJoin} />
        <HowItWorks />
        <Features />
        <Audiences signUpUrl={SIGN_UP_URL} connectSkillsUrl={CONNECT_SKILLS_URL} />
        <Ecosystem connectSkillsUrl={CONNECT_SKILLS_URL} />
        <Faq />
        <FinalCta loading={loading} onCreateMeeting={handleCreateMeeting} onJoinMeeting={openJoin} />
      </main>

      <Footer signUpUrl={SIGN_UP_URL} connectSkillsUrl={CONNECT_SKILLS_URL} />

      {joinModalOpen && (
        <Modal onClose={() => setJoinModalOpen(false)}>
          <h2 className="text-2xl font-bold text-slate-900">{t("landing.joinModal.title")}</h2>
          <p className="mt-2 mb-6 text-slate-600">{t("landing.joinModal.desc")}</p>
          <form onSubmit={handleJoinMeeting} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder={t("landing.joinModal.placeholder")}
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none focus:border-meetor-ink"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-meetor-ink py-4 font-semibold text-white transition-colors hover:bg-meetor-ink-dark cursor-pointer"
            >
              {t("landing.joinModal.button")}
            </button>
          </form>
        </Modal>
      )}

      {logoutModalOpen && (
        <Modal onClose={() => setLogoutModalOpen(false)} centered>
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <LogOut className="h-7 w-7 text-red-600" />
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{t("landing.logoutModal.title")}</h2>
          <p className="mt-2 mb-6 text-slate-600">{t("landing.logoutModal.desc")}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-300 py-3.5 font-semibold text-slate-700 cursor-pointer"
            >
              {t("landing.logoutModal.cancel")}
            </button>
            <button
              onClick={() => {
                handleLogout();
                setLogoutModalOpen(false);
              }}
              className="flex-1 rounded-xl bg-red-600 py-3.5 font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer"
            >
              {t("landing.logoutModal.confirm")}
            </button>
          </div>
        </Modal>
      )}

      {registerModalOpen && (
        <Modal onClose={() => setRegisterModalOpen(false)} centered>
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-meetor-mist">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Connect Skills" className="h-8 w-8 object-contain" />
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{t("landing.registerModal.title")}</h2>
          <p className="mt-2 mb-6 text-slate-600">{t("landing.registerModal.desc")}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                window.location.href = SIGN_UP_URL;
              }}
              className="w-full rounded-xl bg-meetor-ink py-3.5 font-semibold text-white transition-colors hover:bg-meetor-ink-dark cursor-pointer"
            >
              {t("landing.registerModal.button")}
            </button>
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="w-full rounded-xl border border-slate-300 py-3.5 font-semibold text-slate-700 cursor-pointer"
            >
              {t("landing.registerModal.cancel")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, centered = false }: { children: React.ReactNode; onClose: () => void; centered?: boolean }) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 px-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[460px] rounded-3xl bg-white p-8 ${centered ? "text-center" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
}
