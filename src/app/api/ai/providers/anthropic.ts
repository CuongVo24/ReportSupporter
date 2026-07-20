/**
 * Parses a single SSE line from Anthropic streaming API.
 */
export function parseAnthropicLine(
  line: string
): { delta?: string; inputTokens?: number; outputTokens?: number } | null {
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
    return null;
  }
}
