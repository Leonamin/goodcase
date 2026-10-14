import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/")) {
            if (id.includes("radix")) return "radix";
            if (
              id.includes("react-dom") ||
              id.includes("/react/") ||
              id.includes("/scheduler/")
            )
              return "react";
            if (id.includes("fflate")) return "source-export";
          }
        },
      },
    },
  },
});
