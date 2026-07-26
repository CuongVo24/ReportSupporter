export const MAX_ANTHROPIC_LINE_BYTES = 64 * 1024; // 64 KiB

export type AnthropicParsedLine = {
  delta?: string;
  inputTokens?: number;
  outputTokens?: number;
  malformed?: true;
  limitExceeded?: true;
};

/**
 * Parses a single SSE line from Anthropic streaming API. Returns
 * `{ malformed: true }` (not `null`) when a `data:` frame's JSON fails to
 * parse, so callers can treat it as a protocol error instead of silently
 * dropping it (see w25_fix-all-bugs.md §D).
 */
export function parseAnthropicLine(line: string): AnthropicParsedLine | null {
  if (new TextEncoder().encode(line).byteLength > MAX_ANTHROPIC_LINE_BYTES) {
    return { limitExceeded: true };
  }
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("data: ")) return null;

  const dataStr = trimmed.slice(6).trim();

  try {
    const data = JSON.parse(dataStr);
    const type = data.type;

    if (type === "content_block_delta") {
      const text = data.delta?.text;
      return { delta: typeof text === "string" ? text : undefined };
    }

    if (type === "message_start") {
      const inputTokens = data.message?.usage?.input_tokens;
      return { inputTokens: typeof inputTokens === "number" ? inputTokens : undefined };
    }

    if (type === "message_delta") {
      const outputTokens = data.usage?.output_tokens;
      return { outputTokens: typeof outputTokens === "number" ? outputTokens : undefined };
    }

    return {};
  } catch {
    return { malformed: true };
  }
}
