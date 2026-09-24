export type BarcodeType =
  | "code128" | "upca" | "upce" | "upc-extension" | "ean13" | "ean8"
  | "interleaved2of5" | "industrial2of5" | "code11" | "msi"
  | "code39" | "logmars" | "codabar" | "code93" | "data-matrix"
  | "pdf417" | "aztec" | "maxicode" | "qr";

export interface RenderRequest {
  zpl: string; widthIn: number; heightIn: number; dpmm: number;
  backgroundColor: string; parameters: Record<string, string>;
}
