import { executeStatement } from "../../config/db.js";

export default async function header(req) {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TBZ 'Secure' App</title>
    <link rel="stylesheet" href="/css/style.css" />
    <script nonce="${req.nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script nonce="${req.nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.5/jquery.validate.min.js"></script>
    <style>
        .logout-btn {
            background: none;
            border: none;
            color: white;
            text-decoration: none;
            cursor: pointer;
            padding: 5px 10px;
            font-family: inherit;
            font-size: inherit;
            display: block;
        }
        .logout-btn:hover {
            text-decoration: underline;
        }
    </style>
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

        const csrfToken = req.csrfToken ? req.csrfToken() : "";
        content += `
        <nav>
            <ul>
                <li><a href="/">Tasks</a></li>`;
        if (roleid === 1) {
            content += `
                <li><a href="/admin/users">User List</a></li>`;
        }
        content += `
                <li><a href="/test/users" style="color:red; font-weight:bold;">TEST: Manage Roles</a></li>
                <li><a href="/settings">Settings</a></li>
                <li>
                    <form action="/logout" method="POST" style="display:inline;">
                        <input type="hidden" name="_csrf" value="${csrfToken}" />
                        <button type="submit" class="logout-btn">Logout</button>
                    </form>
                </li>
            </ul>
        </nav>`;
    }

    content += `
    </header>
    <main>`;

    return content;
}
