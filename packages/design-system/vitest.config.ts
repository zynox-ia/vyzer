import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/** Componentes do design system num Chromium real (Playwright): interação e acessibilidade. */
export default defineConfig({
  // Raiz no pacote: dependências resolvem a partir daqui, não da raiz do monorepo.
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
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
