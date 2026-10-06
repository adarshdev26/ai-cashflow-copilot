import { NextResponse } from 'next/server';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: Request) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, email, message, company } = body as Record<string, string>;

    if (company) return NextResponse.json({ ok: true }); // honeypot hit: pretend success

    if (!name?.trim() || !email || !isEmail(email) || !message || message.trim().length < 10) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
}
