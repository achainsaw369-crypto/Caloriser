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
  /** Неподвижная панель под заголовком (например, строка поиска) */
  toolbar?: ReactNode;
  /** На телефоне — на весь экран (для поиска) */
  full?: boolean;
}

/**
 * Подгоняет окно под видимую область экрана: когда открыта экранная клавиатура,
 * окно сжимается и остаётся над ней (иначе в iOS/Android поле ввода уходит под клавиатуру).
 */
function useFitVisualViewport(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const vv = window.visualViewport;
    const el = ref.current;
    if (!vv || !el) return;
    const apply = () => {
      el.style.top = `${vv.offsetTop}px`;
      el.style.height = `${vv.height}px`;
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, [ref]);
}

export function Sheet({ title, onClose, children, footer, toolbar, full }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useFitVisualViewport(overlayRef);

  useEffect(() => {
    const id = nextId++;
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
      ref={overlayRef}
      className={full ? 'overlay overlay-full' : 'overlay'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={full ? 'sheet sheet-full' : 'sheet'} role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        {toolbar && <div className="sheet-toolbar">{toolbar}</div>}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
