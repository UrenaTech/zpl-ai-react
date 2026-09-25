import { defineComponent, h } from "vue";
import { useRenderedImage } from "./rendered-image";

export const ZplLabel = defineComponent({
  name: "ZplLabel",
  props: {
    apiKey: { type: String, required: true },
    zpl: { type: String, required: true },
    alt: { type: String, default: "ZPL label" }
  },
  setup(props) {
    const state = useRenderedImage(() => ({
      kind: "label",
      apiKey: props.apiKey,
      zpl: props.zpl
    }));

    return () => {
      const image = state.value;
      if (image.status === "loading") {
        return h("span", { "aria-label": "Generating label" }, "Generating label…");
      }
      if (image.status === "error") return h("span", { role: "alert" }, image.message);
      return h("img", { src: image.src, alt: props.alt });
    };
  }
});
