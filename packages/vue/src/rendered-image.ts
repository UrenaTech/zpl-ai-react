import { onMounted, shallowRef, watch, type Ref } from "vue";
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

export type ImageState =
  | { status: "loading" }
  | { status: "ready"; src: string }
  | { status: "error"; message: string };

export function useRenderedImage(request: () => ImageRequest): Ref<ImageState> {
  const state = shallowRef<ImageState>({ status: "loading" });
  const mounted = shallowRef(false);
  onMounted(() => { mounted.value = true; });

  // Watch in setup so Vue stops the request and revokes its URL on unmount.
  watch(() => mounted.value ? request() : null, (current, _previous, onCleanup) => {
    if (!current) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;

    onCleanup(() => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    state.value = { status: "loading" };
    // onMounted is not called during server rendering, even if window exists.

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
        state.value = { status: "ready", src: objectUrl };
      } catch (error) {
        if (controller.signal.aborted) return;
        state.value = {
          status: "error",
          message: error instanceof Error ? error.message : "Unable to generate label"
        };
      }
    })();
  }, { immediate: true });

  return state;
}
