/** Variáveis de ambiente da API, validadas na subida. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não definida.`);
  return value;
}

function port(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} inválida: ${raw}`);
  }
  return value;
}

function httpUrl(name: string): string {
  const value = required(name);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} invÃ¡lida: ${value}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} deve usar http ou https.`);
  }
  return parsed.toString().replace(/\/$/, "");
}

function authSecret(name: string): string {
  const value = required(name);
  if (value === "replace-with-a-random-secret-at-least-32-characters-long" || value.length < 32) {
    throw new Error(`${name} deve ter ao menos 32 caracteres aleatÃ³rios.`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  appBaseUrl: httpUrl("APP_BASE_URL"),
  authSecret: authSecret("AUTH_SECRET"),
  port: port("API_PORT", 3001),
  rustfsEndpoint: required("RUSTFS_ENDPOINT"),
  rustfsBucket: required("RUSTFS_BUCKET"),
  rustfsAccessKey: required("RUSTFS_ACCESS_KEY"),
  rustfsSecretKey: required("RUSTFS_SECRET_KEY"),
};
