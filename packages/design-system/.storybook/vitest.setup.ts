import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import projectAnnotations from "./annotations";

setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
