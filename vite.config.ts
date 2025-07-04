import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/binance-api/sapi/v1": {
                target: "https://api.binance.com/sapi/v1",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/binance-api\/sapi\/v1/, ""),
            },
            "/binance-api/sapi/v2": {
                target: "https://api.binance.com/sapi/v2",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/binance-api\/sapi\/v2/, ""),
            },
            "/binance-api/v3": {
                target: "https://api.binance.com/api/v3",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/binance-api\/v3/, ""),
            },
        },
    },
});
