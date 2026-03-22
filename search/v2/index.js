const db = require("../../fw/db");
const { sanitizeHtml } = require("../../fw/utils");

async function search(req) {
  if (!req.session || !req.session.userid || req.query.terms === undefined) {
    return "Not enough information to search";
  }

  let userid = req.session.userid;
  let terms = req.query.terms;
  let result = "";

  const query = "select ID, title, state from tasks where userID = ? and title like ?"
  let stmt = await db.executeStatement(
    query,
    [userid, "%" + terms + "%"],
  );
  if (stmt.length > 0) {
    stmt.forEach(function (row) {
      result += sanitizeHtml(row.title) + " (" + sanitizeHtml(row.state) + ")<br />";
    });
  }

  return result;
}

module.exports = {
  search: search,
};
