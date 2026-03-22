import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { executeStatement } from '../config/db.js';

export function activeUserSession(req) {
  return req.session && req.session.loggedin === true;
}

export async function authSync(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      if (getApps().length === 0) {
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });
      }
      const decodedToken = await getAuth().verifyIdToken(token);
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

export async function isAdmin(req) {
  if (!activeUserSession(req)) return false;

  const query = "SELECT 1 FROM permissions WHERE userID = ? AND roleID = 1";
  const result = await executeStatement(query, [req.session.userid]);

  return result.length > 0;
}

export default {
  activeUserSession,
  authSync,
  isAdmin
};
