import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { config } from "../config/env";

let pool: mysql.Pool | null = null;
let dbInstance: any = null;

export function getDb() {
  if (!config.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please provide a valid MySQL connection string (e.g. mysql://user:pass@host:port/database) in your environment variables.",
    );
  }

  if (!pool) {
    pool = mysql.createPool({
      uri: config.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    dbInstance = drizzle(pool, { schema, mode: "default" });
  }

  return dbInstance;
}

export type Db = ReturnType<typeof getDb>;
