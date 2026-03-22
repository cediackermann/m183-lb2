const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const csrf = require('csurf');
require('dotenv').config();

const dbConfig = require('./src/config/db.config');
const MySQLStore = require('express-mysql-session')(session);
const { authSync } = require('./src/middleware/authMiddleware');

const indexRoutes = require('./src/routes/indexRoutes');
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error('Missing session secret');
}

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
