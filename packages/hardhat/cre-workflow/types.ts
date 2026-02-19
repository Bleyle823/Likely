import { z } from "zod";

export const configSchema = z.object({
    geminiModel: z.string(),
    contractAddress: z.string().startsWith("0x"),
    chainName: z.string(),
});

export type Config = z.infer<typeof configSchema>;

export type GeminiResponse = {
    result: "YES" | "NO" | "INCONCLUSIVE";
    confidence: number;
};
