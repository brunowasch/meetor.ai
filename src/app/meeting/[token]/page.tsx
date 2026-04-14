"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useState, useRef, useEffect, Suspense } from "react";
import {
  Copy,
  Target,
  LogOut,
  CheckCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  Eye,
  EyeOff,
  X,
  ClipboardList,
  Send,
  AlertCircle,
} from "lucide-react";

type AuthStatus = "checking" | "need_login" | "unauthorized" | "authorized" | "error";

interface McUser {
  email: string;
  nome?: string;
  sobrenome?: string;
  tipo?: string;
  foto_perfil?: string;
  usuario_id?: string;
}

/* ─────────────────────────────────────────────
   LOGIN MODAL
───────────────────────────────────────────── */
function LoginModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (user: McUser) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Credenciais inválidas.");
      const user: McUser = data.user;
      localStorage.setItem("mc_user", JSON.stringify(user));
      onSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#0e0f12",
          borderRadius: 20,
          border: "1px solid #1e2029",
          padding: "40px 40px 36px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          position: "relative",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              marginBottom: 16,
            }}
          >
            <Target size={28} color="white" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
            Login Necessário
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
            Apenas participantes autorizados podem entrar nesta sala. Faça login
            com sua conta do Connect Skills.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.3)",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "#aaa" }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                background: "#161820",
                border: "1px solid #2a2c36",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "#aaa" }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "#161820",
                  border: "1px solid #2a2c36",
                  borderRadius: 10,
                  padding: "12px 44px 12px 14px",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              background: loading ? "#1d4ed8" : "linear-gradient(135deg, #2563eb, #06b6d4)",
              border: "none",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.2s",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div style={{ textAlign: "center", marginTop: 4 }}>
            <a href="/login" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none" }}>
              Entrar com Google / LinkedIn / Facebook →
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACCESS DENIED
───────────────────────────────────────────── */
function AccessDenied({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#08090c",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 480,
          padding: "48px 40px",
          background: "#0e0f12",
          borderRadius: 20,
          border: "1px solid rgba(239,68,68,.25)",
          boxShadow: "0 0 40px rgba(239,68,68,.08)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(239,68,68,.1)",
            marginBottom: 24,
          }}
        >
          <ShieldAlert size={32} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          Acesso Negado
        </h1>
        <p style={{ fontSize: 15, color: "#888", lineHeight: 1.6, marginBottom: 32 }}>{reason}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onRetry}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              background: "rgba(239,68,68,.15)",
              border: "1px solid rgba(239,68,68,.3)",
              color: "#f87171",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              background: "#1e2029",
              border: "1px solid #2a2c36",
              color: "#aaa",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────── */
function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#08090c",
        fontFamily: "'Inter', sans-serif",
        gap: 20,
      }}
    >
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid #1a1b1f",
          borderTopColor: "#3b82f6",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ fontSize: 15, color: "#888", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

/* FEEDBACK SIDEBAR (mentor only)*/
type FeedbackStatus = "idle" | "sending" | "success" | "error";

