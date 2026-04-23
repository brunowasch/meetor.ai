import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { entrevistaId } = body as { entrevistaId?: string };

        if (!entrevistaId) {
            return NextResponse.json({ error: "entrevistaId é obrigatório." }, { status: 400 });
        }

        const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
        const syncSecret = process.env.SYNC_SECRET;

        if (!connectSkillsUrl || !syncSecret) {
            console.error("CONNECT_SKILLS_URL ou SYNC_SECRET não configurado.");
            return NextResponse.json({ error: "Configuração de serviço incompleta." }, { status: 500 });
        }

        const csRes = await fetch(`${connectSkillsUrl}/api/mentor/interview/end`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({ entrevistaId }),
            signal: AbortSignal.timeout(8000),
        });

        if (!csRes.ok) {
            const data = await csRes.json().catch(() => ({}));
            return NextResponse.json({ error: data.error ?? "Erro ao encerrar reunião." }, { status: csRes.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST /api/meetings/end] Erro:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
