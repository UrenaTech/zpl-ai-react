import { Blob as NodeBlob } from "node:buffer";
import { Component, PLATFORM_ID, provideZonelessChangeDetection, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZplLabel } from "../src/public-api";

@Component({
  standalone: true,
  imports: [ZplLabel],
  template: `<zpl-label [apiKey]="apiKey()" [zpl]="zpl()" [alt]="alt()" />`
})
class Host {
  apiKey = signal("zpk_test");
  zpl = signal("^XA^FO20,20^FDHello^FS^XZ");
  alt = signal("Shipping label");
}

@Component({
  standalone: true,
  imports: [ZplLabel],
  template: `<zpl-label [apiKey]="apiKey()" [zpl]="zpl()" />`
})
class DefaultAltHost {
  apiKey = signal("zpk_test");
  zpl = signal("^XA^XZ");
}

@Component({
  standalone: true,
  imports: [ZplLabel],
  template: `<zpl-label [apiKey]="apiKey()" [zpl]="zpl()" />`
})
class BlankHost {
  apiKey = signal("zpk_test");
  zpl = signal("   ");
}

const png = () => new Response(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAD0lEQVR4XmP4DwQMDAz/ARruBPyTIPhpAAAAAElFTkSuQmCC",
  "base64"
), { headers: { "Content-Type": "image/png" } });

async function mount<T>(component: new () => T, server = false) {
  TestBed.configureTestingModule({ providers: [
    provideZonelessChangeDetection(),
    ...(server ? [{ provide: PLATFORM_ID, useValue: "server" }] : [])
  ] });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

async function image(fixture: { detectChanges(): void; nativeElement: HTMLElement }) {
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("img")).not.toBeNull();
  });
  return fixture.nativeElement.querySelector("img")!;
}

describe("ZplLabel", () => {
  beforeEach(() => {
    const RealURL = URL;
    vi.stubGlobal("URL", class extends RealURL {
      static createObjectURL = vi.fn(() => "blob:label");
      static revokeObjectURL = vi.fn();
    });
    vi.stubGlobal("Blob", NodeBlob);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it("sends ZPL unchanged, crops the PNG, updates alt without another request, and cleans up", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => png());
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount(Host);
    expect((await image(fixture)).alt).toBe("Shipping label");
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe("/api/public/zpl/img");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer zpk_test");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      zpl: "^XA^FO20,20^FDHello^FS^XZ",
      widthIn: 4,
      heightIn: 2,
      dpmm: 8,
      backgroundColor: "#FFFFFF"
    });
    const cropped = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(cropped.type).toBe("image/png");
    const imageHeader = new DataView(await cropped.arrayBuffer());
    expect([imageHeader.getUint32(16), imageHeader.getUint32(20)]).toEqual([1, 1]);

    fixture.componentInstance.alt.set("Updated description");
    fixture.detectChanges();
    expect((await image(fixture)).alt).toBe("Updated description");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:label");
  });

  it("uses the default alt and reports invalid PNGs", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => png());
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount(DefaultAltHost);
    expect((await image(fixture)).alt).toBe("ZPL label");
    fixture.destroy();

    TestBed.resetTestingModule();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not a png", {
      headers: { "Content-Type": "image/png" }
    })));
    const failed = await mount(DefaultAltHost);
    await vi.waitFor(() => {
      failed.detectChanges();
      expect(failed.nativeElement.querySelector('[role="alert"]')?.textContent)
        .toMatch(/PNG/i);
    });
    expect(failed.nativeElement.querySelector("img")).toBeNull();
  });

  it("does not fetch blank ZPL and avoids browser APIs during server rendering", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const fixture = await mount(BlankHost);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
        .toBe("zpl is required");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    fixture.destroy();

    TestBed.resetTestingModule();
    const server = await mount(DefaultAltHost, true);
    expect(server.nativeElement.querySelector('[aria-label="Generating label"]')).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
