const mysql = require("mysql2/promise");
const dbConfig = require("../config");

// Verbindung zur Datenbank herstellen
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 2000;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Database connected");
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
            "Failed to connect to database after multiple retries.",
          );
        }
      }
    }
    return connection;
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

async function executeStatement(statement) {
  let conn = await connectDB();
  const [results, fields] = await conn.query(statement);
  return results;
}

module.exports = { connectDB: connectDB, executeStatement: executeStatement };
