/** Env-only check — no firebase/* import (keeps storefront bundle lean). */

function read(name) {
  const raw = import.meta.env[name];
  return raw != null && String(raw).trim() !== '' ? String(raw).trim() : '';
}

export function isFirebaseConfigured() {
  return !!(
    read('VITE_FIREBASE_API_KEY') &&
    read('VITE_FIREBASE_AUTH_DOMAIN') &&
    read('VITE_FIREBASE_PROJECT_ID') &&
    read('VITE_FIREBASE_APP_ID')
  );
}

export function getFirebaseOptions() {
  const storageBucket = read('VITE_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = read('VITE_FIREBASE_MESSAGING_SENDER_ID');
  return {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
  };
}
