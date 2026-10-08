import 'server-only';
import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

export class GeminiConfigError extends Error {
    constructor() {
        super('GEMINI_API_KEY is not set');
        this.name = 'GeminiConfigError';
    }
}

function getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new GeminiConfigError();
    if (!client) {
        client = new GoogleGenAI({
            apiKey,
            httpOptions: {
                timeout: 12_000, // hard client-level ceiling (ms)
                // @google/genai honours this shape; attempts=1 means no silent retries
                retryOptions: { attempts: 1 },
            },
        });
    }
    return client;
}

type GenerateJsonInput = {
    systemInstruction: string;
    data: unknown;
    schema: Record<string, unknown>;
    timeoutMs?: number;
};

/** Returns the raw parsed JSON. The caller MUST validate it. */
export async function generateJson({
    systemInstruction,
    data,
    schema,
    timeoutMs,
}: GenerateJsonInput): Promise<unknown> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';

    const response = await getClient().models.generateContent({
        model,
        contents: JSON.stringify(data),
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            temperature: 0.2,
            maxOutputTokens: 1024,
            // per-request override, if the SDK version supports it here:
            httpOptions: timeoutMs ? { timeout: timeoutMs } : undefined,
        },
    });

    const text = response.text;
    if (!text) throw new Error('Empty Gemini response');
    return JSON.parse(text);
}