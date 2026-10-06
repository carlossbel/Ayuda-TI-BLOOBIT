import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { DEPARTMENTS } from '../data/users';
import { STATUSES, STATUS_ORDER, fmtDate, folio, isFinished } from '../data/status';
import StatusPill from '../components/StatusPill';
import TicketDetail from '../components/TicketDetail';
import { IconPlus } from '../components/Icons';

function Stat({ label, value, tone }) {
  return (
    <div className={`stat glass stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { myTickets, allTickets, loading, error } = useTickets();
  const [open, setOpen] = useState(null);

  const list = isAdmin ? allTickets : myTickets;
  const count = (fn) => list.filter(fn).length;
  const recent = list.slice(0, 6);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="muted">{greet},</p>
          <h1>{user.name.split(' ')[0]} 👋</h1>
          <p className="muted">{isAdmin ? 'Resumen general de todos los tickets' : 'Resumen de tus solicitudes a TI'}</p>
        </div>
        <Link to="/portal/nueva" className="btn btn-primary"><IconPlus /> Nueva solicitud</Link>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="stats">
        <Stat label="Total" value={list.length} tone="info" />
        <Stat label="En proceso" value={count((t) => !isFinished(t) && t.status !== 'mas_tiempo')} tone="work" />
        <Stat label="Requieren más tiempo" value={count((t) => t.status === 'mas_tiempo')} tone="warn" />
        <Stat label="Finalizadas" value={count(isFinished)} tone="done" />
      </section>

      <div className="grid-2">
        <section className="panel glass">
          <h2>Actividad reciente</h2>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : recent.length === 0 ? (
            <div className="empty">
              <p>Aún no hay solicitudes.</p>
              <Link to="/portal/nueva" className="btn btn-ghost">Crear la primera</Link>
            </div>
          ) : (
            <ul className="ticket-list">
              {recent.map((t) => (
                <li key={t.id} onClick={() => setOpen(t)}>
                  <span className="folio">{folio(t.number)}</span>
                  <div className="grow">
                    <strong>{t.subject}</strong>
                    <small className="muted">
                      {isAdmin ? `${t.createdByName} · ` : ''}{fmtDate(t.updatedAt || t.createdAt)}
                    </small>
                  </div>
                  <StatusPill status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel glass">
          <h2>{isAdmin ? 'Por departamento' : 'Por estatus'}</h2>
          <ul className="bars">
            {(isAdmin ? DEPARTMENTS : STATUS_ORDER).map((k) => {
              const n = isAdmin ? count((t) => t.department === k) : count((t) => t.status === k);
              const pct = list.length ? (n / list.length) * 100 : 0;
              return (
                <li key={k}>
                  <div className="bar-label">
                    <span>{isAdmin ? k : STATUSES[k].short}</span>
                    <strong>{n}</strong>
                  </div>
                  <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                </li>
              );
            })}
          </ul>
          <div className="tips">
            <strong>Tip</strong>
            <p className="muted">Puedes pegar capturas con <kbd>Ctrl</kbd>+<kbd>V</kbd> directamente en el formulario de nueva solicitud.</p>
          </div>
        </section>
      </div>

      {open && <TicketDetail ticket={list.find((t) => t.id === open.id) || open} onClose={() => setOpen(null)} manage={isAdmin} />}
    </div>
  );
}
