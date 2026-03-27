"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, MessageSquare, PhoneCall, RefreshCcw, Mic, MicOff, Video, VideoOff, Monitor, Pause, PhoneOff, LogOut, X, Hourglass, Target } from "lucide-react";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

type ConnectionState = "idle" | "connecting" | "connected" | "failed" | "disconnected";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteIdRef = useRef<string>("");

  useEffect(() => {
    setClientId(Math.random().toString(36).substring(2, 10));
  }, []);

  const sendSignal = useCallback(
    async (type: string, data: unknown) => {
      if (!clientId) return;
      await fetch(`/api/meetings/${token}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          data,
          fromUser: clientId,
          toUser: remoteIdRef.current || "", 
        }),
      });
    },
    [clientId, token]
  );

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
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      throw new Error("Não foi possível acessar câmera e microfone.");
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!clientId) return;
    setConnectionState("connecting");

    try {
      const stream = await startLocalStream();
      const pc = createPeer();
      peerRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await sendSignal("offer", { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type });
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

        await sendSignal("answer", { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type });
        setConnectionState("connecting");
      } catch {
        setError("Erro ao responder chamada.");
      }
    },
    [startLocalStream, createPeer, sendSignal]
  );

  const processSignals = useCallback(
    async (signals: { fromUser: string; type: string; data: unknown }[]) => {
      for (const signal of signals) {
        const pc = peerRef.current;

        if (signal.type === "offer" && connectionState === "idle") {
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

  useEffect(() => {
    if (!clientId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings/${token}/signal?clientId=${clientId}`);
        if (res.ok) {
          const { signals } = await res.json();
          if (signals?.length > 0) await processSignals(signals);
        }
      } catch {/* ignore */}
    }, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [clientId, token, processSignals]);

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
    } catch (err) {
      console.error(err);
    }
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
    await sendSignal("chat", { ...chatData, from: "Convidado" });
    setMessages((prev) => [...prev, chatData]);
    setMsgInput("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={S.container}>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logoIcon}><Target size={20} color="white" /></div>
          <div style={S.meetingInfo}>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
              Sala Privada
            </h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center" }}>
              <span>ID: {token.substring(0, 8)}...</span>
              {inCall && <span className="badge badge-green" style={{ padding: "2px 6px" }}>Ao Vivo</span>}
              {inCall && <span style={{ fontWeight: 600 }}>{formatDuration(callDuration)}</span>}
            </div>
          </div>
        </div>
        <div style={S.headerRight}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} title="Copiar link da sala" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {copied ? "Copiado!" : <><Copy size={16} /> Compartilhar Link</>}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setMessagesOpen(!messagesOpen)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare size={16} /> Chat {messages.length > 0 && <span style={S.chatCount}>{messages.length}</span>}
          </button>
        </div>
      </header>

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
                <div style={S.avatarLarge}><Hourglass size={32} /></div>
                <h3 style={{ marginTop: 16, marginBottom: 8 }}>Esperando convidado...</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
                  Compartilhe o link da sala. Quando alguém entrar,<br/>
                  vocês poderão iniciar a chamada.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn btn-primary" onClick={startCall} disabled={connectionState === "connecting"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {connectionState === "connecting" ? "Conectando..." : <><PhoneCall size={20} /> Iniciar Chamada Agora</>}
                  </button>
                  {connectionState === "disconnected" && (
                    <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <RefreshCcw size={16} /> Reconectar
                    </button>
                  )}
                </div>
              </div>
            )}
            {inCall && (
              <div style={S.nameLabel}>Convidado</div>
            )}
          </div>

          {/* Local Video Draggable / Overlay */}
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

        {/* ─── Sidebar Chat ─────────────────────────────────────── */}
        {messagesOpen && (
          <div style={S.chatSidebar} className="animate-fade-in">
            <div style={S.chatHeader}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Mensagens</h3>
              <button onClick={() => setMessagesOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text)" }}><X size={20}/></button>
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
                        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                          {m.from} • {m.time}
                        </div>
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

// ── Styles ─────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100vh", background: "#000", color: "#fff", fontFamily: "var(--font-inter), sans-serif" },
  header: { height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#111", borderBottom: "1px solid #222", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  meetingInfo: { display: "flex", flexDirection: "column" },
  headerRight: { display: "flex", gap: 12, alignItems: "center" },
  chatCount: { background: "#ef4444", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 10, marginLeft: 6 },
  gridContainer: { flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden", position: "relative" },
  videoArea: { position: "relative", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
  remoteWrapper: { width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  remoteVideo: { width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" },
  waitingScreen: { position: "absolute", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", inset: 0, textAlign: "center" },
  avatarLarge: { width: 80, height: 80, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 },
  localWrapper: { position: "absolute", bottom: 80, right: 24, width: 240, height: 135, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", background: "#111", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 20 },
  localVideo: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  nameLabel: { position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  controlsOverlay: { position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 30 },
  controlsBar: { display: "flex", gap: 12, background: "rgba(17,17,17,0.85)", padding: "10px 20px", borderRadius: 24, backdropFilter: "blur(12px)" },
  ctrlBtn: { width: 44, height: 44, borderRadius: "50%", border: "none", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  chatSidebar: { background: "#111", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", height: "100%" },
  chatHeader: { padding: 16, borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" },
  chatMessages: { flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 },
  msgBubbleWrapper: { display: "flex", gap: 8, alignItems: "flex-end" },
  msgAvatar: { width: 28, height: 28, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#aaa" },
  msgBubble: { padding: "10px 14px", borderRadius: 12, maxWidth: "85%" },
  chatInputArea: { padding: 16, borderTop: "1px solid #222", display: "flex", gap: 8 },
  chatInput: { flex: 1, background: "#222", border: "1px solid #333", color: "white", padding: "10px 14px", borderRadius: 8, outline: "none" },
};
