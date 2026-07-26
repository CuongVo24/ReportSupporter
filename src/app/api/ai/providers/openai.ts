import type { AiUsage } from "@/types/ai";

export const MAX_OPENAI_LINE_BYTES = 64 * 1024; // 64 KiB

/**
 * Parses a single SSE line from OpenAI streaming API.
 */
export type OpenAiParsedLine = {
  delta?: string;
  usage?: AiUsage;
  done?: boolean;
  malformed?: true;
  limitExceeded?: true;
};

/**
 * Returns `null` for lines that are legitimately skippable (blank lines or
 * lines that aren't an SSE `data:` frame).
 * Returns `{ malformed: true }` for a `data:` frame whose JSON payload
 * fails to parse — this is a distinct, protocol-error case the caller must
 * NOT silently ignore (see w25_fix-all-bugs.md §D).
 */
export function parseOpenAiLine(line: string): OpenAiParsedLine | null {
  if (new TextEncoder().encode(line).byteLength > MAX_OPENAI_LINE_BYTES) {
    return { limitExceeded: true };
  }
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
    return { malformed: true };
  }
}
