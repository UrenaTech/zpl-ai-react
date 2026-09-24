import { provideZonelessChangeDetection, Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZplBarcode, type BarcodeType } from "../src/public-api";

@Component({
  standalone: true,
  imports: [ZplBarcode],
  template: `<zpl-barcode [apiKey]="apiKey()" [type]="type()" [value]="value()" />`
})
class Host {
  apiKey = signal("zpk_test");
  type = signal<BarcodeType>("code128");
  value = signal("ORDER^XZ~10452");
}

const png = () => new Response("png", {
  headers: { "Content-Type": "image/png" }
});

async function mount() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

async function expectImage(fixture: { detectChanges(): void; nativeElement: HTMLElement }) {
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("img")).not.toBeNull();
  });
  return fixture.nativeElement.querySelector("img")!;
}

describe("ZplBarcode", () => {
  beforeEach(() => {
    const RealURL = URL;
    vi.stubGlobal("URL", class extends RealURL {
      static createObjectURL = vi.fn(() => "blob:barcode");
      static revokeObjectURL = vi.fn();
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it("shows loading, sends unchanged data with authorization, and displays the original PNG", async () => {
    let resolve!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount();

    expect(fixture.nativeElement.querySelector('[aria-label="Generating label"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe("/api/public/barcode/img");
    expect(options.headers.Authorization).toBe("Bearer zpk_test");
    expect(JSON.parse(options.body)).toEqual({ type: "code128", data: "ORDER^XZ~10452" });

    resolve(png());
    const image = await expectImage(fixture);
    expect(image.alt).toBe("code128 barcode for ORDER^XZ~10452");
    expect(image.src).toBe("blob:barcode");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: "image/png", size: 3 }));
  });

  it("validates blank data and the 4096 character boundary without changing the data", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => png());
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount();
    await expectImage(fixture);

    fixture.componentInstance.value.set(" \t ");
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toBe("value is required");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fixture.componentInstance.value.set("a".repeat(4096));
    fixture.detectChanges();
    await expectImage(fixture);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).data).toBe("a".repeat(4096));

    fixture.componentInstance.value.set("a".repeat(4097));
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
        .toBe("value must be at most 4096 characters");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aborts stale requests and revokes URLs when inputs change or the component is destroyed", async () => {
    let resolve!: (response: Response) => void;
    const fetchMock = vi.fn()
      .mockReturnValueOnce(new Promise<Response>((done) => { resolve = done; }))
      .mockImplementation(async () => png());
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount();
    const oldSignal: AbortSignal = fetchMock.mock.calls[0][1].signal;

    fixture.componentInstance.value.set("new");
    fixture.detectChanges();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(oldSignal.aborted).toBe(true);
    await expectImage(fixture);
    resolve(png());
    await Promise.resolve();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    fixture.componentInstance.type.set("qr");
    fixture.detectChanges();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:barcode");
    await expectImage(fixture);
    fixture.destroy();
    expect(fetchMock.mock.calls[2][1].signal.aborted).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("displays the API's symbology error as an alert", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(
      JSON.stringify({ message: "EAN-13 must contain 12 or 13 digits" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount();
    fixture.componentInstance.type.set("ean13");
    fixture.componentInstance.value.set("bad");
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
        .toBe("EAN-13 must contain 12 or 13 digits");
    });
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body))
      .toEqual({ type: "ean13", data: "bad" });
  });
});
