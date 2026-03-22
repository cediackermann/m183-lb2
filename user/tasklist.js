const db = require("../src/config/db");
const { sanitizeHtml } = require("../src/views/utils");

async function getHtml(req) {
  let html = `
    <section id="list">
        <a href="edit">Create Task</a>
        <table>
            <tr>
                <th>ID</th>
                <th>Description</th>
                <th>State</th>
                <th>Actions</th>
            </tr>
    `;

  const query = "select ID, title, state from tasks where UserID = ?"
  let result = await db.executeStatement(query, [req.session.userid]);
  result.forEach(function (row) {
    const csrfToken = req.csrfToken ? req.csrfToken() : "";
    html += `
            <tr>
                <td>${row.ID}</td>
                <td class="wide">${sanitizeHtml(row.title)}</td>
                <td>${sanitizeHtml(ucfirst(row.state))}</td>
                <td>
                    <a href="edit?id=${row.ID}">edit</a> | 
                    
                    <form action="delete" method="POST" style="display:inline;" onsubmit="return confirm('Delete task?')">
                       <input type="hidden" name="_csrf" value="${csrfToken}" />
                       <input type="hidden" name="id" value="${row.ID}" />
                       <button type="submit" style="background:none; border:none; color:blue; text-decoration:underline; cursor:pointer; padding:0; font-family:inherit; font-size:inherit;">delete</button>
                    </form>
                </td>
            </tr>`;
  });

  html += `
        </table>
    </section>`;

  return html;
}

function ucfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = { html: getHtml };