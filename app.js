const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
const header = require("./fw/header");
const footer = require("./fw/footer");
const login = require("./login");
const index = require("./index");
const adminUser = require("./admin/users");
const editTask = require("./edit");
const saveTask = require("./savetask");
const search = require("./search");
const searchProvider = require("./search/v2/index");
const db = require("./fw/db");
const deleteTask = require("./delete");
const csrf = require("csurf");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error("Missing session secret");
}

app.use(helmet({
  // This would need to be adjusted for production with the right urls.
  contentSecurityPolicy: false,
}));

// Middleware für Body-Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Middleware für Session-Handling
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "strict"
    }
  }),
);

const csrfProtection = csrf();
app.use(csrfProtection);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes"
});

app.use((req, res, next) => {
  if (req.session && req.session.loggedin) {
    req.cookies.userid = req.session.userid;
    req.cookies.username = req.session.username;
  } else {
    delete req.cookies.userid;
    delete req.cookies.username;
  }
  next();
});

async function isAdmin(req) {
  if (!activeUserSession(req)) return false;

  const query = "SELECT roleID FROM permissions WHERE userID =?";
  const result = await db.executeStatement(query, [req.session.userid]);

  return result.length > 0 && result[0].roleID === 1;
}

// Routen
app.get("/", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await index.html(req), req);
    res.send(html);
  } else {
    res.redirect("login");
  }
});

app.post("/", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await index.html(req), req);
    res.send(html);
  } else {
    res.redirect("login");
  }
});

// edit task
app.get("/admin/users", async (req, res) => {
  if (await isAdmin(req)) {
    let html = await wrapContent(await adminUser.html, req);
    res.send(html);
  } else {
    res.status(403).send("403 Forbidden: You do not have permission to view this page.");
  }
});

// edit task
app.get("/edit", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await editTask.html(req), req);
    res.send(html);
  } else {
    res.redirect("/");
  }
});

// Login-Seite anzeigen (GET remains for showing the form)
app.get("/login", async (req, res) => {
  let content = await login.handleLogin(req, res);
  let html = await wrapContent(content.html, req);
  res.send(html);
});

// FIX: Add this POST route to handle the actual login submission
app.post("/login", loginLimiter, async (req, res) => {
  let content = await login.handleLogin(req, res);

  if (content.user.userid !== 0) {
    login.startUserSession(req, res, content.user);
  } else {
    // login unsuccessful or not made jet... display login form
    let html = await wrapContent(content.html, req);
    res.send(html);
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid");
  res.redirect("/login");
});

// Profilseite anzeigen
app.get("/profile", (req, res) => {
  if (req.session.loggedin) {
    res.send(`Welcome, ${req.session.username}! <a href="/logout">Logout</a>`);
  } else {
    res.send("Please login to view this page");
  }
});

// save task
app.post("/savetask", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await saveTask.html(req), req);
    res.send(html);
  } else {
    res.redirect("/");
  }
});

// delete task
app.get("/delete", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await deleteTask.html(req), req);
    res.send(html);
  } else {
    res.redirect("/");
  }
});

// search
app.post("/search", async (req, res) => {
  let html = await search.html(req);
  res.send(html);
});

// search provider
app.get("/search/v2/", async (req, res) => {
  let result = await searchProvider.search(req);
  res.send(result);
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function wrapContent(content, req) {
  let headerHtml = await header(req);
  return headerHtml + content + footer;
}

function activeUserSession(req) {
  // check if cookie with user information ist set
  return req.session && req.session.loggedin === true;
}
