import { describe, expect, it, vi } from "vitest";
import { cropPng } from "../src/image/crop-png";

describe("PNG cropping", () => {
  it("crops to the exact non-white bounds", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 4, height: 3, close })));

    const sourceContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([
          255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
          255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255,
          255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
        ])
      }))
    };

    const outputContext = { drawImage: vi.fn() };
    const contexts = [sourceContext, outputContext];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => contexts.shift() as never);

    const result = await cropPng(new Blob(["png"], { type: "image/png" }));
    expect(result.type).toBe("image/png");
    expect(outputContext.drawImage).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement), 1, 1, 2, 1, 0, 0, 2, 1
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("returns a blank image unchanged", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 1, height: 1, close: vi.fn() })));

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) }))
    }) as never);
    const original = new Blob(["png"], { type: "image/png" });

    expect(await cropPng(original)).toBe(original);
  });
});
