import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { emojibaseData } from "./vite-plugin.js";

/** Componentes do design system num Chromium real (Playwright): interação e acessibilidade. */
export default defineConfig({
  // Raiz no pacote: dependências resolvem a partir daqui, não da raiz do monorepo.
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss(), emojibaseData()],
  // Pré-otimiza tudo que os testes importam: sem isso o Vite recarrega no meio da execução.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "radix-ui",
      "lucide-react",
      "axe-core",
      "vitest-browser-react",
      "clsx",
      "tailwind-merge",
      "frimousse",
    ],
  },
  test: {
    name: "design-system",
    include: ["src/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
