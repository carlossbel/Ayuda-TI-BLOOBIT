import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PRIORITIES, folio } from '../data/status';
import { createTicket } from '../services/tickets';
import { IconImage, IconX } from '../components/Icons';

const MAX_FILES = 4;
const EMPTY = { subject: '', category: CATEGORIES[0], priority: 'Media', description: '' };

export default function NewRequest() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function addFiles(list) {
    const imgs = [...list].filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => {
      const next = [...prev, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))];
      if (next.length > MAX_FILES) setError(`Máximo ${MAX_FILES} capturas por solicitud`);
      return next.slice(0, MAX_FILES);
    });
  }

  // Pegar capturas con Ctrl+V en cualquier parte del formulario.
  useEffect(() => {
    const onPaste = (e) => {
      if (created) return;
      const imgs = [...(e.clipboardData?.files || [])];
      if (imgs.length) addFiles(imgs);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [created]);

  function removeFile(i) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return setError('Escribe el asunto y la descripción');
    setBusy(true);
    setError('');
    try {
      const number = await createTicket({
        user,
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        files: files.map((f) => f.file),
      });
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      setForm(EMPTY);
      setCreated(number);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="page">
        <div className="success-card glass">
          <img src="/img/2.jpg" alt="" />
          <h1>Se recibió tu solicitud</h1>
          <p className="muted">Tu número de ticket es</p>
          <span className="folio big">{folio(created)}</span>
          <p className="muted">Puedes seguir su avance en “Estado de solicitudes”.</p>
          <div className="row-center">
            <Link to="/portal/estado" className="btn btn-primary">Ver estado</Link>
            <button className="btn btn-ghost" onClick={() => setCreated(null)}>Crear otra solicitud</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Nueva solicitud</h1>
          <p className="muted">Cuéntanos qué necesitas y adjunta capturas si ayudan a explicarlo.</p>
        </div>
      </header>

      <form className="panel glass form" onSubmit={submit}>
        <div className="form-row">
          <label className="field">
            <span>Solicitante</span>
            <input value={`${user.name} · ${user.department}`} readOnly />
          </label>
        </div>

        <label className="field">
          <span>Asunto *</span>
          <input value={form.subject} onChange={set('subject')} placeholder="Ej. No puedo entrar a mi correo" maxLength={120} />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Categoría</span>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Prioridad</span>
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Descripción *</span>
          <textarea rows={6} value={form.description} onChange={set('description')} placeholder="Describe el problema o lo que necesitas, con el mayor detalle posible." />
        </label>

        <div className="field">
          <span>Capturas de pantalla (opcional, máx. {MAX_FILES})</span>
          <div
            className={`dropzone${drag ? ' drag' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          >
            <IconImage />
            <p>Arrastra imágenes aquí, haz clic para elegirlas o pega con <kbd>Ctrl</kbd>+<kbd>V</kbd></p>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
          {files.length > 0 && (
            <div className="thumbs">
              {files.map((f, i) => (
                <div className="thumb" key={f.url}>
                  <img src={f.url} alt={f.file.name} />
                  <button type="button" className="thumb-remove" onClick={() => removeFile(i)} aria-label="Quitar"><IconX /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="row-end">
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
        </div>
      </form>
    </div>
  );
}
