const admin = require("firebase-admin");
const db = require('../config/db');

function activeUserSession(req) {
  return req.session && req.session.loggedin === true;
}

async function authSync(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });
      }
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
}

async function isAdmin(req) {
  if (!activeUserSession(req)) return false;

  const query = "SELECT roleID FROM permissions WHERE userID =?";
  const result = await db.executeStatement(query, [req.session.userid]);

  return result.length > 0 && result[0].roleID === 1;
}

module.exports = {
  activeUserSession,
  authSync,
  isAdmin
};
