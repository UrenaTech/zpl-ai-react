"use client";

import { useEffect, useState } from "react";
import { renderBarcode, renderZpl } from "../api/render-barcode";
import { ZplAiError } from "../errors";
import { cropPng } from "../image/crop-png";
import type { BarcodeType } from "../types";

type State =
  | { status: "loading" }
  | { status: "ready"; src: string }
  | { status: "error"; message: string };

type RenderedZplImageProps = { apiKey: string; alt: string } & (
  | { zpl: string; barcode?: never }
  | { barcode: { type: BarcodeType; data: string }; zpl?: never }
);

export function RenderedZplImage({ apiKey, zpl, barcode, alt }: RenderedZplImageProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;

    setState({ status: "loading" });

    void (async () => {
      try {
        if (!apiKey.trim()) throw new ZplAiError("apiKey is required");
        if (barcode ? !barcode.data.trim() : !zpl?.trim()) {
          throw new ZplAiError(barcode ? "value is required" : "zpl is required");
        }

        const rendered = barcode
          ? await renderBarcode(apiKey, barcode, controller.signal)
          : await renderZpl(apiKey, zpl!, controller.signal);

        if (controller.signal.aborted) return;

        const image = barcode ? rendered : await cropPng(rendered);
        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(image);

        setState({ status: "ready", src: objectUrl });
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to generate label"
        });
      }
    })();

    return () => {
      controller.abort();

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiKey, zpl, barcode?.type, barcode?.data]);

  if (state.status === "loading") {
    return <span aria-label="Generating label">Generating label…</span>;
  }

  if (state.status === "error") return <span role="alert">{state.message}</span>;

  return <img src={state.src} alt={alt} />;
}
