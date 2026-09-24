import { ChangeDetectionStrategy, Component, Input, signal } from "@angular/core";
import { RenderedImage } from "./rendered-image";

@Component({
  selector: "zpl-label",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state(); as image) {
      @if (image.status === "loading") {
        <span aria-label="Generating label">Generating label…</span>
      } @else if (image.status === "error") {
        <span role="alert">{{ image.message }}</span>
      } @else {
        <img [src]="image.src" [alt]="alt" />
      }
    }
  `
})
export class ZplLabel extends RenderedImage {
  private readonly key = signal("");
  private readonly labelZpl = signal("");

  @Input({ required: true }) set apiKey(value: string) { this.key.set(value); }
  @Input({ required: true }) set zpl(value: string) { this.labelZpl.set(value); }
  @Input() alt = "ZPL label";

  constructor() {
    super();
    this.watch(() => ({
      kind: "label",
      apiKey: this.key(),
      zpl: this.labelZpl()
    }));
  }
}
