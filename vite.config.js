import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // allow JSX inside .js files
      jsxRuntime: "automatic",
      server: {
        host: "0.0.0.0",
        port: 5173,
      },
      babel: {
        presets: [["@babel/preset-react", { runtime: "automatic" }]],
      },
    }),
  ],
});
