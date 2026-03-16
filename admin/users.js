const db = require("../fw/db");

async function getHtml() {
  let conn = await db.connectDB();
  let html = "";

  let [result, fields] = await conn.query(
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
        <td>${record.ID}</td>
        <td>${record.username}</td>
        <td>${record.title}</td>
      </tr>`;
  });

  html += `
    </table>`;

  return html;
}

module.exports = { html: getHtml() };
