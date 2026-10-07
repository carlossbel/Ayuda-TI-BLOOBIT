// POST /api/password { current, next } con sesión iniciada → cambia la contraseña del propio usuario.
import { loadAdmin, verifyRequest } from './_lib/admin.js';
import { hashPassword, storedHash, verifyPassword } from './_lib/passwords.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  let admin;
  try {
    admin = await loadAdmin();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: `No se pudo iniciar Firebase Admin: ${e.message}` });
  }

  const session = await verifyRequest(req, admin.auth);
  if (!session) return res.status(401).json({ error: 'Tu sesión expiró, vuelve a entrar' });

  const { current, next } = req.body || {};
  if (typeof next !== 'string' || next.trim().length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
  }
  if (!verifyPassword(current, await storedHash(admin.db, session.uid))) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta' });
  }

  await admin.db.doc(`credentials/${session.uid}`).set({ hash: hashPassword(next.trim()), updatedAt: new Date() });
  return res.json({ ok: true });
}
