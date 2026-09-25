import type { BarcodeType } from "@urenatech/zpl-core";

export interface BarcodeProps {
  apiKey: string;
  type: BarcodeType;
  value: string;
}

export interface ZplLabelProps {
  apiKey: string;
  zpl: string;
  alt?: string;
}
