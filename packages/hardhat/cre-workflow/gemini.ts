import {
    cre,
    type Runtime,
    ok,
    consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import { Buffer } from "buffer";
import { Config, GeminiResponse } from "./types";

/**
 * System prompt for Gemini AI.
 */
const systemPrompt = `
You are a fact-checking and event resolution system that determines the real-world outcome of prediction markets.
OUTPUT FORMAT (CRITICAL):
- You MUST respond with a SINGLE JSON object: {"result": "YES" | "NO" | "INCONCLUSIVE", "confidence": <integer 0-10000>}
- No markdown, no prose.
`;

const userPrompt = `Determine the outcome for: `;

// Helper to construct the Gemini API request
export const fetchGeminiOutcome = (
    runtime: Runtime<Config>,
    question: string
): GeminiResponse => {
    const apiKeyResp = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
    if (!apiKeyResp) throw new Error("Missing GEMINI_API_KEY secret");
    const apiKey = apiKeyResp.value;

    const requestBody = {
        contents: [{
            parts: [{ text: systemPrompt + "\n" + userPrompt + question }]
        }],
        tools: [{ google_search: {} }]
    };

    const httpClient = new cre.capabilities.HTTPClient();

    // Encode body as base64
    const bodyJson = JSON.stringify(requestBody);
    const body = Buffer.from(new TextEncoder().encode(bodyJson)).toString("base64");

    const model = runtime.config.geminiModel.trim();
    // Using v1beta and key in query param as per standard Google AI docs
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    const req = {
        url,
        method: "POST" as const,
        headers: {
            "Content-Type": "application/json"
        },
        body,
    };

    // Use runInNodeMode for fan-out and consensus
    // Note: Use the node-specific runtime inside the callback
    let finalResponse = (runtime as any).runInNodeMode((nodeRuntime: any) => {
        return httpClient.sendRequest(nodeRuntime, req).result();
    }, consensusIdenticalAggregation())();

    // Handle lazy result functions if present in older SDK versions, 
    // although 1.1.0 should be fine.
    while (finalResponse && typeof (finalResponse as any).result === 'function') {
        finalResponse = (finalResponse as any).result();
    }

    const response = finalResponse as any;
    runtime.log(`Response settled: statusCode=${response?.statusCode}`);

    if (!ok(response)) {
        const bodyText = response?.body ? new TextDecoder().decode(response.body) : "no body";
        throw new Error(`Gemini API error: ${response?.statusCode} ${bodyText}`);
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Invalid response from Gemini");

    // Clean up the text
    const jsonText = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
        return JSON.parse(jsonText) as GeminiResponse;
    } catch (e) {
        throw new Error(`Failed to parse Gemini JSON: ${jsonText}`);
    }
};
