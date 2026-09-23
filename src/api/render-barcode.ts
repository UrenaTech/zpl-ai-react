import { API_URL, RENDER_SETTINGS } from "../config";
import { ZplAiError } from "../errors";
import type { BarcodeType, RenderRequest } from "../types";

const RETRYABLE = new Set([500, 502, 503, 504]);
let nextRateLimitRetryAt = 0;

const delay = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) {
    reject(new DOMException("Aborted", "AbortError"));
    return;
  }

  const onAbort = () => {
    clearTimeout(id);
    reject(new DOMException("Aborted", "AbortError"));
  };
  const id = setTimeout(() => {
    signal.removeEventListener("abort", onAbort);
    resolve();
  }, milliseconds);
  signal.addEventListener("abort", onAbort, { once: true });
});

function rateLimitDelay(response: Response, attempt: number): number {
  const header = response.headers.get("Retry-After");
  const seconds = header === null ? NaN : Number(header);
  const retryAt = Number.isFinite(seconds)
    ? Date.now() + Math.max(seconds * 1000, 0)
    : header && !Number.isNaN(Date.parse(header))
      ? Date.parse(header)
      : Date.now() + Math.min(1000 * 2 ** attempt, 30_000);

  const scheduledAt = Math.max(retryAt, nextRateLimitRetryAt);
  nextRateLimitRetryAt = scheduledAt + 1000;
  return Math.max(0, scheduledAt - Date.now());
}

async function getError(response: Response): Promise<ZplAiError> {
  try {
    const body = (await response.json()) as { message?: string };

    return new ZplAiError(
      body.message || `ZPL.AI request failed (${response.status})`,
      response.status
    );
  } catch {
    return new ZplAiError(`ZPL.AI request failed (${response.status})`, response.status);
  }
}

async function render(
  path: string,
  apiKey: string,
  request: RenderRequest | { type: BarcodeType; data: string },
  signal: AbortSignal
): Promise<Blob> {
  const body = JSON.stringify(request);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "image/png"
  };

  let response: Response;

  for (let attempt = 0; ; attempt += 1) {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      signal,
      cache: "no-store",
      headers,
      body
    });

    if (response.status === 429 && attempt < 10) {
      await delay(rateLimitDelay(response, attempt), signal);
      continue;
    }

    if (RETRYABLE.has(response.status) && attempt < 2) {
      await delay(250 * 2 ** attempt, signal);
      continue;
    }

    break;
  }

  if (!response.ok) throw await getError(response);
  const contentType = response.headers.get("Content-Type");
  if (contentType && !contentType.toLowerCase().startsWith("image/png")) {
    throw new ZplAiError("ZPL.AI returned a non-PNG response");
  }

  return response.blob();
}

export function renderBarcode(
  apiKey: string,
  request: { type: BarcodeType; data: string },
  signal: AbortSignal
): Promise<Blob> {
  return render("/public/barcode/img", apiKey, request, signal);
}

export function renderZpl(apiKey: string, zpl: string, signal: AbortSignal): Promise<Blob> {
  return render("/public/zpl/img", apiKey, { ...RENDER_SETTINGS, zpl, parameters: {} }, signal);
}
