import { auth } from '../firebase';

// Llama a una función de Vercel (/api/...). Con withSession manda el token de la sesión actual.
export async function postApi(path, body, { withSession = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (withSession) {
    const idToken = await auth?.currentUser?.getIdToken();
    if (!idToken) throw new Error('Tu sesión expiró, vuelve a entrar');
    headers.Authorization = `Bearer ${idToken}`;
  }

  let res;
  try {
    res = await fetch(`/api/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new Error('Sin conexión. Revisa tu internet e intenta de nuevo.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error, intenta de nuevo');
  return data;
}
