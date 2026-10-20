import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; const previous = document.activeElement as HTMLElement; dialog.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog.close(); document.body.style.overflow = old; previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }} aria-labelledby="modal-heading"><div className="modal-inner"><button className="close icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button><p className="eyebrow">VISTACORTEX BUILDFEAST / 2027</p><h2 id="modal-heading">{title}</h2>{children}</div></dialog>;
}
