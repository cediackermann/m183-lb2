const db = require("../../fw/db");

async function search(req) {
  if (req.query.userid === undefined || req.query.terms === undefined) {
    return "Not enough information to search";
  }

  let userid = req.query.userid;
  let terms = req.query.terms;
  let result = "";

  const query = "select ID, title, state from tasks where userID = ? and title like ?"
  let stmt = await db.executeStatement(
    query,
    [userid, "%" + terms + "%"],
  );
  if (stmt.length > 0) {
    stmt.forEach(function (row) {
      result += row.title + " (" + row.state + ")<br />";
    });
  }

  return result;
}

module.exports = {
  search: search,
};
