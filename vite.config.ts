import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // proxy: {
    //   "/auth": { target: "http://localhost:3000", changeOrigin: true },
    //   "/domains": { target: "http://localhost:3000", changeOrigin: true },
    //   "/userlogs": { target: "http://localhost:3000", changeOrigin: true },
    //   "/health": {
    //     target: "http://localhost:3000",
    //     changeOrigin: true,
    //   },
    //   "/stats": {
    //     target: "http://localhost:3000",
    //     changeOrigin: true,
    //   },
    //   "/unsubscribe": {
    //     target: "http://localhost:3000",
    //     changeOrigin: true,
    //   },
    //   "/api": {
    //     target:
    //       process.env.VITE_BACKEND_URL ||
    //       "https://lilah-treelined-nonflagrantly.ngrok-free.dev",
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
    //   },

    // },
    // host: true,
    // hmr: {
    //   host: "lilah-treelined-nonflagrantly.ngrok-free.dev",
    // },
  },
});
