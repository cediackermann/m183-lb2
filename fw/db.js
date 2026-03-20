const mysql = require("mysql2/promise");
const dbConfig = require("../config");

const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

async function connectDB() {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 2000;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const connection = await pool.getConnection();
      return connection;
    } catch (error) {
      retries++;
      console.error(
        `Error connecting to database (attempt ${retries}/${MAX_RETRIES}):`,
        error.message,
      );
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw new Error(
          "Failed to connect to database after multiple retries: " +
          error.message,
        );
      }
    }
  }
}

async function executeStatement(statement, params = []) {
  let conn;
  try {
    conn = await connectDB();
    const [results, fields] = await conn.query(statement, params);
    return results;
  } catch (error) {
    console.error("Error executing statement:", error.message);
    return [];
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

module.exports = { connectDB: connectDB, executeStatement: executeStatement };
