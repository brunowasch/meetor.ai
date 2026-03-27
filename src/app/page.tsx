"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Sparkles, LogIn, X } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinLink, setJoinLink] = useState("");

  const handleJoinMeeting = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinLink.trim()) return;
    const url = joinLink.trim();
    // Extrai o token se for link completo ou usa o próprio texto se for só o token
    const tokenStr = url.includes("/meeting/") ? url.split("/meeting/")[1].split(/[/?#]/)[0] : url.split(/[/?#]/)[0];
    router.push(`/meeting/${tokenStr}`);
  };

  const handleCreateMeeting = () => {
    setLoading(true);
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    router.push(`/meeting/${token}?host=true`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}
            >
              <Target size={20} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800 }}>MentorConnect <span className="text-gray-400 text-sm">Meet</span></span>
          </div>
        </div>
      </nav>

      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 64,
        }}
      >
        <div style={{ textAlign: "center", zIndex: 10 }}>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              marginBottom: 24,
              color: "var(--text)",
            }}
          >
            Videochamadas em <br/>
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tempo Real
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--text-muted)",
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Nenhum cadastro, nenhum download necessário. Crie o seu link único, compartilhe com o convidado e conversem livremente com total privacidade!
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleCreateMeeting}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ fontSize: 18, padding: "16px 32px", borderRadius: 32, boxShadow: "0 8px 20px rgba(37,99,235,0.3)" }}
            >
              {loading ? "Gerando Link..." : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} />
                  Criar Reunião Agora
                </span>
              )}
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="btn btn-secondary btn-lg"
              style={{ fontSize: 18, padding: "16px 32px", borderRadius: 32 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LogIn size={20} />
                Entrar com Link
              </span>
            </button>
          </div>
        </div>
      </section>

      {joinModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="animate-fade-in">
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 24, width: "100%", maxWidth: 460, boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
            <button onClick={() => setJoinModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Entrar em uma Reunião</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
              Cole o link compartilhado pelo anfitrião ou o ID da sala para entrar imediatamente.
            </p>
            <form onSubmit={handleJoinMeeting} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input 
                type="text" 
                placeholder="Ex: https://.../meeting/abc12345" 
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 16, outline: "none" }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: 16, borderRadius: 12, fontSize: 16, fontWeight: 600 }}>
                Entrar na Sala
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

