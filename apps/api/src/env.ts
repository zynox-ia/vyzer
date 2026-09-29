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

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: port("API_PORT", 3001),
  rustfsEndpoint: required("RUSTFS_ENDPOINT"),
  rustfsBucket: required("RUSTFS_BUCKET"),
  rustfsAccessKey: required("RUSTFS_ACCESS_KEY"),
  rustfsSecretKey: required("RUSTFS_SECRET_KEY"),
};
