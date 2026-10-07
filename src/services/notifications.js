import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from '../firebase';
import { postApi } from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const TOKEN_KEY = 'tickets-ti.pushToken';

const store = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (v) => {
    try {
      v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* sin almacenamiento local */
    }
  },
};

// 'unsupported' | 'default' | 'granted' | 'denied'
export async function pushStatus() {
  if (!app || !VAPID_KEY || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  if (!(await isSupported())) return 'unsupported';
  return Notification.permission;
}

// Registra este dispositivo para recibir push y lo liga al usuario en Firestore (pushTokens/{token}).
async function registerDevice(user) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Firebase no entregó token de notificaciones');

  const previous = store.get();
  if (previous && previous !== token) deleteDoc(doc(db, 'pushTokens', previous)).catch(() => {});
  await setDoc(doc(db, 'pushTokens', token), {
    userId: user.id,
    name: user.name,
    role: user.role,
    updatedAt: serverTimestamp(),
    device: navigator.userAgent.slice(0, 200),
  });
  store.set(token);
}

export async function enablePush(user) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') await registerDevice(user);
  return permission;
}

// Los tokens de FCM rotan: se refresca en cada visita si ya hay permiso.
export async function refreshPush(user) {
  if (Notification.permission !== 'granted') return;
  try {
    await registerDevice(user);
  } catch (e) {
    console.warn('No se pudo refrescar el token de notificaciones', e);
  }
}

// Al cerrar sesión el teléfono deja de recibir avisos de ese usuario.
export async function unlinkPush() {
  const token = store.get();
  if (!token) return;
  store.set(null);
  try {
    await deleteDoc(doc(db, 'pushTokens', token));
  } catch {
    /* sin conexión: el servidor limpia tokens viejos */
  }
}

// Pide a la función de Vercel (api/notify) que envíe el aviso. Nunca bloquea al usuario si falla.
export async function notify(type, ticketId) {
  try {
    await postApi('notify', { type, ticketId: String(ticketId) }, { withSession: true });
  } catch (e) {
    console.warn('No se pudo enviar la notificación', e);
  }
}
