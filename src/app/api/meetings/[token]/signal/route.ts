import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const signalsStore: Record<string, any[]> = {};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!signalsStore[token]) signalsStore[token] = [];

  try {
    const { type, data, fromUser, toUser } = await req.json();

    signalsStore[token].push({
      id: Date.now().toString() + Math.random(),
      fromUser,
      toUser,
      type,
      data: JSON.stringify(data),
      consumed: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
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
  if (!signalsStore[token]) signalsStore[token] = [];

  try {
    const matchSignals = signalsStore[token].filter(
      (s) => !s.consumed && s.fromUser !== me && (!s.toUser || s.toUser === me)
    );

    matchSignals.forEach((s) => (s.consumed = true));

    const parsed = matchSignals.map((s) => ({
      id: s.id,
      fromUser: s.fromUser,
      type: s.type,
      data: JSON.parse(s.data),
    }));

    if (signalsStore[token].length > 50) {
      signalsStore[token] = signalsStore[token].filter((s) => !s.consumed);
    }

    return NextResponse.json({ signals: parsed }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, s-maxage=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}