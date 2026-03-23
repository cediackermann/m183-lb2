import { Router } from 'express';
const router = Router();
import { handleLogin } from '../controllers/authController.js';
import { wrapContent } from '../views/utils.js';
import rateLimit from 'express-rate-limit';
import { executeStatement } from '../config/db.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes'
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

router.post('/auth-sync', async (req, res) => {
  const idToken = req.body.idToken;
  if (idToken) {
    res.cookie('token', idToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  }

  const uid = req.body.uid || req.session.userid;
  if (!uid) {
    return res.status(401).send('Unauthorized');
  }

  let email = req.body.email || 'user@example.com';
  try {
    const existing = await executeStatement('SELECT id FROM users WHERE id=?', [uid]);
    if (existing.length === 0) {
      await executeStatement('INSERT INTO users (id, username) VALUES (?, ?)', [uid, email]);
      await executeStatement('INSERT INTO permissions (userID, roleID) VALUES (?, 2)', [uid]);
    }
    res.status(200).send('Synced');
  } catch (err) {
    console.error(err);
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