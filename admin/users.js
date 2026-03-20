const db = require("../fw/db");
const { sanitizeHtml } = require("../fw/utils");

async function getHtml() {
  let html = "";
  let result = await db.executeStatement(
    "SELECT users.ID, users.username, roles.title FROM users INNER JOIN permissions ON users.ID = permissions.userID INNER JOIN roles ON permissions.roleID = roles.ID ORDER BY username"
  );

  html += `
    <h2>User List</h2>  

    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
        </tr>`;

  result.map(function (record) {
    html += `
      <tr>
        <td>${sanitizeHtml(record.ID.toString())}</td>
        <td>${sanitizeHtml(record.username)}</td>
        <td>${sanitizeHtml(record.title)}</td>
      </tr>`;
  });

  html += `
    </table>`;

  return html;
}

module.exports = { html: getHtml() };
