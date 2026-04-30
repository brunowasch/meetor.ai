import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { profile, feedback, language } = await request.json();

        if (!profile || !feedback) {
            return NextResponse.json(
                { error: 'profile and feedback are required' },
                { status: 400 }
            );
        }

        const aiUrl = process.env.FEEDBACK_ANALYSIS_AI;

        if (!aiUrl) {
            console.error('FEEDBACK_ANALYSIS_AI env variable is not defined');
            return NextResponse.json(
                { error: 'AI service configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile, feedback, language }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Feedback AI returned ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: `AI Service Error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Check feedback error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
