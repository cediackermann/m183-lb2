const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');
const { wrapContent } = require('../views/utils');

router.get('/users', async (req, res) => {
  if (await isAdmin(req)) {
    let html = await wrapContent(await adminController.html, req);
    res.send(html);
  } else {
    res.status(403).send('403 Forbidden: You do not have permission to view this page.');
  }
});

module.exports = router;
