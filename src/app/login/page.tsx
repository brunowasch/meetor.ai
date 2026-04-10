"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Target } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "account_not_found") {
      setError("Sua conta não foi encontrada no Connect Skills. Cadastre-se primeiro no Connect Skills.");
    } else if (errorParam === "user_not_found") {
      setError("Usuário não encontrado. Se você registrou via social, tente logar pela rede.");
    }
  }, [searchParams]);



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
      localStorage.setItem("mc_user", JSON.stringify(data.user));
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-[#d1d5db] text-[15px] text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const inputStyle = { borderRadius: 999, padding: "12px 18px" };

  return (
    <div
      style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 16px", fontFamily: "Inter, sans-serif" }}
    >
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", height: 64, justifyContent: "space-between", padding: "0 24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => router.push("/")}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Target size={20} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
              MentorConnect <span style={{ color: "#9ca3af", fontSize: 14 }}>Meet</span>
            </span>
          </div>
          <div>
            <a href="#" onClick={(e) => { e.preventDefault(); router.push("/"); }} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color="#111827")} onMouseLeave={e => (e.currentTarget.style.color="#6b7280")}>
              Voltar ao início
            </a>
          </div>
        </div>
      </nav>

      <div
        style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "40px 40px 36px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
      >
        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", color: "#111827", marginBottom: 28 }}>
          Login
        </h1>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, color: "#374151" }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, color: "#374151" }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className={inputClass}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer", borderRadius: 4 }}
              />
              Manter login
            </label>
            <a href="#" style={{ fontSize: 14, color: "#3b82f6", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#60a5fa" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s",
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#1d4ed8"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#2563eb"; }}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 13, color: "#9ca3af" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Google */}
          <button
            type="button"
            onClick={() => { window.location.href = `/api/auth/google`; }}
            style={{ width: "100%", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Entrar com Google
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={() => { window.location.href = `/api/auth/linkedin`; }}
            style={{ width: "100%", background: "#fff", border: "1px solid #0a66c2", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 500, color: "#0a66c2", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Entrar com LinkedIn
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => { window.location.href = `/api/auth/facebook`; }}
            style={{ width: "100%", background: "#fff", border: "1px solid #1877f2", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 500, color: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Entrar com Facebook
          </button>
        </div>

        {/* Register */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 24 }}>
          Não tem uma conta?{" "}
          <a href="/api/auth/register" style={{ color: "#3b82f6", fontWeight: 500, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
