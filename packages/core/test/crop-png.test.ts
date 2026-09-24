// @vitest-environment node
import { decode, encode } from "fast-png";
import { describe, expect, it } from "vitest";
import { cropPng } from "../src";

function png(image: Parameters<typeof encode>[0]): Blob {
  return new Blob([encode(image) as Uint8Array<ArrayBuffer>], { type: "image/png" });
}

describe("PNG cropping", () => {
  it("crops to the exact non-white bounds and returns decodable PNG pixels", async () => {
    const data = new Uint8Array(4 * 3 * 4);
    for (let i = 0; i < data.length; i += 4) data.set([255, 255, 255, 255], i);
    data.set([0, 0, 0, 255], (1 * 4 + 1) * 4);
    data.set([100, 30, 20, 255], (1 * 4 + 2) * 4);
    data.set([0, 0, 0, 0], (0 * 4 + 3) * 4);
    const source = png({ width: 4, height: 3, data });

    const result = await cropPng(source);
    const cropped = decode(await result.arrayBuffer());
    expect(result.type).toBe("image/png");
    expect([cropped.width, cropped.height]).toEqual([2, 1]);
    expect([...cropped.data]).toEqual([0, 0, 0, 255, 100, 30, 20, 255]);
  });

  it("returns blank and fully occupied images unchanged", async () => {
    const blank = png({
      width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255])
    });
    const full = png({
      width: 1, height: 1, data: new Uint8Array([0, 0, 0, 255])
    });

    expect(await cropPng(blank)).toBe(blank);
    expect(await cropPng(full)).toBe(full);
  });

  it("handles packed indexed PNG pixels across scanlines", async () => {
    const source = png({
      width: 3, height: 2, depth: 1, channels: 1,
      palette: [[255, 255, 255], [0, 0, 0]],
      data: new Uint8Array([0b01000000, 0b00000000])
    });

    const cropped = decode(await (await cropPng(source)).arrayBuffer());
    expect([cropped.width, cropped.height]).toEqual([1, 1]);
    expect([...cropped.data]).toEqual([0, 0, 0, 255]);
  });

  it("ignores transparent and near-white pixels", async () => {
    const source = png({
      width: 3, height: 1, data: new Uint8Array([
        0, 0, 0, 0, 250, 250, 250, 255, 249, 250, 250, 255
      ])
    });

    const cropped = decode(await (await cropPng(source)).arrayBuffer());
    expect([cropped.width, cropped.height]).toEqual([1, 1]);
    expect([...cropped.data]).toEqual([249, 250, 250, 255]);
  });
});
