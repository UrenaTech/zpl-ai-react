import { describe, expect, it } from "vitest";
import { isBarcodeType, SUPPORTED_BARCODE_TYPES } from "../src";

describe("supported type registry", () => {
  it("matches the public barcode image API discriminators", () => {
    expect([...SUPPORTED_BARCODE_TYPES].sort()).toEqual([
      "code128", "upca", "upce", "upc-extension",
      "ean13", "ean8", "interleaved2of5", "industrial2of5",
      "code11", "msi", "code39", "logmars",
      "codabar", "code93", "data-matrix", "pdf417",
      "aztec", "maxicode", "qr"
    ].sort());
  });

  it("narrows runtime strings and excludes retired native-ZPL variants", () => {
    expect(isBarcodeType("upc-extension")).toBe(true);
    expect(isBarcodeType("interleaved2of5")).toBe(true);
    expect(isBarcodeType("interleaved-2of5")).toBe(false);
    expect(isBarcodeType("itf14")).toBe(false);
  });
});
