import { executeStatement } from "../src/config/db.js";
import { sanitizeHtml } from "../src/views/utils.js";

export async function taskList(req) {
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
  let result = await executeStatement(query, [req.session.userid]);
  result.forEach(function (row) {
    const csrfToken = req.csrfToken ? req.csrfToken() : "";
    html += `
            <tr>
                <td>${sanitizeHtml(row.ID)}</td>
                <td class="wide">${sanitizeHtml(row.title)}</td>
                <td>${sanitizeHtml(ucfirst(row.state))}</td>
                <td>
                    <a href="edit?id=${sanitizeHtml(row.ID)}">edit</a> | 
                    
                    <form action="delete" method="POST" style="display:inline;" class="delete-task-form">
                       <input type="hidden" name="_csrf" value="${csrfToken}" />
                       <input type="hidden" name="id" value="${sanitizeHtml(row.ID)}" />
                       <button type="submit" style="background:none; border:none; color:blue; text-decoration:underline; cursor:pointer; padding:0; font-family:inherit; font-size:inherit;">delete</button>
                    </form>
                </td>
            </tr>`;
  });

  html += `
        </table>
        <script nonce="${req.nonce}">
          document.addEventListener('submit', function(e) {
            if (e.target && e.target.classList.contains('delete-task-form')) {
              if (!confirm('Delete task?')) {
                e.preventDefault();
              }
            }
          });
        </script>
    </section>`;

  return html;
}

function ucfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}