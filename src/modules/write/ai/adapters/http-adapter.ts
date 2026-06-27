import type { AiAdapter } from "../ai-gateway";
import type { AiAction } from "@/types/ai";
import { loadAiConfig } from "../ai-config";

export class HttpAiAdapter implements AiAdapter {
  async request(action: AiAction, input: string): Promise<string> {
    const config = loadAiConfig();

    if (!config.enabled || !config.provider) {
      return "";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.apiKey) {
      headers["x-api-key"] = config.apiKey;
    }

    const response = await fetch("/api/ai", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action,
        input,
        provider: config.provider,
        model: config.model,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestion || "";
  }
}

export const httpAdapter = new HttpAiAdapter();
