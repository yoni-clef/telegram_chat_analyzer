import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "./config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

export async function initDb(): Promise<void> {
  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const schema = await fs.promises.readFile(schemaPath, "utf8");
  await pool.query(schema);
}
