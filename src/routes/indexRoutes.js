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

router.post('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await _html(req), req);
    res.send(html);
  } else {
    res.redirect('login');
  }
});

export default router;
