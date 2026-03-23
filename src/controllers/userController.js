export async function user(req) {
  let token = req && req.csrfToken ? req.csrfToken() : "";
  return `
    <h2>Settings</h2>
    <div id="mfa-status" style="margin-bottom: 20px;">Checking MFA Status...</div>
    <div id="mfa-enroll-btn" style="display:none; margin-top: 15px;">
        <button id="enroll-mfa-btn" type="button" class="btn size-auto">Setup Authenticator (TOTP)</button>
    </div>
    <div id="mfa-disable-btn" style="display:none; margin-top: 15px;">
        <button id="disable-mfa-btn" type="button" class="btn size-auto">Disable Authenticator (TOTP)</button>
    </div>
    <div id="qr-code-container" style="display:none; margin-top: 15px;"></div>
    <div id="error-msg" style="color:red; margin-top: 10px;"></div>

    <script nonce="${req.nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <script type="text/javascript" nonce="${req.nonce}">
      window.CSRF_TOKEN = "${token}";
    </script>
    <script type="module" nonce="${req.nonce}" src="/js/settings.js"></script>
  `;
}