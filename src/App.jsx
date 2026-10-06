import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import PortalLayout from './components/PortalLayout';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import RequestStatus from './pages/RequestStatus';
import Finished from './pages/Finished';
import AdminTickets from './pages/AdminTickets';

function Private({ children, admin }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (admin && !isAdmin) return <Navigate to="/portal" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <div className="bg-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/inicio" replace /> : <Login />} />
        <Route path="/inicio" element={<Private><Welcome /></Private>} />
        <Route path="/portal" element={<Private><PortalLayout /></Private>}>
          <Route index element={<Dashboard />} />
          <Route path="nueva" element={<NewRequest />} />
          <Route path="estado" element={<RequestStatus />} />
          <Route path="finalizadas" element={<Finished />} />
          <Route path="gestion" element={<Private admin><AdminTickets /></Private>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
