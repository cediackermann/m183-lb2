const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const { activeUserSession } = require('../middleware/authMiddleware');
const { wrapContent } = require('../views/utils');

router.get('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await indexController.html(req), req);
    res.send(html);
  } else {
    res.redirect('login');
  }
});

router.post('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await indexController.html(req), req);
    res.send(html);
  } else {
    res.redirect('login');
  }
});

module.exports = router;
