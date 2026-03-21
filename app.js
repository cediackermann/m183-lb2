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
const settings = require("./settings");
const deleteTask = require("./delete");
const csrf = require("csurf");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const dbConfig = require("./config");
const MySQLStore = require("express-mysql-session")(session);

const app = express();
const PORT = 3000;

const admin = require("firebase-admin");
try {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
} catch (e) { }

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

const sessionStore = new MySQLStore(dbConfig);

// Middleware für Session-Handling
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // disabled for local HTTP testing
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

app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.session.loggedin = true;
      req.session.userid = decodedToken.uid;
      req.session.username = decodedToken.email;
    } catch (err) {
      req.session.loggedin = false;
      delete req.session.userid;
      delete req.session.username;
    }
  } else {
    req.session.loggedin = false;
    delete req.session.userid;
    delete req.session.username;
  }

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
  // Just show the UI since authentication happens on client.
  let html = await wrapContent(content.html, req);
  res.send(html);
});

// Sync Firebase User with Local DB
app.post("/auth-sync", async (req, res) => {
  if (!req.session.loggedin || !req.session.userid) {
    return res.status(401).send("Unauthorized");
  }
  const uid = req.session.userid;
  let email = req.body.email || "user@example.com";
  // Create user in DB if they don't exist
  try {
    const existing = await db.executeStatement("SELECT id FROM users WHERE id=?", [uid]);
    if (existing.length === 0) {
      await db.executeStatement("INSERT INTO users (id, username) VALUES (?, ?)", [uid, email]);

      // Default to Role 2 (User)
      await db.executeStatement("INSERT INTO permissions (userID, roleID) VALUES (?, 2)", [uid]);
    }
    res.status(200).send("Synced");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error syncing user");
  }
});

// Logout
app.get("/logout", (req, res) => {
  if (req.session) req.session.destroy();
  res.clearCookie("connect.sid");
  res.clearCookie("token");
  res.send(`
    <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js"></script>
    <script type="text/javascript">
      const firebaseConfig = {
        apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
        authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
        projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
      };
      const app = firebase.initializeApp(firebaseConfig);
      firebase.auth().signOut().then(() => {
        window.location.href = "/login";
      }).catch(() => {
        window.location.href = "/login";
      });
    </script>
    Logging out...
  `);
});

// Settings page
app.get("/settings", async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await settings.html(req), req);
    res.send(html);
  } else {
    res.redirect("/login");
  }
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
