import { Router } from 'express';
const router = Router();
import { taskEdit } from '../controllers/taskEditController.js';
import { taskSave } from '../controllers/taskSaveController.js';
import { taskDelete } from '../controllers/taskDeleteController.js';
import { activeUserSession } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';

router.get('/edit', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskEdit(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

router.post('/savetask', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskSave(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

router.post('/delete', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskDelete(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

export default router;
