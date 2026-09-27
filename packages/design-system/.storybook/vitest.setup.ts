/*
 * Os testes usam só as anotações (annotations.tsx), não o preview.tsx: o preview importa o
 * addon-docs (moldura do autodocs), que não resolve react-dom no runner do Vitest. O addon
 * mostra um aviso informativo sugerindo remover este arquivo; aqui ele é intencional.
 */
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import projectAnnotations from "./annotations";

setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
