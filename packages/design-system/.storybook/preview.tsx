import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import type { Preview } from "@storybook/react-vite";
import { useEffect, useState, type PropsWithChildren } from "react";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { themes } from "storybook/theming";
import annotations, { channel, resolveTheme, type Globals, type ThemeGlobal } from "./annotations";

/** Moldura do autodocs (props, canvas) no mesmo tema do toolbar. */
function ThemedDocsContainer({ children, context }: PropsWithChildren<DocsContainerProps>) {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  useEffect(() => {
    const update = ({ globals }: { globals: Globals }) =>
      setTheme(resolveTheme((globals.theme as ThemeGlobal | undefined) ?? "dark"));
    channel.on(SET_GLOBALS, update);
    channel.on(GLOBALS_UPDATED, update);
    return () => {
      channel.off(SET_GLOBALS, update);
      channel.off(GLOBALS_UPDATED, update);
    };
  }, []);
  return (
    <DocsContainer context={context} theme={theme === "light" ? themes.light : themes.dark}>
      {children}
    </DocsContainer>
  );
}

const preview: Preview = {
  ...annotations,
  parameters: {
    ...annotations.parameters,
    docs: { container: ThemedDocsContainer },
  },
};

export default preview;
