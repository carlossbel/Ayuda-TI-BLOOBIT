import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../context/TicketsContext';
import { STATUSES, fmtDate, folio, isFinished, toDate } from '../data/status';
import TicketDetail from '../components/TicketDetail';

const RECENT_MS = 72 * 60 * 60 * 1000;

export default function RequestStatus() {
  const { myTickets, loading, error } = useTickets();
  const [openId, setOpenId] = useState(null);
  // Los resueltos se muestran aquí (con su imagen) 72 h; después solo viven en Finalizadas.
  const active = myTickets.filter((t) => {
    if (!isFinished(t)) return true;
    const at = toDate(t.resolvedAt || t.updatedAt);
    return at && Date.now() - at.getTime() < RECENT_MS;
  });
  const open = myTickets.find((t) => t.id === openId);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Estado de solicitudes</h1>
          <p className="muted">Se actualiza en tiempo real cuando TI avanza tu ticket.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : active.length === 0 ? (
        <div className="panel glass empty">
          <p>No tienes solicitudes abiertas.</p>
          <Link to="/portal/nueva" className="btn btn-primary">Nueva solicitud</Link>
        </div>
      ) : (
        <div className="status-grid">
          {active.map((t) => {
            const s = STATUSES[t.status] || STATUSES.recibida;
            return (
              <article key={t.id} className={`status-card glass tone-${s.tone}`} onClick={() => setOpenId(t.id)}>
                <div className="status-card-img">
                  <img src={s.img} alt="" />
                </div>
                <div className="status-card-body">
                  <div className="status-card-top">
                    <span className="folio">{folio(t.number)}</span>
                    <span className={`prio prio-${t.priority}`}>{t.priority}</span>
                  </div>
                  <p className="status-text">{s.label}</p>
                  <strong className="status-subject">{t.subject}</strong>
                  <small className="muted">{t.category} · {fmtDate(t.updatedAt || t.createdAt)}</small>
                  {t.adminNote && <p className="note-snippet">💬 {t.adminNote}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && <TicketDetail ticket={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
