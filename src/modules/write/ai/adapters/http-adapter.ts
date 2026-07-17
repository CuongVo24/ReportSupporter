import type { AiAdapter } from "../ai-gateway";
import type { AiAction, AiRequestOptions, AiStreamEvent, AiSuggestion } from "@/types/ai";
import { loadAiConfig } from "../ai-config";
import { estimateUsage, withEstimatedCost } from "../model-catalog";

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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    };

    const response = await fetch("/api/ai", {
      method: "POST",
      headers,
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers?.get("content-type") ?? "";
    if (contentType.includes("application/x-ndjson")) {
      const payload = await response.text();
      let suggestion = "";
      let usage: AiSuggestion["usage"];
      let responseModel = config.model || "";
      for (const line of payload.split(/\r?\n/u)) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as AiStreamEvent;
        options.onEvent?.(event);
        if (event.event === "meta") responseModel = event.model;
        if (event.event === "delta") suggestion += event.text;
        if (event.event === "done" && event.usage) usage = withEstimatedCost(responseModel, event.usage);
        if (event.event === "error") throw new Error(event.message);
      }
      return {
        suggestion,
        usage: usage ?? estimateUsage(input, suggestion, responseModel),
      };
    }

    const data = await response.json();
    const suggestion = data.suggestion || "";
    return {
      suggestion,
      usage: data.usage && typeof data.usage === "object"
        ? withEstimatedCost(config.model || "", { ...data.usage, estimated: false })
        : estimateUsage(input, suggestion, config.model || ""),
    };
  }
}

export const httpAdapter = new HttpAiAdapter();
