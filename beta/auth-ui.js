(async function () {
  'use strict';
  const config = window.STACKADOO_AUTH_CONFIG;
  const core = window.StackadooAuth;
  const dialog = document.getElementById('signin-dialog');
  const status = document.getElementById('auth-status');
  const emailInput = document.getElementById('parent-email');
  const form = document.getElementById('auth-email-form');
  const sendButton = document.getElementById('auth-send');
  const googleButton = document.getElementById('auth-google');
  const account = document.getElementById('auth-account');
  const signedOut = document.getElementById('auth-signed-out');
  const help = document.getElementById('auth-help');
  const notice = document.getElementById('auth-preview');
  let service, sdk, auth, pendingLink = '', busy = false, currentUser = null;
  const originalURL = new URL(location.href);
  const isCallback = originalURL.searchParams.get('mode') === 'signIn';
  // Keep the one-time code in memory only, and out of referrers/address history.
  if (isCallback) {
    pendingLink = originalURL.href;
    history.replaceState(null, '', location.pathname + '#sign-in');
    dialog.showModal();
  }
  function say(message, error = false) {
    status.textContent = message;
    status.classList.toggle('auth-error', error);
  }
  function linkMode(active) {
    sendButton.textContent = active ? 'Finish signing in' : 'Email me a sign-in link';
    document.getElementById('auth-link-instructions').hidden = !active;
    document.getElementById('auth-fresh-link').hidden = !active;
    googleButton.hidden = active;
    document.getElementById('auth-or').hidden = active;
    help.hidden = active;
  }
  function renderUser(user) {
    window.dispatchEvent(new CustomEvent('stackadoo-account', {detail: {signedIn: !!user}}));
    currentUser = user;
    account.hidden = !user;
    signedOut.hidden = !!user;
    document.querySelectorAll('[data-open="signin-dialog"]').forEach(button => button.textContent = user ? 'Parent account' : 'Sign in');
    if (user) {
      document.getElementById('auth-account-email').textContent = user.email || 'Your parent account';
      pendingLink = '';
      linkMode(false);
      say('You are signed in. Choose Find my saved players to look for your earlier games and learning records.');
    }
  }
  async function run(action) {
    if (busy) return;
    if (!service) { say(core.explain({code:'auth/preview'})); return; }
    busy = true;
    const controls = [...dialog.querySelectorAll('[data-auth-action]')];
    controls.forEach(control => control.disabled = true);
    dialog.setAttribute('aria-busy', 'true');
    say('One moment…');
    try {
      const result = await action();
      if (typeof result === 'string') say(result);
    } catch (error) {
      say(core.explain(error), true);
      if (error.code === 'auth/expired-action-code') { pendingLink = ''; linkMode(false); }
    } finally {
      busy = false;
      controls.forEach(control => control.disabled = false);
      dialog.removeAttribute('aria-busy');
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    run(() => pendingLink ? service.completeLink(emailInput.value, pendingLink) : service.sendLink(emailInput.value));
  });
  document.getElementById('auth-password-submit').addEventListener('click', () => {
    if (!emailInput.reportValidity()) return;
    const field = document.getElementById('auth-password');
    const value = field.value; field.value = '';
    run(() => service.password(emailInput.value, value));
  });
  googleButton.addEventListener('click', () => run(() => service.google()));
  document.getElementById('auth-reset').addEventListener('click', () => {
    if (!emailInput.reportValidity()) return;
    run(() => service.resetPassword(emailInput.value));
  });
  document.getElementById('auth-resend').addEventListener('click', () => {
    if (!emailInput.reportValidity()) return;
    run(() => service.sendLink(emailInput.value));
  });
  document.getElementById('auth-fresh-link').addEventListener('click', () => {
    pendingLink = ''; linkMode(false); say('Enter your email above to request a fresh sign-in link.'); emailInput.focus();
  });
  document.getElementById('auth-signout').addEventListener('click', () => run(async () => {
    await service.signOut(); emailInput.value = ''; return 'You are signed out. Your saved game progress has not been deleted.';
  }));
  dialog.addEventListener('close', () => { emailInput.value = ''; if (!currentUser) say(''); });
  if (!core.allowed(config, location.origin)) {
    notice.hidden = false;
    if (isCallback) say('This sign-in link cannot be completed in the local preview. Please return to the official Stackadoo website.', true);
    pendingLink = '';
    return;
  }
  notice.hidden = true;
  dialog.querySelectorAll('[data-auth-action]').forEach(button => button.disabled = true);
  say('Connecting securely…');
  try {
    const [appSDK, authSDK] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')
    ]);
    sdk = authSDK;
    auth = sdk.getAuth(appSDK.initializeApp(config.firebase));
    // Local QA keeps its Google session in memory, separate from the live game's session.
    if (config.allowLocalTesting === true) await sdk.setPersistence(auth, sdk.inMemoryPersistence);
    window.StackadooBetaAccount = {auth, app: auth.app};
    sdk.useDeviceLanguage(auth);
    service = core.create({config, sdk, auth, origin:location.origin});
    sdk.onAuthStateChanged(auth, renderUser, () => say('We could not read your sign-in state. Please reload and try again.', true));
    if (pendingLink) {
      if (sdk.isSignInWithEmailLink(auth, pendingLink)) {
        linkMode(true); say('Please enter the same parent email that received this link.'); emailInput.focus();
      } else { pendingLink = ''; say(core.explain({code:'auth/invalid-action-code'}), true); }
    } else say('');
  } catch {
    say('Sign-in could not load. Check your connection and reload this page, or use the existing browser-game sign-in below.', true);
  } finally {
    dialog.querySelectorAll('[data-auth-action]').forEach(button => button.disabled = !service);
  }
})();
