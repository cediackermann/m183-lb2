import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    getAuth,
    multiFactor,
    TotpMultiFactorGenerator,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

let auth;
let currentUser = null;

async function init() {
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            checkMfaStatus();
        } else {
            document.getElementById('mfa-status').innerText = 'You must be logged into Firebase to change settings.';
        }
    });

    const enrollBtn = document.getElementById('enroll-mfa-btn');
    if (enrollBtn) enrollBtn.addEventListener('click', enrollMfa);

    const disableBtn = document.getElementById('disable-mfa-btn');
    if (disableBtn) disableBtn.addEventListener('click', disableMfa);
}

init();

function checkMfaStatus() {
    const enrolledSession = multiFactor(currentUser);
    const enrolled = enrolledSession.enrolledFactors;
    if (enrolled.length > 0) {
        document.getElementById('mfa-status').innerHTML = '<strong>MFA is Enabled</strong>';
        document.getElementById('mfa-disable-btn').style.display = 'block';
        document.getElementById('mfa-enroll-btn').style.display = 'none';
    } else {
        document.getElementById('mfa-status').innerHTML = '<strong>MFA is Disabled</strong>';
        document.getElementById('mfa-enroll-btn').style.display = 'block';
        document.getElementById('mfa-disable-btn').style.display = 'none';
    }
}

function disableMfa() {
    const errorMsg = document.getElementById('error-msg');
    const userMultifactor = multiFactor(currentUser);
    const factors = userMultifactor.enrolledFactors;
    let promises = [];
    factors.forEach((f) => {
        promises.push(userMultifactor.unenroll(f));
    });
    Promise.all(promises).then(() => {
        document.getElementById('error-msg').style.color = 'green';
        document.getElementById('error-msg').innerText = 'MFA successfully disabled!';
        checkMfaStatus();
    }).catch((e) => {
        errorMsg.style.color = 'red';
        errorMsg.innerText = e.message;
    });
}

async function enrollMfa() {
    const errorMsg = document.getElementById('error-msg');
    if (!currentUser) return;

    try {
        await currentUser.reload();
    } catch (e) {
        console.error(e);
    }

    if (!currentUser.emailVerified) {
        errorMsg.style.color = 'red';
        errorMsg.innerText = 'Please verify your email first before enrolling in MFA. Check your inbox and reload the page.';
        return;
    }

    multiFactor(currentUser).getSession().then((session) => {
        return TotpMultiFactorGenerator.generateSecret(session);
    }).then((secret) => {
        const qrContainer = document.getElementById('qr-code-container');
        qrContainer.style.display = 'block';
        window.currentTotpSecret = secret;
        qrContainer.innerHTML = "<h4>Scan this QR code with Google Authenticator or Authy</h4><div id='qr'></div><br><input type='text' id='enroll-code' placeholder='Enter Code'>";
        
        const finalizeBtn = document.createElement('button');
        finalizeBtn.type = 'button';
        finalizeBtn.innerText = 'Finalize Setup';
        finalizeBtn.addEventListener('click', finalizeMfa);
        qrContainer.appendChild(finalizeBtn);

        new QRCode(document.getElementById('qr'), secret.generateQrCodeUrl('cedi-app', currentUser.email));
        errorMsg.style.color = 'blue';
        errorMsg.innerText = 'Use your Authenticator App to scan the code below.';
        document.getElementById('mfa-enroll-btn').style.display = 'none';
    }).catch((e) => {
        errorMsg.style.color = 'red';
        errorMsg.innerText = e.message;
    });
}

function finalizeMfa() {
    const code = document.getElementById('enroll-code').value;
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(window.currentTotpSecret, code);
    multiFactor(currentUser).enroll(assertion, 'TOTP Authenticator').then(() => {
        document.getElementById('qr-code-container').innerHTML = '';
        document.getElementById('error-msg').style.color = 'green';
        document.getElementById('error-msg').innerText = 'MFA successfully enrolled!';
        checkMfaStatus();
    }).catch((e) => {
        document.getElementById('error-msg').style.color = 'red';
        document.getElementById('error-msg').innerText = e.message;
    });
}
