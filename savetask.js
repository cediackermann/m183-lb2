const db = require("./fw/db");

async function getHtml(req) {
  let html = "";
  let taskId = "";
  let userid = req.session.userid;

  // see if the id exists in the database
  if (req.body.id !== undefined && req.body.id.length !== 0) {
    taskId = req.body.id;
    // We add the userID check here to prevent IDOR
    let stmt = await db.executeStatement(
        "SELECT ID FROM tasks WHERE ID = ? AND userID = ?",
        [taskId, userid]
    );

    if (stmt.length === 0) {
      // If task doesn't exist OR doesn't belong to the user, reset taskId
      taskId = "";
    }
  }

  if (req.body.title !== undefined && req.body.state !== undefined) {
    let state = req.body.state;
    let title = req.body.title;

    if (taskId === "") {
      await db.executeStatement(
          "INSERT INTO tasks (title, state, userID) VALUES (?, ?, ?)",
          [title, state, userid]
      );
    } else {
      await db.executeStatement(
          "UPDATE tasks SET title = ?, state = ? WHERE ID = ? AND userID = ?",
          [title, state, taskId, userid]
      );
    }

    html += "<span class='info info-success'>Update successfull</span>";
  } else {
    html += "<span class='info info-error'>No update was made</span>";
  }

  return html;
}

module.exports = { html: getHtml };
