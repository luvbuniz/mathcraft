(function (root) {
  'use strict';
  const RESET_MESSAGE = 'If this address has a password account, a reset email is on its way. Check your inbox and spam folder.';
  function fail(code) { return Object.assign(new Error(code), {code}); }
  function allowed(config, origin) {
    const localTest = config.allowLocalTesting === true && /^http:\/\/localhost(?::[0-9]+)?$/.test(origin);
    return config.enabled === true && (origin.startsWith('https://') || localTest) && config.allowedOrigins.includes(origin);
  }
  function explain(error) {
    const messages = {
      'auth/preview': 'This local preview does not send emails or sign in. The new sign-in will be connected when the website is ready to go live.',
      'auth/invalid-email': 'Please enter a valid parent email address.',
      'auth/expired-action-code': 'This link has expired. Request a fresh sign-in link below.',
      'auth/invalid-action-code': 'This link is no longer valid, or the email does not match. Check the email address or request a fresh link.',
      'auth/invalid-credential': 'Check your email and password, or request a fresh sign-in link.',
      'auth/missing-password': 'Enter your existing password, or request a sign-in link.',
      'auth/too-many-requests': 'Please wait a little before trying again. You can also use Google if that is how you normally sign in.',
      'auth/quota-exceeded': 'Email sign-in is temporarily unavailable. Please try later, or use your usual Google sign-in.',
      'auth/network-request-failed': 'We could not connect. Check your internet connection and try again.',
      'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for Stackadoo, then choose Continue with Google again.',
      'auth/popup-closed-by-user': 'The Google window was closed. You can try again whenever you are ready.',
      'auth/cancelled-popup-request': 'Another sign-in window is already open. Please finish there.',
      'auth/account-exists-with-different-credential': 'Please use your original sign-in method for this family. Your saved progress has not been changed.',
      'auth/user-disabled': 'We could not sign in. Please contact Stackadoo support for help.',
      'auth/operation-not-allowed': 'This sign-in option is not available yet. Please use the existing browser-game sign-in.',
      'auth/unauthorized-domain': 'Sign-in is not available at this website address. Please use the official Stackadoo website.',
      'auth/invalid-continue-uri': 'The email return page is not ready. Please contact Stackadoo support.',
      'auth/unauthorized-continue-uri': 'The email return page is not ready. Please contact Stackadoo support.',
      'auth/busy': 'Please finish the current request first.',
      'auth/cooldown': 'Please wait one minute before requesting another email.',
      'auth/signed-in': 'You are already signed in. Sign out first to use another parent account.'
    };
    return messages[error?.code] || 'We could not complete sign-in. Please try again, or contact Stackadoo support.';
  }
  function create({config, sdk, auth, origin, now = Date.now}) {
    let busy = false, nextEmailAt = 0;
    function guard() { if (!allowed(config, origin)) throw fail('auth/preview'); }
    function email(value) {
      const result = String(value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw fail('auth/invalid-email');
      return result;
    }
    async function exclusive(task, sendingEmail = false) {
      guard();
      if (busy) throw fail('auth/busy');
      if (sendingEmail && now() < nextEmailAt) throw fail('auth/cooldown');
      busy = true;
      try {
        const result = await task();
        if (sendingEmail) nextEmailAt = now() + 60000;
        return result;
      } finally { busy = false; }
    }
    function callbackURL() {
      const url = new URL(config.callbackPath, origin);
      if (url.origin !== origin || url.search || url.hash) throw fail('auth/invalid-continue-uri');
      return url.href;
    }
    return {
      sendLink(value) {
        return exclusive(async () => {
          if (auth.currentUser) throw fail('auth/signed-in');
          await sdk.sendSignInLinkToEmail(auth, email(value), {url: callbackURL(), handleCodeInApp: true});
          return 'Check your email for your sign-in link. Open the newest link, then confirm your email to finish. Check your spam folder too.';
        }, true);
      },
      resetPassword(value) {
        return exclusive(async () => {
          try { await sdk.sendPasswordResetEmail(auth, email(value)); }
          catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
          return RESET_MESSAGE;
        }, true);
      },
      completeLink(value, link) {
        return exclusive(async () => {
          if (auth.currentUser) throw fail('auth/signed-in');
          if (!sdk.isSignInWithEmailLink(auth, link)) throw fail('auth/invalid-action-code');
          return sdk.signInWithEmailLink(auth, email(value), link);
        });
      },
      google() {
        return exclusive(() => {
          if (auth.currentUser) throw fail('auth/signed-in');
          const provider = new sdk.GoogleAuthProvider();
          provider.setCustomParameters({prompt: 'select_account'});
          return sdk.signInWithPopup(auth, provider);
        });
      },
      password(value, password) {
        return exclusive(() => {
          if (auth.currentUser) throw fail('auth/signed-in');
          if (!password) throw fail('auth/missing-password');
          return sdk.signInWithEmailAndPassword(auth, email(value), password);
        });
      },
      signOut() { return exclusive(() => sdk.signOut(auth)); }
    };
  }
  root.StackadooAuth = {allowed, create, explain, RESET_MESSAGE};
})(typeof window === 'undefined' ? globalThis : window);
