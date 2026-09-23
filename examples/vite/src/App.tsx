import { useState } from "react";
import { Barcode, isBarcodeType, SUPPORTED_BARCODE_TYPES, ZplLabel, type BarcodeType } from "@zpl-ai/react";

const sampleValues: Record<BarcodeType, string> = {
  code128: "ORDER-10452",
  upca: "036000291452",
  upce: "01234565",
  "upc-extension": "12345",
  ean13: "5901234123457",
  ean8: "96385074",
  interleaved2of5: "123456",
  industrial2of5: "12345",
  code11: "12345-67",
  msi: "123456",
  code39: "PART-10452",
  logmars: "LOGMARS",
  codabar: "123456",
  code93: "ORDER-10452",
  "data-matrix": "ITEM-1001",
  pdf417: "SHIPPING DOCUMENT 10452",
  aztec: "ORDER-10452",
  maxicode: "MAXICODE TEST 123",
  qr: "https://zpl.ai"
};

const shippingLabel = `^XA
^PW812
^LL406
^FO24,20^GB764,360,2^FS
^FO45,40^A0N,32,32^FDZPL.AI SHIPPING^FS
^FO45,85^A0N,22,22^FDOrder #10452^FS
^FO45,120^A0N,22,22^FDItem: Widget A x 2^FS
^FO45,160^GB720,0,2^FS
^FO45,185^A0N,20,20^FDTracking^FS
^FO45,215^BY2,2,65^BCN,65,Y,N,N^FDTRACK10452^FS
^FO45,335^A0N,20,20^FDThank you for your order^FS
^XZ`;

export function App() {
  const [type, setType] = useState<BarcodeType>(SUPPORTED_BARCODE_TYPES[0]);
  const apiKey = import.meta.env.VITE_ZPL_AI_KEY;
  if (!apiKey) return <p>Add VITE_ZPL_AI_KEY to your .env file.</p>;
  return (
    <main>
      <h1>ZPL.AI React examples</h1>
      <section>
        <h2>Barcode</h2>
        <label htmlFor="barcode-type">Barcode type: </label>
        <select
          id="barcode-type"
          value={type}
          onChange={(event) => {
            const selected = event.currentTarget.value;
            if (isBarcodeType(selected)) setType(selected);
          }}
        >
          {SUPPORTED_BARCODE_TYPES.map((barcodeType) => (
            <option key={barcodeType} value={barcodeType}>{barcodeType}</option>
          ))}
        </select>
        <p>Value: <code>{sampleValues[type]}</code></p>
        <Barcode apiKey={apiKey} type={type} value={sampleValues[type]} />
      </section>
      <section>
        <h2>Custom ZPL label</h2>
        <ZplLabel apiKey={apiKey} zpl={shippingLabel} alt="Order 10452 shipping label" />
      </section>
    </main>
  );
}
