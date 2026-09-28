import type { Plugin } from "vite";

/** Caminho público dos dados de emoji servidos pelo app. */
export declare const EMOJIBASE_PATH: string;

/** Serve os dados do emojibase-data pelo próprio app (dev e build). */
export declare function emojibaseData(): Plugin;
