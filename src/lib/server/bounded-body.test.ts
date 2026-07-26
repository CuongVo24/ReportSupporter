import { afterEach, describe, expect, it, vi } from "vitest";
import { readBoundedBody } from "./bounded-body";

function streamedRequest(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Request {
  return new Request("http://localhost/upload", {
    method: "POST",
    body,
    signal,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("readBoundedBody", () => {
  it("rejects invalid reader configuration", async () => {
    const request = new Request("http://localhost/upload", { method: "POST" });

    await expect(readBoundedBody(request, 0, 10, 20)).resolves.toEqual({
      ok: false,
      status: 500,
      message: "Invalid bounded-body configuration.",
    });
    await expect(readBoundedBody(request, 10, Number.NaN, 20)).resolves.toMatchObject({
      ok: false,
      status: 500,
    });
  });

  it("returns an empty string when the request has no body", async () => {
    const request = new Request("http://localhost/upload", { method: "POST" });
    await expect(readBoundedBody(request, 10, 10, 20)).resolves.toEqual({
      ok: true,
      text: "",
    });
  });

  it("combines streamed UTF-8 chunks within the byte cap", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("xin "));
        controller.enqueue(encoder.encode("chào"));
        controller.close();
      },
    });

    await expect(readBoundedBody(streamedRequest(body), 32, 100, 500)).resolves.toEqual({
      ok: true,
      text: "xin chào",
    });
  });

  it("rejects actual streamed bytes over the cap", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(5));
        controller.enqueue(new Uint8Array(6));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(readBoundedBody(streamedRequest(body), 10, 100, 500)).resolves.toMatchObject({
      ok: false,
      status: 413,
    });
    expect(cancelled).toBe(true);
  });

  it("rejects malformed UTF-8 after a bounded read", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([0xc3, 0x28]));
        controller.close();
      },
    });

    await expect(readBoundedBody(streamedRequest(body), 10, 100, 500)).resolves.toMatchObject({
      ok: false,
      status: 400,
      message: "Request body is not valid UTF-8.",
    });
  });

  it("cancels promptly when the request is aborted during a pending read", async () => {
    const abortController = new AbortController();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });
    const pending = readBoundedBody(streamedRequest(body, abortController.signal), 10, 10_000, 20_000);

    abortController.abort(new Error("client disconnected"));

    await expect(pending).resolves.toMatchObject({ ok: false, status: 499 });
    expect(cancelled).toBe(true);
  });

  it("distinguishes idle and total body-read deadlines", async () => {
    vi.useFakeTimers();

    const idle = readBoundedBody(
      streamedRequest(new ReadableStream<Uint8Array>()),
      10,
      50,
      500,
    );
    await vi.advanceTimersByTimeAsync(50);
    await expect(idle).resolves.toMatchObject({
      ok: false,
      status: 408,
      message: "Request body read idle timeout.",
    });

    const total = readBoundedBody(
      streamedRequest(new ReadableStream<Uint8Array>()),
      10,
      500,
      50,
    );
    await vi.advanceTimersByTimeAsync(50);
    await expect(total).resolves.toMatchObject({
      ok: false,
      status: 408,
      message: "Request body read total deadline exceeded.",
    });
  });

  it("fails closed when the body stream throws", async () => {
    const body = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("stream failure");
      },
    });

    await expect(readBoundedBody(streamedRequest(body), 10, 100, 500)).resolves.toMatchObject({
      ok: false,
      status: 400,
      message: "Failed to read request body.",
    });
  });
});
