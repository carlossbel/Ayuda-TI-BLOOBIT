import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseReady } from '../firebase';
import { DEPARTMENTS, USERS } from '../data/users';
import { IconTicket } from '../components/Icons';
import GlassSelect from '../components/GlassSelect';

const USER_OPTIONS = DEPARTMENTS.flatMap((dep) =>
  USERS.filter((u) => u.department === dep).map((u) => ({ value: u.id, label: u.name, group: dep })),
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = USERS.find((u) => u.id === userId);

  async function submit(e) {
    e.preventDefault();
    if (!selected) return setError('Selecciona tu usuario');
    setBusy(true);
    setError('');
    try {
      await login(selected, pin);
      navigate('/inicio');
    } catch (err) {
      console.error(err);
      if (['auth/admin-restricted-operation', 'auth/operation-not-allowed', 'auth/configuration-not-found'].includes(err.code)) {
        setError('Activa el proveedor "Anónimo" en Firebase > Authentication > Método de acceso');
      } else if (err.code === 'permission-denied') {
        setError('Firestore rechazó el acceso: publica las reglas de firestore.rules');
      } else {
        setError(err.code ? `No se pudo conectar con Firebase (${err.code})` : err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="login-card glass" onSubmit={submit}>
        <span className="brand-mark lg"><IconTicket /></span>
        <h1>Ayuda TI</h1>
        <p className="muted">Inicia sesión para levantar y dar seguimiento a tus solicitudes</p>

        {!firebaseReady && (
          <div className="alert">Falta configurar Firebase: llena el archivo <code>.env</code> y reinicia el servidor.</div>
        )}

        <div className="field">
          <span>Usuario</span>
          <GlassSelect
            value={userId}
            placeholder="Selecciona tu nombre…"
            options={USER_OPTIONS}
            onChange={(id) => { setUserId(id); setPin(''); setError(''); }}
          />
        </div>

        <label className="field">
          <span>Departamento</span>
          <input value={selected?.department || ''} placeholder="Se asigna automáticamente" readOnly />
        </label>

        {selected?.role === 'admin' && (
          <label className="field">
            <span>PIN de administrador</span>
            <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
          </label>
        )}

        {error && <div className="alert">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy || !selected}>
          {busy ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
