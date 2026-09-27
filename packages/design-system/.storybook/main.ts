import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  // TypeScript 7 não expõe a API em JS: o autodocs usa o react-docgen (Babel).
  typescript: { reactDocgen: "react-docgen" },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    viteConfig.build = {
      ...viteConfig.build,
      // O manager e o preview do Storybook são grandes por natureza; não é código do pacote.
      chunkSizeWarningLimit: 4096,
      rolldownOptions: {
        ...viteConfig.build?.rolldownOptions,
        onwarn(warning, defaultHandler) {
          // "use client" do lucide-react: diretiva de RSC, sem efeito num app Vite.
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
          defaultHandler(warning);
        },
      },
    };
    return viteConfig;
  },
};

export default config;
