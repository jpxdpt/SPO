import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL em falta.");

const sql = postgres(url, {
  ssl: process.env.DATABASE_SSL === "false" ? false : "require",
  max: 1,
  prepare: false,
});

async function main() {
  try {
    const dir = join(process.cwd(), "db", "migrations");
    const files = readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      await sql.unsafe(readFileSync(join(dir, file), "utf8"));
      console.log(`[migrations] ${file} aplicado`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
