import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATABASE_ENV_NAMES = new Set([
  "DATABASE_URL", "postgresqlURL", "POSTGRESQL_URL", "POSTGRES_URL", "Host", "HOST", "PGHOST", "Puerto", "PORT_DB", "PGPORT",
  "Base de datos", "DATABASE", "PGDATABASE", "Usuario", "USER_DB", "PGUSER", "Password", "PASSWORD_DB", "PGPASSWORD", "SSL", "sslmode", "PGSSLMODE",
]);

let environmentLoaded = false;

function loadDatabaseEnvironment(): void {
  if (environmentLoaded) return;
  environmentLoaded = true;
  for (const file of [join(process.cwd(), ".env"), join(process.cwd(), "..", ".env"), join(process.cwd(), "..", "..", ".env")]) {
    try {
      const text = readFileSync(file, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([^=]+)=(.*)\s*$/);
        if (!match || !DATABASE_ENV_NAMES.has(match[1].trim())) continue;
        const value = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
        if (!process.env[match[1].trim()]) process.env[match[1].trim()] = value;
      }
    } catch { /* Missing local env files are expected in CI and fresh checkouts. */ }
  }
}

function firstEnvironment(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

export function resolveDatabaseUrl(): string | undefined {
  loadDatabaseEnvironment();
  const direct = firstEnvironment("DATABASE_URL", "postgresqlURL", "POSTGRESQL_URL", "POSTGRES_URL");
  if (direct) return direct;
  const host = firstEnvironment("Host", "HOST", "PGHOST");
  const port = firstEnvironment("Puerto", "PORT_DB", "PGPORT") ?? "5432";
  const database = firstEnvironment("Base de datos", "DATABASE", "PGDATABASE");
  const user = firstEnvironment("Usuario", "USER_DB", "PGUSER");
  const password = firstEnvironment("Password", "PASSWORD_DB", "PGPASSWORD");
  if (!host || !database || !user || password === undefined) return undefined;
  const ssl = firstEnvironment("SSL", "sslmode", "PGSSLMODE");
  const query = new URLSearchParams({ schema: "public" });
  if (ssl) query.set("sslmode", ssl === "true" ? "require" : ssl);
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?${query.toString()}`;
}
