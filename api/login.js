// POST /api/login { userId, password } → { token, role }
// Verifica la contraseña y entrega un token de Firebase para signInWithCustomToken.
import { USERS } from '../src/data/users.js';
import { loadAdmin } from './_lib/admin.js';
import { storedHash, verifyPassword } from './_lib/passwords.js';

const MAX_FAILS = 5;
const LOCK_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { userId, password } = req.body || {};
  const user = USERS.find((u) => u.id === userId);
  if (!user || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Selecciona tu usuario y escribe tu contraseña' });
  }

  let admin;
  try {
    admin = await loadAdmin();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: `No se pudo iniciar Firebase Admin: ${e.message}` });
  }

  const attemptsRef = admin.db.doc(`loginAttempts/${user.id}`);
  const attempts = (await attemptsRef.get()).data() || {};
  if (attempts.lockedUntil > Date.now()) {
    const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Demasiados intentos. Intenta de nuevo en ${minutes} min.` });
  }

  const hash = await storedHash(admin.db, user.id);
  if (!hash) return res.status(403).json({ error: 'Tu usuario aún no tiene contraseña. Pídela a TI.' });

  if (!verifyPassword(password, hash)) {
    const fails = (attempts.fails || 0) + 1;
    await attemptsRef.set(fails >= MAX_FAILS ? { fails: 0, lockedUntil: Date.now() + LOCK_MS } : { fails, lockedUntil: 0 });
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  if (attempts.fails) await attemptsRef.delete();

  const role = user.role || 'user';
  const token = await admin.auth.createCustomToken(user.id, { role, department: user.department });
  return res.json({ token, role });
}
