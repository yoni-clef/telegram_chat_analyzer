import { env } from "./config/env";
import { initDb } from "./db";
import { createApp } from "./app";

async function start(): Promise<void> {
  await initDb();
  const app = createApp();
  app.listen(Number(env.PORT), () => {
    process.stdout.write(`Backend listening on port ${env.PORT}\n`);
  });
}

start().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
