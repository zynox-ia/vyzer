/**
 * Amostra de código da linha "Font" de Preferences (Linear ao vivo, 30/09): um trecho em diff
 * (linhas removidas em vermelho, adicionadas em verde, com número de linha e realce de sintaxe)
 * e o seletor de linguagem sobre o canto superior direito. Trocar a linguagem troca o trecho.
 *
 * Sem dependência nova: o realce é um tokenizador pequeno (comentário, string, número,
 * palavra-chave, tipo) com as palavras-chave de cada linguagem; as cores vêm dos tokens
 * semânticos do design system.
 */
import { useState } from "react";
import { Select } from "@zynox/design-system/components";
import { CODE_THEMES, DEFAULT_CODE_THEME, paletteStyle } from "./code-themes";

type Kind = "same" | "add" | "del";
type Line = [Kind, string];
type Language = {
  label: string;
  keywords: string[];
  comment: string;
  lines: Line[];
};

const kw = (words: string) => words.split(" ");
const C_LIKE =
  "if else for while return break continue new null true false void int char bool const static struct class public private void";

const LANGUAGES: Record<string, Language> = {
  bash: {
    label: "Bash",
    comment: "#",
    keywords: kw("if then else fi for do done function return local export echo curl"),
    lines: [
      ["same", 'API_URL="https://api.example.com"'],
      ["del", "DEBUG=true"],
      ["same", "TIMEOUT=5000"],
      ["same", ""],
      ["del", "fetch_user() {"],
      ["del", '  curl "$API_URL/users/$1"'],
      ["add", "fetch_user() {"],
      ["add", '  curl -s "$API_URL/v2/users/$1" || return 1'],
      ["same", "}"],
    ],
  },
  c: {
    label: "C",
    comment: "//",
    keywords: kw(C_LIKE + " typedef include sizeof"),
    lines: [
      ["same", "typedef struct {"],
      ["same", "  const char *api_url;"],
      ["same", "  int timeout;"],
      ["del", "  bool debug;"],
      ["same", "} Config;"],
      ["del", "User *fetch_user(int id) {"],
      ["add", "User *fetch_user(int id, Config *cfg) {"],
      ["same", "  User *user = malloc(sizeof(User));"],
      ["same", "  return user;"],
      ["same", "}"],
    ],
  },
  csharp: {
    label: "C#",
    comment: "//",
    keywords: kw(C_LIKE + " async await var namespace using record string"),
    lines: [
      ["same", "var config = new Config {"],
      ["same", '  ApiUrl = "https://api.example.com",'],
      ["same", "  Timeout = 5000,"],
      ["del", "  Debug = true,"],
      ["same", "};"],
      ["del", "async Task<User> FetchUser(string id) {"],
      ["add", "async Task<User?> FetchUser(string id) {"],
      ["same", '  var res = await http.GetAsync($"{config.ApiUrl}/users/{id}");'],
      ["same", "  return res.IsSuccessStatusCode ? await res.Read() : null;"],
      ["same", "}"],
    ],
  },
  cpp: {
    label: "C++",
    comment: "//",
    keywords: kw(C_LIKE + " auto namespace template typename std using optional"),
    lines: [
      ["same", "struct Config {"],
      ["same", '  std::string apiUrl = "https://api.example.com";'],
      ["same", "  int timeout = 5000;"],
      ["del", "  bool debug = true;"],
      ["same", "};"],
      ["del", "User fetchUser(int id) {"],
      ["add", "std::optional<User> fetchUser(int id) {"],
      ["same", '  auto res = http::get(config.apiUrl + "/users/" + id);'],
      ["same", "  return res.ok() ? res.json() : std::nullopt;"],
      ["same", "}"],
    ],
  },
  css: {
    label: "CSS",
    comment: "/*",
    keywords: kw("@media @import @font-face important"),
    lines: [
      ["same", ":root {"],
      ["same", "  --api-timeout: 5000;"],
      ["del", "  --debug: true;"],
      ["same", "}"],
      ["del", ".user { color: red; }"],
      ["add", ".user {"],
      ["add", "  color: var(--fg-primary);"],
      ["add", "  padding: 8px 12px;"],
      ["same", "}"],
    ],
  },
  go: {
    label: "Go",
    comment: "//",
    keywords: kw(
      "package import func return if else for range var const type struct interface nil true false go defer",
    ),
    lines: [
      ["same", "var config = Config{"],
      ["same", '  ApiURL:  "https://api.example.com",'],
      ["same", "  Timeout: 5000,"],
      ["del", "  Debug:   true,"],
      ["same", "}"],
      ["del", "func FetchUser(id string) (User, error) {"],
      ["add", "func FetchUser(id string) (*User, error) {"],
      ["same", '  res, err := http.Get(config.ApiURL + "/users/" + id)'],
      ["same", "  return decode(res), err"],
      ["same", "}"],
    ],
  },
  html: {
    label: "HTML",
    comment: "<!--",
    keywords: kw("html head body div span script link meta title main section a ul li"),
    lines: [
      ["same", '<main class="user-card">'],
      ["del", '  <div id="user" class="card">'],
      ["add", '  <section id="user" class="card">'],
      ["same", "    <h1>Profile</h1>"],
      ["same", '    <a href="/users/1">Open</a>'],
      ["del", "  </div>"],
      ["add", "  </section>"],
      ["same", "</main>"],
    ],
  },
  json: {
    label: "JSON",
    comment: "//",
    keywords: kw("true false null"),
    lines: [
      ["same", "{"],
      ["same", '  "apiUrl": "https://api.example.com",'],
      ["same", '  "timeout": 5000,'],
      ["del", '  "debug": true,'],
      ["same", '  "headers": { "Content-Type": "application/json" },'],
      ["add", '  "retries": 3'],
      ["same", "}"],
    ],
  },
  java: {
    label: "Java",
    comment: "//",
    keywords: kw(C_LIKE + " final throws import extends implements interface try catch"),
    lines: [
      ["same", "Config config = new Config()"],
      ["same", '  .apiUrl("https://api.example.com")'],
      ["same", "  .timeout(5000);"],
      ["del", "  .debug(true);"],
      ["del", "User fetchUser(String id) {"],
      ["add", "Optional<User> fetchUser(String id) {"],
      ["same", '  var url = config.apiUrl() + "/users/" + id;'],
      ["same", "  var res = client.send(url);"],
      ["same", "  return res.ok() ? Optional.of(res.body()) : Optional.empty();"],
      ["same", "}"],
    ],
  },
  javascript: {
    label: "JavaScript",
    comment: "//",
    keywords: kw(
      "const let var function async await return if else new null true false import export from class",
    ),
    lines: [
      ["same", "const config = {"],
      ["same", '  apiUrl: "https://api.example.com",'],
      ["same", "  timeout: 5000,"],
      ["del", "  debug: true,"],
      ["same", '  headers: { "Content-Type": "application/json" },'],
      ["same", "};"],
      ["del", "async function fetchUser(id) {"],
      ["add", "async function fetchUser(id) {"],
      ["same", "  const res = await fetch(`${config.apiUrl}/v2/users/${id}`);"],
      ["same", "  return res.ok ? res.json() : null;"],
      ["same", "}"],
    ],
  },
  kotlin: {
    label: "Kotlin",
    comment: "//",
    keywords: kw("val var fun return if else null true false class data object suspend when in is"),
    lines: [
      ["same", "val config = Config("],
      ["same", '  apiUrl = "https://api.example.com",'],
      ["same", "  timeout = 5000,"],
      ["del", "  debug = true,"],
      ["same", ")"],
      ["del", "suspend fun fetchUser(id: String): User {"],
      ["add", "suspend fun fetchUser(id: String): User? {"],
      ["same", '  val res = client.get("${config.apiUrl}/users/$id")'],
      ["same", "  return if (res.ok) res.body() else null"],
      ["same", "}"],
    ],
  },
  php: {
    label: "PHP",
    comment: "//",
    keywords: kw(
      "function return if else new null true false class public private fn use echo array",
    ),
    lines: [
      ["same", "$config = ["],
      ["same", "  'apiUrl' => 'https://api.example.com',"],
      ["same", "  'timeout' => 5000,"],
      ["del", "  'debug' => true,"],
      ["same", "];"],
      ["del", "function fetchUser(string $id): User {"],
      ["add", "function fetchUser(string $id): ?User {"],
      ["same", "  $res = http_get($config['apiUrl'] . \"/users/$id\");"],
      ["same", "  return $res->ok() ? $res->json() : null;"],
      ["same", "}"],
    ],
  },
  python: {
    label: "Python",
    comment: "#",
    keywords: kw(
      "def return if else elif for in import from class async await None True False with as lambda",
    ),
    lines: [
      ["same", "config = {"],
      ["same", '    "api_url": "https://api.example.com",'],
      ["same", '    "timeout": 5000,'],
      ["del", '    "debug": True,'],
      ["same", "}"],
      ["del", "async def fetch_user(id: str) -> User:"],
      ["add", "async def fetch_user(id: str) -> User | None:"],
      ["same", "    res = await client.get(f\"{config['api_url']}/users/{id}\")"],
      ["same", "    return res.json() if res.ok else None"],
    ],
  },
  ruby: {
    label: "Ruby",
    comment: "#",
    keywords: kw("def end return if else elsif class module do nil true false unless then require"),
    lines: [
      ["same", "config = {"],
      ["same", '  api_url: "https://api.example.com",'],
      ["same", "  timeout: 5000,"],
      ["del", "  debug: true,"],
      ["same", "}"],
      ["del", "def fetch_user(id)"],
      ["add", "def fetch_user(id)"],
      ["same", '  res = Net::HTTP.get("#{config[:api_url]}/v2/users/#{id}")'],
      ["same", "  res.ok? ? JSON.parse(res.body) : nil"],
      ["same", "end"],
    ],
  },
  rust: {
    label: "Rust",
    comment: "//",
    keywords: kw(
      "fn let mut pub struct impl enum match if else return use async await Some None true false self",
    ),
    lines: [
      ["same", "let config = Config {"],
      ["same", '    api_url: "https://api.example.com".into(),'],
      ["same", "    timeout: 5000,"],
      ["del", "    debug: true,"],
      ["same", "};"],
      ["del", "async fn fetch_user(id: &str) -> User {"],
      ["add", "async fn fetch_user(id: &str) -> Option<User> {"],
      ["same", '    let res = client.get(format!("{}/users/{}", config.api_url, id)).await;'],
      ["same", "    res.ok().map(|r| r.json())"],
      ["same", "}"],
    ],
  },
  sql: {
    label: "SQL",
    comment: "--",
    keywords: kw(
      "SELECT FROM WHERE JOIN LEFT ON AND OR ORDER BY LIMIT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE NULL TRUE FALSE AS",
    ),
    lines: [
      ["del", "SELECT id, name FROM users"],
      ["add", "SELECT u.id, u.name, t.name AS team"],
      ["add", "FROM users u"],
      ["add", "LEFT JOIN teams t ON t.id = u.team_id"],
      ["same", "WHERE u.active = TRUE"],
      ["del", "  AND u.debug = TRUE"],
      ["same", "ORDER BY u.created_at DESC"],
      ["same", "LIMIT 50;"],
    ],
  },
  scala: {
    label: "Scala",
    comment: "//",
    keywords: kw(
      "val var def object class case trait extends match if else return null true false import new given",
    ),
    lines: [
      ["same", "val config = Config("],
      ["same", '  apiUrl = "https://api.example.com",'],
      ["same", "  timeout = 5000,"],
      ["del", "  debug = true,"],
      ["same", ")"],
      ["del", "def fetchUser(id: String): Future[User] ="],
      ["add", "def fetchUser(id: String): Future[Option[User]] ="],
      ["same", '  client.get(s"${config.apiUrl}/users/$id")'],
      ["same", "    .map(res => if (res.ok) Some(res.body) else None)"],
    ],
  },
  swift: {
    label: "Swift",
    comment: "//",
    keywords: kw(
      "let var func return if else guard struct class enum import async await try throws nil true false self init",
    ),
    lines: [
      ["same", "let config = Config("],
      ["same", '  apiUrl: "https://api.example.com",'],
      ["same", "  timeout: 5000,"],
      ["del", "  debug: true,"],
      ["same", ")"],
      ["del", "func fetchUser(id: String) async throws -> User {"],
      ["add", "func fetchUser(id: String) async throws -> User? {"],
      ["same", "  let (data, res) = try await URLSession.shared.data(from: url(id))"],
      ["same", "  return res.isOK ? try decode(data) : nil"],
      ["same", "}"],
    ],
  },
  typescript: {
    label: "TypeScript",
    comment: "//",
    keywords: kw(
      "const let var function async await return if else new null true false import export from class interface type",
    ),
    lines: [
      ["same", "const config = {"],
      ["same", '  apiUrl: "https://api.example.com",'],
      ["same", "  timeout: 5000,"],
      ["del", "  debug: true,"],
      ["same", '  headers: { "Content-Type": "application/json" },'],
      ["same", "};"],
      ["del", "async function fetchUser(id: string): Promise<User> {"],
      ["del", "  const url = `${config.apiUrl}/users/${id}`;"],
      ["add", "async function fetchUser(id: string): Promise<User | null> {"],
      ["add", "  const url = `${config.apiUrl}/v2/users/${id}`;"],
      ["same", "  const res = await fetch(url);"],
      ["same", "  return res.ok ? res.json() : null;"],
      ["same", "}"],
    ],
  },
  xml: {
    label: "XML",
    comment: "<!--",
    keywords: kw("config item settings property version encoding"),
    lines: [
      ["same", '<?xml version="1.0" encoding="UTF-8"?>'],
      ["same", "<config>"],
      ["same", "  <apiUrl>https://api.example.com</apiUrl>"],
      ["same", "  <timeout>5000</timeout>"],
      ["del", "  <debug>true</debug>"],
      ["add", "  <retries>3</retries>"],
      ["same", "</config>"],
    ],
  },
  yaml: {
    label: "YAML",
    comment: "#",
    keywords: kw("true false null"),
    lines: [
      ["same", "config:"],
      ["same", "  apiUrl: https://api.example.com"],
      ["same", "  timeout: 5000"],
      ["del", "  debug: true"],
      ["same", "  headers:"],
      ["same", '    Content-Type: "application/json"'],
      ["add", "  retries: 3"],
    ],
  },
};

