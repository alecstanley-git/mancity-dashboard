import { useEffect, useRef } from 'react';

const TONES = { sky: '#6CABDD', gold: '#FFC659', red: '#EC3325' };

/**
 * The two floating nodes from the design export: a delegated tooltip driven by
 * `data-tip`, and a toast stack driven by `data-toast`. Both live outside the
 * React tree because they are page-level singletons positioned against the
 * viewport, and delegation means any new `data-tip` works without wiring.
 */
export function useOverlays(theme) {
  const tipRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const tip = document.createElement('div');
    tip.style.cssText =
      'position:fixed;left:0;top:0;z-index:90;pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .14s ease,transform .14s ease;font-family:Archivo,Helvetica,sans-serif;font-size:11.5px;font-weight:600;line-height:1.35;max-width:240px;padding:7px 10px;border-radius:8px;background:var(--panel);color:var(--ink);border:1px solid var(--line);box-shadow:0 10px 26px rgba(0,0,0,.28)';
    tip.setAttribute('data-m', 'tip');
    document.body.appendChild(tip);
    tipRef.current = tip;

    const box = document.createElement('div');
    box.style.cssText =
      'position:fixed;right:24px;bottom:24px;z-index:95;display:flex;flex-direction:column-reverse;gap:12px;pointer-events:none';
    box.setAttribute('data-m', 'toasts');
    document.body.appendChild(box);
    boxRef.current = box;

    let timer;
    const place = (el) => {
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      let x = r.left + r.width / 2 - t.width / 2;
      x = Math.max(12, Math.min(x, window.innerWidth - t.width - 12));
      let y = r.top - t.height - 8;
      if (y < 12) y = r.bottom + 8;
      tip.style.left = Math.round(x) + 'px';
      tip.style.top = Math.round(y) + 'px';
    };
    const hide = () => {
      clearTimeout(timer);
      tip.style.opacity = '0';
      tip.style.transform = 'translateY(4px)';
    };

    const over = (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el || !el.getAttribute('data-tip')) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        tip.textContent = el.getAttribute('data-tip');
        tip.style.opacity = '1';
        tip.style.transform = 'translateY(0)';
        place(el);
      }, 250);
    };
    const out = (e) => {
      if (e.target.closest && e.target.closest('[data-tip]')) hide();
    };
    const click = (e) => {
      hide();
      const el = e.target.closest && e.target.closest('[data-toast]');
      if (!el) return;
      pushToast(box, el.getAttribute('data-toast'), TONES[el.getAttribute('data-toast-tone')] || TONES.sky);
    };

    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('click', click);
    window.addEventListener('scroll', hide, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('click', click);
      window.removeEventListener('scroll', hide, true);
      tip.remove();
      box.remove();
    };
  }, []);

  // Both nodes sit outside the themed root, so they carry the theme themselves.
  useEffect(() => {
    if (tipRef.current) tipRef.current.setAttribute('data-theme', theme);
    if (boxRef.current) boxRef.current.setAttribute('data-theme', theme);
  }, [theme]);

  return (message, tone = 'sky') => pushToast(boxRef.current, message, TONES[tone] || TONES.sky);
}

function pushToast(box, message, tone) {
  if (!box || !message) return;
  while (box.children.length >= 3) box.removeChild(box.firstChild);
  const el = document.createElement('div');
  el.style.cssText =
    'pointer-events:auto;max-width:340px;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-left:4px solid ' +
    tone +
    ';box-shadow:0 14px 34px rgba(0,0,0,.3);font-family:Archivo,Helvetica,sans-serif;font-size:13px;font-weight:600;line-height:1.4;animation:toastIn .22s cubic-bezier(.2,.8,.2,1) both';
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .18s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 3400);
}
