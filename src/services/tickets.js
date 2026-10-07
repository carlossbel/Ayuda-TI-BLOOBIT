import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { notify } from './notifications';

const byNumberDesc = (a, b) => (b.number || 0) - (a.number || 0);
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNumberDesc);

// Comprime la captura para guardarla en Firestore (límite de 1 MB por documento).
export function compressImage(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.8;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 900_000 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Folio consecutivo con transacción sobre meta/counters para que nunca se repita un número.
export async function createTicket({ user, subject, category, priority, description, files }) {
  const images = await Promise.all(files.map((f) => compressImage(f)));
  const counterRef = doc(db, 'meta', 'counters');

  const number = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().tickets || 0 : 0) + 1;
    tx.set(counterRef, { tickets: next }, { merge: true });
    tx.set(doc(db, 'tickets', String(next)), {
      number: next,
      subject,
      category,
      priority,
      description,
      status: 'recibida',
      createdById: user.id,
      createdByName: user.name,
      department: user.department,
      attachmentsCount: images.length,
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [{ status: 'recibida', at: Timestamp.now(), by: user.name, note: '' }],
    });
    return next;
  });

  await Promise.all(
    images.map((dataUrl, i) =>
      setDoc(doc(db, 'tickets', String(number), 'attachments', String(i + 1)), {
        name: files[i].name || `captura-${i + 1}.jpg`,
        dataUrl,
        createdAt: serverTimestamp(),
      }),
    ),
  );
  notify('new', number);
  return number;
}

export function subscribeUserTickets(userId, cb, onError) {
  const q = query(collection(db, 'tickets'), where('createdById', '==', userId));
  return onSnapshot(q, (s) => cb(mapDocs(s)), onError);
}

export function subscribeAllTickets(cb, onError) {
  const q = query(collection(db, 'tickets'), orderBy('number', 'desc'));
  return onSnapshot(q, (s) => cb(mapDocs(s)), onError);
}

export async function getAttachments(ticketId) {
  const snap = await getDocs(collection(db, 'tickets', String(ticketId), 'attachments'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Borra el ticket y sus capturas. El folio no se reutiliza.
export async function deleteTicket(ticketId) {
  const id = String(ticketId);
  const attachments = await getDocs(collection(db, 'tickets', id, 'attachments'));
  const batch = writeBatch(db);
  attachments.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'tickets', id));
  await batch.commit();
}

export async function updateTicketStatus(ticketId, status, note, adminName) {
  const data = {
    status,
    updatedAt: serverTimestamp(),
    history: arrayUnion({ status, at: Timestamp.now(), by: adminName, note: note || '' }),
  };
  if (note) data.adminNote = note;
  if (status === 'resuelto') data.resolvedAt = serverTimestamp();
  await updateDoc(doc(db, 'tickets', String(ticketId)), data);
  notify('status', ticketId);
}
