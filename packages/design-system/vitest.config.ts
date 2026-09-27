import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const configDir = fileURLToPath(new URL("./.storybook", import.meta.url));

/** Stories como testes de interação e acessibilidade, num Chromium real (Playwright). */
export default defineConfig({
  // Raiz no pacote: dependências (react-dom, addon-docs) resolvem a partir daqui, não da raiz do monorepo.
  root,
  plugins: [storybookTest({ configDir }), tailwindcss()],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./.storybook/vitest.setup.ts"],
  },
});
