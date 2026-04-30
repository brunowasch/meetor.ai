import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { entrevistaId, nota } = body as {
            entrevistaId?: string;
            nota?: number;
        };

        if (!entrevistaId || !nota) {
            return NextResponse.json({ error: "entrevistaId e nota são obrigatórios." }, { status: 400 });
        }

        const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
        const syncSecret = process.env.SYNC_SECRET;

        if (!connectSkillsUrl || !syncSecret) {
            return NextResponse.json({ error: "Configuração de serviço incompleta." }, { status: 500 });
        }

        const csRes = await fetch(`${connectSkillsUrl}/api/mentor/interview/rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
                entrevistaId,
                nota,
            }),
            signal: AbortSignal.timeout(10000),
        });

        const data = await csRes.json();

        if (!csRes.ok) {
            return NextResponse.json({ error: data.error ?? "Erro ao salvar avaliação." }, { status: csRes.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
