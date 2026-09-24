import { decode, encode, type DecodedPng } from "fast-png";

const WHITE_THRESHOLD = 250;

function pixel(image: DecodedPng, x: number, y: number): number {
  const { data, depth, channels, palette, transparency, width } = image;
  const offset = (y * width + x) * channels;
  let value: number;

  if (depth < 8) {
    const rowBytes = Math.ceil(width * depth / 8);
    const bit = x * depth;
    value = (data[y * rowBytes + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
  } else {
    value = data[offset];
  }

  let red: number;
  let green: number;
  let blue: number;
  let alpha = depth === 16 ? 65535 : 255;

  if (palette) {
    const color = palette[value];
    if (!color) throw new Error("Invalid PNG palette index");
    [red, green, blue] = color;
    alpha = color[3] ?? 255;
  } else if (channels <= 2) {
    red = green = blue = depth < 8 ? Math.round(value * 255 / ((1 << depth) - 1)) : value;
    if (channels === 2) alpha = data[offset + 1];
    else if (transparency?.[0] === value) alpha = 0;
  } else {
    red = value;
    green = data[offset + 1];
    blue = data[offset + 2];
    if (channels === 4) alpha = data[offset + 3];
    else if (transparency && transparency[0] === red &&
      transparency[1] === green && transparency[2] === blue) alpha = 0;
  }

  if (depth === 16 && !palette) {
    red >>= 8;
    green >>= 8;
    blue >>= 8;
    alpha >>= 8;
  }
  return (alpha << 24) | (blue << 16) | (green << 8) | red;
}

export async function cropPng(blob: Blob): Promise<Blob> {
  const image = decode(await blob.arrayBuffer());
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const color = pixel(image, x, y);
      if ((color >>> 24) === 0 ||
        ((color & 255) >= WHITE_THRESHOLD &&
          ((color >>> 8) & 255) >= WHITE_THRESHOLD &&
          ((color >>> 16) & 255) >= WHITE_THRESHOLD)) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return blob;

  const width = right - left + 1;
  const height = bottom - top + 1;
  if (left === 0 && top === 0 && width === image.width && height === image.height) return blob;

  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = pixel(image, left + x, top + y);
      const offset = (y * width + x) * 4;
      data[offset] = color & 255;
      data[offset + 1] = (color >>> 8) & 255;
      data[offset + 2] = (color >>> 16) & 255;
      data[offset + 3] = color >>> 24;
    }
  }
  return new Blob([encode({ width, height, data, channels: 4 }) as Uint8Array<ArrayBuffer>], { type: "image/png" });
}
