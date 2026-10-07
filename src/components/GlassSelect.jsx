import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Select propio con efecto vidrio. La lista se dibuja en un portal (fuera de las tarjetas glass)
// porque un backdrop-filter anidado no puede desenfocar la página que está detrás.
// options: [{ value, label, group? }]
export default function GlassSelect({ value, onChange, options, placeholder = 'Selecciona…', id }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(opt) {
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  }

  // Posiciona la lista bajo el botón (o arriba si no cabe) y la sigue al hacer scroll.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 220 && above > below;
      const maxHeight = Math.min(320, up ? above : below);
      setPos({ left: r.left, width: r.width, maxHeight, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  function onKeyDown(e) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  let lastGroup;
  return (
    <>
      <button
        type="button"
        id={id}
        ref={btnRef}
        className={`gselect${open ? ' open' : ''}${selected ? '' : ' is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && pos &&
        createPortal(
          <ul ref={listRef} className="gselect-list" role="listbox" style={pos}>
            {options.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              return [
                header && <li key={`g-${header}`} className="gselect-group" role="presentation">{header}</li>,
                <li
                  key={o.value}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  className={`gselect-option${i === active ? ' active' : ''}${o.value === value ? ' selected' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                >
                  {o.label}
                  {o.value === value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                  )}
                </li>,
              ];
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
