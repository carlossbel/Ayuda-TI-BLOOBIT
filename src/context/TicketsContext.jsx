import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeAllTickets, subscribeUserTickets } from '../services/tickets';
import { db } from '../firebase';

const TicketsContext = createContext(null);

export function TicketsProvider({ children }) {
  const { user, isAdmin, authReady } = useAuth();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !authReady) return;
    if (!db) {
      setError('Falta configurar Firebase en el archivo .env');
      setLoading(false);
      return;
    }
    setLoading(true);
    const onData = (list) => {
      setAll(list);
      setLoading(false);
      setError('');
    };
    const onError = (e) => {
      console.error(e);
      setError('No se pudieron cargar los tickets. Revisa la conexión o las reglas de Firestore.');
      setLoading(false);
    };
    return isAdmin ? subscribeAllTickets(onData, onError) : subscribeUserTickets(user.id, onData, onError);
  }, [user, isAdmin, authReady]);

  const value = useMemo(
    () => ({
      allTickets: all,
      myTickets: all.filter((t) => t.createdById === user?.id),
      loading,
      error,
    }),
    [all, loading, error, user],
  );

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>;
}

export const useTickets = () => useContext(TicketsContext);
