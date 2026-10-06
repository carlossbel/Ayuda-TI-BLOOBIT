import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { STATUSES, fmtDate, folio, isFinished } from '../data/status';
import TicketDetail from '../components/TicketDetail';

export default function Finished() {
  const { isAdmin } = useAuth();
  const { myTickets, allTickets, loading } = useTickets();
  const [openId, setOpenId] = useState(null);
  const source = isAdmin ? allTickets : myTickets;
  const done = source.filter(isFinished);
  const open = done.find((t) => t.id === openId);
  const s = STATUSES.resuelto;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Solicitudes finalizadas</h1>
          <p className="muted">{done.length} ticket(s) resueltos</p>
        </div>
      </header>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : done.length === 0 ? (
        <div className="panel glass empty">
          <p>Todavía no hay solicitudes finalizadas.</p>
        </div>
      ) : (
        <div className="status-grid">
          {done.map((t) => (
            <article key={t.id} className="status-card glass tone-done" onClick={() => setOpenId(t.id)}>
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
                <small className="muted">
                  {isAdmin ? `${t.createdByName} · ` : ''}Resuelto el {fmtDate(t.resolvedAt || t.updatedAt)}
                </small>
                {t.adminNote && <p className="note-snippet">💬 {t.adminNote}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {open && <TicketDetail ticket={open} onClose={() => setOpenId(null)} manage={isAdmin} />}
    </div>
  );
}
