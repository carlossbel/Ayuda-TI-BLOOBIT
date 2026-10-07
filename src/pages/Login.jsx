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
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = USERS.find((u) => u.id === userId);

  async function submit(e) {
    e.preventDefault();
    if (!selected) return setError('Selecciona tu usuario');
    if (!password) return setError('Escribe tu contraseña');
    setBusy(true);
    setError('');
    try {
      await login(selected, password);
      navigate('/inicio');
    } catch (err) {
      console.error(err);
      if (err.code === 'permission-denied') {
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
            onChange={(id) => { setUserId(id); setPassword(''); setError(''); }}
          />
        </div>

        <label className="field">
          <span>Departamento</span>
          <input value={selected?.department || ''} placeholder="Se asigna automáticamente" readOnly />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <div className="password-input">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Tu contraseña"
              autoComplete="current-password"
            />
            <button type="button" className="password-toggle" onClick={() => setShow((v) => !v)}>
              {show ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </label>

        {error && <div className="alert">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy || !selected}>
          {busy ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
