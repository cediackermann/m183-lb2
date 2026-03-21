const db = require("./fw/db");

async function handleLogin(req, res) {
  return { html: getHtml(req), user: { username: "", userid: 0 } };
}

function startUserSession(req, res, user) {
  res.redirect("/");
}

function getHtml(req) {
  let token = req && req.csrfToken ? req.csrfToken() : "";
  return `
    <style>
      .auth-container { max-width: 400px; margin: 0 auto; padding: 20px; }
      .tab-btn { margin-right: 10px; cursor: pointer; padding: 5px; }
      .active-tab { font-weight: bold; border-bottom: 2px solid #000; }
    </style>
    <div class="auth-container">
      <h2>Authentication</h2>
      <div id="tabs">
        <span id="tab-login" class="tab-btn active-tab" onclick="switchTab('login')">Login</span>
        <span id="tab-register" class="tab-btn" onclick="switchTab('register')">Register</span>
      </div>
      <br>

      <div id="error-msg" style="color:red; margin-bottom: 10px;"></div>

      <form id="auth-form" onsubmit="handleAuth(event)">
          <div class="form-group" id="email-group">
              <label for="email">Email / Username</label>
              <input type="email" class="form-control" id="email">
          </div>
          <div class="form-group" id="password-group">
              <label for="password">Password</label>
              <input type="password" class="form-control" id="password">
          </div>
          <div class="form-group" id="confirm-group" style="display:none;">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" class="form-control" id="confirm-password">
          </div>
          <div class="form-group" id="mfa-group" style="display:none;">
              <label for="totp-code">Authenticator Code (TOTP)</label>
              <input type="text" class="form-control" id="totp-code" placeholder="123456">
          </div>
          <div class="form-group">
              <input type="submit" class="btn" id="submit-btn" value="Login" />
          </div>
          <div id="mfa-enroll-btn" style="display:none; margin-top: 15px;">
              <button type="button" class="btn size-auto" onclick="enrollMfa()">Setup Authenticator (TOTP)</button>
          </div>
          <div id="continue-btn" style="display:none; margin-top: 15px;">
              <button type="button" class="btn size-auto" onclick="window.location.assign('/')">Skip & Continue to App</button>
          </div>
          <div id="qr-code-container" style="display:none; margin-top: 15px;"></div>
      </form>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <script type="text/javascript">
      window.FIREBASE_CONFIG = {
        apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
        authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
        projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
        storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
        messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
        appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"
      };
      window.CSRF_TOKEN = "${token}";
    </script>
    <script type="module" src="/client-login.js"></script>
  `;
}

module.exports = {
  handleLogin: handleLogin,
  startUserSession: startUserSession,
};
