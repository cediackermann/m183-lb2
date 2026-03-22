import { Router } from 'express';
const router = Router();
import { userList } from '../controllers/adminController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';

router.get('/users', async (req, res) => {
  if (await isAdmin(req)) {
    let html = await wrapContent(await userList(), req);
    res.send(html);
  } else {
    res.status(403).send('403 Forbidden: You do not have permission to view this page.');
  }
});

export default router;
