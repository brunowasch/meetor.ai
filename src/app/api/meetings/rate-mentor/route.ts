import { NextRequest, NextResponse } from "next/server";
import { authorizeMeetingParticipant } from "@/lib/meeting-authz";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, email, nota } = body as {
            token?: string;
            email?: string;
            nota?: number;
        };

        if (typeof nota !== "number" || nota < 1 || nota > 5) {
            return NextResponse.json({ error: "Nota deve ser entre 1 e 5." }, { status: 400 });
        }

        const authz = await authorizeMeetingParticipant(token, email);
        if (!authz.authorized) {
            return NextResponse.json({ error: authz.reason }, { status: authz.status });
        }
        if (authz.isMentor) {
            return NextResponse.json({ error: "O mentor não pode avaliar a si mesmo." }, { status: 403 });
        }

        const entrevistaId = authz.entrevistaId;
        if (!entrevistaId) {
            return NextResponse.json({ error: "Reunião sem entrevista vinculada." }, { status: 400 });
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
        console.error("[POST /api/meetings/rate-mentor] Erro:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
