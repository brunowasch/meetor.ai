"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateMeeting = () => {
    setLoading(true);
    // Gera um token criptograficamente pseudo-randomico (hash simulado pelo client para evitar Server Action complexity)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    router.push(`/meeting/${token}`);
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

          <button
            onClick={handleCreateMeeting}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ fontSize: 20, padding: "16px 40px", borderRadius: 32, boxShadow: "0 8px 20px rgba(37,99,235,0.3)" }}
          >
            {loading ? "Gerando Link..." : (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={20} />
                Criar Reunião Agora
              </span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

