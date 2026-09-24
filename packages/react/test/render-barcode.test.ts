import { afterEach, describe, expect, it, vi } from "vitest";
import { renderBarcode, renderZpl } from "../src/api/render-barcode";
import { ZplAiError } from "../src/errors";

describe("API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("requests uncached barcode images from the public endpoint", async () => {
    const mock = vi.fn().mockImplementation(async () => new Response(new Blob(["png"]), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" }
    }));
    vi.stubGlobal("fetch", mock);

    const request = { type: "qr" as const, data: "https://zpl.ai/^~" };
    const signal = new AbortController().signal;

    await renderBarcode("zpk_test", request, signal);
    await renderBarcode("zpk_test", request, signal);

    expect(mock).toHaveBeenCalledTimes(2);
    expect(new URL(mock.mock.calls[0][0]).pathname).toBe("/api/public/barcode/img");
    expect(mock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        Authorization: "Bearer zpk_test",
        Accept: "image/png",
        "Content-Type": "application/json"
      }
    });
    expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual(request);
  });

  it("sends arbitrary ZPL with required render settings", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(new Blob(["png"]), {
      status: 200,
      headers: { "Content-Type": "image/png" }
    }));
    vi.stubGlobal("fetch", mock);

    await renderZpl("zpk_test", "^XA^XZ", new AbortController().signal);

    expect(new URL(mock.mock.calls[0][0]).pathname).toBe("/api/public/zpl/img");
    expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual({
      zpl: "^XA^XZ",
      widthIn: 4,
      heightIn: 2,
      dpmm: 8,
      backgroundColor: "#FFFFFF",
      parameters: {}
    });
  });

  it("surfaces the API error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "unauthorized", message: "Missing or invalid API key" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )));

    await expect(
      renderBarcode("bad", { type: "code128", data: "TEST" }, new AbortController().signal)
    ).rejects.toThrow("Missing or invalid API key");
  });

  it("retries transient server failures", async () => {
    const mock = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), {
        status: 200,
        headers: { "Content-Type": "image/png" }
      }));
    vi.stubGlobal("fetch", mock);

    await renderBarcode("zpk_retry", { type: "code128", data: "TEST" }, new AbortController().signal);

    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After before retrying a rate limit", async () => {
    vi.useFakeTimers();

    const mock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "rate_limit_exceeded", message: "Try again" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "2" }
      }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), {
        status: 200,
        headers: { "Content-Type": "image/png" }
      }));
    vi.stubGlobal("fetch", mock);

    const result = renderBarcode("zpk_test", { type: "qr", data: "TEST" }, new AbortController().signal);

    await vi.advanceTimersByTimeAsync(1999);
    expect(mock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBeInstanceOf(Blob);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("continues retrying rate limits after the old three-attempt ceiling", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01"));

    const mock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(new Response(new Blob(["png"]), {
        status: 200,
        headers: { "Content-Type": "image/png" }
      }));
    vi.stubGlobal("fetch", mock);

    const result = renderBarcode("zpk_test", { type: "qr", data: "TEST" }, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(result).resolves.toBeInstanceOf(Blob);
    expect(mock).toHaveBeenCalledTimes(4);
  });

  it("staggers simultaneous rate-limit retries instead of retrying in a burst", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-01-01"));

    const mock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockImplementation(async () => new Response(new Blob(["png"]), {
        status: 200,
        headers: { "Content-Type": "image/png" }
      }));
    vi.stubGlobal("fetch", mock);

    const signal = new AbortController().signal;
    const first = renderBarcode("zpk_test", { type: "qr", data: "ONE" }, signal);
    const second = renderBarcode("zpk_test", { type: "qr", data: "TWO" }, signal);
    await vi.advanceTimersByTimeAsync(1000);
    expect(mock).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(mock).toHaveBeenCalledTimes(4);
  });

  it("rejects a successful response that is not a PNG", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "unexpected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", mock);

    await expect(renderBarcode("zpk_test", { type: "qr", data: "TEST" }, new AbortController().signal))
      .rejects.toThrow(ZplAiError);
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
