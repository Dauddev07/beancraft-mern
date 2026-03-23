import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Read PORT from ../server/.env so the proxy always matches Express (loadEnv can miss this path).
 * On macOS, use 5050+ in server/.env — port 5000 is often AirPlay.
 */
function getServerPort() {
  const envPath = path.resolve(__dirname, "../server/.env");
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    const line = raw.split(/\r?\n/).find((l) => /^\s*PORT\s*=\s*\S+/.test(l));
    if (line) {
      const v = line.replace(/^\s*PORT\s*=\s*/, "").trim();
      if (/^\d+$/.test(v)) return v;
    }
  } catch {
    /* no server/.env */
  }
  return "5050";
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${getServerPort()}`,
        changeOrigin: true,
      },
    },
  },
});
