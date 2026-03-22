const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { activeUserSession } = require('../middleware/authMiddleware');
const { wrapContent } = require('../views/utils');

router.get('/settings', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await wrapContent(await userController.html(req), req);
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

module.exports = router;
