"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  MessageSquare,
  PhoneCall,
  RefreshCcw,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Pause,
  PhoneOff,
  LogOut,
  X,
  Target,
  UserCheck,
  UserX,
  Clock,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── WebRTC config ──────────────────────────────────────────────
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

type ConnState = "idle" | "connecting" | "connected" | "disconnected" | "failed";
type GuestStatus = "joining" | "waiting" | "admitted" | "denied";

interface KnockReq {
  fromId: string;
  name: string;
}

interface ChatMsg {
  from: string;
  text: string;
  time: string;
}

// ─── Helpers ────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10);
}
function fmtTime(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ═══════════════════════════════════════════════════════════════
export default function MeetingRoomPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isHost = searchParams.get("host") === "true";
  const [clientId] = useState(genId);

  // ── UI State ──────────────────────────────────────────────────
  const [connState, setConnState] = useState<ConnState>("idle");
  const [inCall, setInCall] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [networkQuality, setNetworkQuality] = useState<"good" | "poor" | "unknown">("unknown");

  // ── Admission ─────────────────────────────────────────────────
  const [knockQueue, setKnockQueue] = useState<KnockReq[]>([]);
  const [guestStatus, setGuestStatus] = useState<GuestStatus>("joining");
  const [guestName, setGuestName] = useState("");

  // ── Refs ──────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const remoteIdRef = useRef("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false); // prevent concurrent poll
  const signalingStateRef = useRef<ConnState>("idle");

  // Keep signalingStateRef in sync
  useEffect(() => { signalingStateRef.current = connState; }, [connState]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Camera / Mic ──────────────────────────────────────────────
  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  }, []);

  // Host calls camera early — so preview is immediate
  useEffect(() => {
    if (isHost) {
      startLocalStream().catch(() => setError("Não foi possível acessar câmera/microfone."));
    }
    return () => {
      // Clean up on unmount
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  // ── Signal helpers ────────────────────────────────────────────
  const sendSignal = useCallback(
    async (type: string, data: unknown, toUser?: string) => {
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

  // ── Peer creation ─────────────────────────────────────────────
  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal("candidate", candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") {
        setConnState("connected");
        setInCall(true);
      } else if (s === "disconnected" || s === "failed") {
        setConnState(s as ConnState);
        setInCall(false);
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    // Basic network quality via RTCStatsReport
    const statsInterval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            const rtt = (report as RTCIceCandidatePairStats).currentRoundTripTime ?? 0;
            setNetworkQuality(rtt < 0.15 ? "good" : "poor");
          }
        });
      } catch { /* ignore */ }
    }, 5000);

    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "closed" || pc.connectionState === "failed") {
        clearInterval(statsInterval);
      }
    });

    return pc;
  }, [sendSignal]);

  // ── Host initiates call ───────────────────────────────────────
  const startCall = useCallback(
    async (targetId: string) => {
      try {
        setConnState("connecting");
        remoteIdRef.current = targetId;

        const stream = await startLocalStream();
        const pc = createPeer();
        peerRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", { sdp: offer.sdp, type: offer.type }, targetId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao iniciar chamada.");
        setConnState("failed");
      }
    },
    [startLocalStream, createPeer, sendSignal]
  );

  // ── Guest receives offer ──────────────────────────────────────
  const handleOffer = useCallback(
    async (offerSdp: string, offerType: RTCSdpType, fromId: string) => {
      try {
        remoteIdRef.current = fromId;
        setConnState("connecting");

        const stream = await startLocalStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const pc = createPeer();
        peerRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        await pc.setRemoteDescription(new RTCSessionDescription({ sdp: offerSdp, type: offerType }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", { sdp: answer.sdp, type: answer.type }, fromId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atender chamada.");
        setConnState("failed");
      }
    },
    [startLocalStream, createPeer, sendSignal]
  );

  // ── Admission ─────────────────────────────────────────────────
  const admitGuest = useCallback(
    async (knock: KnockReq) => {
      setKnockQueue((q) => q.filter((k) => k.fromId !== knock.fromId));
      await sendSignal("admit", {}, knock.fromId);
      await startCall(knock.fromId);
    },
    [sendSignal, startCall]
  );

  const denyGuest = useCallback(
    async (knock: KnockReq) => {
      setKnockQueue((q) => q.filter((k) => k.fromId !== knock.fromId));
      await sendSignal("deny", {}, knock.fromId);
    },
    [sendSignal]
  );

  // ── Process incoming signals ──────────────────────────────────
  // Use ref-based state to avoid stale closures in processSignals
  const connStateRef = useRef<ConnState>("idle");
  useEffect(() => { connStateRef.current = connState; }, [connState]);

  const processSignals = useCallback(
    async (signals: { id: string; fromUser: string; type: string; data: unknown }[]) => {
      for (const sig of signals) {
        const pc = peerRef.current;

        switch (sig.type) {
          case "knock": {
            const d = sig.data as { name?: string };
            setKnockQueue((q) => {
              if (q.some((k) => k.fromId === sig.fromUser)) return q;
              return [...q, { fromId: sig.fromUser, name: d.name ?? "Convidado" }];
            });
            break;
          }
          case "admit": {
            setGuestStatus("admitted");
            break;
          }
          case "deny": {
            setGuestStatus("denied");
            break;
          }
          case "offer": {
            // Guest receives offer from host — only handle if not yet in call
            if (connStateRef.current === "idle" || connStateRef.current === "disconnected") {
              const d = sig.data as { sdp: string; type: RTCSdpType };
              setGuestStatus("admitted");
              await handleOffer(d.sdp, d.type, sig.fromUser);
            }
            break;
          }
          case "answer": {
            if (pc && pc.signalingState === "have-local-offer") {
              remoteIdRef.current = sig.fromUser;
              const d = sig.data as { sdp: string; type: RTCSdpType };
              await pc.setRemoteDescription(new RTCSessionDescription(d));
            }
            break;
          }
          case "candidate": {
            if (pc && (pc.remoteDescription !== null)) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(sig.data as RTCIceCandidateInit));
              } catch { /* ignore */ }
            }
            break;
          }
          case "chat": {
            const d = sig.data as ChatMsg;
            setMessages((prev) => [...prev, d]);
            break;
          }
          case "leave": {
            setConnState("disconnected");
            setInCall(false);
            remoteIdRef.current = "";
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            peerRef.current?.close();
            peerRef.current = null;
            // Allow reconnect — host goes back to idle
            if (isHost) setConnState("idle");
            break;
          }
        }
      }
    },
    [handleOffer, isHost]
  );

  // ── Polling ───────────────────────────────────────────────────
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch(
          `/api/meetings/${token}/signal?clientId=${clientId}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const { signals } = await res.json();
          if (signals?.length) await processSignals(signals);
        }
      } catch { /* ignore network errors */ } finally {
        busyRef.current = false;
      }
    }, 1000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [clientId, token, processSignals]);

  // ── Call duration ─────────────────────────────────────────────
  useEffect(() => {
    if (inCall) {
      setCallDuration(0);
      durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (durationRef.current) clearInterval(durationRef.current);
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current); };
  }, [inCall]);

  // ── Controls ──────────────────────────────────────────────────
  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !camOn;
    });
    setCamOn((v) => !v);
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !micOn;
    });
    setMicOn((v) => !v);
  };

  const toggleScreen = async () => {
    if (screenSharing) {
      // Restore camera
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      peerRef.current?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(camTrack ?? null);
      if (localVideoRef.current && localStreamRef.current)
        localVideoRef.current.srcObject = localStreamRef.current;
      setScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        screenTrack.onended = () => toggleScreen();
        peerRef.current?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        setScreenSharing(true);
      } catch { /* user cancelled */ }
    }
  };

  const hangup = async () => {
    await sendSignal("leave", {});
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    router.push("/");
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = msgInput.trim();
    if (!text) return;
    const msg: ChatMsg = {
      from: "Você",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const serverMsg: ChatMsg = {
      from: isHost ? "Anfitrião" : guestName || "Convidado",
      text,
      time: msg.time,
    };
    await sendSignal("chat", serverMsg);
    setMessages((prev) => [...prev, msg]);
    setMsgInput("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Host: start preview visible in main area too  ─────────────
  // Attach local stream to local video element whenever it changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && !localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  });

  // ══════════════════════════════════════════════════════
  // SCREENS
  // ══════════════════════════════════════════════════════

  // Guest: enter name
  if (!isHost && guestStatus === "joining") {
    return (
      <div style={sc.page}>
        <div style={sc.card}>
          <div style={sc.avatarRing}>
            <UserCheck size={36} color="white" />
          </div>
          <h1 style={sc.h1}>Entrar na Sala</h1>
          <p style={sc.sub}>Informe seu nome para pedir acesso ao anfitrião.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!guestName.trim()) return;
              try {
                await startLocalStream();
              } catch {
                alert("Permita o acesso à câmera e microfone para continuar.");
                return;
              }
              setGuestStatus("waiting");
              sendSignal("knock", { name: guestName.trim() }, "");
            }}
            style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}
          >
            <input
              autoFocus
              type="text"
              placeholder="Seu nome"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={sc.input}
            />
            <button type="submit" style={sc.btnPrimary} disabled={!guestName.trim()}>
              Pedir para entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Guest: waiting room
  if (!isHost && guestStatus === "waiting") {
    return (
      <div style={sc.page}>
        <style>{`
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.3);opacity:0} }
          @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-10px);opacity:1} }
        `}</style>
        <div style={sc.card}>
          <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 28px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(37,99,235,.2)", animation: "pulse 2s infinite" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={36} color="white" />
            </div>
          </div>
          <h1 style={sc.h1}>Sala de Espera</h1>
          <p style={sc.sub}>Aguardando aprovação do anfitrião{guestName ? `, ${guestName}` : ""}…</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <button onClick={() => router.push("/")} style={sc.btnSec}>Cancelar</button>
        </div>
      </div>
    );
  }

  // Guest: denied
  if (!isHost && guestStatus === "denied") {
    return (
      <div style={sc.page}>
        <div style={sc.card}>
          <div style={{ ...sc.avatarRing, background: "rgba(239,68,68,.15)", border: "2px solid rgba(239,68,68,.4)" }}>
            <UserX size={36} color="#ef4444" />
          </div>
          <h1 style={sc.h1}>Acesso Negado</h1>
          <p style={sc.sub}>O anfitrião não permitiu sua entrada nesta sala.</p>
          <button onClick={() => router.push("/")} style={sc.btnPrimary}>Voltar</button>
        </div>
      </div>
    );
  }

  // ── Main Room ────────────────────────────────────────────────
  const showLocalPiP = inCall || connState === "connecting" || (isHost && !!localStreamRef.current);

  return (
    <div style={R.root}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={R.header}>
        <div style={R.hLeft}>
          <div style={R.logo}><Target size={18} color="white" /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              Sala Privada
              {isHost && <span style={R.badge}>Anfitrião</span>}
              {inCall && <span style={{ ...R.badge, background: "rgba(34,197,94,.15)", color: "#22c55e" }}>Ao Vivo</span>}
            </div>
            <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
              <span>#{token.substring(0, 8)}</span>
              {inCall && <span style={{ color: "#aaa", fontVariantNumeric: "tabular-nums" }}>{fmtTime(callDuration)}</span>}
              {networkQuality !== "unknown" && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, color: networkQuality === "good" ? "#22c55e" : "#f59e0b" }}>
                  {networkQuality === "good" ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {networkQuality === "good" ? "Boa conexão" : "Conexão instável"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={R.hRight}>
          {isHost && (
            <button style={R.btnSm} onClick={copyLink}>
              {copied ? "✓ Copiado!" : <><Copy size={14} /> Compartilhar</>}
            </button>
          )}
          <button style={{ ...R.btnSm, background: chatOpen ? "rgba(37,99,235,.3)" : "rgba(255,255,255,.05)", position: "relative" }} onClick={() => setChatOpen((v) => !v)}>
            <MessageSquare size={14} /> Chat
            {messages.length > 0 && !chatOpen && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{messages.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Knock Notifications ─────────────────────────────────── */}
      {isHost && knockQueue.length > 0 && (
        <div style={R.knockBanner}>
          {knockQueue.map((k) => (
            <div key={k.fromId} style={R.knockRow}>
              <div style={R.knockAv}>{k.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{k.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>quer entrar na sala</div>
              </div>
              <button style={{ ...R.knockBtn, background: "#22c55e" }} onClick={() => admitGuest(k)} title="Admitir">
                <UserCheck size={16} />
              </button>
              <button style={{ ...R.knockBtn, background: "#ef4444" }} onClick={() => denyGuest(k)} title="Negar">
                <UserX size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ ...R.body, gridTemplateColumns: chatOpen ? "1fr 320px" : "1fr" }}>

        {/* ── Video Area ─────────────────────────────────────────── */}
        <div style={R.videoArea}>
          {error && (
            <div style={R.errorBar}>
              <X size={14} /> {error}
              <button style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", cursor: "pointer" }} onClick={() => setError("")}>×</button>
            </div>
          )}

          {/* Remote video (full) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={R.remoteVideo}
          />

          {/* Waiting overlay */}
          {!inCall && (
            <div style={R.overlay}>
              {connState === "connecting" ? (
                <>
                  <div style={R.overlayIcon}><PhoneCall size={28} color="#2563eb" /></div>
                  <h3 style={R.overlayTitle}>Conectando…</h3>
                  <p style={R.overlaySub}>Estabelecendo conexão de vídeo, aguarde.</p>
                </>
              ) : connState === "disconnected" ? (
                <>
                  <div style={R.overlayIcon}><WifiOff size={28} color="#ef4444" /></div>
                  <h3 style={R.overlayTitle}>Chamada encerrada</h3>
                  <p style={R.overlaySub}>A outra pessoa saiu da chamada.</p>
                  {isHost && (
                    <button style={sc.btnPrimary} onClick={() => window.location.reload()}>
                      <RefreshCcw size={14} /> Nova chamada
                    </button>
                  )}
                </>
              ) : isHost ? (
                <>
                  <div style={R.overlayIcon}><Clock size={28} color="#888" /></div>
                  <h3 style={R.overlayTitle}>
                    {knockQueue.length > 0
                      ? `${knockQueue.length} pessoa(s) aguardando`
                      : "Aguardando convidados…"}
                  </h3>
                  <p style={R.overlaySub}>
                    Compartilhe o link. Quando alguém bater na porta você verá a notificação acima.
                  </p>
                </>
              ) : (
                <>
                  <div style={R.overlayIcon}><UserCheck size={28} color="#22c55e" /></div>
                  <h3 style={R.overlayTitle}>Entrada aprovada!</h3>
                  <p style={R.overlaySub}>O anfitrião vai iniciar a chamada em instantes…</p>
                </>
              )}
            </div>
          )}

          {/* PiP – local video (bottom-right) */}
          {showLocalPiP && (
            <div style={R.pip}>
              <video ref={localVideoRef} autoPlay playsInline muted style={R.pipVideo} />
              {!camOn && (
                <div style={R.pipMuted}><VideoOff size={20} color="#888" /></div>
              )}
              <span style={R.nameTag}>Você</span>
            </div>
          )}

          {/* Name tag remote */}
          {inCall && <span style={{ ...R.nameTag, bottom: 88, left: 16, fontSize: 13 }}>{isHost ? "Convidado" : "Anfitrião"}</span>}

          {/* Controls bar */}
          <div style={R.ctrlBar}>
            <button style={{ ...R.ctrl, background: micOn ? "rgba(255,255,255,.1)" : "#ef4444" }} onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button style={{ ...R.ctrl, background: camOn ? "rgba(255,255,255,.1)" : "#ef4444" }} onClick={toggleCam} title={camOn ? "Desligar câmera" : "Ligar câmera"}>
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button style={{ ...R.ctrl, background: screenSharing ? "#2563eb" : "rgba(255,255,255,.1)" }} onClick={toggleScreen} disabled={!inCall} title="Compartilhar tela">
              {screenSharing ? <Pause size={20} /> : <Monitor size={20} />}
            </button>
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,.1)" }} />
            <button style={{ ...R.ctrl, background: "#ef4444", width: "auto", padding: "0 20px", borderRadius: 24, gap: 8, fontSize: 14, fontWeight: 600 }} onClick={hangup}>
              {inCall ? <><PhoneOff size={18} /> Sair</> : <><LogOut size={18} /> Sair da Sala</>}
            </button>
          </div>
        </div>

        {/* ── Chat Sidebar ────────────────────────────────────────── */}
        {chatOpen && (
          <div style={R.chat}>
            <div style={R.chatHead}>
              <span style={{ fontWeight: 700 }}>Chat</span>
              <button style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", display: "flex" }} onClick={() => setChatOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={R.chatBody}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#555", fontSize: 13, marginTop: 48 }}>
                  Nenhuma mensagem ainda.<br />Diga olá! 👋
                </div>
              ) : (
                messages.map((m, i) => {
                  const mine = m.from === "Você";
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 2 }}>
                      <span style={{ fontSize: 11, color: "#555" }}>{m.from} · {m.time}</span>
                      <div style={{ background: mine ? "#2563eb" : "#1e1e1e", color: "#fff", padding: "8px 12px", borderRadius: mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px", fontSize: 14, maxWidth: "85%", wordBreak: "break-word" }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={sendChat} style={R.chatInput}>
              <input
                type="text"
                placeholder="Mensagem…"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: 8, outline: "none", fontSize: 14 }}
              />
              <button type="submit" style={{ background: "#2563eb", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable micro-screen styles ──────────────────────────────────
const sc: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#08090c", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 24 },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 20, padding: "40px 32px", maxWidth: 420, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 },
  avatarRing: { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 12px" },
  sub: { color: "#666", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" },
  input: { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid #2a2a2a", background: "#0a0a0a", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" },
  btnPrimary: { width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSec: { padding: "12px 28px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#aaa", fontSize: 14, cursor: "pointer" },
};

// ── Main room styles ──────────────────────────────────────────────
const R: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#08090c", color: "#fff", fontFamily: "'Inter', sans-serif", overflow: "hidden" },
  header: { height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#0e0f12", borderBottom: "1px solid #1a1b1f", flexShrink: 0, zIndex: 10 },
  hLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badge: { fontSize: 10, fontWeight: 600, background: "rgba(37,99,235,.2)", color: "#60a5fa", padding: "2px 8px", borderRadius: 20, letterSpacing: ".3px" },
  hRight: { display: "flex", gap: 8, alignItems: "center" },
  btnSm: { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#ccc", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", position: "relative" },

  knockBanner: { background: "#0e0f12", borderBottom: "1px solid #1e2030", padding: "0 20px", flexShrink: 0, zIndex: 9 },
  knockRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #141417" },
  knockAv: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 },
  knockBtn: { width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 },

  body: { flex: 1, display: "grid", overflow: "hidden" },
  videoArea: { position: "relative", background: "#000", overflow: "hidden", display: "flex" },
  errorBar: { position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(239,68,68,.9)", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 50, maxWidth: "80%" },

  remoteVideo: { width: "100%", height: "100%", objectFit: "cover", background: "#000" },
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "0 48px", textAlign: "center" },
  overlayIcon: { width: 72, height: 72, borderRadius: "50%", background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  overlayTitle: { fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#fff" },
  overlaySub: { fontSize: 14, color: "#666", margin: "0 0 20px", lineHeight: 1.6 },

  pip: { position: "absolute", bottom: 88, right: 20, width: 220, height: 124, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,.12)", background: "#111", boxShadow: "0 8px 32px rgba(0,0,0,.6)", zIndex: 20 },
  pipVideo: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  pipMuted: { position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" },
  nameTag: { position: "absolute", bottom: 6, left: 8, background: "rgba(0,0,0,.65)", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#fff", backdropFilter: "blur(4px)" },

  ctrlBar: { position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, background: "rgba(10,10,12,.85)", padding: "10px 20px", borderRadius: 28, backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.06)", zIndex: 30, alignItems: "center" },
  ctrl: { width: 46, height: 46, borderRadius: "50%", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" },

  chat: { background: "#0e0f12", borderLeft: "1px solid #1a1b1f", display: "flex", flexDirection: "column", overflow: "hidden" },
  chatHead: { padding: "14px 16px", borderBottom: "1px solid #1a1b1f", display: "flex", justifyContent: "space-between", alignItems: "center" },
  chatBody: { flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  chatInput: { padding: "12px 16px", borderTop: "1px solid #1a1b1f", display: "flex", gap: 8, alignItems: "center" },
};
