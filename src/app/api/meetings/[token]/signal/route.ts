import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Signal {
  id: string;
  fromUser: string;
  toUser: string;
  type: string;
  data: string;
  consumed: boolean;
  createdAt: number;
}

// Global singleton store – survives hot-reloads in dev via globalThis
declare global {
  // eslint-disable-next-line no-var
  var __signalStore: Record<string, Signal[]> | undefined;
}
if (!globalThis.__signalStore) globalThis.__signalStore = {};
const store = globalThis.__signalStore;

const MAX_SIGNALS = 200;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function gc(token: string) {
  if (!store[token]) return;
  const now = Date.now();
  store[token] = store[token].filter((s) => !s.consumed && now - s.createdAt < TTL_MS);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!store[token]) store[token] = [];

  try {
    const { type, data, fromUser, toUser } = await req.json();

    if (!fromUser || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    store[token].push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fromUser,
      toUser: toUser ?? "",
      type,
      data: JSON.stringify(data ?? {}),
      consumed: false,
      createdAt: Date.now(),
    });

    // Keep the store bounded
    if (store[token].length > MAX_SIGNALS) gc(token);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = new URL(req.url);
  const me = url.searchParams.get("clientId");

  if (!me) return NextResponse.json({ error: "No clientId" }, { status: 400 });
  if (!store[token]) store[token] = [];

  try {
    gc(token);

    // Match signals addressed to me (or broadcast with empty toUser) from others
    const matched = store[token].filter(
      (s) => !s.consumed && s.fromUser !== me && (s.toUser === "" || s.toUser === me)
    );

    matched.forEach((s) => (s.consumed = true));

    const signals = matched.map((s) => ({
      id: s.id,
      fromUser: s.fromUser,
      type: s.type,
      data: JSON.parse(s.data),
    }));

    const headers = {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "Pragma": "no-cache",
    };

    return NextResponse.json({ signals }, { headers });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}