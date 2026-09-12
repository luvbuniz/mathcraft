/* Stackadoo — Google sign-in overlay.
   Loaded last so we can replace the popup-only Google flow (which breaks in the
   Play app, Safari, and any browser that swallows the Firebase popup). */
(function () {
  var CLIENT_ID = '587953023716-dhg7m2id8vc597jkdcr8o15clfbo0oi9.apps.googleusercontent.com';

  function $(id) { return document.getElementById(id); }

  function gisReady() {
    return window.google && google.accounts && google.accounts.id;
  }

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
    if (((e && e.code) || '').indexOf('account-exists-with-different-credential') >= 0 && email && window.fbAuth && fbAuth.fetchSignInMethodsForEmail) {
      fbAuth.fetchSignInMethodsForEmail(email).then(function (methods) {
        if ((methods || []).indexOf('password') >= 0)
          authMsg('This Google email already has a password account. Sign in with email & password below (same Gmail) to get your worlds back.', true);
        else authMsg(friendlyAuthErr(e), true);
      }).catch(function () { authMsg(friendlyAuthErr(e), true); });
      return;
    }
    authMsg(friendlyAuthErr(e), true);
  }

  function finishIdToken(idToken) {
    var cred = firebase.auth.GoogleAuthProvider.credential(idToken);
    return fbAuth.signInWithCredential(cred).then(function () {
      authMsg('Signed in! Syncing your worlds…');
      if (typeof authAutoClose === 'function') authAutoClose();
    }).catch(fail);
  }

  function popupFlow() {
    if (typeof cloudReady === 'function' && !cloudReady()) { authMsg('Sign-in needs an internet connection.', true); return; }
    var p = new firebase.auth.GoogleAuthProvider();
    p.addScope('email');
    p.setCustomParameters({ prompt: 'select_account' });
    var standalone = (typeof IS_ANDROID_APP !== 'undefined' && IS_ANDROID_APP) ||
      (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ||
      !!navigator.standalone;
    if (standalone) {
      authMsg('Taking you to Google…');
      fbAuth.signInWithRedirect(p).catch(fail);
      return;
    }
    fbAuth.signInWithPopup(p).then(function () {
      authMsg('Signed in! Syncing your worlds…');
      if (typeof authAutoClose === 'function') authAutoClose();
    }).catch(function (e) {
      var c = (e && e.code) || '';
      if (c.indexOf('popup-blocked') >= 0) {
        authMsg('Popup blocked — trying a full-page Google sign-in…');
        fbAuth.signInWithRedirect(p).catch(fail);
        return;
      }
      fail(e);
    });
  }

  window.authGoogle = function () {
    if (typeof cloudReady === 'function' && !cloudReady()) { authMsg('Sign-in needs an internet connection.', true); return; }
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

  function paintBtn() {
    var btn = $('authGoogleBtn');
    var wrap = $('authGoogleWrap');
    if (!wrap && btn && btn.parentNode) {
      wrap = document.createElement('div');
      wrap.id = 'authGoogleWrap';
      wrap.style.cssText = 'display:flex;justify-content:center;min-height:44px;margin-bottom:4px';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
    }
    if (!wrap || (typeof fbUser !== 'undefined' && fbUser) || !gisReady()) return;
    try {
      wrap.innerHTML = '';
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: function (resp) { if (resp && resp.credential) finishIdToken(resp.credential); },
        auto_select: false,
        itp_support: true
      });
      google.accounts.id.renderButton(wrap, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width: 280, shape: 'pill' });
    } catch (e) {
      wrap.innerHTML = '<button id="authGoogleBtn" class="libBtn" style="background:#fff;border:2px solid #dadce0;color:#3c4043;font-weight:bold">Continue with Google</button>';
      var b = $('authGoogleBtn'); if (b) b.onclick = function () { authGoogle(); };
    }
  }

  var _open = window.openAuth;
  window.openAuth = function () {
    if (typeof _open === 'function') _open();
    paintBtn();
  };

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'authGoogleBtn' || (t.closest && t.closest('#authGoogleBtn'))) {
      e.preventDefault();
      authGoogle();
    }
  }, true);

  var n = 0;
  var timer = setInterval(function () {
    n++;
    if (gisReady()) { clearInterval(timer); var p = $('authPopup'); if (p && p.style.display === 'flex') paintBtn(); }
    else if (n > 40) clearInterval(timer);
  }, 150);

  if (window.fbAuth && fbAuth.getRedirectResult) {
    fbAuth.getRedirectResult().then(function () {}).catch(fail);
  }
})();
