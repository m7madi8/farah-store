import { getFirebaseOptions, isFirebaseConfigured } from './firebaseConfig';

export { isFirebaseConfigured };

/** @type {{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore } | null} */
let cached = null;

async function initFirebase() {
  if (cached) return cached;

  const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);

  const options = getFirebaseOptions();
  const app = getApps().length ? getApps()[0] : initializeApp(options);
  const auth = getAuth(app);
  const db = getFirestore(app);

  cached = { app, auth, db };
  return cached;
}

export async function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
    );
  }
  const { auth } = await initFirebase();
  return auth;
}

export async function getFirestoreDb() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }
  const { db } = await initFirebase();
  return db;
}

/** Wait until Firebase Auth has a signed-in user (admin panel). */
export async function ensureAdminSignedIn() {
  const auth = await getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;

  const { onAuthStateChanged } = await import('firebase/auth');
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('auth/not-signed-in'));
    }, 15_000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;
        window.clearTimeout(timer);
        unsubscribe();
        resolve(user);
      },
      (err) => {
        window.clearTimeout(timer);
        unsubscribe();
        reject(err);
      }
    );
  });
}

export async function getAdminFirestore() {
  await ensureAdminSignedIn();
  return getFirestoreDb();
}
