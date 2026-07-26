import type { AiAdapter } from "../ai-gateway";
import {
  aiStreamEventSchema,
  aiUsageSchema,
  type AiAction,
  type AiRequestOptions,
  type AiStreamEvent,
  type AiSuggestion,
} from "@/types/ai";
import { loadAiConfig } from "../ai-config";
import { estimateUsage, withEstimatedCost } from "../model-catalog";

const MAX_CLIENT_LINE_BYTES = 128 * 1024;
const MAX_CLIENT_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_CLIENT_ERROR_BYTES = 64 * 1024;
const MAX_CLIENT_EVENTS = 2_000;
const MAX_CLIENT_SUGGESTION_CHARS = 50_000;

class AiClientProtocolError extends Error {}
class AiClientLimitError extends Error {}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

async function readBoundedResponseText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) throw new AiClientProtocolError("AI response body is missing");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let totalBytes = 0;
  let text = "";
  let complete = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new AiClientLimitError("AI response exceeded maximum size");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    complete = true;
    return text;
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    if (!complete) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function parseEvent(line: string): AiStreamEvent {
  if (new TextEncoder().encode(line).byteLength > MAX_CLIENT_LINE_BYTES) {
    throw new AiClientLimitError("AI stream line exceeded maximum size");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new AiClientProtocolError("AI stream contained invalid JSON");
  }
  const result = aiStreamEventSchema.safeParse(parsed);
  if (!result.success) throw new AiClientProtocolError("AI stream event failed schema validation");
  return result.data;
}

export class HttpAiAdapter implements AiAdapter {
  async request(
    action: AiAction,
    input: string,
    options: AiRequestOptions = {},
  ): Promise<{ suggestion: string; usage?: AiSuggestion["usage"] }> {
    const config = loadAiConfig();

    if (!config.enabled || !config.provider || !config.apiKey) {
      return { suggestion: "" };
    }

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        action,
        input,
        provider: config.provider,
        model: config.model,
        requestId: options.requestId,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const payload = await readBoundedResponseText(response, MAX_CLIENT_ERROR_BYTES);
      let publicMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = asRecord(JSON.parse(payload)).error;
        if (typeof error === "string" && error.length <= 1_024) publicMessage = error;
      } catch {
        // Keep the bounded generic status message.
      }
      throw new Error(publicMessage);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-ndjson")) {
      if (!response.body) throw new AiClientProtocolError("AI stream body is missing");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let totalBytes = 0;
      let eventCount = 0;
      let buffer = "";
      let suggestion = "";
      let usage: AiSuggestion["usage"];
      let responseModel = config.model || "";
      let metaSeen = false;
      let terminalSeen = false;
      let completed = false;

      const consumeEvent = (event: AiStreamEvent) => {
        eventCount += 1;
        if (eventCount > MAX_CLIENT_EVENTS) {
          throw new AiClientLimitError("AI stream emitted too many events");
        }
        if (terminalSeen) throw new AiClientProtocolError("AI stream emitted data after its terminal event");

        if (event.event === "meta") {
          if (metaSeen || eventCount !== 1) throw new AiClientProtocolError("AI stream meta event is out of order");
          metaSeen = true;
          responseModel = event.model;
        } else if (event.event === "delta") {
          if (!metaSeen) throw new AiClientProtocolError("AI stream delta arrived before meta");
          suggestion += event.text;
          if (suggestion.length > MAX_CLIENT_SUGGESTION_CHARS) {
            throw new AiClientLimitError("AI suggestion exceeded maximum size");
          }
        } else {
          terminalSeen = true;
          if (event.event === "done" && event.usage) {
            usage = withEstimatedCost(responseModel, event.usage);
          }
        }

        options.onEvent?.(event);
        if (event.event === "error") throw new Error(event.message);
      };

      const consumeLines = (flush: boolean) => {
        let lineEnd: number;
        while ((lineEnd = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 1);
          const clean = line.endsWith("\r") ? line.slice(0, -1) : line;
          if (clean.trim()) consumeEvent(parseEvent(clean));
        }
        if (new TextEncoder().encode(buffer).byteLength > MAX_CLIENT_LINE_BYTES) {
          throw new AiClientLimitError("AI stream line buffer exceeded maximum size");
        }
        if (flush && buffer.trim()) {
          const clean = buffer.endsWith("\r") ? buffer.slice(0, -1) : buffer;
          buffer = "";
          consumeEvent(parseEvent(clean));
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          totalBytes += value.byteLength;
          if (totalBytes > MAX_CLIENT_RESPONSE_BYTES) {
            throw new AiClientLimitError("AI stream exceeded maximum response size");
          }
          buffer += decoder.decode(value, { stream: true });
          consumeLines(false);
        }
        buffer += decoder.decode();
        consumeLines(true);
        if (!metaSeen || !terminalSeen) {
          throw new AiClientProtocolError("AI stream ended before the required meta/terminal events");
        }
        completed = true;
      } catch (error) {
        await reader.cancel(error).catch(() => undefined);
        throw error;
      } finally {
        if (!completed) await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }

      return {
        suggestion,
        usage: usage ?? estimateUsage(input, suggestion, responseModel),
      };
    }

    if (!contentType.includes("application/json")) {
      await response.body?.cancel().catch(() => undefined);
      throw new AiClientProtocolError("AI response Content-Type is unsupported");
    }

    const payload = await readBoundedResponseText(response, MAX_CLIENT_RESPONSE_BYTES);
    let parsed: Record<string, unknown>;
    try {
      parsed = asRecord(JSON.parse(payload));
    } catch {
      throw new AiClientProtocolError("AI JSON response is malformed");
    }
    if (typeof parsed.suggestion !== "string" || parsed.suggestion.length > MAX_CLIENT_SUGGESTION_CHARS) {
      throw new AiClientProtocolError("AI JSON response failed schema validation");
    }

    const usageResult = aiUsageSchema.safeParse(parsed.usage);
    return {
      suggestion: parsed.suggestion,
      usage: usageResult.success
        ? withEstimatedCost(config.model || "", { ...usageResult.data, estimated: false })
        : estimateUsage(input, parsed.suggestion, config.model || ""),
    };
  }
}

export const httpAdapter = new HttpAiAdapter();
