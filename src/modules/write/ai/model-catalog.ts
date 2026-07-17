import type { AiUsage } from "@/types";

export const MODEL_CATALOG_UPDATED_AT = "2026-07-17";

const MODEL_USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
};

export function withEstimatedCost(model: string, usage: AiUsage): AiUsage {
  const price = MODEL_USD_PER_MILLION[model];
  if (!price || usage.inputTokens === undefined || usage.outputTokens === undefined) {
    return { ...usage, catalogUpdatedAt: MODEL_CATALOG_UPDATED_AT };
  }
  return {
    ...usage,
    estimatedCostUsd: (usage.inputTokens * price.input + usage.outputTokens * price.output) / 1_000_000,
    catalogUpdatedAt: MODEL_CATALOG_UPDATED_AT,
  };
}

export function estimateUsage(input: string, output: string, model: string): AiUsage {
  return withEstimatedCost(model, {
    inputTokens: Math.ceil(input.length / 4),
    outputTokens: Math.ceil(output.length / 4),
    estimated: true,
  });
}
