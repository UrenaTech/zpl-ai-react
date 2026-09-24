import type { BarcodeType } from "../types";

export const SUPPORTED_BARCODE_TYPES = [
  "code128", "upca", "upce", "upc-extension", "ean13", "ean8",
  "interleaved2of5", "industrial2of5", "code11", "msi",
  "code39", "logmars", "codabar", "code93", "data-matrix",
  "pdf417", "aztec", "maxicode", "qr"
] as const satisfies readonly BarcodeType[];

const typeSet: ReadonlySet<string> = new Set(SUPPORTED_BARCODE_TYPES);

export function isBarcodeType(value: string): value is BarcodeType {
    return typeSet.has(value);
}
