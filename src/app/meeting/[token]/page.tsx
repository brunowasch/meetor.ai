"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Copy, MessageSquare, PhoneCall, RefreshCcw,
  Mic, MicOff, Video, VideoOff, Monitor, Pause,
  PhoneOff, LogOut, X, Target, UserCheck, UserX, Clock,
} from "lucide-react";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

type ConnectionState = "idle" | "connecting" | "connected" | "failed" | "disconnected";
type GuestStatus = "joining" | "waiting" | "admitted" | "denied";

interface KnockRequest {
  fromId: string;
  name: string;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;
  const isHost = searchParams.get("host") === "true";

  // ── State ──────────────────────────────────────────────────
  const [clientId, setClientId] = useState<string>("");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [error, setError] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: string; text: string; time: string }[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Admission state ────────────────────────────────────────
  // Host: pending knock requests
  const [knockQueue, setKnockQueue] = useState<KnockRequest[]>([]);
  // Guest: waiting room status
  const [guestStatus, setGuestStatus] = useState<GuestStatus>("joining");
  const [guestName, setGuestName] = useState("");

  // ── Refs ───────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteIdRef = useRef<string>("");
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    setClientId(Math.random().toString(36).substring(2, 10));
  }, []);

  // ── Copy link (strip ?host=true) ───────────────────────────
  const handleCopyLink = () => {
    const baseUrl = `${window.location.origin}/meeting/${token}`;
    navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Signal helpers ─────────────────────────────────────────
  const sendSignal = useCallback(
    async (type: string, data: unknown, toUser?: string) => {
      if (!clientId) return;
      await fetch(`/api/meetings/${token}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          data,
          fromUser: clientId,
          toUser: toUser ?? remoteIdRef.current ?? "",
        }),
      });
    },
    [clientId, token]
  );

  // ── WebRTC helpers ─────────────────────────────────────────
  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal("candidate", e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setConnectionState("connected");
        setInCall(true);
      } else if (state === "failed" || state === "disconnected") {
        setConnectionState(state as ConnectionState);
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    return pc;
  }, [sendSignal]);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      throw new Error("Não foi possível acessar câmera e microfone.");
    }
  }, []);

  // Host starts the call toward the admitted guest
  const startCall = useCallback(async (targetId?: string) => {
    if (!clientId) return;
    setConnectionState("connecting");
    try {
      const stream = await startLocalStream();
      const pc = createPeer();
      peerRef.current = pc;
      if (targetId) remoteIdRef.current = targetId;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal("offer", { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type }, targetId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar chamada.");
      setConnectionState("failed");
    }
  }, [clientId, startLocalStream, createPeer, sendSignal]);

  const handleOffer = useCallback(
    async (offerData: { sdp: string; type: RTCSdpType }, fromId: string) => {
      try {
        remoteIdRef.current = fromId;
        const stream = await startLocalStream();
        const pc = createPeer();
        peerRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(offerData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await sendSignal("answer", { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type }, fromId);
        setConnectionState("connecting");
      } catch {
        setError("Erro ao responder chamada.");
      }
    },
    [startLocalStream, createPeer, sendSignal]
  );

  // ── Admission actions (Host) ───────────────────────────────
  const admitGuest = useCallback(async (knock: KnockRequest) => {
    setKnockQueue((q) => q.filter((k) => k.fromId !== knock.fromId));
    remoteIdRef.current = knock.fromId;
    await sendSignal("admit", { admitted: true }, knock.fromId);
    // Host initiates the WebRTC call toward the guest
    await startCall(knock.fromId);
  }, [sendSignal, startCall]);

  const denyGuest = useCallback(async (knock: KnockRequest) => {
    setKnockQueue((q) => q.filter((k) => k.fromId !== knock.fromId));
    await sendSignal("deny", { denied: true }, knock.fromId);
  }, [sendSignal]);

  // ── Process incoming signals ───────────────────────────────
  const processSignals = useCallback(
    async (signals: { fromUser: string; type: string; data: unknown }[]) => {
      for (const signal of signals) {
        const pc = peerRef.current;

        if (signal.type === "knock") {
          // Host receives knock from guest
          const d = signal.data as { name?: string };
          setKnockQueue((q) => {
            const exists = q.some((k) => k.fromId === signal.fromUser);
            if (exists) return q;
            return [...q, { fromId: signal.fromUser, name: d.name ?? "Convidado" }];
          });

        } else if (signal.type === "admit") {
          // Guest is admitted — wait for host offer
          setGuestStatus("admitted");

        } else if (signal.type === "deny") {
          // Guest was denied
          setGuestStatus("denied");

        } else if (signal.type === "offer" && connectionState === "idle") {
          // Guest receives call offer from host after being admitted
          setGuestStatus("admitted");
          await handleOffer(signal.data as { sdp: string; type: RTCSdpType }, signal.fromUser);

        } else if (signal.type === "answer" && pc) {
          remoteIdRef.current = signal.fromUser;
          const answerData = signal.data as { sdp: string; type: RTCSdpType };
          await pc.setRemoteDescription(new RTCSessionDescription(answerData));

        } else if (signal.type === "candidate" && pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
          } catch {/* ignore */}

        } else if (signal.type === "chat") {
          const chatData = signal.data as { from: string; text: string; time: string };
          setMessages((prev) => [...prev, chatData]);

        } else if (signal.type === "leave") {
          setConnectionState("disconnected");
          setInCall(false);
          remoteIdRef.current = "";
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      }
    },
    [connectionState, handleOffer]
  );

  // ── Polling ────────────────────────────────────────────────
  useEffect(() => {
    if (!clientId) return;

    pollingRef.current = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await fetch(`/api/meetings/${token}/signal?clientId=${clientId}`);
        if (res.ok) {
          const { signals } = await res.json();
          if (signals?.length > 0) await processSignals(signals);
        }
      } catch {/* ignore */}
      finally {
        isPollingRef.current = false;
      }
    }, 1500);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [clientId, token, processSignals]);

  // ── Call duration ──────────────────────────────────────────
  useEffect(() => {
    if (inCall) {
      durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (durationRef.current) clearInterval(durationRef.current);
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current); };
  }, [inCall]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Toggle controls ────────────────────────────────────────
  const toggleCam = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { t.enabled = !camOn; setCamOn(!camOn); }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !micOn; setMicOn(!micOn); }
    }
  };

  const toggleScreen = async () => {
    try {
      if (!screenSharing) {
        const monitorStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = monitorStream.getVideoTracks()[0];
        videoTrack.onended = () => { stopScreenShare(); };
        if (peerRef.current) {
          const sender = peerRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = monitorStream;
        setScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) { console.error(err); }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const origVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender && origVideoTrack) sender.replaceTrack(origVideoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
    setScreenSharing(false);
  };

  const hangup = async () => {
    await sendSignal("leave", {});
    setInCall(false);
    setConnectionState("disconnected");
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    router.push("/");
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    const chatData = {
      from: "Você",
      text: msgInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    await sendSignal("chat", { ...chatData, from: isHost ? "Anfitrião" : "Convidado" });
    setMessages((prev) => [...prev, chatData]);
    setMsgInput("");
  };

  // ══════════════════════════════════════════════════════════
  // GUEST JOINING SCREEN (ASK FOR NAME)
  // ══════════════════════════════════════════════════════════
  if (!isHost && guestStatus === "joining") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px", width: "100%" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <UserCheck size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Como você se chama?
          </h1>
          <p style={{ color: "#888", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Identifique-se para pedir permissão ao anfitrião para entrar na sala.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (guestName.trim()) {
              setGuestStatus("waiting");
              sendSignal("knock", { name: guestName.trim() }, "");
            }
          }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input 
              type="text"
              placeholder="Seu nome"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid #333", background: "#111", color: "white", fontSize: 16, outline: "none", width: "100%" }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!guestName.trim() || !clientId} style={{ padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 600 }}>
              Pedir para participar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // GUEST WAITING ROOM SCREEN
  // ══════════════════════════════════════════════════════════
  if (!isHost && guestStatus === "waiting") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px" }}>
          {/* Animated pulse ring */}
          <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(37,99,235,0.15)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 10, borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Clock size={36} color="white" />
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Sala de Espera
          </h1>
          <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Você está na fila de entrada.<br />
            Aguarde enquanto o anfitrião analisa o seu pedido de entrada.
          </p>

          {/* Blinking dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#2563eb",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>

          <button onClick={() => router.push("/")} className="btn btn-secondary" style={{ padding: "12px 28px", borderRadius: 12 }}>
            Cancelar
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.25); opacity: 0; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // GUEST DENIED SCREEN
  // ══════════════════════════════════════════════════════════
  if (!isHost && guestStatus === "denied") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <UserX size={36} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Entrada Negada
          </h1>
          <p style={{ color: "#888", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            O anfitrião não permitiu sua entrada na sala neste momento.
          </p>
          <button onClick={() => router.push("/")} className="btn btn-primary" style={{ padding: "12px 28px", borderRadius: 12 }}>
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // MAIN ROOM
  // ══════════════════════════════════════════════════════════
  return (
    <div style={S.container}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logoIcon}><Target size={20} color="white" /></div>
          <div style={S.meetingInfo}>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
              Sala Privada {isHost && <span style={{ fontSize: 11, background: "rgba(37,99,235,0.15)", color: "#2563eb", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Anfitrião</span>}
            </h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center" }}>
              <span>ID: {token.substring(0, 8)}...</span>
              {inCall && <span className="badge badge-green" style={{ padding: "2px 6px" }}>Ao Vivo</span>}
              {inCall && <span style={{ fontWeight: 600 }}>{formatDuration(callDuration)}</span>}
            </div>
          </div>
        </div>
        <div style={S.headerRight}>
          {isHost && (
            <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} title="Copiar link da sala" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {copied ? "Copiado!" : <><Copy size={16} /> Compartilhar Link</>}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setMessagesOpen(!messagesOpen)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare size={16} /> Chat {messages.length > 0 && <span style={S.chatCount}>{messages.length}</span>}
          </button>
        </div>
      </header>

      {/* ─── Knock Notifications (Host only) ────────────────── */}
      {isHost && knockQueue.length > 0 && (
        <div style={S.knockBanner} className="animate-fade-in">
          {knockQueue.map((knock) => (
            <div key={knock.fromId} style={S.knockItem}>
              <div style={S.knockAvatar}>
                {knock.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{knock.name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>Quer entrar na sala</div>
              </div>
              <button
                onClick={() => admitGuest(knock)}
                style={{ ...S.knockBtn, background: "#22c55e" }}
                title="Admitir"
              >
                <UserCheck size={18} />
              </button>
              <button
                onClick={() => denyGuest(knock)}
                style={{ ...S.knockBtn, background: "#ef4444" }}
                title="Negar"
              >
                <UserX size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Main Grid ──────────────────────────────────────── */}
      <div style={S.gridContainer}>
        {error && (
          <div className="alert alert-error" style={{ margin: 16, gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8 }}>
            <X size={16} /> {error}
          </div>
        )}

        <div style={{ ...S.videoArea, gridColumn: messagesOpen ? "1" : "1 / 3" }}>
          <div style={S.remoteWrapper}>
            <video ref={remoteVideoRef} autoPlay playsInline style={S.remoteVideo} />
            {!inCall && (
              <div style={S.waitingScreen}>
                {isHost ? (
                  <>
                    <div style={S.avatarLarge}><Clock size={32} color="#888" /></div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                      {knockQueue.length > 0
                        ? `${knockQueue.length} pessoa(s) aguardando entrada`
                        : "Aguardando convidados..."}
                    </h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
                      Compartilhe o link da sala. Quando alguém bater na porta,<br />
                      você verá uma notificação para admitir ou negar a entrada.
                    </p>
                    <div style={{ display: "flex", gap: 12 }}>
                      {connectionState === "disconnected" && (
                        <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <RefreshCcw size={16} /> Reconectar
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={S.avatarLarge}><UserCheck size={32} color="#22c55e" /></div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>Entrada aprovada!</h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
                      O anfitrião vai iniciar a chamada em instantes...
                    </p>
                    <div style={{ display: "flex", gap: 12 }}>
                      {connectionState === "connecting" && (
                        <button className="btn btn-primary" disabled style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <PhoneCall size={20} /> Conectando...
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {inCall && <div style={S.nameLabel}>{isHost ? "Convidado" : "Anfitrião"}</div>}
          </div>

          {(inCall || connectionState === "connecting") && (
            <div style={S.localWrapper}>
              <video ref={localVideoRef} autoPlay playsInline muted style={S.localVideo} />
              <div style={S.nameLabel}>Você</div>
            </div>
          )}

          {/* Controls Overlay */}
          <div style={S.controlsOverlay}>
            <div style={S.controlsBar}>
              <button style={{ ...S.ctrlBtn, background: micOn ? "#333" : "#ef4444" }} onClick={toggleMic}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button style={{ ...S.ctrlBtn, background: camOn ? "#333" : "#ef4444" }} onClick={toggleCam}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button style={{ ...S.ctrlBtn, background: screenSharing ? "var(--primary)" : "#333" }} onClick={toggleScreen} disabled={!inCall}>
                {screenSharing ? <Pause size={20} /> : <Monitor size={20} />}
              </button>
              <button style={{ ...S.ctrlBtn, background: "#ef4444", padding: "0 16px", width: "auto", borderRadius: 24, gap: 8 }} onClick={hangup}>
                {inCall ? <><PhoneOff size={20} /> Sair</> : <><LogOut size={20} /> Sair da Sala</>}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Sidebar Chat ──────────────────────────────────── */}
        {messagesOpen && (
          <div style={S.chatSidebar} className="animate-fade-in">
            <div style={S.chatHeader}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Mensagens</h3>
              <button onClick={() => setMessagesOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}>
                <X size={20} />
              </button>
            </div>
            <div style={S.chatMessages}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 40 }}>
                  Nenhuma mensagem ainda.
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.from === "Você";
                  return (
                    <div key={i} style={{ ...S.msgBubbleWrapper, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && <div style={S.msgAvatar}>{m.from[0]}</div>}
                      <div style={{ ...S.msgBubble, background: isMe ? "var(--primary)" : "var(--surface-2)", color: isMe ? "white" : "inherit" }}>
                        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>{m.from} • {m.time}</div>
                        <div style={{ fontSize: 14, wordBreak: "break-word" }}>{m.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendChat} style={S.chatInputArea}>
              <input
                type="text"
                placeholder="Digite algo..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                style={S.chatInput}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0 16px", flexShrink: 0 }}>
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100vh", background: "#000", color: "#fff", fontFamily: "var(--font-inter), sans-serif" },
  header: { height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#111", borderBottom: "1px solid #222", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" },
  meetingInfo: { display: "flex", flexDirection: "column" },
  headerRight: { display: "flex", gap: 12, alignItems: "center" },
  chatCount: { background: "#ef4444", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 10, marginLeft: 6 },
  // Knock notification banner
  knockBanner: { background: "#111", borderBottom: "1px solid #2563eb", padding: "0 20px", zIndex: 50, flexShrink: 0 },
  knockItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e1e1e" },
  knockAvatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  knockBtn: { width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 },
  // Room
  gridContainer: { flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden", position: "relative" },
  videoArea: { position: "relative", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
  remoteWrapper: { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  remoteVideo: { width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" },
  waitingScreen: { position: "absolute", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", inset: 0, textAlign: "center", padding: "0 32px" },
  avatarLarge: { width: 80, height: 80, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" },
  localWrapper: { position: "absolute", bottom: 80, right: 24, width: 240, height: 135, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", background: "#111", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 20 },
  localVideo: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  nameLabel: { position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  controlsOverlay: { position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 30 },
  controlsBar: { display: "flex", gap: 12, background: "rgba(17,17,17,0.85)", padding: "10px 20px", borderRadius: 24, backdropFilter: "blur(12px)" },
  ctrlBtn: { width: 44, height: 44, borderRadius: "50%", border: "none", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  // Chat
  chatSidebar: { background: "#111", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", height: "100%" },
  chatHeader: { padding: 16, borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" },
  chatMessages: { flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 },
  msgBubbleWrapper: { display: "flex", gap: 8, alignItems: "flex-end" },
  msgAvatar: { width: 28, height: 28, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#aaa" },
  msgBubble: { padding: "10px 14px", borderRadius: 12, maxWidth: "85%" },
  chatInputArea: { padding: 16, borderTop: "1px solid #222", display: "flex", gap: 8 },
  chatInput: { flex: 1, background: "#222", border: "1px solid #333", color: "white", padding: "10px 14px", borderRadius: 8, outline: "none" },
};
