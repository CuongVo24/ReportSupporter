import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function aiRequest(body: unknown, apiKey?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (apiKey) headers.set("x-api-key", apiKey);

  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("/api/ai route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects requests without a client API key and does not call provider fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "openai",
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: "Missing API key. Configure a local client API key in AI Settings.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a generic provider error without leaking upstream details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Payment Required",
      text: async () => "quota exhausted for account billing@example.com",
    } as Response));

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "openai",
    }, "client-key"));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe(
      "AI provider request failed. Please check your API key, quota, model, or provider status.",
    );
    expect(JSON.stringify(data)).not.toContain("billing@example.com");
    expect(JSON.stringify(data)).not.toContain("quota exhausted");
  });

  it("rejects oversized request bodies before calling a provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "x".repeat(513 * 1024),
      provider: "openai",
    }, "client-key"));

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a Gemini key in a header instead of the URL and caps output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Suggestion" }] } }] }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "gemini",
      model: "gemini-2.0-flash",
    }, "secret-client-key"));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("secret-client-key");
    expect(url).not.toContain("?key=");
    expect(init.headers).toMatchObject({ "x-goog-api-key": "secret-client-key" });
    expect(JSON.parse(String(init.body)).generationConfig.maxOutputTokens).toBe(4000);
  });
});
