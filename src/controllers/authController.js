export async function handleLogin(req, res) {
  return { html: getHtml(req), user: { username: "", userid: 0 } };
}

export function startUserSession(req, res, user) {
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
        <span id="tab-login" class="tab-btn active-tab">Login</span>
        <span id="tab-register" class="tab-btn">Register</span>
      </div>
      <br>

      <div id="error-msg" style="color:red; margin-bottom: 10px;"></div>

      <form id="auth-form">
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
              <button id="enroll-mfa-btn" type="button" class="btn size-auto">Setup Authenticator (TOTP)</button>
          </div>
          <div id="continue-btn" style="display:none; margin-top: 15px;">
              <button id="skip-btn" type="button" class="btn size-auto">Skip & Continue to App</button>
          </div>
          <div id="qr-code-container" style="display:none; margin-top: 15px;"></div>
      </form>
    </div>

    <script nonce="${req.nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <script type="text/javascript" nonce="${req.nonce}">
      window.CSRF_TOKEN = "${token}";
    </script>
    <script type="module" nonce="${req.nonce}" src="/js/login.js"></script>
  `;
}
