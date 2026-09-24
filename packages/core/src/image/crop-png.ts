import { ZplAiError } from "../errors";

const WHITE_THRESHOLD = 250;

function hasInk(data: Uint8ClampedArray, index: number): boolean {
  const alpha = data[index + 3];
  return alpha > 0 && (
    data[index] < WHITE_THRESHOLD ||
    data[index + 1] < WHITE_THRESHOLD ||
    data[index + 2] < WHITE_THRESHOLD
  );
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ZplAiError("The browser could not crop the PNG"));
    }, "image/png");
  });
}

export async function cropPng(blob: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function") {
    throw new ZplAiError("This browser does not support PNG cropping");
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const source = document.createElement("canvas");
    source.width = bitmap.width;
    source.height = bitmap.height;
    const context = source.getContext("2d", { willReadFrequently: true });
    if (!context) throw new ZplAiError("The browser could not inspect the PNG");
    context.drawImage(bitmap, 0, 0);

    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let left = bitmap.width;
    let top = bitmap.height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < bitmap.height; y += 1) {
      for (let x = 0; x < bitmap.width; x += 1) {
        if (!hasInk(pixels, (y * bitmap.width + x) * 4)) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }

    if (right < left || bottom < top) return blob;

    const width = right - left + 1;
    const height = bottom - top + 1;
    if (left === 0 && top === 0 && width === bitmap.width && height === bitmap.height) return blob;

    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const outputContext = output.getContext("2d");
    if (!outputContext) throw new ZplAiError("The browser could not crop the PNG");
    outputContext.drawImage(source, left, top, width, height, 0, 0, width, height);

    return await canvasToPng(output);
  } finally {
    bitmap.close();
  }
}
