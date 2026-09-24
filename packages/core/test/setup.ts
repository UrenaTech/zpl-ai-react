import { vi } from "vitest";

Object.defineProperty(globalThis, "createImageBitmap", {
  configurable: true,
  writable: true,
  value: vi.fn(async () => ({ width: 1, height: 1, close: vi.fn() }))
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) }))
  }))
});

Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
  configurable: true,
  value: vi.fn((callback: BlobCallback) => callback(new Blob(["cropped"], { type: "image/png" })))
});
