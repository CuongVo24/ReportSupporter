import type { AiUsage } from "@/types/ai";

/**
 * Parses a single SSE line from OpenAI streaming API.
 */
export function parseOpenAiLine(
  line: string
): { delta?: string; usage?: AiUsage; done?: boolean } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("data: ")) return null;

  const dataStr = trimmed.slice(6).trim();
  if (dataStr === "[DONE]") {
    return { done: true };
  }

  try {
    const data = JSON.parse(dataStr);
    const choice = data.choices?.[0];
    const text = choice?.delta?.content;

    let usage: AiUsage | undefined;
    if (data.usage) {
      const u = data.usage;
      if (typeof u.prompt_tokens === "number" && typeof u.completion_tokens === "number") {
        usage = {
          inputTokens: u.prompt_tokens,
          outputTokens: u.completion_tokens,
          estimated: false,
        };
      }
    }

    return {
      delta: typeof text === "string" ? text : undefined,
      usage,
    };
  } catch {
    return null;
  }
}
