const express = require('express');
const router = express.Router();
const taskEditController = require('../controllers/taskEditController');
const taskSaveController = require('../controllers/taskSaveController');
const taskDeleteController = require('../controllers/taskDeleteController');
const { activeUserSession } = require('../middleware/authMiddleware');
const { wrapContent } = require('../views/utils');

router.get('/edit', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskEditController.html(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

router.post('/savetask', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskSaveController.html(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

router.post('/delete', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await taskDeleteController.html(req), req);
    res.send(html);
  } else {
    res.redirect('/');
  }
});

module.exports = router;
