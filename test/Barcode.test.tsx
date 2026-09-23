import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Barcode } from "../src/components/Barcode";

const png = () => new Response(new Blob(["png"]), {
  status: 200,
  headers: { "Content-Type": "image/png" }
});

describe("Barcode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends raw barcode data to the image endpoint and displays the PNG", async () => {
    const fetchMock = vi.fn().mockResolvedValue(png());
    vi.stubGlobal("fetch", fetchMock);

    render(<Barcode apiKey="zpk_test" type="code128" value="ORDER^XZ~10452" />);
    await waitFor(() => expect(screen.getByRole("img").getAttribute("src")).toBe("blob:barcode"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe("/api/public/barcode/img");
    expect(options.headers.Authorization).toBe("Bearer zpk_test");
    expect(JSON.parse(options.body)).toEqual({
      type: "code128",
      data: "ORDER^XZ~10452"
    });
  });

  it("sends newly supported API discriminators without native ZPL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(png());
    vi.stubGlobal("fetch", fetchMock);

    render(<Barcode apiKey="zpk_test" type="upc-extension" value="12345" />);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      type: "upc-extension",
      data: "12345"
    });
  });

  it("shows type-specific API errors instead of rejecting payloads locally", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: "EAN-13 must contain 12 or 13 digits" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    render(<Barcode apiKey="zpk_test" type="ean13" value="bad" />);

    expect((await screen.findByRole("alert")).textContent).toBe("EAN-13 must contain 12 or 13 digits");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      type: "ean13",
      data: "bad"
    });
  });

  it("rejects blank data before calling the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Barcode apiKey="zpk_test" type="qr" value={" \t "} />);

    expect(screen.getByRole("alert").textContent).toBe("value is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces the API maximum data length", async () => {
    const fetchMock = vi.fn().mockResolvedValue(png());
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<Barcode apiKey="zpk_test" type="qr" value={"a".repeat(4096)} />);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    view.rerender(<Barcode apiKey="zpk_test" type="qr" value={"a".repeat(4097)} />);
    expect(screen.getByRole("alert").textContent).toBe("value must be at most 4096 characters");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("regenerates after a value change", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => png());
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<Barcode apiKey="zpk_test" type="code128" value="ONE" />);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());

    view.rerender(<Barcode apiKey="zpk_test" type="code128" value="TWO" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      type: "code128",
      data: "TWO"
    });
  });

  it("abandons a stale response after a value change", async () => {
    let resolveFirst!: (response: Response) => void;
    const first = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(async () => png());
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(URL.createObjectURL).mockClear();

    const view = render(<Barcode apiKey="zpk_test" type="code128" value="OLD" />);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    view.rerender(<Barcode apiKey="zpk_test" type="code128" value="NEW" />);
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(png());
    });
    expect(screen.getByRole("img").getAttribute("alt")).toContain("NEW");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});
