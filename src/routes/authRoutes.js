import { Router } from 'express';
const router = Router();
import { handleLogin } from '../controllers/authController.js';
import { wrapContent } from '../views/utils.js';
import rateLimit from 'express-rate-limit';
import { executeStatement } from '../config/db.js';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { auditLog } from '../utils/auditLogger.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes'
});

// T-06: Apply rate limiting to the real authentication entry point /auth-sync
const authSyncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again after 15 minutes'
});

router.get('/login', async (req, res) => {
  let content = await handleLogin(req, res);
  let html = await wrapContent(content.html, req);
  res.send(html);
});

router.post('/login', loginLimiter, async (req, res) => {
  let content = await handleLogin(req, res);
  let html = await wrapContent(content.html, req);
  res.send(html);
});

router.post('/auth-sync', authSyncLimiter, async (req, res) => {
  const idToken = req.body.idToken;
  if (!idToken) {
    auditLog('AUTH_SYNC_FAILED', null, 'Missing idToken');
    return res.status(401).send('Unauthorized');
  }

  // T-04: Verify the idToken with Firebase Admin SDK and extract claims from it —
  // never trust uid/email provided by the client body
  let decodedToken;
  try {
    if (getApps().length === 0) {
      initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    }
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    auditLog('AUTH_SYNC_FAILED', null, 'Invalid idToken');
    return res.status(401).send('Unauthorized');
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email || 'user@example.com';

  const isProd = process.env.ENVIRONMENT === 'prod' || process.env.NODE_ENV === 'production';
  res.cookie('token', idToken, { httpOnly: true, secure: isProd, sameSite: 'strict' });

  try {
    const existing = await executeStatement('SELECT id FROM users WHERE id=?', [uid]);
    if (existing.length === 0) {
      await executeStatement('INSERT INTO users (id, username) VALUES (?, ?)', [uid, email]);
      await executeStatement('INSERT INTO permissions (userID, roleID) VALUES (?, 2)', [uid]);
    }

    // T-05: Regenerate session after successful authentication to prevent session fixation
    const sessionData = { loggedin: true, userid: uid, username: email };
    req.session.regenerate((err) => {
      if (err) {
        auditLog('AUTH_SYNC_FAILED', uid);
        return res.status(500).send('Error syncing user');
      }
      req.session.loggedin = sessionData.loggedin;
      req.session.userid = sessionData.userid;
      req.session.username = sessionData.username;
      auditLog('AUTH_SYNC_SUCCESS', uid);
      res.status(200).send('Synced');
    });
  } catch (err) {
    console.error(err);
    auditLog('AUTH_SYNC_FAILED', uid);
    res.status(500).send('Error syncing user');
  }
});

router.post('/logout', (req, res) => {
  if (req.session) req.session.destroy();
  res.clearCookie('connect.sid');
  res.clearCookie('token');
  res.send(`
    <script type="text/javascript" nonce="${req.nonce}">
      fetch('/api/firebase-config')
        .then(response => response.json())
        .then(config => {
          const scriptApp = document.createElement('script');
          scriptApp.src = "https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js";
          document.head.appendChild(scriptApp);
          scriptApp.onload = () => {
            const scriptAuth = document.createElement('script');
            scriptAuth.src = "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js";
            document.head.appendChild(scriptAuth);
            scriptAuth.onload = () => {
              firebase.initializeApp(config);
              firebase.auth().signOut().then(() => {
                window.location.href = "/login";
              }).catch(() => {
                window.location.href = "/login";
              });
            };
          };
        });
    </script>
    Logging out...
  `);
});

router.get('/logout', (req, res) => {
  res.redirect('/');
});

export default router;