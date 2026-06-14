/** Map Firestore / Firebase errors to admin-friendly translation keys. */

export function firestoreErrorKey(err) {
  const code = String(err?.code || '');
  if (code === 'permission-denied') return 'admin.firestorePermissionDenied';
  if (code === 'failed-precondition') return 'admin.firestoreIndexRequired';
  return null;
}

export function formatAdminFirestoreError(err, t) {
  const key = firestoreErrorKey(err);
  if (key) return t(key);
  return err?.message || t('admin.firestorePermissionDenied');
}
