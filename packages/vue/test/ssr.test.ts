// @vitest-environment node
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it, vi } from "vitest";
import { Barcode, ZplLabel } from "../src";

describe("server rendering", () => {
  it("renders loading placeholders without requesting or creating browser URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    try {
      const barcode = await renderToString(createSSRApp({
        render: () => h(Barcode, { apiKey: "zpk_test", type: "qr", value: "ORDER-1" })
      }));
      const label = await renderToString(createSSRApp({
        render: () => h(ZplLabel, { apiKey: "zpk_test", zpl: "^XA^XZ" })
      }));
      expect(barcode).toContain('aria-label="Generating label"');
      expect(label).toContain('aria-label="Generating label"');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
