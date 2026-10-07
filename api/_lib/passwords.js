import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Formato guardado: scrypt$<salt hex>$<hash hex>. Nunca se guarda la contraseña en texto.
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(String(password), Buffer.from(salt, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Contraseña vigente: la que el usuario cambió (Firestore credentials/{id}) o la inicial (variable USER_PASSWORDS).
export async function storedHash(db, userId) {
  const snap = await db.doc(`credentials/${userId}`).get();
  if (snap.exists && snap.data().hash) return snap.data().hash;
  try {
    return JSON.parse(process.env.USER_PASSWORDS || '{}')[userId] || null;
  } catch {
    return null;
  }
}
