import { Barcode, ZplLabel, type BarcodeType } from "@zpl-ai/react";

const examples: ReadonlyArray<{ type: BarcodeType; value: string }> = [
  { type: "code128", value: "ORDER-10452" },
  { type: "qr", value: "https://zpl.ai" },
  { type: "data-matrix", value: "ITEM-1001" }
];

export function App() {
  const apiKey = import.meta.env.VITE_ZPL_AI_KEY;
  if (!apiKey) return <p>Add VITE_ZPL_AI_KEY to your .env file.</p>;
  return (
    <main>
      <h1>ZPL.AI React examples</h1>
      {examples.map(({ type, value }) => (
        <section key={type}>
          <h2>{type}</h2>
          <Barcode apiKey={apiKey} type={type} value={value} />
        </section>
      ))}
      <section>
        <h2>Custom ZPL label</h2>
        <ZplLabel apiKey={apiKey} zpl="^XA^FO20,20^FDHello from ZPL^FS^XZ" />
      </section>
    </main>
  );
}
