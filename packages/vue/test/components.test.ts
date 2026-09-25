import { Blob as NodeBlob } from "node:buffer";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Barcode, ZplLabel } from "../src";

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAD0lEQVR4XmP4DwQMDAz/ARruBPyTIPhpAAAAAElFTkSuQmCC",
  "base64"
);
const png = () => new Response(pngBytes, {
  status: 200,
  headers: { "Content-Type": "image/png" }
});

async function settle() {
  await flushPromises();
  await nextTick();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("Vue image components", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts unchanged barcode data and displays the original PNG", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    const fetchMock = vi.fn().mockResolvedValue(png());
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(Barcode, {
      props: { apiKey: "zpk_test", type: "code128", value: "ORDER^XZ~10452" }
    });
    expect(wrapper.get("span").attributes("aria-label")).toBe("Generating label");
    await settle();

    expect(wrapper.get("img").attributes("alt")).toBe("code128 barcode for ORDER^XZ~10452");
    expect(wrapper.get("img").attributes("src")).toBe("blob:label");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe("/api/public/barcode/img");
    expect(options.headers.Authorization).toBe("Bearer zpk_test");
    expect(JSON.parse(options.body)).toEqual({ type: "code128", data: "ORDER^XZ~10452" });
    const rendered = vi.mocked(URL.createObjectURL).mock.calls[0][0];
    if (!("arrayBuffer" in rendered)) throw new Error("Expected a readable PNG");
    expect(new Uint8Array(await rendered.arrayBuffer())).toEqual(new Uint8Array(pngBytes));
    wrapper.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:label");
  });

  it.each([
    [{ apiKey: " ", type: "qr", value: "abc" }, "apiKey is required"],
    [{ apiKey: "zpk_test", type: "qr", value: "  " }, "value is required"],
    [{ apiKey: "zpk_test", type: "qr", value: "x".repeat(4097) }, "value must be at most 4096 characters"]
  ] as const)("rejects invalid barcode props without a request", async (props, message) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(Barcode, { props: { ...props } });
    await settle();
    expect(wrapper.get('[role="alert"]').text()).toBe(message);
    expect(fetchMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("shows API errors and recovers when the key changes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Invalid barcode content" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }))
      .mockResolvedValueOnce(png());
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(Barcode, {
      props: { apiKey: "zpk_old", type: "qr", value: "abc" }
    });
    await settle();
    expect(wrapper.get('[role="alert"]').text()).toBe("Invalid barcode content");

    await wrapper.setProps({ apiKey: "zpk_new" });
    await settle();
    expect(wrapper.get("img").attributes("alt")).toBe("qr barcode for abc");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer zpk_new");
    wrapper.unmount();
  });

  it("aborts a changed value, ignores a late response and revokes the previous URL", async () => {
    const late = deferred<Response>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(png())
      .mockImplementationOnce(() => late.promise)
      .mockResolvedValueOnce(png());
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(Barcode, {
      props: { apiKey: "zpk_test", type: "qr", value: "first" }
    });
    await settle();
    expect(wrapper.get("img").attributes("alt")).toBe("qr barcode for first");

    await wrapper.setProps({ value: "stale" });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:label");
    expect(wrapper.get("span").attributes("aria-label")).toBe("Generating label");
    const staleSignal: AbortSignal = fetchMock.mock.calls[1][1].signal;
    await wrapper.setProps({ value: "current" });
    await settle();
    expect(staleSignal.aborted).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).data).toBe("current");
    expect(wrapper.get("img").attributes("alt")).toBe("qr barcode for current");

    late.resolve(png());
    await settle();
    expect(wrapper.get("img").attributes("alt")).toBe("qr barcode for current");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("crops labels, updates alt without a new request, and ignores a late result after unmount", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    const pending = deferred<Response>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(pngBytes, {
        headers: { "Content-Type": "image/png" }
      }))
      .mockImplementationOnce(() => pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(ZplLabel, {
      props: { apiKey: "zpk_test", zpl: "^XA^FDlabel^FS^XZ" }
    });
    await settle();
    expect(wrapper.get("img").attributes("alt")).toBe("ZPL label");
    const rendered = vi.mocked(URL.createObjectURL).mock.calls[0][0];
    expect(rendered).toBeInstanceOf(Blob);
    if (!(rendered instanceof Blob)) throw new Error("Expected a PNG blob");
    const bytes = new DataView(await rendered.arrayBuffer());
    expect([bytes.getUint32(16), bytes.getUint32(20)]).toEqual([1, 1]);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe("/api/public/zpl/img");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).zpl).toBe("^XA^FDlabel^FS^XZ");

    await wrapper.setProps({ alt: "Shipping label" });
    expect(wrapper.get("img").attributes("alt")).toBe("Shipping label");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ zpl: "^XA^FDchanged^FS^XZ" });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:label");
    const signal: AbortSignal = fetchMock.mock.calls[1][1].signal;
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
    pending.resolve(new Response(pngBytes, { headers: { "Content-Type": "image/png" } }));
    await settle();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("rejects blank keys and ZPL without posting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(ZplLabel, { props: { apiKey: " ", zpl: "^XA^XZ" } });
    await settle();
    expect(wrapper.get('[role="alert"]').text()).toBe("apiKey is required");
    await wrapper.setProps({ apiKey: "zpk_test", zpl: " " });
    await settle();
    expect(wrapper.get('[role="alert"]').text()).toBe("zpl is required");
    expect(fetchMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
