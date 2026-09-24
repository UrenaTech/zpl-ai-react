"use client";

import type { BarcodeProps } from "../types";
import { RenderedZplImage } from "./RenderedZplImage";

export function Barcode({ apiKey, type, value }: BarcodeProps) {
  if (!value.trim()) return <span role="alert">value is required</span>;

  if (value.length > 4096) {
    return <span role="alert">value must be at most 4096 characters</span>;
  }

  return (
    <RenderedZplImage
      apiKey={apiKey}
      barcode={{ type, data: value }}
      alt={`${type} barcode for ${value}`}
    />
  );
}
