"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target, Sparkles, LogIn, X, LogOut, User } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    // deploy
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
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, justifyContent: "space-between" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {currentUser ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 20, background: "var(--primary-50)", border: "1px solid var(--primary-200)" }}>
                  {currentUser.foto_perfil ? (
                    <img 
                      src={currentUser.foto_perfil} 
                      alt="Foto de perfil" 
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} 
                    />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={14} color="white" />
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
                    {[currentUser.nome, currentUser.sobrenome].filter(Boolean).join(" ") || currentUser.email}
                    {currentUser.tipo && ` - ${currentUser.tipo.charAt(0).toUpperCase() + currentUser.tipo.slice(1).toLowerCase()}`}
                  </span>
                </div>
                <button
                  onClick={() => setLogoutModalOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ borderRadius: 20, padding: "6px 12px", color: "var(--text-muted)" }}
                  title="Sair"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: "20px", padding: "8px 16px" }}
              >
                <LogIn size={16} />
                Fazer Login
              </button>
            )}
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

      {logoutModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="animate-fade-in">
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 24, width: "100%", maxWidth: 400, boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative", textAlign: "center" }}>
            <button onClick={() => setLogoutModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={24} />
            </button>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", marginBottom: 16 }}>
              <LogOut size={28} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Sair da conta?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
              Tem certeza que deseja sair agora? Você precisará fazer login novamente para acessar suas próximas chamadas.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setLogoutModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600 }}>
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleLogout();
                  setLogoutModalOpen(false);
                }} 
                style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600, background: "#dc2626", color: "white", border: "none", cursor: "pointer" }}
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}

      {registerModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="animate-fade-in">
          <div style={{ background: "var(--surface)", padding: 32, borderRadius: 24, width: "100%", maxWidth: 400, boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative", textAlign: "center" }}>
            <button onClick={() => setRegisterModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={24} />
            </button>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "#e0f2fe", marginBottom: 16 }}>
              <img src="/icon.png" alt="Connect Skills" style={{ width: 32, height: 32, objectFit: "contain" }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Conta Necessária</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
              Apenas usuários do Connect Skills podem criar novas salas de reunião. Se você não tem uma conta, cadastre-se agora mesmo!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => {
                  window.location.href = "/api/auth/register";
                }} 
                style={{ width: "100%", padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}
              >
                Cadastrar no Connect Skills
              </button>
              <button onClick={() => setRegisterModalOpen(false)} className="btn btn-secondary" style={{ width: "100%", padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

