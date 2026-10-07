import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TicketsProvider, useTickets } from '../context/TicketsContext';
import { initials } from '../data/users';
import { isFinished } from '../data/status';
import PushBanner from './PushBanner';
import PasswordModal from './PasswordModal';
import { IconCheck, IconClock, IconDashboard, IconKey, IconLogout, IconPlus, IconShield, IconTicket } from './Icons';

function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { myTickets, allTickets } = useTickets();
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const activeCount = myTickets.filter((t) => !isFinished(t)).length;
  const pendingAdmin = allTickets.filter((t) => !isFinished(t)).length;

  const links = [
    { to: '/portal', end: true, label: 'Dashboard', icon: <IconDashboard /> },
    { to: '/portal/nueva', label: 'Nueva solicitud', icon: <IconPlus /> },
    { to: '/portal/estado', label: 'Estado de solicitudes', icon: <IconClock />, badge: activeCount },
    { to: '/portal/finalizadas', label: 'Solicitudes finalizadas', icon: <IconCheck /> },
  ];
  if (isAdmin) {
    links.push({ to: '/portal/gestion', label: 'Gestión de tickets', icon: <IconShield />, badge: pendingAdmin });
  }

  return (
    <aside className="sidebar glass">
      <div className="brand">
        <span className="brand-mark"><IconTicket /></span>
        <div>
          <strong>Ayuda TI</strong>
          <small>Soporte técnico</small>
        </div>
      </div>

      <nav className="nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {l.icon}
            <span>{l.label}</span>
            {l.badge > 0 && <em className="nav-badge">{l.badge}</em>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="avatar">{initials(user.name)}</span>
        <div className="sidebar-user-info">
          <strong>{user.name}</strong>
          <small>{user.department}{isAdmin ? ' · Admin' : ''}</small>
        </div>
        <button className="icon-btn" title="Cambiar contraseña" onClick={() => setChangingPassword(true)}>
          <IconKey />
        </button>
        <button
          className="icon-btn"
          title="Cerrar sesión"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          <IconLogout />
        </button>
      </div>
      {changingPassword && <PasswordModal onClose={() => setChangingPassword(false)} />}
    </aside>
  );
}

export default function PortalLayout() {
  return (
    <TicketsProvider>
      <div className="portal">
        <Sidebar />
        <main className="portal-main">
          <PushBanner />
          <Outlet />
        </main>
      </div>
    </TicketsProvider>
  );
}
