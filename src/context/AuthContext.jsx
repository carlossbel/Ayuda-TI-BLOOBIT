import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from '../firebase';
import { unlinkPush } from '../services/notifications';

const AuthContext = createContext(null);
const SESSION_KEY = 'tickets-ti.session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const [authReady, setAuthReady] = useState(!firebaseReady);

  // Mantiene viva la sesión anónima de Firebase mientras haya un usuario guardado.
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser && readSession()) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error(e);
        }
        return;
      }
      setAuthReady(true);
    });
  }, []);

  async function login(selected, pin) {
    if (!firebaseReady) throw new Error('Falta configurar Firebase en el archivo .env');
    if (selected.role === 'admin' && pin !== import.meta.env.VITE_ADMIN_PIN) {
      throw new Error('PIN de administrador incorrecto');
    }
    if (!auth.currentUser) await signInAnonymously(auth);
    const session = {
      id: selected.id,
      name: selected.name,
      department: selected.department,
      role: selected.role || 'user',
    };
    // Solo se guarda el usuario y su departamento.
    await setDoc(
      doc(db, 'users', selected.id),
      { name: session.name, department: session.department, role: session.role, lastLogin: serverTimestamp() },
      { merge: true },
    );
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  async function logout() {
    await unlinkPush();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    if (auth) await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, authReady, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
