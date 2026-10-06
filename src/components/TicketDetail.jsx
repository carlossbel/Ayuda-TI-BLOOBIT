import { useEffect, useState } from 'react';
import { STATUSES, STATUS_ORDER, fmtDate, folio, isFinished } from '../data/status';
import { deleteTicket, getAttachments, updateTicketStatus } from '../services/tickets';
import { useAuth } from '../context/AuthContext';
import StatusPill from './StatusPill';
import { IconTrash, IconX } from './Icons';

export default function TicketDetail({ ticket, onClose, manage = false }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!ticket.attachmentsCount) return setAttachments([]);
    getAttachments(ticket.id).then(setAttachments).catch(() => setAttachments([]));
  }, [ticket.id, ticket.attachmentsCount]);

  useEffect(() => setStatus(ticket.status), [ticket.status]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && (preview ? setPreview(null) : onClose());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, onClose]);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await updateTicketStatus(ticket.id, status, note.trim(), user.name);
      setNote('');
      setMsg('Estatus actualizado');
    } catch (e) {
      console.error(e);
      setMsg('No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteTicket(ticket.id);
      onClose();
    } catch (e) {
      console.error(e);
      setMsg('No se pudo eliminar el ticket');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const s = STATUSES[ticket.status] || STATUSES.recibida;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <span className="folio">{folio(ticket.number)}</span>
            <h2>{ticket.subject}</h2>
            <p className="muted">
              {ticket.createdByName} · {ticket.department} · {fmtDate(ticket.createdAt)}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><IconX /></button>
        </header>

        <div className="modal-body">
          <div className="status-hero">
            <img src={s.img} alt="" />
            <div>
              <StatusPill status={ticket.status} />
              <p>{s.label}</p>
              {isFinished(ticket) && (
                <small className="muted">Resuelto el {fmtDate(ticket.resolvedAt || ticket.updatedAt)}</small>
              )}
            </div>
          </div>

          <dl className="meta-grid">
            <div><dt>Categoría</dt><dd>{ticket.category}</dd></div>
            <div><dt>Prioridad</dt><dd><span className={`prio prio-${ticket.priority}`}>{ticket.priority}</span></dd></div>
            <div><dt>Última actualización</dt><dd>{fmtDate(ticket.updatedAt)}</dd></div>
          </dl>

          <h3>Descripción</h3>
          <p className="description">{ticket.description}</p>

          {ticket.adminNote && (
            <div className="admin-note">
              <strong>Comentario de TI</strong>
              <p>{ticket.adminNote}</p>
            </div>
          )}

          {ticket.attachmentsCount > 0 && (
            <>
              <h3>Capturas ({ticket.attachmentsCount})</h3>
              {attachments === null ? (
                <p className="muted">Cargando capturas…</p>
              ) : (
                <div className="thumbs">
                  {attachments.map((a) => (
                    <button key={a.id} className="thumb" onClick={() => setPreview(a.dataUrl)}>
                      <img src={a.dataUrl} alt={a.name} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <h3>Historial</h3>
          <ol className="timeline">
            {[...(ticket.history || [])].reverse().map((h, i) => (
              <li key={i}>
                <StatusPill status={h.status} />
                <span className="muted">{fmtDate(h.at)} · {h.by}</span>
                {h.note && <p>{h.note}</p>}
              </li>
            ))}
          </ol>

          {manage && (
            <div className="manage glass-inner">
              <h3>Actualizar estatus</h3>
              <div className="status-picker">
                {STATUS_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`status-option${status === k ? ' selected' : ''}`}
                    onClick={() => setStatus(k)}
                  >
                    <img src={STATUSES[k].img} alt="" />
                    <span>{STATUSES[k].short}</span>
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="Comentario para el usuario (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="row-end">
                {msg && <span className="muted">{msg}</span>}
                <button
                  className="btn btn-primary"
                  disabled={saving || (status === ticket.status && !note.trim())}
                  onClick={save}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {manage && (
            <div className="danger-zone">
              {confirmDelete ? (
                <>
                  <span>¿Eliminar el ticket {folio(ticket.number)} y sus capturas? No se puede deshacer.</span>
                  <div className="row-end">
                    <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Cancelar
                    </button>
                    <button className="btn btn-danger" onClick={remove} disabled={deleting}>
                      {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                  </div>
                </>
              ) : (
                <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
                  <IconTrash /> Eliminar ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="lightbox" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>
          <img src={preview} alt="Captura" />
        </div>
      )}
    </div>
  );
}
