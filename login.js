const db = require("./fw/db");
const bcrypt = require("bcrypt");

async function handleLogin(req, res) {
  let msg = "";
  let user = { username: "", userid: 0 };

  if (
    typeof req.body.username !== "undefined" &&
    typeof req.body.password !== "undefined"
  ) {
    // Get username and password from the form and call the validateLogin
    let result = await validateLogin(req.body.username, req.body.password);

    if (result.valid) {
      // Login is correct. Store user information to be returned.
      user.username = req.body.username;
      user.userid = result.userId;
      msg = result.msg;
    } else {
      msg = result.msg;
    }
  }

  return { html: msg + getHtml(), user: user };
}

function startUserSession(req, res, user) {
  req.session.regenerate((err) => {
    if (err) {
      return res.redirect("/login");
    }

    req.session.loggedin = true;
    req.session.userid = user.userid;
    req.session.username = user.username;

    req.session.save((err) => {
      if (err) {
        return res.redirect("/login");
      }
      res.redirect("/");
    });
  });
}

async function validateLogin(username, password) {
  let result = { valid: false, msg: "", userId: 0 };

  const query = `SELECT id, username, password FROM users WHERE username= ?`;
  try {
    const results = await db.executeStatement(query, [username]);

    if (results.length > 0) {
      // Bind the result variables
      let db_id = results[0].id;
      let db_username = results[0].username;
      let db_password = results[0].password;

      const match = await bcrypt.compare(password, db_password);
      // Verify the password
      if (match) {
        result.userId = db_id;
        result.valid = true;
        result.msg = "login correct";
      } else {
        // Password is incorrect
        result.msg = "Incorrect password";
      }
    } else {
      // Username does not exist
      result.msg = "Username does not exist";
    }
    //console.log(fields); // fields contains extra meta data about results, if available
  } catch (err) {
    console.log(err);
  }

  return result;
}

function getHtml() {
  return `
    <h2>Login</h2>

    <form id="form" method="post" action="/login">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" class="form-control size-medium" name="username" id="username">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password">
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Login" />
        </div>
    </form>`;
}

module.exports = {
  handleLogin: handleLogin,
  startUserSession: startUserSession,
};
