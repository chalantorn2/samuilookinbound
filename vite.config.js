import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward /api/* requests to the production PHP backend during local dev.
      // Cookies are rewritten so the browser stores the session on localhost.
      "/api": {
        target: "https://inbound.samuilookbiz.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: "/",
      },
    },
  },
});
