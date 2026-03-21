import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  multiFactor,
  TotpMultiFactorGenerator,
  onAuthStateChanged,
  sendEmailVerification,
  getMultiFactorResolver
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);

let mode = 'login';
let mfaResolver = null;
let currentUser = null;

window.switchTab = function (newMode) {
  mode = newMode;
  document.getElementById('error-msg').innerText = '';
  if (mode === 'register') {
    document.getElementById('tab-register').classList.add('active-tab');
    document.getElementById('tab-login').classList.remove('active-tab');
    document.getElementById('confirm-group').style.display = 'block';
    document.getElementById('confirm-password').required = true;
    document.getElementById('mfa-group').style.display = 'none';
    document.getElementById('email-group').style.display = 'block';
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('tabs').style.display = 'block';
    document.getElementById('submit-btn').value = 'Register';
  } else {
    document.getElementById('tab-login').classList.add('active-tab');
    document.getElementById('tab-register').classList.remove('active-tab');
    document.getElementById('confirm-group').style.display = 'none';
    document.getElementById('confirm-password').required = false;
    document.getElementById('mfa-group').style.display = 'none';
    document.getElementById('email-group').style.display = 'block';
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('tabs').style.display = 'block';
    document.getElementById('submit-btn').value = 'Login';
  }
};

function onAuthSuccess(user) {
  currentUser = user;
  user.getIdToken().then(function (idToken) {
    document.cookie = "token=" + idToken + "; path=/; SameSite=Strict";
    fetch('/auth-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': window.CSRF_TOKEN
      },
      body: JSON.stringify({ uid: user.uid, email: user.email, _csrf: window.CSRF_TOKEN })
    }).then(() => {
      document.getElementById('tabs').style.display = 'none';
      document.getElementById('email-group').style.display = 'none';
      document.getElementById('password-group').style.display = 'none';
      document.getElementById('confirm-group').style.display = 'none';
      document.getElementById('submit-btn').style.display = 'none';
      if (mode === 'login') {
          document.getElementById('error-msg').style.color = 'green';
          document.getElementById('error-msg').innerText = 'Logged in successfully! Redirecting...';
          window.location.assign('/');
      } else {
          document.getElementById('error-msg').style.color = 'green';
          document.getElementById('error-msg').innerText = 'Account created! You can now configure MFA or continue.';
          document.getElementById('mfa-enroll-btn').style.display = 'block';
          document.getElementById('continue-btn').style.display = 'block';
      }
    });
  });
}

window.handleAuth = function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');
  errorMsg.style.color = 'red';
  errorMsg.innerText = '';

  if (mfaResolver) {
    const code = document.getElementById('totp-code').value;
    const hint = mfaResolver.hints[0];
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
    mfaResolver.resolveSignIn(assertion)
      .then((userCredential) => {
        mfaResolver = null;
        onAuthSuccess(userCredential.user);
      })
      .catch((error) => {
        errorMsg.innerText = 'Incorrect TOTP Code: ' + error.message;
      });
    return;
  }

  if (mode === 'register') {
    const confirmPassword = document.getElementById('confirm-password').value;
    if (password !== confirmPassword) {
      errorMsg.innerText = 'Passwords do not match!';
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        sendEmailVerification(userCredential.user).then(() => {
          onAuthSuccess(userCredential.user);
        }).catch((err) => {
          errorMsg.innerText = "Error sending verification email: " + err.message;
        });
      })
      .catch((error) => {
        errorMsg.innerText = error.message;
      });
  } else {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        onAuthSuccess(userCredential.user);
      })
      .catch((error) => {
        if (error.code === 'auth/multi-factor-auth-required') {
          mfaResolver = getMultiFactorResolver(auth, error);
          document.getElementById('mfa-group').style.display = 'block';
          document.getElementById('totp-code').required = true;
          document.getElementById('email-group').style.display = 'none';
          document.getElementById('password-group').style.display = 'none';
          document.getElementById('tabs').style.display = 'none';
          document.getElementById('submit-btn').value = 'Verify TOTP Code';
          errorMsg.innerText = 'Multi-Factor Authentication required.';
        } else {
          errorMsg.innerText = error.message;
        }
      });
  }
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
    errorMsg.innerText = 'Please verify your email first before enrolling in MFA. Check your inbox.';
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
    document.getElementById('error-msg').innerText = 'MFA successfully enrolled! Redirecting...';
    document.getElementById('mfa-enroll-btn').style.display = 'none';
    setTimeout(() => window.location.assign('/'), 2000);
  }).catch((e) => {
    document.getElementById('error-msg').style.color = 'red';
    document.getElementById('error-msg').innerText = e.message;
  });
};

onAuthStateChanged(auth, (user) => {
  if (user && !mfaResolver) {
    onAuthSuccess(user);
  }
});
