const { Pool } = require("pg");
require("dotenv").config();

const rawConnectionString = process.env.DATABASE_URL?.trim();
const connectionString = rawConnectionString?.replace(
  /^psql\s+(['"])(.*)\1$/s,
  "$2"
);

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

try {
  const databaseUrl = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error();
  }
} catch {
  throw new Error("DATABASE_URL must be a PostgreSQL connection URI");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;