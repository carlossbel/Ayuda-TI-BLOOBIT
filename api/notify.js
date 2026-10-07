// Función serverless de Vercel: envía notificaciones push con Firebase Cloud Messaging.
// POST /api/notify { type: 'new' | 'status', ticketId }
// Los destinatarios se deciden aquí con los datos del ticket, nunca los manda el navegador.
import { STATUSES, folio } from '../src/data/status.js';
import { USERS } from '../src/data/users.js';
import { loadAdmin, verifyRequest } from './_lib/admin.js';

const DEAD_TOKEN_CODES = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];

function buildMessage(type, t) {
  if (type === 'new') {
    return {
      recipients: USERS.filter((u) => u.role === 'admin').map((u) => u.id),
      data: {
        title: `Nuevo ticket ${folio(t.number)}`,
        body: `${t.createdByName} (${t.department}): ${t.subject}`,
        url: '/portal/gestion',
        icon: '/img/1.jpg',
        tag: `ticket-${t.number}`,
      },
    };
  }

  const s = STATUSES[t.status] || STATUSES.recibida;
  const note = t.history?.[t.history.length - 1]?.note;
  return {
    recipients: [t.createdById],
    data: {
      title: `Ticket ${folio(t.number)}: ${s.short}`,
      body: note ? `${s.label}\n💬 ${note}` : `${s.label} · ${t.subject}`,
      url: t.status === 'resuelto' ? '/portal/finalizadas' : '/portal/estado',
      icon: s.img,
      image: s.img,
      tag: `ticket-${t.number}`,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  let admin;
  try {
    admin = await loadAdmin();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: `No se pudo iniciar Firebase Admin: ${e.message}` });
  }

  // Solo sesiones iniciadas desde la app pueden pedir envíos.
  const session = await verifyRequest(req, admin.auth);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  const { type, ticketId } = req.body || {};
  if (!['new', 'status'].includes(type) || !/^\d+$/.test(String(ticketId))) {
    return res.status(400).json({ error: 'Solicitud inválida' });
  }

  const db = admin.db;
  const snap = await db.doc(`tickets/${ticketId}`).get();
  if (!snap.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

  // Ticket nuevo: solo quien lo creó. Cambio de estatus: solo el admin.
  const ticket = snap.data();
  const allowed = type === 'new' ? ticket.createdById === session.uid : session.role === 'admin';
  if (!allowed) return res.status(403).json({ error: 'Sin permiso para este aviso' });

  const { recipients, data } = buildMessage(type, ticket);
  const tokensSnap = await db.collection('pushTokens').where('userId', 'in', recipients).get();
  const tokens = tokensSnap.docs.map((d) => d.id);
  if (!tokens.length) return res.json({ sent: 0, reason: 'El destinatario no tiene notificaciones activadas' });

  const result = await admin.messaging.sendEachForMulticast({
    tokens,
    data,
    webpush: { headers: { Urgency: 'high', TTL: '86400' } },
  });

  // Limpia teléfonos que ya no existen o desinstalaron el permiso.
  const dead = result.responses
    .map((r, i) => (!r.success && DEAD_TOKEN_CODES.includes(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);
  await Promise.all(dead.map((tok) => db.doc(`pushTokens/${tok}`).delete()));

  return res.json({ sent: result.successCount, failed: result.failureCount });
}
