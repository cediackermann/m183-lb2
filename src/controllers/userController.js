export async function user(req) {
  let token = req && req.csrfToken ? req.csrfToken() : "";
  return `
    <link rel="stylesheet" href="/css/auth.css">
    <h2>Settings</h2>
    <div id="mfa-status" class="settings-section">Checking MFA Status...</div>
    <div id="mfa-enroll-btn" class="hidden mfa-section">
        <button id="enroll-mfa-btn" type="button" class="btn size-auto">Setup Authenticator (TOTP)</button>
    </div>
    <div id="mfa-disable-btn" class="hidden mfa-section">
        <button id="disable-mfa-btn" type="button" class="btn size-auto">Disable Authenticator (TOTP)</button>
    </div>
    <div id="qr-code-container" class="hidden mfa-section"></div>
    <div id="error-msg" class="error-msg error status-message"></div>

    <script nonce="${req.nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <script type="text/javascript" nonce="${req.nonce}">
      window.CSRF_TOKEN = "${token}";
    </script>
    <script type="module" nonce="${req.nonce}" src="/js/settings.js"></script>
  `;
}