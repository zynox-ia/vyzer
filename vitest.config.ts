import { defineConfig } from "vitest/config";

/**
 * Uma instalação do Vitest para o monorepo:
 * - node: testes unitários dos pacotes e testes de autorização da API (ADR-0007);
 * - design-system e web: componentes e páginas de /design-system num Chromium real (Playwright),
 *   com interação e acessibilidade (axe-core).
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["apps/api/src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
        },
      },
      "packages/design-system/vitest.config.ts",
      "apps/web/vitest.config.ts",
    ],
  },
});
