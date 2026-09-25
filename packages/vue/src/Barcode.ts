import { defineComponent, h, type PropType } from "vue";
import type { BarcodeType } from "@urenatech/zpl-core";
import { useRenderedImage } from "./rendered-image";

export const Barcode = defineComponent({
  name: "Barcode",
  props: {
    apiKey: { type: String, required: true },
    type: { type: String as PropType<BarcodeType>, required: true },
    value: { type: String, required: true }
  },
  setup(props) {
    const state = useRenderedImage(() => ({
      kind: "barcode",
      apiKey: props.apiKey,
      type: props.type,
      value: props.value
    }));

    return () => {
      const image = state.value;
      if (image.status === "loading") {
        return h("span", { "aria-label": "Generating label" }, "Generating label…");
      }
      if (image.status === "error") return h("span", { role: "alert" }, image.message);
      return h("img", { src: image.src, alt: `${props.type} barcode for ${props.value}` });
    };
  }
});
