import { defineConfig } from "vite";

export default defineConfig({
  base: "/onrte-app/",
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          "import",
          "if-function",
          "global-builtin",
          "color-functions",
        ],
      },
    },
  },
});