function FeedbackSidebar({ entrevistaId }: { entrevistaId: string | null }) {
  const [comportamental, setComportamental] = useState("");
  const [notaComportamental, setNotaComportamental] = useState<string>("");
  const [tecnica, setTecnica] = useState("");
  const [notaTecnica, setNotaTecnica] = useState<string>("");
  const [geral, setGeral] = useState("");
  const [notaGeral, setNotaGeral] = useState<string>("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const parseNota = (v: string) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
  const notaValida = (v: string) => { const n = parseNota(v); return n !== null && n >= 1 && n <= 100; };

  const allFilled =
    comportamental.trim() !== "" && notaValida(notaComportamental) &&
    tecnica.trim() !== "" && notaValida(notaTecnica) &&
    geral.trim() !== "" && notaValida(notaGeral);
  const isSuccess = status === "success";

  const handleSubmit = async () => {
    if (!allFilled || !entrevistaId) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/meetings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrevistaId,
          feedback_comportamental: comportamental.trim(),
          nota_comportamental: parseNota(notaComportamental),
          feedback_tecnico: tecnica.trim(),
          nota_tecnica: parseNota(notaTecnica),
          feedback_geral: geral.trim(),
          nota_geral: parseNota(notaGeral),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar avaliação.");
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar avaliação.");
      setStatus("error");
    }
  };

  const handleNotaChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") { setter(""); return; }
    const n = parseInt(raw, 10);
    if (n > 100) setter("100");
    else setter(String(n));
  };



  const getTextareaClass = (val: string) => {
    const base = "w-full bg-[#13141a] border rounded-[10px] text-slate-200 text-sm leading-[1.6] outline-none resize-y min-h-[90px] box-border transition-colors duration-200";
    return val.trim() ? `${base} border-blue-600/30` : `${base} border-[#232530]`;
  };

  const getNotaClass = (val: string) => {
    const valid = notaValida(val);
    const base = "w-full bg-[#13141a] border rounded-[10px] text-slate-200 text-[15px] font-semibold outline-none box-border transition-colors duration-200";
    if (val === "") return `${base} border-[#232530]`;
    if (valid) return `${base} border-blue-600/30`;
    return `${base} border-red-500/50`;
  };

  const textareaStyle: React.CSSProperties = { padding: "12px 16px" };
  const inputStyle: React.CSSProperties = { padding: "10px 14px" };

  return (
    <div className="w-[340px] min-w-[340px] h-full bg-[#0c0d11] border-r border-[#1a1c24] flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1a1c24] bg-gradient-to-b from-[#10111a] to-[#0c0d11]">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-gradient-to-br from-blue-600/[0.13] to-cyan-500/[0.13] border border-blue-600/[0.27]">
            <ClipboardList size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">
              Avaliação do Candidato
            </div>
            <div className="text-[11px] text-slate-500">Visível apenas para você</div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-5" style={{ padding: "20px 20px 20px" }}>
          {isSuccess ? (
            /* ── success state ── */
            <div className="flex flex-col items-center justify-center text-center gap-4 px-3 py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/[0.12] border border-green-500/30 flex items-center justify-center">
                <CheckCircle size={30} className="text-green-500" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-100 mb-1.5">
                  Avaliação Enviada!
                </div>
                <div className="text-[13px] text-slate-500 leading-relaxed">
                  Seu feedback foi salvo com sucesso e estará disponível no relatório da entrevista.
                </div>
              </div>
            </div>
          ) : (
            /* ── form fields ── */
            <>
              {/* Comportamental — cabeçalho */}
              <div>
                <label className="text-xs font-bold tracking-[0.6px] uppercase text-slate-400 mb-1.5 block">
                  Comportamental
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-snug">
                  Comunicação, trabalho em equipe, postura profissional e proatividade.
                </p>
              </div>

              {/* Comportamental — nota */}
              <div className="mt-2.5">
                <label className="text-[11px] text-slate-500 mb-1 block">
                  Nota Comportamental (1 – 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Ex: 85"
                  value={notaComportamental}
                  onChange={handleNotaChange(setNotaComportamental)}
                  disabled={status === "sending"}
                  className={getNotaClass(notaComportamental)}
                  style={inputStyle}
                />
              </div>

              {/* Comportamental — textarea */}
              <div>
                <textarea
                  placeholder="Descreva o desempenho comportamental do candidato..."
                  value={comportamental}
                  onChange={(e) => setComportamental(e.target.value)}
                  disabled={status === "sending"}
                  className={getTextareaClass(comportamental)}
                  style={textareaStyle}
                />
              </div>

              {/* Técnica — cabeçalho */}
              <div>
                <label className="text-xs font-bold tracking-[0.6px] uppercase text-slate-400 mb-1.5 block">
                  Técnica
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-snug">
                  Conhecimentos técnicos, raciocínio lógico e resolução de problemas.
                </p>
              </div>

              {/* Técnica — nota */}
              <div className="mt-2">
                <label className="text-[11px] text-slate-500 mb-1 block">
                  Nota Técnica (1 – 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Ex: 72"
                  value={notaTecnica}
                  onChange={handleNotaChange(setNotaTecnica)}
                  disabled={status === "sending"}
                  className={getNotaClass(notaTecnica)}
                  style={inputStyle}
                />
              </div>

              {/* Técnica — textarea */}
              <div>
                <textarea
                  placeholder="Avalie as habilidades técnicas do candidato..."
                  value={tecnica}
                  onChange={(e) => setTecnica(e.target.value)}
                  disabled={status === "sending"}
                  className={getTextareaClass(tecnica)}
                  style={textareaStyle}
                />
              </div>

              {/* Geral — cabeçalho */}
              <div>
                <label className="text-xs font-bold tracking-[0.6px] uppercase text-slate-400 mb-1.5 block">
                  Geral
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2 leading-snug">
                  Impressão geral, adequação cultural e recomendação final.
                </p>
              </div>

              {/* Geral — nota */}
              <div className="mt-2.5">
                <label className="text-[11px] text-slate-500 mb-0.5 block">
                  Nota Geral (1 – 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Ex: 90"
                  value={notaGeral}
                  onChange={handleNotaChange(setNotaGeral)}
                  disabled={status === "sending"}
                  className={getNotaClass(notaGeral)}
                  style={inputStyle}
                />
              </div>

              {/* Geral — textarea */}
              <div>
                <textarea
                  placeholder="Deixe sua avaliação geral sobre o candidato..."
                  value={geral}
                  onChange={(e) => setGeral(e.target.value)}
                  disabled={status === "sending"}
                  className={getTextareaClass(geral)}
                  style={textareaStyle}
                />
              </div>

              {/* Error */}
              {status === "error" && errorMsg && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-[10px] bg-red-500/[0.08] border border-red-500/25 text-red-400 text-[13px]">
                  <AlertCircle size={15} className="mt-px shrink-0" />
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit button */}
      {!isSuccess && (
        <div className="px-5 pt-4 pb-5 border-t border-[#1a1c24] mt-3">
          {!allFilled && (
            <p className="text-xs text-slate-500 mb-2.5 text-center">
              Preencha os 3 campos e notas (1–100) para liberar o envio
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allFilled || status === "sending" || !entrevistaId}
            className={[
              "w-full py-[13px] rounded-xl text-sm font-bold",
              "flex items-center justify-center gap-2",
              "border-none transition-all duration-200",
              allFilled && status !== "sending"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_4px_20px_rgba(37,99,235,.3)] cursor-pointer"
                : "bg-[#1a1c24] text-[#374151] cursor-not-allowed",
            ].join(" ")}
          >
            {status === "sending" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={15} />
                Enviar Avaliação
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN MEETING ROOM
───────────────────────────────────────────── */
function MeetingRoomInner() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isHost = searchParams.get("host") === "true";
  const [copied, setCopied] = useState(false);
  const jitsiApiRef = useRef<any>(null);
  const APP_ID = process.env.NEXT_PUBLIC_APP_ID;

  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authReason, setAuthReason] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<McUser | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [entrevistaId, setEntrevistaId] = useState<string | null>(null);

  const runAuthCheck = async (user: McUser | null) => {
    if (!token) return;

    if (!user) {
      setAuthStatus("need_login");
      setShowLoginModal(true);
      return;
    }

    setAuthStatus("checking");
    try {
      const res = await fetch(
        `/api/meetings/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();

      if (data.authorized) {
        setAuthorizedUser(user);
        setIsMentor(data.isMentor ?? false);
        setEntrevistaId(data.entrevistaId ?? null);
        setAuthStatus("authorized");
      } else {
        setAuthReason(data.reason ?? "Acesso não permitido.");
        setAuthStatus("unauthorized");
      }
    } catch {
      setAuthReason("Não foi possível verificar sua autorização. Verifique sua conexão.");
      setAuthStatus("error");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("mc_user");
    const user: McUser | null = stored ? JSON.parse(stored) : null;
    runAuthCheck(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const copyLink = () => {
    if (!token) return;
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = () => {
    if (jitsiApiRef.current) jitsiApiRef.current.dispose();
    router.push("/");
  };

  const handleLoginSuccess = (user: McUser) => {
    setShowLoginModal(false);
    runAuthCheck(user);
  };

  const handleLoginClose = () => {
    setShowLoginModal(false);
    router.push("/");
  };

  if (!token) return <LoadingScreen message="Identificando sala..." />;
  if (authStatus === "checking") return <LoadingScreen message="Verificando autorização de acesso..." />;

  if (authStatus === "need_login") {
    return (
      <div
        style={{
          height: "100vh",
          background: "#08090c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showLoginModal && (
          <LoginModal onSuccess={handleLoginSuccess} onClose={handleLoginClose} />
        )}
        {!showLoginModal && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                border: "none",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LogIn size={18} /> Fazer login para entrar na sala
            </button>
          </div>
        )}
      </div>
    );
  }

  if (authStatus === "unauthorized" || authStatus === "error") {
    return (
      <AccessDenied
        reason={authReason}
        onRetry={() => runAuthCheck(JSON.parse(localStorage.getItem("mc_user") ?? "null"))}
      />
    );
  }

  const roomName = `${APP_ID}/MentorshipConnect-Room-${token}`;
  const displayName = authorizedUser
    ? [authorizedUser.nome, authorizedUser.sobrenome].filter(Boolean).join(" ") ||
      authorizedUser.email
    : isHost
    ? "Anfitrião"
    : "Participante";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#08090c",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "#0e0f12",
          borderBottom: "1px solid #1a1b1f",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1DB5DA, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target size={18} color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Sala de Mentoria Privada
              {isHost && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: "rgba(37,99,235,.2)",
                    color: "#60a5fa",
                    padding: "3px 10px",
                    borderRadius: 20,
                    letterSpacing: 0.5,
                  }}
                >
                  ANFITRIÃO
                </span>
              )}
              {isMentor && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: "rgba(168,85,247,.15)",
                    color: "#c084fc",
                    padding: "3px 10px",
                    borderRadius: 20,
                    letterSpacing: 0.5,
                  }}
                >
                  MENTOR
                </span>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(34,197,94,.15)",
                  color: "#22c55e",
                  padding: "3px 10px",
                  borderRadius: 20,
                  letterSpacing: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ShieldCheck size={11} /> Verificado
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
              #{token?.substring(0, 8)}
              {authorizedUser && (
                <span style={{ marginLeft: 8, color: "#4b5563" }}>
                  · {displayName}
                  {authorizedUser.tipo ? ` (${authorizedUser.tipo})` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isHost && (
            <button
              onClick={copyLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                background: copied ? "rgba(34,197,94,.15)" : "rgba(37,99,235,.15)",
                border: `1px solid ${copied ? "rgba(34,197,94,.3)" : "rgba(37,99,235,.3)"}`,
                color: copied ? "#22c55e" : "#60a5fa",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? (
                <><CheckCircle size={16} /> Link Copiado!</>
              ) : (
                <><Copy size={16} /> Compartilhar</>
              )}
            </button>
          )}
          <button
            onClick={leaveRoom}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,.15)",
              border: "1px solid rgba(239,68,68,.3)",
              color: "#ef4444",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <LogOut size={16} /> Encerrar
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + call ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Feedback sidebar — only visible to mentor */}
        {isMentor && <FeedbackSidebar entrevistaId={entrevistaId} />}

        {/* Jitsi call area */}
        <div style={{ flex: 1, position: "relative", background: "#0a0b0e", minWidth: 0 }}>
          <JitsiMeeting
            domain="8x8.vc"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              disableModeratorIndicator: false,
              enableEmailInStats: false,
              defaultLanguage: "ptBR",
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_CHROME_EXTENSION_BANNER: false,
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "closedcaptions",
                "desktop",
                "fullscreen",
                "fodeviceselection",
                "hangup",
                "profile",
                "chat",
                "recording",
                "livestreaming",
                "etherpad",
                "sharedvideo",
                "settings",
                "raisehand",
                "videoquality",
                "filmstrip",
                "invite",
                "feedback",
                "stats",
                "shortcuts",
                "tileview",
                "videobackgroundblur",
                "download",
                "help",
                "mute-everyone",
                "security",
              ],
            }}
            userInfo={{
              displayName,
              email: authorizedUser?.email ?? "",
            }}
            onApiReady={(externalApi) => {
              jitsiApiRef.current = externalApi;

              if (isHost) {
                externalApi.addListener("videoConferenceJoined", () => {
                  externalApi.executeCommand("toggleLobby", true);
                });
              }

              externalApi.addListener("videoConferenceLeft", () => {
                router.push("/");
              });
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
              iframeRef.style.border = "none";
            }}
            spinner={() => <LoadingScreen message="Iniciando ambiente seguro..." />}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────── */
export default function MeetingRoomPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            height: "100vh",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0b0e",
            color: "#666",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Loader2 size={32} color="#3b82f6" className="animate-spin" />
        </div>
      }
    >
      <MeetingRoomInner />
    </Suspense>
  );
}