const LANGUAGE_OPTIONS = Object.entries(LANGUAGES)
  .map(([value, { label }]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

const TOKEN =
  /(\/\/.*|#.*|--.*|\/\*.*|<!--.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_@$][\w$-]*)|(\s+|.)/g;

/** Realce de sintaxe por tokens: cores semânticas do design system. */
function highlight(line: string, language: Language) {
  const words = new Set(language.keywords);
  const out: React.ReactNode[] = [];
  let index = 0;
  for (const match of line.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = match;
    const key = index++;
    if (comment && comment.startsWith(language.comment)) {
      out.push(
        <span key={key} className="text-(--cs-comment,var(--fg-tertiary))">
          {comment}
        </span>,
      );
    } else if (string) {
      out.push(
        <span key={key} className="text-(--cs-string,var(--st-warning))">
          {string}
        </span>,
      );
    } else if (number) {
      out.push(
        <span key={key} className="text-(--cs-number,var(--st-info))">
          {number}
        </span>,
      );
    } else if (word && !words.has(word) && line[(match.index ?? 0) + word.length] === "(") {
      out.push(
        <span key={key} className="text-(--cs-fn,var(--st-warning))">
          {word}
        </span>,
      );
    } else if (word && words.has(word)) {
      out.push(
        <span key={key} className="text-(--cs-keyword,var(--accent-text))">
          {word}
        </span>,
      );
    } else if (word && /^[A-Z]/.test(word)) {
      out.push(
        <span key={key} className="text-(--cs-type,var(--st-success))">
          {word}
        </span>,
      );
    } else {
      out.push(text);
    }
  }
  return out;
}

export function CodeSample({
  theme = DEFAULT_CODE_THEME,
  fontSize,
  lineHeight,
  fontFamily,
}: {
  theme?: string;
  /** Tamanho da fonte em px e altura de linha (múltiplo); sem eles vale o token `text-code`. */
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
}) {
  const palette = (CODE_THEMES[theme] ?? CODE_THEMES[DEFAULT_CODE_THEME]!).palette;
  const [languageKey, setLanguageKey] = useState("typescript");
  const language = LANGUAGES[languageKey] ?? LANGUAGES.typescript!;
  // Número de linha: só as linhas que não foram removidas contam.
  const numbers = language.lines.reduce<number[]>((acc, [kind], i) => {
    acc.push(kind === "del" ? (acc[i - 1] ?? 0) : (acc[i - 1] ?? 0) + 1);
    return acc;
  }, []);

  return (
    <div
      style={paletteStyle(palette)}
      className="relative overflow-hidden rounded-container border border-default bg-(--cs-bg,var(--bg-sidebar)) text-(--cs-fg,var(--fg-primary))"
    >
      <pre
        aria-label="Code sample"
        // Rola nos dois sentidos: recebe foco para rolar pelo teclado (o mesmo padrão de
        // kit/doc.tsx CodeBlock).
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        style={{
          fontSize,
          lineHeight,
          fontFamily,
        }}
        className="max-h-72 overflow-auto py-2 text-code"
      >
        <code className="flex min-w-max flex-col">
          {language.lines.map(([kind, text], i) => {
            return (
              <span
                // Amostra estática: a ordem nunca muda.
                // oxlint-disable-next-line react/no-array-index-key
                key={`${languageKey}-${i}`}
                className={
                  kind === "add"
                    ? "flex bg-[color-mix(in_srgb,var(--cs-add,var(--st-success))_15%,transparent)]"
                    : kind === "del"
                      ? "flex bg-[color-mix(in_srgb,var(--cs-del,var(--st-danger))_15%,transparent)]"
                      : "flex"
                }
              >
                <span
                  aria-hidden
                  className={`w-10 shrink-0 pr-3 text-right select-none ${
                    kind === "add"
                      ? "text-(--cs-add,var(--st-success))"
                      : kind === "del"
                        ? "text-(--cs-del,var(--st-danger))"
                        : "text-(--cs-comment,var(--fg-tertiary))"
                  }`}
                >
                  {kind === "del" ? "−" : numbers[i]}
                </span>
                <span className="pr-24 whitespace-pre">
                  {text === "" ? " " : highlight(text, language)}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
      <div className="absolute top-2 right-4">
        <Select
          aria-label="Code sample language"
          value={languageKey}
          onValueChange={setLanguageKey}
          options={LANGUAGE_OPTIONS}
        />
      </div>
    </div>
  );
}
