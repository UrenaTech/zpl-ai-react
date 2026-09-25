# @urenatech/zpl-vue

Render barcodes and ZPL labels as PNG images from the ZPL.AI API in Vue 3.

## Install

```bash
npm install @urenatech/zpl-vue
```

Vue `^3.5.0` is a peer dependency. `@urenatech/zpl-core` is a runtime dependency providing API requests, retries, barcode types, errors, and PNG cropping.

## Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Barcode, ZplLabel, type BarcodeType } from "@urenatech/zpl-vue";

const apiKey = import.meta.env.VITE_ZPL_AI_KEY;
const value = ref("ORDER-10452");
const type: BarcodeType = "code128";
const zpl = `^XA
^PW812
^LL406
^FO40,30^A0N,36,36^FDOrder 10452^FS
^XZ`;
</script>

<template>
  <Barcode :api-key="apiKey" :type="type" :value="value" />
  <ZplLabel :api-key="apiKey" :zpl="zpl" alt="Order 10452 label" />
</template>
```

### Barcode

| Prop | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | Required API key sent as a Bearer token. |
| `type` | `BarcodeType` | Required supported barcode discriminator. |
| `value` | `string` | Required barcode data, posted unchanged as `data`. |

`Barcode` calls `POST https://app.zpl.ai/api/public/barcode/img` with `{ type, data: value }`, displays the original PNG without cropping, and uses `alt="<type> barcode for <value>"`. Blank keys or values and values longer than 4096 characters display errors without a request. The API validates type-specific data; its error message is displayed. Barcode PNGs on the free tier may have a black footer and randomized whitespace: do not remove either. The shared client requests barcode responses with `cache: "no-store"`.

`BarcodeType`, `SUPPORTED_BARCODE_TYPES`, and `isBarcodeType` are re-exported from `@urenatech/zpl-core` to handle dynamic type choices. Supported discriminators are `code128`, `upca`, `upce`, `upc-extension`, `ean13`, `ean8`, `interleaved2of5`, `industrial2of5`, `code11`, `msi`, `code39`, `logmars`, `codabar`, `code93`, `data-matrix`, `pdf417`, `aztec`, `maxicode`, and `qr`.

### ZplLabel

| Prop | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | Required API key sent as a Bearer token. |
| `zpl` | `string` | Required, unmodified ZPL source. |
| `alt` | `string` | Optional image description; defaults to `ZPL label`. |

`ZplLabel` calls `POST https://app.zpl.ai/api/public/zpl/img` with your ZPL and the core render settings (`widthIn: 4`, `heightIn: 2`, `dpmm: 8`, white background, empty parameters). Its PNG is cropped to non-white content in the browser. Blank keys or ZPL display errors without a request. Supply trusted or sanitized ZPL; retain quiet zones in the ZPL itself when scanning requires them.

## API access and security

The package follows the [ZPL.AI v1 API reference](https://app.zpl.ai/api/scalar/). The public endpoints on `app.zpl.ai` must be reachable with CORS enabled for your application's origin. Create a key in [ZPL.ai settings](https://app.zpl.ai/settings/apikeys); the API documents keys prefixed `zpk_`.

**A key used in browser Vue code is visible to every visitor.** Public environment variables such as `VITE_ZPL_AI_KEY` do not hide it. Never put a secret key into a client bundle; use a server-side integration instead if it must remain secret. Each image request includes `Authorization: Bearer <key>`.

## Runtime

On the server the components render a loading placeholder but make no requests. In the browser, prop changes start a new image request, abort the old one, and revoke its object URL. Requests are also aborted and URLs revoked on unmount; stale results cannot replace a newer image. An optional `alt` change only updates the image description. Loading is a span with `aria-label="Generating label"`; failures are a span with `role="alert"`. The shared client retries HTTP 429 up to ten times using `Retry-After` and concurrent staggering, and 500/502/503/504 up to twice.

## Development

From the repository root:

```bash
npm ci
npm run check
npm pack --workspace @urenatech/zpl-vue --dry-run
```

The package builds ESM, CommonJS, and TypeScript declarations.

## License

MIT License. Copyright © 2026 UrenaTech LLC. See `LICENSE`.
