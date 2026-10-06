import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../data/users';

const LOADING_MS = 2600;

function LoadingScreen({ onDone, img = '/img/1.jpg', text = 'Cargando…', tall = false }) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    // Intervalo en vez de requestAnimationFrame: sigue avanzando aunque la pestaña quede en segundo plano.
    const start = Date.now();
    let timer;
    const interval = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / LOADING_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        timer = setTimeout(() => doneRef.current(), 250);
      }
    }, 30);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="center-screen">
      <div className="loading-card glass">
        <img src={img} alt="" className={`loading-img${tall ? ' tall' : ''}`} />
        <p className="loading-text">{text}</p>
        <div className="progress"><div style={{ width: `${progress}%` }} /></div>
        <small className="muted">{Math.round(progress)}%</small>
      </div>
    </div>
  );
}

export default function Welcome() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // El admin de TI no abre tickets: entra directo al dashboard.
  if (isAdmin) {
    return (
      <LoadingScreen
        img="/img/8.jpg"
        text="Cargando solicitudes…"
        tall
        onDone={() => navigate('/portal', { replace: true })}
      />
    );
  }

  if (loading) return <LoadingScreen onDone={() => navigate('/portal')} />;

  return (
    <div className="center-screen">
      <div className="welcome-card glass">
        <span className="avatar xl">{initials(user.name)}</span>
        <p className="welcome-hi">Bienvenido(a)</p>
        <h1>{user.name}</h1>
        <span className="dept-chip">{user.department}</span>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => setLoading(true)}>
          Abrir Ticket
        </button>
        <button className="btn btn-ghost btn-block" onClick={logout}>No soy yo · Cambiar usuario</button>
      </div>
    </div>
  );
}
