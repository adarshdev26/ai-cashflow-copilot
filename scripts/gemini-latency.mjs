// scripts/gemini-latency.mjs
// Usage: node scripts/gemini-latency.mjs
// Optional: GEMINI_MODEL=gemini-3.8-flash node scripts/gemini-latency.mjs

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    process.exit(1);
}

// One client, per-request timeout via config so we can vary it per test.
const ai = new GoogleGenAI({ apiKey: API_KEY });

/** A tiny JSON schema, same shape you use in prod. */
const SCHEMA = {
    type: 'object',
    properties: {
        insights: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    detail: { type: 'string' },
                },
                required: ['title', 'detail'],
            },
        },
    },
    required: ['insights'],
};

/** Build a fake payload of roughly `targetChars` characters. */
function makePayload(targetChars) {
    const rows = [];
    let size = 0;
    let i = 0;
    while (size < targetChars) {
        const row = {
            category: `Category ${i % 20}`,
            amount: Number((Math.random() * 5000).toFixed(2)),
            currency: 'INR',
            date: new Date(Date.now() - i * 86400000).toISOString(),
            note: 'x'.repeat(40),
        };
        const s = JSON.stringify(row);
        rows.push(row);
        size += s.length;
        i++;
    }
    return { transactions: rows, currency: 'INR' };
}

async function callOnce({ label, data, timeoutMs, maxOutputTokens = 1024 }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs + 500);

    const started = Date.now();
    try {
        const res = await ai.models.generateContent({
            model: MODEL,
            contents: JSON.stringify(data),
            config: {
                systemInstruction: 'You are a financial analyst. Return one short insight.',
                responseMimeType: 'application/json',
                responseJsonSchema: SCHEMA,
                temperature: 0.2,
                maxOutputTokens,
                abortSignal: controller.signal,
            },
        });
        const ms = Date.now() - started;
        const text = res.text ?? '';
        const inChars = JSON.stringify(data).length;
        console.log(
            `${label.padEnd(22)} in=${String(inChars).padStart(7)}  out=${String(text.length).padStart(5)}  ${String(ms).padStart(6)}ms  ok`,
        );
        return { ok: true, ms, inChars, outChars: text.length };
    } catch (err) {
        const ms = Date.now() - started;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${label.padEnd(22)} ${String(ms).padStart(6)}ms  FAIL  ${msg.slice(0, 120)}`);
        return { ok: false, ms, error: msg };
    } finally {
        clearTimeout(timer);
    }
}

console.log(`model=${MODEL}\n`);

// 1) Trivial prompt — does the model respond at all, and how fast?
console.log('--- baseline ---');
await callOnce({
    label: 'trivial',
    data: { ping: 'ok' },
    timeoutMs: 30_000,
});

// 2) Payload size sweep. Small → large.
console.log('\n--- payload sweep ---');
const sizes = [1_000, 5_000, 20_000, 60_000, 120_000];
for (const target of sizes) {
    const data = makePayload(target);
    const inChars = JSON.stringify(data).length;
    // Generous timeout so we see real latency, not our own abort.
    await callOnce({
        label: `~${Math.round(inChars / 1000)}k chars`,
        data,
        timeoutMs: 45_000,
    });
}

// 3) Output size sensitivity at a fixed input.
console.log('\n--- output cap sweep (20k input) ---');
const fixed = makePayload(20_000);
for (const maxOut of [256, 512, 1024, 2048]) {
    await callOnce({
        label: `maxOut=${maxOut}`,
        data: fixed,
        timeoutMs: 45_000,
        maxOutputTokens: maxOut,
    });
}

console.log('\nDone. Look for the row where latency jumps past ~15s.');
