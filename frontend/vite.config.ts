import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: parseInt(process.env.VITE_PORT || '5173'),
    strictPort: true, 
    watch: {
      usePolling: true, 
    },
    hmr: {
      overlay: false,
      clientPort: parseInt(process.env.VITE_PORT || '5173'), 
    },
  },
});