import { Blob as NodeBlob } from "node:buffer";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZplLabel } from "../src/components/ZplLabel";

describe("ZplLabel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders arbitrary ZPL through the public ZPL endpoint", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAD0lEQVR4XmP4DwQMDAz/ARruBPyTIPhpAAAAAElFTkSuQmCC",
      "base64"
    );
    const fetchMock = vi.fn().mockResolvedValue(new Response(png, {
      status: 200,
      headers: { "Content-Type": "image/png" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ZplLabel apiKey="zpk_test" zpl="^XA^FO20,20^FDHello^FS^XZ" alt="Shipping label" />);

    await waitFor(() => expect(screen.getByAltText("Shipping label")).toBeTruthy());
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe("/api/public/zpl/img");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).zpl).toContain("^FDHello");
  });

  it("does not request an empty label", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ZplLabel apiKey="zpk_test" zpl=" " />);

    expect((await screen.findByRole("alert")).textContent).toContain("zpl is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
