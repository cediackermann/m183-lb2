import { Router } from 'express';
const router = Router();
import { search } from '../controllers/searchController.js';
import { searchV2 } from '../controllers/searchV2Controller.js';
import { activeUserSession } from '../middleware/authMiddleware.js';

router.post('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await search(req);
    res.send(html);
  } else {
    res.status(401).send('Unauthorized');
  }
});

router.get('/v2/', async (req, res) => {
  if (activeUserSession(req)) {
    let result = await searchV2(req);
    res.send(result);
  } else {
    res.status(401).send('Unauthorized');
  }
});

export default router;
