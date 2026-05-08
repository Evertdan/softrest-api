import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index.js";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "softrest_dev",
  password: process.env.DB_PASSWORD || "devpassword",
  database: process.env.DB_NAME || "softrest",
});

export const db = drizzle(connection, { schema, mode: "default" });
export { schema };