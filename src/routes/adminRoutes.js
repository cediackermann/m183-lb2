import { Router } from 'express';
const router = Router();
import { userList, updateUserRole } from '../controllers/adminController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { wrapContent } from '../views/utils.js';
import { auditLog } from '../utils/auditLogger.js';

// T-10: Whitelist of valid role IDs
const VALID_ROLE_IDS = [1, 2];

router.get('/users', async (req, res) => {
  if (await isAdmin(req)) {
    let html = await wrapContent(await userList(req), req);
    res.send(html);
  } else {
    auditLog('ADMIN_ACCESS_DENIED', req.session?.userid, 'GET /admin/users');
    res.status(403).send('403 Forbidden: You do not have permission to view this page.');
  }
});

router.post('/users/role', async (req, res) => {
  if (!(await isAdmin(req))) {
    auditLog('ROLE_UPDATE_DENIED', req.session?.userid, 'Not an admin');
    return res.status(403).send('Forbidden');
  }

  const { userID, roleID } = req.body;

  // T-10: Reject invalid roleID values before hitting the database
  const parsedRoleID = parseInt(roleID, 10);
  if (!VALID_ROLE_IDS.includes(parsedRoleID)) {
    auditLog('ROLE_UPDATE_INVALID', req.session?.userid, `Invalid roleID: ${roleID}`);
    return res.status(400).send('Invalid role');
  }

  try {
    await updateUserRole(userID, parsedRoleID);
    auditLog('ROLE_UPDATED', req.session?.userid, `userID=${userID} -> roleID=${parsedRoleID}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating user role');
  }
});

export default router;
