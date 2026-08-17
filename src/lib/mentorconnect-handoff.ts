import { createHmac, timingSafeEqual } from "crypto";


export const HANDOFF_TTL_SECONDS = 120;

function getSharedSecret(): string {
    const secret = process.env.SYNC_SECRET;
    if (!secret) {
        throw new Error("SYNC_SECRET não configurado: handoff indisponível.");
    }
    return secret;
}

function sign(payload: string): string {
    return createHmac("sha256", getSharedSecret()).update(payload).digest("base64url");
}

export function createHandoffToken(usuarioId: string, nowMs: number = Date.now()): string {
    const expiresAt = Math.floor(nowMs / 1000) + HANDOFF_TTL_SECONDS;
    const payload = `${usuarioId}.${expiresAt}`;
    return `${payload}.${sign(payload)}`;
}

export function verifyHandoffToken(
    token: string | null | undefined,
    nowMs: number = Date.now()
): string | null {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [usuarioId, expiresAtRaw, providedSignature] = parts;
    if (!usuarioId || !expiresAtRaw || !providedSignature) return null;

    const payload = `${usuarioId}.${expiresAtRaw}`;
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(sign(payload));

    if (provided.length !== expected.length) return null;
    if (!timingSafeEqual(provided, expected)) return null;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt)) return null;
    if (Math.floor(nowMs / 1000) > expiresAt) return null;

    return usuarioId;
}
