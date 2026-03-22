import { taskList } from "../../user/tasklist.js";
import { backgroundSearch } from "../../user/backgroundsearch.js";
import { sanitizeHtml } from "../views/utils.js";

export async function index(req) {
  let taskListHtml = await taskList(req);
  return (
    `<h2>Welcome, ` +
    sanitizeHtml(req.session.username) +
    `!</h2>` +
    taskListHtml +
    "<hr />" +
    backgroundSearch(req)
  );
}