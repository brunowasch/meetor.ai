import { NextRequest, NextResponse } from "next/server";

// Origens sempre permitidas em desenvolvimento.
const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

/** Reduz um valor (URL completa ou origem) a uma origem canônica (scheme+host+port). */
function toOrigin(value: string | undefined | null): string | null {
    if (!value) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

/**
 * Monta a allowlist de origens:
 * - localhost (dev)
 * - origem do app parceiro (Connect Skills), derivada das envs já existentes
 * - origens extras configuráveis via CORS_ALLOWED_ORIGINS (lista separada por vírgula, ex.: domínios de produção)
 */
function getAllowedOrigins(): Set<string> {
    const set = new Set<string>(
        process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS
    );

    for (const value of [process.env.CONNECT_SKILLS_URL, process.env.NEXT_PUBLIC_CONNECT_SKILLS_URL]) {
        const origin = toOrigin(value);
        if (origin) set.add(origin);
    }

    for (const raw of (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",")) {
        const origin = toOrigin(raw.trim());
        if (origin) set.add(origin);
    }

    return set;
}

function withCors(res: NextResponse, origin: string, requestHeaders: string | null): NextResponse {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.append("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", requestHeaders || "Content-Type, Authorization, x-sync-secret");
    res.headers.set("Access-Control-Max-Age", "86400");
    return res;
}

export function proxy(req: NextRequest) {
    const origin = req.headers.get("origin");
    const isAllowed = !!origin && getAllowedOrigins().has(origin);
    const requestHeaders = req.headers.get("access-control-request-headers");

    // Preflight
    if (req.method === "OPTIONS") {
        const res = new NextResponse(null, { status: 204 });
        return isAllowed ? withCors(res, origin!, requestHeaders) : res;
    }

    const res = NextResponse.next();
    return isAllowed ? withCors(res, origin!, requestHeaders) : res;
}

export const config = {
    matcher: "/api/:path*",
};
