const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

module.exports = pool; // 👈 THIS LINE IS REQUIRED

console.log("DATABASE_URL exists?", !!process.env.DATABASE_URL);
console.log("DATABASE_URL preview:", process.env.DATABASE_URL?.slice(0, 20));
