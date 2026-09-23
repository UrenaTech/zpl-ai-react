# @zpl-ai/react

Render barcodes and ZPL labels as PNG images from the ZPL.AI API in React.

```tsx
import { Barcode } from "@zpl-ai/react";

<Barcode apiKey="zpk_xxxxx" type="code128" value="ORDER-10452" />
```

## Install

```bash
npm install @zpl-ai/react
```

React 18 and 19 are supported. The package is marked `"use client"` for Next.js App Router; React is a peer dependency.

## API compatibility

This client follows the [ZPL.AI v1 API reference](https://app.zpl.ai/api/scalar/) and sends requests to **`https://app.zpl.ai/api`**. Deployments using this package require the documented public endpoints on `app.zpl.ai` and CORS access from your application's origin.

Create an API key in [ZPL.ai settings](https://app.zpl.ai/settings/apikeys). The API documents the `zpk_...` prefix. Browser keys are visible to users: never put a secret key in React code or a public environment variable. Both components send `Authorization: Bearer <key>` with each request.

### Barcode

```tsx
<Barcode apiKey="zpk_xxxxx" type="qr" value="https://zpl.ai" />
```

| Property | Type | Meaning |
| --- | --- | --- |
| `apiKey` | `string` | API key sent as a Bearer token. |
| `type` | `BarcodeType` | API-supported barcode discriminator. |
| `value` | `string` | Barcode data sent unchanged as `data`. |

All three properties are required. `Barcode` calls `POST /public/barcode/img` with `{ type, data: value }` and uses the API's default render settings. The API performs symbology-specific validation; errors are displayed using its `message` field. The original PNG is displayed without cropping: free-tier responses can contain a black footer and randomized whitespace, which must not be removed. Barcode responses are requested with `cache: "no-store"` and are not cached by the library.

Supported types match the API's discriminator values:

| Linear | Matrix and stacked |
| --- | --- |
| `code128`, `upca`, `upce`, `upc-extension`, `ean13`, `ean8`, `interleaved2of5`, `industrial2of5`, `code11`, `msi`, `code39`, `logmars`, `codabar`, `code93` | `data-matrix`, `pdf417`, `aztec`, `maxicode`, `qr` |

See [barcode examples](docs/barcodes.md) for each type. `SUPPORTED_BARCODE_TYPES` and `isBarcodeType` are exported for dynamic inputs. Types outside the public barcode API can be rendered from trusted ZPL through `ZplLabel`, if supported by the ZPL renderer.

### ZplLabel

```tsx
import { ZplLabel } from "@zpl-ai/react";

const zpl = `^XA
^PW812
^LL406
^FO40,30^A0N,36,36^FDOrder 10452^FS
^XZ`;

<ZplLabel apiKey="zpk_xxxxx" zpl={zpl} alt="Order 10452 label" />
```

`ZplLabel` calls `POST /public/zpl/img` with the ZPL and required render settings: `widthIn: 4`, `heightIn: 2`, `dpmm: 8`, `backgroundColor: "#FFFFFF"`, and empty `parameters`. `alt` defaults to `"ZPL label"`. ZPL input is sent unchanged; use trusted or sanitized ZPL. The returned label PNG is cropped to its non-white content in the browser. Preserve quiet zones in the ZPL itself if scanners need them.

## Framework examples

Next.js client component:

```tsx
"use client";
import { Barcode } from "@zpl-ai/react";

export function OrderBarcode({ value }: { value: string }) {
  return <Barcode apiKey={process.env.NEXT_PUBLIC_ZPL_AI_KEY!} type="code128" value={value} />;
}
```

Vite:

```tsx
import { Barcode, ZplLabel } from "@zpl-ai/react";

export function Labels() {
  const apiKey = import.meta.env.VITE_ZPL_AI_KEY;
  return <>
    <Barcode apiKey={apiKey} type="data-matrix" value="ITEM-1001" />
    <ZplLabel apiKey={apiKey} zpl="^XA^FO20,20^FDHello^FS^XZ" />
  </>;
}
```

Public environment variables organize keys but do not hide them.

## Runtime

Prop changes request a new image; stale requests are aborted. HTTP `429`, `500`, `502`, `503`, and `504` are retried up to twice, respecting `Retry-After` when provided. Loading uses `aria-label="Generating label"`; errors use `role="alert"`. Object URLs are revoked on unmount or prop changes. ZPL cropping needs `createImageBitmap` and Canvas 2D; barcode images do not.

## Development

```bash
npm install
npm run check
npm pack
```

The package builds ESM, CommonJS, and TypeScript declarations.

## License

Proprietary and confidential. Copyright © 2026 UrenaTech LLC. See `LICENSE`.
