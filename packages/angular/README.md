# @urenatech/zpl-angular

Standalone Angular 21 barcode and ZPL label components backed by the ZPL.AI API.

## Install

```bash
npm install @urenatech/zpl-angular
```

Angular 21 is required. `@angular/core` and `@angular/common` are peer dependencies; `@urenatech/zpl-core` is installed as a runtime dependency. Import standalone components directly:

```ts
import { Component } from "@angular/core";
import { ZplBarcode, ZplLabel, type BarcodeType } from "@urenatech/zpl-angular";

@Component({
  selector: "app-shipping",
  standalone: true,
  imports: [ZplBarcode, ZplLabel],
  template: `
    <zpl-barcode [apiKey]="apiKey" [type]="barcodeType" [value]="orderId" />
    <zpl-label [apiKey]="apiKey" [zpl]="shippingZpl" alt="Shipping label" />
  `
})
export class ShippingComponent {
  apiKey = "zpk_xxxxx";
  barcodeType: BarcodeType = "code128";
  orderId = "ORDER-10452";
  shippingZpl = "^XA^FO20,20^FDOrder 10452^FS^XZ";
}
```

`zpl-barcode` requires `apiKey: string`, `type: BarcodeType`, and `value: string`. It sends unchanged barcode data to `POST https://app.zpl.ai/api/public/barcode/img`; empty/whitespace-only values and values longer than 4096 characters show an alert instead of making a request. The API performs type-specific validation. Barcode PNGs are displayed without cropping (including any free-tier footer and whitespace). `SUPPORTED_BARCODE_TYPES` and `isBarcodeType` are exported for validating dynamic type choices.

`zpl-label` requires `apiKey: string` and `zpl: string`; `alt` is optional and defaults to `"ZPL label"`. It sends ZPL unchanged to `POST https://app.zpl.ai/api/public/zpl/img`, then crops the returned PNG to its non-white content in the browser. Use trusted or sanitized ZPL. If scanners require quiet zones, include them in the ZPL before cropping.

Both components show `aria-label="Generating label"` while loading, display the image with alt text when ready, and show API errors with `role="alert"`. Input changes abort old requests and revoke the previous image URL; destroying the component also cleans up. Server rendering does not perform a fetch or access browser image APIs; the client renders the image after hydration. Label cropping requires `createImageBitmap` and Canvas 2D in the browser. The API must allow CORS requests from your site's origin.

**Browser API keys are visible to every visitor.** Only pass keys intended for public browser use; never embed a secret key in Angular source or public environment configuration. Requests send `Authorization: Bearer <apiKey>`. Create a browser key in [ZPL.AI settings](https://app.zpl.ai/settings/apikeys).

## Development

From the repository root, run `npm ci` and `npm run check` to build the core before checking this package. The Angular build uses ng-packagr partial compilation and writes an Angular Package Format distributable to `packages/angular/dist`, including this README and the license. Publish from that `dist` directory, not from the workspace source.

## License

MIT License. Copyright © 2026 UrenaTech LLC. See `LICENSE`.
