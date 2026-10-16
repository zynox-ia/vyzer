/**
 * Plugin do Vite que serve os dados de emoji (emojibase-data) pelo próprio app, sem CDN externo
 * (decisão do responsável). O Emoji Picker (Frimousse) busca `${EMOJIBASE_PATH}/en/data.json` e
 * `messages.json`: no dev um middleware entrega os arquivos do pacote; no build eles viram assets
 * com o mesmo caminho. Use no vite.config do app e no vitest.config do pacote.
 *
 * Em JavaScript (com vite-plugin.d.ts) porque roda em Node e o pacote não tem tipos de Node.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/** Caminho público dos dados. Mesmo valor de EMOJIBASE_URL (src/lib/emoji-data.ts). */
export const EMOJIBASE_PATH = "/emojibase-data";

const LOCALES = ["en"];
const FILES = ["data.json", "messages.json"];
const root = dirname(createRequire(import.meta.url).resolve("emojibase-data/package.json"));
const read = (locale, file) => readFileSync(join(root, locale, file));

export function emojibaseData() {
  return {
    name: "zynox:emojibase-data",
    configureServer(server) {
      server.middlewares.use(EMOJIBASE_PATH, (req, res, next) => {
        const [locale, file] = (req.url ?? "").split("?")[0].replace(/^\//, "").split("/");
        if (!LOCALES.includes(locale) || !FILES.includes(file)) return next();
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.end(read(locale, file));
      });
    },
    generateBundle() {
      for (const locale of LOCALES) {
        for (const file of FILES) {
          this.emitFile({
            type: "asset",
            fileName: `${EMOJIBASE_PATH.slice(1)}/${locale}/${file}`,
            source: read(locale, file),
          });
        }
      }
    },
  };
}
