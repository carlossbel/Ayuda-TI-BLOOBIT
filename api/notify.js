// Función serverless de Vercel: envía notificaciones push con Firebase Cloud Messaging.
// POST /api/notify { type: 'new' | 'status', ticketId }
// Los destinatarios se deciden aquí con los datos del ticket, nunca los manda el navegador.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { STATUSES, folio } from '../src/data/status.js';
import { USERS } from '../src/data/users.js';

const DEAD_TOKEN_CODES = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];

function initAdmin() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
}

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
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(500).json({ error: 'Falta la variable FIREBASE_SERVICE_ACCOUNT en Vercel' });
  }
  initAdmin();

  // Solo sesiones iniciadas desde la app pueden pedir envíos.
  const idToken = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    await getAuth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { type, ticketId } = req.body || {};
  if (!['new', 'status'].includes(type) || !/^\d+$/.test(String(ticketId))) {
    return res.status(400).json({ error: 'Solicitud inválida' });
  }

  const db = getFirestore();
  const snap = await db.doc(`tickets/${ticketId}`).get();
  if (!snap.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

  const { recipients, data } = buildMessage(type, snap.data());
  const tokensSnap = await db.collection('pushTokens').where('userId', 'in', recipients).get();
  const tokens = tokensSnap.docs.map((d) => d.id);
  if (!tokens.length) return res.json({ sent: 0, reason: 'El destinatario no tiene notificaciones activadas' });

  const result = await getMessaging().sendEachForMulticast({
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
