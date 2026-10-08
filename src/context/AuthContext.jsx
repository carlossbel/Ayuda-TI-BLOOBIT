import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from '../firebase';
import { postApi } from '../services/api';
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

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

// Solo se guarda el usuario y su departamento. Firestore puede tardar un instante en recibir la sesión
// recién iniciada, así que se reintenta una vez; si aun así falla no se bloquea la entrada.
async function recordLogin(session) {
  const write = () =>
    setDoc(
      doc(db, 'users', session.id),
      { name: session.name, department: session.department, role: session.role, lastLogin: serverTimestamp() },
      { merge: true },
    );
  try {
    await write();
  } catch (e) {
    if (e.code !== 'permission-denied') throw e;
    await new Promise((r) => setTimeout(r, 800));
    try {
      await write();
    } catch (retryError) {
      console.warn('No se pudo registrar el último acceso', retryError);
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const [authReady, setAuthReady] = useState(!firebaseReady);

  // La sesión guardada solo vale si Firebase tiene a ese mismo usuario autenticado
  // (las sesiones anónimas de la versión anterior se descartan y piden contraseña).
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth, (fbUser) => {
      const saved = readSession();
      if (saved && fbUser?.uid !== saved.id) {
        clearSession();
        setUser(null);
        if (fbUser) signOut(auth);
      }
      setAuthReady(true);
    });
  }, []);

  async function login(selected, password) {
    if (!firebaseReady) throw new Error('Falta configurar Firebase en el archivo .env');
    clearSession();
    const { token, role } = await postApi('login', { userId: selected.id, password });
    const { user: fbUser } = await signInWithCustomToken(auth, token);
    await fbUser.getIdToken();

    const session = { id: selected.id, name: selected.name, department: selected.department, role };
    await recordLogin(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  async function changePassword(current, next) {
    await postApi('password', { current, next }, { withSession: true });
  }

  async function logout() {
    await unlinkPush();
    clearSession();
    setUser(null);
    if (auth) await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, authReady, login, logout, changePassword, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
