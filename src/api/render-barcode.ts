import { API_URL, RENDER_SETTINGS } from "../config";
import { ZplAiError } from "../errors";
import type { BarcodeType, RenderRequest } from "../types";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const delay = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const id = setTimeout(resolve, milliseconds);

  signal.addEventListener("abort", () => {
    clearTimeout(id);
    reject(new DOMException("Aborted", "AbortError"));
  }, { once: true });
});

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

  let response: Response | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      signal,
      cache: "no-store",
      headers,
      body
    });

    if (response.ok || !RETRYABLE.has(response.status) || attempt === 2) break;

    const retryAfter = Number(response.headers.get("Retry-After"));
    await delay(
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 250 * 2 ** attempt,
      signal
    );
  }

  if (!response) throw new ZplAiError("ZPL.AI did not return a response");
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
