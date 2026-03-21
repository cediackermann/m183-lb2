async function getHtml(req) {
    let token = req && req.csrfToken ? req.csrfToken() : "";
    return `
    <h2>Settings</h2>
    <div id="mfa-status" style="margin-bottom: 20px;">Checking MFA Status...</div>
    <div id="mfa-enroll-btn" style="display:none; margin-top: 15px;">
        <button type="button" class="btn size-auto" onclick="window.enrollMfa()">Setup Authenticator (TOTP)</button>
    </div>
    <div id="mfa-disable-btn" style="display:none; margin-top: 15px;">
        <button type="button" class="btn size-auto" onclick="window.disableMfa()">Disable Authenticator (TOTP)</button>
    </div>
    <div id="qr-code-container" style="display:none; margin-top: 15px;"></div>
    <div id="error-msg" style="color:red; margin-top: 10px;"></div>

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
    <script type="module" src="/client-settings.js"></script>
  `;
}

module.exports = { html: getHtml };
