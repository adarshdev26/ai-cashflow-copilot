// scripts/gemini-models.mjs
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const pager = await ai.models.list();
for await (const m of pager) {
    const methods = (m.supportedActions ?? m.supportedGenerationMethods ?? []).join(',');
    console.log((m.name ?? '').padEnd(45), (m.displayName ?? '').padEnd(28), methods);
}
