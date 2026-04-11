"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useState, useRef } from "react";
import { Copy, Target, LogOut, CheckCircle } from "lucide-react";

export default function MeetingRoomPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isHost = searchParams.get("host") === "true";
  const [copied, setCopied] = useState(false);
  const jitsiApiRef = useRef<any>(null);
  const APP_ID = process.env.APP_ID;
  const roomName = token ? `${APP_ID}/MentorshipConnect-Room-${token}` : "";

  const copyLink = () => {
    if (!token) return;
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
    }
    router.push("/");
  };

  if (!token) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0b0e", color: "#666" }}>
        Identificando sala...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#08090c", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Custom Header ── */}
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#0e0f12", borderBottom: "1px solid #1a1b1f", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #1DB5DA, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              Sala de Mentoria Privada
              {isHost && <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(37,99,235,.2)", color: "#60a5fa", padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5 }}>ANFITRIÃO</span>}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>#{token?.substring(0, 8)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isHost && (
            <button
              onClick={copyLink}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: copied ? "rgba(34,197,94,.15)" : "rgba(37,99,235,.15)", border: `1px solid ${copied ? "rgba(34,197,94,.3)" : "rgba(37,99,235,.3)"}`, color: copied ? "#22c55e" : "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              {copied ? <><CheckCircle size={16} /> Link Copiado!</> : <><Copy size={16} /> Compartilhar</>}
            </button>
          )}
          <button
            onClick={leaveRoom}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <LogOut size={16} /> Encerrar
          </button>
        </div>
      </header>

      {/* ── Jitsi Iframe Area ── */}
      <div style={{ flex: 1, position: "relative", width: "100%", background: "#0a0b0e" }}>
        <JitsiMeeting
          domain="8x8.vc"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true, // Enables entering names before joining
            disableModeratorIndicator: false,
            enableEmailInStats: false,
            defaultLanguage: 'ptBR',
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }}
          userInfo={{
            displayName: isHost ? "Anfitrião" : "",
            email: isHost ? "host@mentorship.local" : "guest@mentorship.local",
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
          spinner={() => (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", background: "#0a0b0e" }}>
              <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}</style>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #1a1b1f", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 24, fontSize: 15, color: "#888", fontWeight: 500 }}>Iniciando ambiente seguro...</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
