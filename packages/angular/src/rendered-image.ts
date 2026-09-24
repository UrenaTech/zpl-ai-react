import { isPlatformBrowser } from "@angular/common";
import { effect, inject, PLATFORM_ID, signal } from "@angular/core";
import {
  cropPng,
  renderBarcode,
  renderZpl,
  ZplAiError,
  type BarcodeType
} from "@urenatech/zpl-core";

type ImageRequest =
  | { kind: "barcode"; apiKey: string; type: BarcodeType; value: string }
  | { kind: "label"; apiKey: string; zpl: string };

type ImageState =
  | { status: "loading" }
  | { status: "ready"; src: string }
  | { status: "error"; message: string };

export abstract class RenderedImage {
  protected readonly state = signal<ImageState>({ status: "loading" });
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected watch(request: () => ImageRequest): void {
    effect((onCleanup) => {
      const current = request();
      const controller = new AbortController();
      let objectUrl: string | undefined;

      onCleanup(() => {
        controller.abort();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });

      this.state.set({ status: "loading" });
      if (!this.browser) return;

      void (async () => {
        try {
          if (!current.apiKey.trim()) throw new ZplAiError("apiKey is required");

          let image: Blob;
          if (current.kind === "barcode") {
            if (!current.value.trim()) throw new ZplAiError("value is required");
            if (current.value.length > 4096) {
              throw new ZplAiError("value must be at most 4096 characters");
            }
            image = await renderBarcode(
              current.apiKey,
              { type: current.type, data: current.value },
              controller.signal
            );
          } else {
            if (!current.zpl.trim()) throw new ZplAiError("zpl is required");
            image = await renderZpl(current.apiKey, current.zpl, controller.signal);
            if (controller.signal.aborted) return;
            image = await cropPng(image);
          }

          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(image);
          this.state.set({ status: "ready", src: objectUrl });
        } catch (error) {
          if (controller.signal.aborted) return;
          this.state.set({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to generate label"
          });
        }
      })();
    });
  }
}
