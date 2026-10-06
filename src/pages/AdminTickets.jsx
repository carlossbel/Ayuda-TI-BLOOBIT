import { useMemo, useState } from 'react';
import { useTickets } from '../context/TicketsContext';
import { DEPARTMENTS } from '../data/users';
import { STATUSES, STATUS_ORDER, fmtDate, folio } from '../data/status';
import StatusPill from '../components/StatusPill';
import TicketDetail from '../components/TicketDetail';

export default function AdminTickets() {
  const { allTickets, loading, error } = useTickets();
  const [status, setStatus] = useState('abiertos');
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allTickets.filter((t) => {
      if (status === 'abiertos' && t.status === 'resuelto') return false;
      if (status !== 'abiertos' && status !== 'todos' && t.status !== status) return false;
      if (dept && t.department !== dept) return false;
      if (term && !`${t.number} ${t.subject} ${t.createdByName} ${t.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [allTickets, status, dept, q]);

  const open = allTickets.find((t) => t.id === openId);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Gestión de tickets</h1>
          <p className="muted">Cambia el estatus y deja comentarios; el usuario lo ve al instante.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="filters glass">
        <input placeholder="Buscar por folio, asunto o persona…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="abiertos">Abiertos</option>
          <option value="todos">Todos</option>
          {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUSES[k].short}</option>)}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">Todos los departamentos</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="panel glass table-wrap">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="muted empty">No hay tickets con esos filtros.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Asunto</th>
                <th>Solicitante</th>
                <th>Prioridad</th>
                <th>Estatus</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setOpenId(t.id)}>
                  <td><span className="folio">{folio(t.number)}</span></td>
                  <td>
                    {t.subject}
                    {t.attachmentsCount > 0 && <small className="muted"> · 📎{t.attachmentsCount}</small>}
                  </td>
                  <td>
                    {t.createdByName}
                    <br />
                    <small className="muted">{t.department}</small>
                  </td>
                  <td><span className={`prio prio-${t.priority}`}>{t.priority}</span></td>
                  <td><StatusPill status={t.status} /></td>
                  <td>{fmtDate(t.updatedAt || t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <TicketDetail ticket={open} onClose={() => setOpenId(null)} manage />}
    </div>
  );
}
