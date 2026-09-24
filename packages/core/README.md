# @urenatech/zpl-core

Shared ZPL.AI barcode and ZPL rendering runtime for browsers and Node.js 18+. React and Angular packages use this package for requests, retries, errors, barcode types, and PNG cropping.

## Install

```bash
npm install @urenatech/zpl-core
```

## Usage

```ts
import {
  cropPng,
  isBarcodeType,
  renderBarcode,
  renderZpl,
  SUPPORTED_BARCODE_TYPES,
  ZplAiError
} from "@urenatech/zpl-core";
import type { BarcodeType } from "@urenatech/zpl-core";

const controller = new AbortController();
const type: BarcodeType = "code128";
const barcode = await renderBarcode("zpk_xxxxx", { type, data: "ORDER-10452" }, controller.signal);
const label = await renderZpl("zpk_xxxxx", "^XA^FO20,20^FDHello^FS^XZ", controller.signal);
const croppedLabel = await cropPng(label);
```

`renderBarcode` sends `{ type, data }` to `POST https://app.zpl.ai/api/public/barcode/img` and returns the original PNG, including any API-provided footer and whitespace. `renderZpl` sends ZPL to `POST https://app.zpl.ai/api/public/zpl/img` with 4 × 2 inch dimensions, 8 dpmm, a white background, and empty parameters. Use `cropPng` when you want to crop a PNG label to its non-white content; it accepts and returns a `Blob` in both browsers and Node.js 18+, without Canvas or DOM APIs. Blank and already tightly cropped images are returned unchanged. Both request functions require an `AbortSignal` and use `fetch` with `cache: "no-store"`.

Use `SUPPORTED_BARCODE_TYPES` for the public API's available types and `isBarcodeType(value)` to narrow a dynamic string to `BarcodeType`. Non-successful responses throw `ZplAiError` with the API's error message and HTTP `status` where available. HTTP 429 retries respect `Retry-After` and stagger concurrent retries (up to ten attempts); HTTP 500, 502, 503, and 504 retry up to twice. Aborting a pending request or retry cancels it.

This client requires the ZPL.AI public endpoints. Browser requests also require CORS access from your origin. Browser API keys are visible to users: never put a secret key in client-side code or a public environment variable. Generate API keys in [ZPL.AI settings](https://app.zpl.ai/settings/apikeys).

## Development

Run `npm run check --workspace @urenatech/zpl-core` after installing repository dependencies. The package builds ESM, CommonJS, and TypeScript declarations.

## License

MIT License. Copyright © 2026 UrenaTech LLC. See `LICENSE`.
