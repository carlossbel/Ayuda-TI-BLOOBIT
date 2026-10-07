import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { enablePush, pushStatus, refreshPush } from '../services/notifications';
import { IconX } from './Icons';

const DISMISS_KEY = 'tickets-ti.pushDismissed';

export default function PushBanner() {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    pushStatus().then((s) => {
      setStatus(s);
      if (s === 'granted') refreshPush(user);
    });
  }, [user]);

  if (dismissed || !['default', 'denied'].includes(status)) return null;

  async function activate() {
    setBusy(true);
    setError('');
    try {
      setStatus(await enablePush(user));
    } catch (e) {
      console.error(e);
      setError('No se pudieron activar. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sin almacenamiento */
    }
    setDismissed(true);
  }

  return (
    <div className="push-banner glass">
      <span className="push-bell" aria-hidden="true">🔔</span>
      <div className="grow">
        {status === 'denied' ? (
          <>
            <strong>Las notificaciones están bloqueadas</strong>
            <p className="muted">
              Toca el candado junto a la dirección de la página → Permisos → Notificaciones → Permitir.
            </p>
          </>
        ) : (
          <>
            <strong>Activa las notificaciones</strong>
            <p className="muted">
              {isAdmin
                ? 'Te avisamos en tu teléfono cada vez que llegue un ticket nuevo.'
                : 'Te avisamos en tu teléfono cuando cambie el estatus de tu solicitud.'}
            </p>
          </>
        )}
        {error && <p className="push-error">{error}</p>}
      </div>
      {status === 'default' && (
        <button className="btn btn-primary" onClick={activate} disabled={busy}>
          {busy ? 'Activando…' : 'Activar'}
        </button>
      )}
      <button className="icon-btn" onClick={dismiss} aria-label="Ocultar">
        <IconX />
      </button>
    </div>
  );
}
