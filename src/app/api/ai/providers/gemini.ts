import type { AiUsage } from "@/types/ai";

export const MAX_GEMINI_BUFFER_BYTES = 128 * 1024; // 128 KiB
export const MAX_GEMINI_BRACE_DEPTH = 32;

/**
 * Parses a single complete Gemini response object from the stream.
 */
export function parseGeminiChunk(
  jsonText: string
): { delta?: string; usage?: AiUsage } | null {
  if (jsonText.length > MAX_GEMINI_BUFFER_BYTES) {
    return null;
  }
  try {
    const data = JSON.parse(jsonText);
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    let usage: AiUsage | undefined;
    if (data.usageMetadata) {
      const u = data.usageMetadata;
      if (typeof u.promptTokenCount === "number" && typeof u.candidatesTokenCount === "number") {
        usage = {
          inputTokens: u.promptTokenCount,
          outputTokens: u.candidatesTokenCount,
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

/**
 * Extracts complete curly-braced JSON objects from a text buffer.
 * Correctly ignores curly braces nested inside string literals,
 * taking double quotes and backslash escaping into account.
 * Enforces buffer size cap and nesting depth cap to prevent memory/CPU amplification.
 */
export function extractJsonObjects(
  buffer: string,
  maxBufferBytes = MAX_GEMINI_BUFFER_BYTES,
): { objects: string[]; remaining: string } {
  if (buffer.length > maxBufferBytes) {
    throw new Error("Gemini stream buffer limit exceeded");
  }

  const objects: string[] = [];
  let inString = false;
  let escaped = false;
  let braceDepth = 0;
  let startIndex = -1;
  let lastEndIndex = 0;

  for (let i = 0; i < buffer.length; i++) {
    const char = buffer[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        if (braceDepth === 0) {
          startIndex = i;
        }
        braceDepth++;
        if (braceDepth > MAX_GEMINI_BRACE_DEPTH) {
          throw new Error("Gemini stream nesting depth exceeded");
        }
      } else if (char === "}") {
        if (braceDepth > 0) {
          braceDepth--;
          if (braceDepth === 0 && startIndex !== -1) {
            objects.push(buffer.substring(startIndex, i + 1));
            lastEndIndex = i + 1;
            startIndex = -1;
          }
        }
      }
    }
  }

  return {
    objects,
    remaining: buffer.slice(lastEndIndex),
  };
}
