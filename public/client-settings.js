import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    getAuth,
    multiFactor,
    TotpMultiFactorGenerator,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        checkMfaStatus();
    } else {
        document.getElementById('mfa-status').innerText = 'You must be logged into Firebase to change settings.';
    }
});

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

window.disableMfa = function () {
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
};

window.enrollMfa = async function () {
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
        qrContainer.innerHTML = "<h4>Scan this QR code with Google Authenticator or Authy</h4><div id='qr'></div><br><input type='text' id='enroll-code' placeholder='Enter Code'><button type='button' onclick='finalizeMfa()'>Finalize Setup</button>";
        new QRCode(document.getElementById('qr'), secret.generateQrCodeUrl('cedi-app', currentUser.email));
        errorMsg.style.color = 'blue';
        errorMsg.innerText = 'Use your Authenticator App to scan the code below.';
        document.getElementById('mfa-enroll-btn').style.display = 'none';
    }).catch((e) => {
        errorMsg.style.color = 'red';
        errorMsg.innerText = e.message;
    });
};

window.finalizeMfa = function () {
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
};
