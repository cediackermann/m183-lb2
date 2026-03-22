import { executeStatement } from "../../config/db.js";

export default async function header(req) {
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TBZ 'Secure' App</title>
    <link rel="stylesheet" href="/css/style.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.0/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.1/jquery.validate.min.js"></script>
</head>
<body>
    <header>
        <div>This is the <del>in</del>secure m183 test app</div>`;

  let id = 0;
  let roleid = 0;
  if (req.session && req.session.userid) {
    id = req.session.userid;
    const query = "select users.id as userid, roles.id as roleid, roles.title as rolename from users inner join permissions on users.id = permissions.userID inner join roles on permissions.roleID = roles.id where users.id = ?";
    let stmt = await executeStatement(query, [id]);

    // load role from db
    if (stmt.length > 0) {
      roleid = stmt[0].roleid;
    }

    content += `
        <nav>
            <ul>
                <li><a href="/">Tasks</a></li>`;
    if (roleid === 1) {
      content += `
                <li><a href="/admin/users">User List</a></li>`;
    }
    content += `
                <li><a href="/settings">Settings</a></li>
                <li><a href="/logout">Logout</a></li>
            </ul>
        </nav>`;
  }

  content += `
    </header>
    <main>`;

  return content;
}
