const tasklist = require("./user/tasklist");
const bgSearch = require("./user/backgroundsearch");
const { sanitizeHtml } = require("./fw/utils");

async function getHtml(req) {
  let taskListHtml = await tasklist.html(req);
  return (
    `<h2>Welcome, ` +
    sanitizeHtml(req.cookies.username) +
    `!</h2>` +
    sanitizeHtml(taskListHtml) +
    "<hr />" +
    sanitizeHtml(bgSearch.html(req))
  );
}

module.exports = {
  html: getHtml,
};
