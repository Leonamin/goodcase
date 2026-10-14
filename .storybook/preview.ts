import type { Preview } from "@storybook/react-vite";
import "../src/styles/tokens.css";
import "../src/styles/global.css";
import "../src/styles/basic.css";
import "../src/styles/overlays.css";
import "../src/styles/tabs.css";
import "../src/styles/toast.css";
import "../src/styles/composed.css";
import "../src/styles/gallery.css";
const preview: Preview = {
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    document.documentElement.dataset.theme = "reference";
    document.documentElement.dataset.density = "comfortable";
    document.documentElement.dataset.colorMode = "light";
  },
};
export default preview;
