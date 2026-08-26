import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/",
  resolve: {
    alias: {
      pages: path.resolve(__dirname, "./src/pages"),
      layout: path.resolve(__dirname, "./src/layout"),
      common: path.resolve(__dirname, "./src/common"),
      api: path.resolve(__dirname, "./src/api"),
      components: path.resolve(__dirname, "./src/components"),
      images: path.resolve(__dirname, "./src/assets/images"),
      css: path.resolve(__dirname, "./src/assets/css"),
      assets: path.resolve(__dirname, "./src/assets"),
      svgs: path.resolve(__dirname, "./src/assets/svgs"),
      global: path.resolve(__dirname, "./src/global"),
      store: path.resolve(__dirname, "./src/store"),
      helper: path.resolve(__dirname, "./src/helper"),
      hooks: path.resolve(__dirname, "./src/hooks"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    manifest: true, // Generate a manifest.json to map old file names to new ones.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
      },
    },
  },
});
