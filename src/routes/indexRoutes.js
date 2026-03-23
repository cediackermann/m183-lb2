import { Router } from 'express';
const router = Router();
import { index } from '../controllers/indexController.js';
import { activeUserSession } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';

router.get('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await index(req), req);
    res.send(html);
  } else {
    res.redirect('login');
  }
});

router.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
});

router.post('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await index(req), req);
    res.send(html);
  } else {
    res.redirect('login');
  }
});

export default router;
