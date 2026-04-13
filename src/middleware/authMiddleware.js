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
      // T-08: Track whether MFA was used during this authentication
      req.session.mfaVerified = !!(decodedToken.firebase?.sign_in_second_factor);
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
  if (result.length === 0) return false;

  // T-08: Require MFA for admin-level access
  if (!req.session.mfaVerified) return false;

  return true;
}

export default {
  activeUserSession,
  authSync,
  isAdmin
};
