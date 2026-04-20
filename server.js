import express, { urlencoded, json } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { csrfSync } from "csrf-sync";
import crypto from "crypto";
import { config } from "dotenv";
config();
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dbConfig from "./src/config/db.config.js";
import MySQLStoreFactory from "express-mysql-session";
const MySQLStore = MySQLStoreFactory(session);

import { authSync } from "./src/middleware/authMiddleware.js";

import indexRoutes from "./src/routes/indexRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import searchRoutes from "./src/routes/searchRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

const app = express();
const PORT = 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error("Missing session secret");
}

// T-03: Trust proxy so secure cookies work behind a reverse proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  req.nonce = nonce;

  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          `'nonce-${nonce}'`,
          "https://www.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://apis.google.com",
        ],
        "script-src-attr": ["'self'", `'nonce-${nonce}'`],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:", "https://www.gstatic.com"],
        "connect-src": [
          "'self'",
          "https://www.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://*.firebaseio.com",
        ],
        "frame-src": ["'self'", "https://*.firebaseapp.com"],
      },
    },
  })(req, res, next);
});

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const sessionStore = new MySQLStore({
  ...dbConfig,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // T-03: Secure flag enabled in production to prevent session hijacking over HTTP
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  }),
);

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) =>
    req.body._csrf || req.query._csrf || req.headers["csrf-token"],
});

app.use((req, res, next) => {
  req.csrfToken = () => generateToken(req);
  next();
});

// Apply CSRF protection to all POST/PUT/DELETE requests
app.use(csrfSynchronisedProtection);

app.use(authSync);

app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use("/", taskRoutes);
app.use("/admin", adminRoutes);
app.use("/search", searchRoutes);
app.use("/", userRoutes);

// T-01 / T-11: Only mount test routes in dev mode; never expose in production
if (process.env.ENVIRONMENT === "dev") {
  const { default: testRoutes } = await import("./src/routes/testRoutes.js");
  app.use("/test", testRoutes);
}

// T-12: Global error handler to suppress stack traces in responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
