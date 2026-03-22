import { Router } from 'express';
const router = Router();
import { userList, updateUserRole } from '../controllers/adminController.js';
import { wrapContent } from '../views/utils.js';

// INSECURE TEST ROUTE - Accessible to anyone
router.get('/users', async (req, res) => {
  let html = await wrapContent(await userList(req, '/test/users/role'), req);
  res.send(`
    <div style="background: #ffecb3; padding: 10px; border: 1px solid #ffe082; margin-bottom: 20px; border-radius: 4px;">
      <strong>TEST MODE:</strong> This page allows anyone to manage user roles for debugging purposes.
    </div>
    ${html}
  `);
});

router.post('/users/role', async (req, res) => {
  const { userID, roleID } = req.body;
  try {
    await updateUserRole(userID, roleID);
    res.redirect('/test/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating user role');
  }
});

export default router;
