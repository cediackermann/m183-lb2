const db = require("./fw/db");

async function getHtml(req) {
  let html = "";
  let taskId = "";
  let userid = req.session.userid;

  if (req.body.id !== undefined && req.body.id.trim() !== "") {
    taskId = req.body.id;
    // We add the userID check here to prevent IDOR
    let stmt = await db.executeStatement(
        "SELECT ID FROM tasks WHERE ID = ? AND userID = ?",
        [taskId, userid]
    );

    if (stmt.length === 0) {
      return "<span class='info info-error'>Error: Task not found or permission denied. <a href='/'>Go back</a></span>";
    }
  }

  if (req.body.title !== undefined && req.body.state !== undefined) {
    let title = req.body.title.trim();
    let state = req.body.state.toLowerCase();

    const validStates = ["open", "in progress", "done"];
    if (!validStates.includes(state)) {
      return "<span class='info info-error'>Invalid state provided. <a href='/'>Go back</a></span>";
    }

    if (title.length === 0) {
      return "<span class='info info-error'>Title cannot be empty. <a href='/'>Go back</a></span>";
    }

    if (taskId === "") {
      await db.executeStatement(
          "INSERT INTO tasks (title, state, userID) VALUES (?, ?, ?)",
          [title, state, userid]
      );
      html += "<span class='info info-success'>Task successfully created. <a href='/'>Go back</a></span>";
    } else {
      await db.executeStatement(
          "UPDATE tasks SET title = ?, state = ? WHERE ID = ? AND userID = ?",
          [title, state, taskId, userid]
      );
      html += "<span class='info info-success'>Task successfully updated. <a href='/'>Go back</a></span>";
    }
  } else {
    html += "<span class='info info-error'>Missing required fields. <a href='/'>Go back</a></span>";
  }

  return html;
}

module.exports = { html: getHtml };