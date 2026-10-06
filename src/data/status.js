// Cada estatus muestra su imagen + texto. "resuelto" pasa a Solicitudes finalizadas.
export const STATUSES = {
  recibida: { label: 'Se recibió tu solicitud', short: 'Recibida', img: '/img/2.jpg', tone: 'info' },
  procesando: { label: 'Procesando tu solicitud', short: 'Procesando', img: '/img/3.jpg', tone: 'info' },
  trabajando: { label: 'Trabajando en tu solicitud', short: 'Trabajando', img: '/img/4.jpg', tone: 'work' },
  casi: { label: 'Solicitud casi terminada', short: 'Casi terminada', img: '/img/5.jpg', tone: 'work' },
  mas_tiempo: {
    label: 'Tu solicitud no tiene solución, requiero más tiempo',
    short: 'Requiere más tiempo',
    img: '/img/7.jpg',
    tone: 'warn',
  },
  resuelto: { label: 'Ticket resuelto', short: 'Resuelto', img: '/img/6.jpg', tone: 'done' },
};

export const STATUS_ORDER = ['recibida', 'procesando', 'trabajando', 'casi', 'mas_tiempo', 'resuelto'];

export const isFinished = (t) => t.status === 'resuelto';

export const CATEGORIES = [
  'Equipo / Hardware',
  'Software / Programas',
  'Red / Internet',
  'Accesos / Contraseñas',
  'Correo',
  'Impresoras',
  'Teléfono',
  'Otro',
];

export const PRIORITIES = ['Baja', 'Media', 'Alta', 'Urgente'];

export const folio = (n) => `#${String(n ?? '').padStart(4, '0')}`;

export const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);

export const fmtDate = (ts) => {
  const d = toDate(ts);
  return d
    ? d.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
};
