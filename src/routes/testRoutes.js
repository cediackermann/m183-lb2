import { Router } from 'express';
const router = Router();
import { userList, updateUserRole } from '../controllers/adminController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';

// T-01: Test routes are only mounted in dev mode (see server.js).
// Additionally guarded by isAdmin to prevent privilege escalation even in dev.
const VALID_ROLE_IDS = [1, 2];

router.get('/users', async (req, res) => {
  if (!(await isAdmin(req))) {
    return res.status(403).send('Forbidden');
  }
  let html = await wrapContent(await userList(req, '/test/users/role'), req);
  res.send(`
    <link rel="stylesheet" href="/css/auth.css">
    <div class="test-warning">
      <strong>TEST MODE:</strong> This page allows admins to manage user roles for debugging purposes.
    </div>
    ${html}
  `);
});

router.post('/users/role', async (req, res) => {
  if (!(await isAdmin(req))) {
    return res.status(403).send('Forbidden');
  }
  const { userID, roleID } = req.body;
  const parsedRoleID = parseInt(roleID, 10);
  if (!VALID_ROLE_IDS.includes(parsedRoleID)) {
    return res.status(400).send('Invalid role');
  }
  try {
    await updateUserRole(userID, parsedRoleID);
    res.redirect('/test/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating user role');
  }
});

export default router;
