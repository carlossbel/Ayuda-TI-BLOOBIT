// Firebase Admin compartido por las funciones de /api (los archivos con "_" no se publican como rutas).
// Se carga al primer uso: si algo falla, la función responde con el error en vez de caerse.
let cached;

export async function loadAdmin() {
  if (cached) return cached;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Falta la variable FIREBASE_SERVICE_ACCOUNT en Vercel');
  }
  const [{ cert, getApps, initializeApp }, { getAuth }, { getFirestore }, { getMessaging }] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/auth'),
    import('firebase-admin/firestore'),
    import('firebase-admin/messaging'),
  ]);
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  cached = { auth: getAuth(), db: getFirestore(), messaging: getMessaging() };
  return cached;
}

// Devuelve el usuario de la sesión (uid + claims) o null si el token no es válido.
export async function verifyRequest(req, auth) {
  const idToken = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    return await auth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}
