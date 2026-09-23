# Barcode reference

`Barcode` sends `{ type, data: value }` to the [ZPL.AI public barcode endpoint](https://app.zpl.ai/api/scalar/). The API chooses the default size, interpretation line, resolution, and symbology settings; it validates symbology-specific data. The React component requires a nonblank `value` of at most 4096 characters. For custom ZPL or other render settings, use `ZplLabel` with trusted ZPL instead.

```tsx
import { Barcode } from "@zpl-ai/react";
const apiKey = "zpk_xxxxx";
```

## Matrix and stacked

| Type | Example |
| --- | --- |
| `aztec` | `<Barcode apiKey={apiKey} type="aztec" value="ORDER-10452" />` |
| `data-matrix` | `<Barcode apiKey={apiKey} type="data-matrix" value="ITEM-1001" />` |
| `maxicode` | `<Barcode apiKey={apiKey} type="maxicode" value="MAXICODE TEST 123" />` |
| `pdf417` | `<Barcode apiKey={apiKey} type="pdf417" value="SHIPPING DOCUMENT 10452" />` |
| `qr` | `<Barcode apiKey={apiKey} type="qr" value="https://zpl.ai" />` |

## Linear

| Type | Example |
| --- | --- |
| `codabar` | `<Barcode apiKey={apiKey} type="codabar" value="123456" />` |
| `code11` | `<Barcode apiKey={apiKey} type="code11" value="12345-67" />` |
| `code128` | `<Barcode apiKey={apiKey} type="code128" value="ORDER-10452" />` |
| `code39` | `<Barcode apiKey={apiKey} type="code39" value="PART-10452" />` |
| `code93` | `<Barcode apiKey={apiKey} type="code93" value="ORDER-10452" />` |
| `ean13` | `<Barcode apiKey={apiKey} type="ean13" value="5901234123457" />` |
| `ean8` | `<Barcode apiKey={apiKey} type="ean8" value="96385074" />` |
| `industrial2of5` | `<Barcode apiKey={apiKey} type="industrial2of5" value="12345" />` |
| `interleaved2of5` | `<Barcode apiKey={apiKey} type="interleaved2of5" value="123456" />` |
| `logmars` | `<Barcode apiKey={apiKey} type="logmars" value="LOGMARS" />` |
| `msi` | `<Barcode apiKey={apiKey} type="msi" value="123456" />` |
| `upca` | `<Barcode apiKey={apiKey} type="upca" value="036000291452" />` |
| `upce` | `<Barcode apiKey={apiKey} type="upce" value="01234565" />` |
| `upc-extension` | `<Barcode apiKey={apiKey} type="upc-extension" value="12345" />` |

Values and spellings reflect the public API's barcode discriminator. `ZplLabel` remains available for trusted ZPL outside this list. Barcode PNGs are displayed unchanged, including any free-tier footer and whitespace; the API marks barcode responses `Cache-Control: no-store`.
