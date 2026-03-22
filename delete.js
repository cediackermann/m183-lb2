const db = require("./fw/db");
const { sanitizeHtml } = require("./fw/utils");

async function getHtml(req) {
  let html = "";
  let taskId = req.body.id;
  let userid = req.session.userid;

  if (taskId !== undefined && taskId.length !== 0) {
    // Delete the task if the logged-in user owns it
    let result = await db.executeStatement(
      "DELETE FROM tasks WHERE ID = ? AND UserID = ?",
      [taskId, userid]
    );

    if (result.affectedRows > 0) {
      html += "<span class='info info-success'>Task successfully deleted</span>";
      // Redirect back to task list or show message
      html += "<br><a href='/'>Go back</a>";
    } else {
      html += "<span class='info info-error'>Task not found or permission denied</span>";
      html += "<br><a href='/'>Go back</a>";
    }
  } else {
    html += "<span class='info info-error'>No task specified</span>";
    html += "<br><a href='/'>Go back</a>";
  }

  return html;
}

module.exports = { html: getHtml };
