import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

/** Páginas de /design-system num Chromium real (Playwright), com checagem de acessibilidade. */
export default mergeConfig(
  viteConfig,
  defineConfig({
    root: fileURLToPath(new URL(".", import.meta.url)),
    // Pré-otimiza tudo que as páginas importam: sem isso o Vite recarrega no meio da execução.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-dev-runtime",
        "react-router",
        "radix-ui",
        "lucide-react",
        "axe-core",
        "vitest-browser-react",
        "clsx",
        "tailwind-merge",
      ],
    },
    test: {
      name: "web",
      include: ["src/**/*.browser.test.tsx"],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }],
      },
    },
  }),
);
