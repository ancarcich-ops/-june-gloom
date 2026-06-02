import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project pages are served from https://<user>.github.io/-june-gloom/
export default defineConfig({
  base: "/-june-gloom/",
  plugins: [react()],
});
