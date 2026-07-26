import type { AiUsage } from "@/types/ai";

export const MAX_GEMINI_BUFFER_BYTES = 128 * 1024; // 128 KiB
export const MAX_GEMINI_BRACE_DEPTH = 32;

export type GeminiParsedChunk = {
  delta?: string;
  usage?: AiUsage;
  malformed?: true;
  limitExceeded?: true;
};

/**
 * Parses a single complete Gemini response object from the stream. Returns
 * `{ malformed: true }` (not `null`) when a syntactically-balanced object
 * still fails JSON.parse, so callers treat it as a protocol error instead of
 * silently dropping it (see w25_fix-all-bugs.md §D).
 */
export function parseGeminiChunk(jsonText: string): GeminiParsedChunk | null {
  if (new TextEncoder().encode(jsonText).byteLength > MAX_GEMINI_BUFFER_BYTES) {
    return { limitExceeded: true };
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
    return { malformed: true };
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
): { objects: string[]; remaining: string; incomplete: boolean } {
  if (new TextEncoder().encode(buffer).byteLength > maxBufferBytes) {
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
    // true only when the buffer ends mid-object (an actual truncated JSON
    // object) — NOT for harmless trailing array syntax like `]`, `,`, or
    // whitespace between/after objects in Gemini's `[ {...}, {...} ]` wire
    // format, which legitimately remains unconsumed after the last object.
    incomplete: braceDepth > 0,
    remaining: buffer.slice(lastEndIndex),
  };
}
