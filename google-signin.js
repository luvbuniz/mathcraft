/* Stackadoo — Google sign-in overlay.
   Loaded last so a crash in the 3D world script cannot kill Sign in. */
(function () {
  var CLIENT_ID = '587953023716-dhg7m2id8vc597jkdcr8o15clfbo0oi9.apps.googleusercontent.com';
  function $(id) { return document.getElementById(id); }
  function auth() { return window.fbAuth || (typeof fbAuth !== 'undefined' ? fbAuth : null); }
  function db() { return window.fbDb || (typeof fbDb !== 'undefined' ? fbDb : null); }
  function gisReady() { return window.google && google.accounts && google.accounts.id; }
  function ready() { return !!(auth() && db()); }

  window.friendlyAuthErr = function (e) {
    var c = (e && e.code) || '';
    if (c.indexOf('email-already-in-use') >= 0) return 'That email already has an account — try Sign in instead.';
    if (c.indexOf('wrong-password') >= 0 || c.indexOf('invalid-credential') >= 0) return 'Wrong email or password.';
    if (c.indexOf('weak-password') >= 0) return 'Pick a password with at least 6 characters.';
    if (c.indexOf('invalid-email') >= 0) return 'That doesn\'t look like an email address.';
    if (c.indexOf('account-exists-with-different-credential') >= 0)
      return 'This Google email already has a password account. Sign in with email & password below (same Gmail) to restore your worlds.';
    if (c.indexOf('unauthorized-domain') >= 0)
      return 'Open stackadoo.com (not a preview link) and try Google again.';
    if (c.indexOf('operation-not-allowed') >= 0) return 'Google sign-in is turned off. Try email & password.';
    if (c.indexOf('popup-closed') >= 0 || c.indexOf('cancelled') >= 0 || c.indexOf('canceled') >= 0)
      return 'Google window closed before finishing. Tap Continue with Google again — pick the same Gmail you used before.';
    if (c.indexOf('popup-blocked') >= 0) return 'Your browser blocked the Google window. Allow popups for stackadoo.com, or use email & password.';
    if (c.indexOf('web-storage-unsupported') >= 0 || c.indexOf('operation-not-supported') >= 0)
      return 'Your browser is blocking sign-in storage (often Brave Shields or “Block all cookies”). Allow cookies for stackadoo.com, then try again.';
    if (c.indexOf('network') >= 0) return 'Network problem — check your connection.';
    if (c.indexOf('too-many-requests') >= 0) return 'Too many tries. Wait a minute, then try again.';
    var msg = (e && e.message) || '';
    if (/origin/i.test(msg)) return 'Google blocked this page. Open https://stackadoo.com/play.html and try again.';
    return 'Hmm, that didn\'t work. Try email & password with the same Gmail, or another browser.';
  };

  function fail(e) {
    var email = (e && (e.email || (e.customData && e.customData.email))) || '';
    var a = auth();
    if (((e && e.code) || '').indexOf('account-exists-with-different-credential') >= 0 && email && a && a.fetchSignInMethodsForEmail) {
      a.fetchSignInMethodsForEmail(email).then(function (methods) {
        if ((methods || []).indexOf('password') >= 0)
          authMsg('This Google email already has a password account. Sign in with email & password below (same Gmail) to get your worlds back.', true);
        else authMsg(friendlyAuthErr(e), true);
      }).catch(function () { authMsg(friendlyAuthErr(e), true); });
      return;
    }
    authMsg(friendlyAuthErr(e), true);
  }

  function ensureFirebase() {
    if (auth() && db()) return true;
    if (typeof firebase === 'undefined' || !firebase.initializeApp) return false;
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG || {
        apiKey: 'AIzaSyBNOgrfPBOKg2-J0N82g9sdJn6IHtcYJMU',
        authDomain: 'stackadoo.firebaseapp.com',
        projectId: 'stackadoo',
        storageBucket: 'stackadoo.firebasestorage.app',
        messagingSenderId: '587953023716',
        appId: '1:587953023716:web:376cd1fc01e8ea8dcb9af1'
      });
      window.fbAuth = firebase.auth();
      window.fbDb = firebase.firestore();
      window.fbAuth.onAuthStateChanged(function (u) { window.fbUser = u; if (typeof renderAuthUI === 'function') renderAuthUI(); });
      return true;
    } catch (e) { console.warn('ensureFirebase', e); return false; }
  }

  function finishIdToken(idToken) {
    var a = auth();
    var cred = firebase.auth.GoogleAuthProvider.credential(idToken);
    return a.signInWithCredential(cred).then(function () {
      authMsg('Signed in! Syncing your worlds…');
      if (typeof authAutoClose === 'function') authAutoClose();
    }).catch(fail);
  }

  function popupFlow() {
    if (!ensureFirebase() || !ready()) { authMsg('Sign-in needs an internet connection. If you are online, allow cookies for stackadoo.com (Edge: lock icon → cookies).', true); return; }
    var p = new firebase.auth.GoogleAuthProvider();
    p.addScope('email');
    p.setCustomParameters({ prompt: 'select_account' });
    var standalone = (typeof IS_ANDROID_APP !== 'undefined' && IS_ANDROID_APP) ||
      (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ||
      !!navigator.standalone;
    if (standalone) {
      authMsg('Taking you to Google…');
      auth().signInWithRedirect(p).catch(fail);
      return;
    }
    auth().signInWithPopup(p).then(function () {
      authMsg('Signed in! Syncing your worlds…');
      if (typeof authAutoClose === 'function') authAutoClose();
    }).catch(function (e) {
      var c = (e && e.code) || '';
      if (c.indexOf('popup-blocked') >= 0) {
        authMsg('Popup blocked — trying a full-page Google sign-in…');
        auth().signInWithRedirect(p).catch(fail);
        return;
      }
      fail(e);
    });
  }

  window.authGoogle = function () {
    ensureFirebase();
    if (!ready()) { authMsg('Sign-in needs an internet connection. If you are online, allow cookies for stackadoo.com (Edge: lock icon → cookies).', true); return; }
    authMsg('Opening Google…');
    if (gisReady()) {
      try {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: function (resp) {
            if (resp && resp.credential) finishIdToken(resp.credential);
            else popupFlow();
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true
        });
        var used = false;
        google.accounts.id.prompt(function (n) {
          if (!n) return;
          var missed = (n.isNotDisplayed && n.isNotDisplayed()) || (n.isSkippedMoment && n.isSkippedMoment()) || (n.isDismissedMoment && n.isDismissedMoment());
          if (missed && !used) { used = true; popupFlow(); }
        });
        return;
      } catch (e) { /* fall through */ }
    }
    popupFlow();
  };

  function showAuth() {
    if (typeof window.openAuth === 'function') {
      try { window.openAuth(); return; } catch (e) {}
    }
    if (typeof window.bootOpenAuth === 'function') { window.bootOpenAuth(); return; }
    var p = $('authPopup'); if (p) p.style.display = 'flex';
  }

  document.addEventListener('click', function (e) {
    var t = e.target; if (!t) return;
    if (t.id === 'authGoogleBtn' || (t.closest && t.closest('#authGoogleBtn'))) {
      e.preventDefault();
      authGoogle();
      return;
    }
    if (t.id === 'authEntryHome' || t.id === 'authEntryGrown' || t.id === 'authEntryUnlock' ||
        (t.closest && (t.closest('#authEntryHome') || t.closest('#authEntryGrown') || t.closest('#authEntryUnlock')))) {
      showAuth();
    }
  }, true);

  ensureFirebase();
  var a = auth();
  if (a && a.getRedirectResult) a.getRedirectResult().then(function () {}).catch(fail);
})();
