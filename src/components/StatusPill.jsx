import { STATUSES } from '../data/status';

export default function StatusPill({ status }) {
  const s = STATUSES[status] || STATUSES.recibida;
  return <span className={`pill pill-${s.tone}`}>{s.short}</span>;
}
