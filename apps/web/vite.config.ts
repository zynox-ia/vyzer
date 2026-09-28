import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { emojibaseData } from "@vyzer/design-system/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // emojibaseData: dados do Emoji Picker servidos pelo próprio app (sem CDN externo)
  plugins: [react(), tailwindcss(), emojibaseData()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 3000,
    strictPort: true,
    // IPv4 explícito: o Traefik alcança o host via host.docker.internal (IPv4), e no Windows
    // "localhost" resolve só para ::1.
    host: "127.0.0.1",
    // Atrás do Traefik, o host chega como vyzer.localhost e o HMR usa a porta 80.
    allowedHosts: ["vyzer.localhost"],
    hmr: { clientPort: 80 },
    // Acesso direto (localhost:3000, sem Traefik): encaminha a API como o Traefik faz.
    proxy: { "^/api/": "http://127.0.0.1:3001" },
  },
});
