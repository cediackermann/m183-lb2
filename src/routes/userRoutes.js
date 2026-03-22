import { Router } from 'express';
const router = Router();
import { user } from '../controllers/userController.js';
import { activeUserSession } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';

router.get('/settings', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await user(req), req);
    res.send(html);
  } else {
    res.redirect('/login');
  }
});

router.get('/profile', (req, res) => {
  if (activeUserSession(req)) {
    res.send(`Welcome, ${req.session.username}! <a href="/logout">Logout</a>`);
  } else {
    res.send('Please login to view this page');
  }
});

export default router;
