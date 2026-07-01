import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
