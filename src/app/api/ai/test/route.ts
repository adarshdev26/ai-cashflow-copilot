import { NextResponse } from 'next/server';

import { gemini } from '@/services/ai/gemini.service';

export async function GET() {
    try {
        const response = await gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: 'Say hello to CashFlow Copilot in one short sentence.',
        });

        return NextResponse.json({
            success: true,
            message: response.text,
        });
    } catch (error) {
        console.error('Gemini test failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to communicate with Gemini',
            },
            { status: 500 },
        );
    }
}