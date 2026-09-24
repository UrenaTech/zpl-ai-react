import { ChangeDetectionStrategy, Component, Input, signal } from "@angular/core";
import type { BarcodeType } from "@urenatech/zpl-core";
import { RenderedImage } from "./rendered-image";

@Component({
  selector: "zpl-barcode",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state(); as image) {
      @if (image.status === "loading") {
        <span aria-label="Generating label">Generating label…</span>
      } @else if (image.status === "error") {
        <span role="alert">{{ image.message }}</span>
      } @else {
        <img [src]="image.src" [alt]="typeValue() + ' barcode for ' + barcodeValue()" />
      }
    }
  `
})
export class ZplBarcode extends RenderedImage {
  private readonly key = signal("");
  protected readonly typeValue = signal<BarcodeType>("code128");
  protected readonly barcodeValue = signal("");

  @Input({ required: true }) set apiKey(value: string) { this.key.set(value); }
  @Input({ required: true }) set type(value: BarcodeType) { this.typeValue.set(value); }
  @Input({ required: true }) set value(value: string) { this.barcodeValue.set(value); }

  constructor() {
    super();
    this.watch(() => ({
      kind: "barcode",
      apiKey: this.key(),
      type: this.typeValue(),
      value: this.barcodeValue()
    }));
  }
}
