import { defineConfig } from "vitest/config";

/**
 * Uma instalação do Vitest para o monorepo:
 * - node: testes unitários dos pacotes e testes de autorização da API (ADR-0007);
 * - storybook: stories do design system num navegador real.
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
    ],
  },
});
