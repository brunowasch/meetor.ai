import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { entrevistaId, feedback_comportamental, feedback_tecnico, feedback_geral, nota_comportamental, nota_tecnica, nota_geral } = body as {
            entrevistaId?: string;
            feedback_comportamental?: string;
            feedback_tecnico?: string;
            feedback_geral?: string;
            nota_comportamental?: number;
            nota_tecnica?: number;
            nota_geral?: number;
        };

        if (!entrevistaId) {
            return NextResponse.json({ error: "entrevistaId é obrigatório." }, { status: 400 });
        }
        if (!feedback_comportamental?.trim()) {
            return NextResponse.json({ error: "Feedback Comportamental é obrigatório." }, { status: 400 });
        }
        if (nota_comportamental === undefined || nota_comportamental < 0 || nota_comportamental > 100) {
            return NextResponse.json({ error: "Nota Comportamental deve ser entre 0 e 100." }, { status: 400 });
        }
        if (!feedback_tecnico?.trim()) {
            return NextResponse.json({ error: "Feedback Técnico é obrigatório." }, { status: 400 });
        }
        if (nota_tecnica === undefined || nota_tecnica < 0 || nota_tecnica > 100) {
            return NextResponse.json({ error: "Nota Técnica deve ser entre 0 e 100." }, { status: 400 });
        }
        if (!feedback_geral?.trim()) {
            return NextResponse.json({ error: "Feedback Geral é obrigatório." }, { status: 400 });
        }
        if (nota_geral === undefined || nota_geral < 0 || nota_geral > 100) {
            return NextResponse.json({ error: "Nota Geral deve ser entre 0 e 100." }, { status: 400 });
        }

        const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
        const syncSecret = process.env.SYNC_SECRET;

        if (!connectSkillsUrl || !syncSecret) {
            console.error("CONNECT_SKILLS_URL ou SYNC_SECRET não configurado.");
            return NextResponse.json({ error: "Configuração de serviço incompleta." }, { status: 500 });
        }

        const csRes = await fetch(`${connectSkillsUrl}/api/mentor/interview/feedback`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
                entrevistaId,
                feedback_comportamental,
                nota_comportamental,
                feedback_tecnico,
                nota_tecnica,
                feedback_geral,
                nota_geral,
            }),
            signal: AbortSignal.timeout(10000),
        });

        const data = await csRes.json();

        if (!csRes.ok) {
            return NextResponse.json({ error: data.error ?? "Erro ao salvar feedback." }, { status: csRes.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST /api/meetings/feedback] Erro:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
