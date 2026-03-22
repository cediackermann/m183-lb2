import { executeStatement } from "../config/db.js";
import { sanitizeHtml } from "../views/utils.js";

export async function userList(req, actionUrl = "/admin/users/role") {
  let html = "";
  let result = await executeStatement(
    "SELECT users.ID, users.username, roles.title FROM users INNER JOIN permissions ON users.ID = permissions.userID INNER JOIN roles ON permissions.roleID = roles.ID ORDER BY username"
  );

  let csrfToken = req.csrfToken ? req.csrfToken() : "";

  html += `
    <h2>User List (Admin Preview)</h2>  

    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
        </tr>`;

  result.map(function (record) {
    html += `
      <tr>
        <td>${sanitizeHtml(record.ID.toString())}</td>
        <td>${sanitizeHtml(record.username)}</td>
        <td>${sanitizeHtml(record.title)}</td>
        <td>
          <form action="${actionUrl}" method="POST" style="display:inline;">
            <input type="hidden" name="userID" value="${sanitizeHtml(record.ID.toString())}">
            <input type="hidden" name="roleID" value="${record.title === 'Admin' ? 2 : 1}">
            <input type="hidden" name="_csrf" value="${csrfToken}">
            <button type="submit" class="btn size-auto">
              ${record.title === 'Admin' ? 'Demote to User' : 'Promote to Admin'}
            </button>
          </form>
        </td>
      </tr>`;
  });

  html += `
    </table>`;

  return html;
}

export async function updateUserRole(userID, roleID) {
  let query = "UPDATE permissions SET roleID = ? WHERE userID = ?";
  return await executeStatement(query, [roleID, userID]);
}

export default { userList, updateUserRole };
