import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { IconX } from './Icons';

export default function PasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (form.next.trim().length < 4) return setError('La nueva contraseña debe tener al menos 4 caracteres');
    if (form.next !== form.confirm) return setError('Las contraseñas nuevas no coinciden');
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Portal: el menú lateral tiene backdrop-filter, que encerraría al modal fijo dentro de él.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm glass" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Cambiar contraseña</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><IconX /></button>
        </header>

        {done ? (
          <div className="modal-body form">
            <p>✅ Tu contraseña se cambió. Úsala la próxima vez que inicies sesión.</p>
            <div className="row-end">
              <button className="btn btn-primary" onClick={onClose}>Listo</button>
            </div>
          </div>
        ) : (
          <form className="modal-body form" onSubmit={submit}>
            <label className="field">
              <span>Contraseña actual</span>
              <input type="password" value={form.current} onChange={set('current')} autoComplete="current-password" autoFocus />
            </label>
            <label className="field">
              <span>Nueva contraseña</span>
              <input type="password" value={form.next} onChange={set('next')} autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Confirmar nueva contraseña</span>
              <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </label>
            {error && <div className="alert">{error}</div>}
            <div className="row-end">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" disabled={busy || !form.current || !form.next}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
