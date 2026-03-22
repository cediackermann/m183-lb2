import express, { urlencoded, json } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import csrf from 'csurf';
import { config } from 'dotenv';
config();
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dbConfig from './src/config/db.config.js';
import MySQLStoreFactory from 'express-mysql-session';
const MySQLStore = MySQLStoreFactory(session);

import { authSync } from './src/middleware/authMiddleware.js';

import indexRoutes from './src/routes/indexRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const app = express();
const PORT = 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error('Missing session secret');
}

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

const sessionStore = new MySQLStore(dbConfig);

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // disabled for local HTTP testing
      sameSite: 'strict'
    }
  })
);

const csrfProtection = csrf();
app.use(csrfProtection);

app.use(authSync);

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/search', searchRoutes);
app.use('/', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
