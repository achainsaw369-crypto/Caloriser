import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Стек открытых окон: Esc закрывает только верхнее
const stack: number[] = [];
let nextId = 1;

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ title, onClose, children, footer }: Props) {
  const idRef = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = nextId++;
    idRef.current = id;
    stack.push(id);
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (!stack.length) document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
