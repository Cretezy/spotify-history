import { drizzle } from "drizzle-orm/libsql";

export const db = createDb();

export function createDb() {
  return drizzle(process.env.DB_FILE_NAME!);
}

export * from "./schema.ts";
