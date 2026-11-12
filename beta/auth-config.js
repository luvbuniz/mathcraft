// Email-link sign-in enabled in the existing Firebase project with owner approval, 2026-11-12.
// Google sign-in/sign-out verified locally with the authorized owner account, 2026-11-12.
// Keep the distributable preview disabled until its production callback is hosted.
// Public Firebase web configuration from the existing Stackadoo browser game, not a server key.
window.STACKADOO_AUTH_CONFIG = Object.freeze({
  enabled: true,
  allowedOrigins: ['https://stackadoo.com', 'https://www.stackadoo.com'],
  callbackPath: '/beta/index.html',
  firebase: {
    apiKey: 'AIzaSyBNOgrfPBOKg2-J0N82g9sdJn6IHtcYJMU',
    authDomain: 'stackadoo.firebaseapp.com',
    projectId: 'stackadoo',
    storageBucket: 'stackadoo.firebasestorage.app',
    messagingSenderId: '587953023716',
    appId: '1:587953023716:web:376cd1fc01e8ea8dcb9af1'
  }
});
