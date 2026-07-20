import type { AiUsage } from "@/types/ai";

/**
 * Parses a single complete Gemini response object from the stream.
 */
export function parseGeminiChunk(
  jsonText: string
): { delta?: string; usage?: AiUsage } | null {
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
 */
export function extractJsonObjects(buffer: string): { objects: string[]; remaining: string } {
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
