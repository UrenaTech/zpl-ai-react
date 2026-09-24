"use client";

import { ZplLabelProps } from "../types";
import { RenderedZplImage } from "./RenderedZplImage";

export function ZplLabel({ apiKey, zpl, alt = "ZPL label" }: ZplLabelProps) {
  return <RenderedZplImage apiKey={apiKey} zpl={zpl} alt={alt} />;
}
