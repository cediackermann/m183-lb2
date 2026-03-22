const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const searchV2Controller = require('../controllers/searchV2Controller');
const { activeUserSession } = require('../middleware/authMiddleware');

router.post('/', async (req, res) => {
  if (activeUserSession(req)) {
    let html = await searchController.html(req);
    res.send(html);
  } else {
    res.status(401).send('Unauthorized');
  }
});

router.get('/v2/', async (req, res) => {
  if (activeUserSession(req)) {
    let result = await searchV2Controller.search(req);
    res.send(result);
  } else {
    res.status(401).send('Unauthorized');
  }
});

module.exports = router;
