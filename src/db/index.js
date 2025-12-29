const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

module.exports = pool; // 👈 THIS LINE IS REQUIRED
