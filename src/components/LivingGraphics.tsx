import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

function Field({ mode, active = 0, count = 8, onSelect }: { mode: 'map' | 'wave'; active?: number; count?: number; onSelect?: (index: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef(onSelect);
  const rippleRef = useRef<() => void>(() => {});
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  const redraw = useRef<() => void>(() => {});
  const values = useRef({ active, expanded: false });
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => { values.current = { active, expanded }; redraw.current(); }, [active, expanded]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, phase = 0, frame = 0, last = 0, visible = false, blend = 0;
    let pointer: { x: number; y: number } | null = null;
    let gesture: { x: number; y: number; id: number } | null = null;
    let ripples: { x: number; born: number }[] = [];
    const weights = Array.from({ length: count }, (_, i) => i === values.current.active ? 1 : 0);
    const ripple = (x = width / 2) => { if (!preference.matches) ripples = [...ripples.slice(-2), { x, born: phase }]; };
    rippleRef.current = () => ripple();
    const displacement = (x: number) => {
      if (preference.matches) return 0;
      let offset = 0;
      for (const pulse of ripples) {
        const age = phase - pulse.born;
        const distance = Math.abs(x - pulse.x) - age * 300;
        offset += Math.sin(distance / 18) * Math.exp(-((distance / 65) ** 2)) * Math.max(0, 1 - age / 1.8) * 22;
      }
      return offset;
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const cy = height / 2;
      ripples = ripples.filter(pulse => phase - pulse.born < 1.8);
      if (mode === 'map') {
        const columns = width < 700 ? 64 : 105;
        for (let strand = 0; strand < count; strand++) {
          const selected = strand === values.current.active;
          weights[strand] += ((selected ? 1 : 0) - weights[strand]) * (preference.matches ? 1 : .12);
          const emphasis = weights[strand];
          const points: { x: number; y: number; z: number }[] = [];
          for (let column = 0; column < columns; column++) {
            const u = column / (columns - 1);
            const angle = u * Math.PI * 2.2 + phase * .55 + strand / count * Math.PI * 2;
            const envelope = Math.sin(u * Math.PI) ** .65;
            const z = Math.cos(angle), x = width * (.05 + u * .9);
            const proximity = pointer && !preference.matches ? Math.exp(-(((x - pointer.x) / 150) ** 2)) : 0;
            const push = pointer ? (pointer.y - cy) * proximity * .27 : 0;
            const y = height * .43 + Math.sin(angle) * height * .22 * envelope + (u - .5) * height * .16 + push + displacement(x);
            points.push({ x, y, z });
          }
          ctx.globalAlpha = .12 + emphasis * .38;
          ctx.strokeStyle = selected ? '#285d3e' : '#7a9e59'; ctx.lineWidth = .7 + emphasis * .7;
          ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
          points.forEach((point, index) => {
            const depth = (point.z + 1) / 2;
            ctx.globalAlpha = .12 + emphasis * .33 + depth * (.35 + emphasis * .2);
            ctx.fillStyle = selected ? '#235d3d' : '#81a65f';
            const pulse = selected && (index + Math.floor(phase * 12)) % 18 < 3 ? 1.5 : 1;
            ctx.beginPath(); ctx.arc(point.x, point.y, (.65 + depth * (1.15 + emphasis * .95)) * pulse, 0, Math.PI * 2); ctx.fill();
          });
        }
        ctx.globalAlpha = 1;
      } else {
        blend += ((values.current.expanded ? 1 : 0) - blend) * .045;
        const rows = innerWidth < 700 ? 7 : 10, columns = innerWidth < 700 ? 70 : 110;
        for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
          const u = column / (columns - 1), x = 15 + u * (width - 30);
          const proximity = pointer ? Math.exp(-(((x - pointer.x) / 125) ** 2)) : 0;
          const push = pointer && !preference.matches ? (pointer.y - cy) * proximity * .35 : 0;
          const amplitude = Math.min(height * .25, 22 + blend * 28 + proximity * 17);
          const y = cy + Math.sin(u * Math.PI * (2.4 + blend) + phase * .65 + row * .19) * amplitude + (row - rows / 2) * 4 + push + displacement(x);
          const alpha = .15 + Math.sin(u * Math.PI) * .65;
          ctx.fillStyle = row % 3 === 0 ? `rgba(38,91,52,${alpha})` : `rgba(115,157,77,${alpha * .7})`;
          ctx.beginPath(); ctx.arc(x, y, row % 3 === 0 ? 1.6 : 1.1, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    redraw.current = draw;
    const animate = (time: number) => { if (time - last > 32) { phase += .025; draw(); last = time; } frame = requestAnimationFrame(animate); };
    const start = () => { cancelAnimationFrame(frame); draw(); if (visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(animate); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    const resize = new ResizeObserver(() => { width = canvas.clientWidth; height = canvas.clientHeight; const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start(); });
    const move = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const leave = () => { pointer = null; };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
      canvas.setPointerCapture(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (mode === 'map' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        selectRef.current?.((values.current.active + (dx < 0 ? 1 : count - 1)) % count);
        ripple(event.clientX - canvas.getBoundingClientRect().left);
      } else if (Math.hypot(dx, dy) < 10) {
        if (mode === 'map') selectRef.current?.((values.current.active + 1) % count);
        else if (!preference.matches) setExpanded(value => !value);
        ripple(event.clientX - canvas.getBoundingClientRect().left);
      }
      if (event.pointerType === 'touch') pointer = null;
    };
    const cancel = () => { gesture = null; pointer = null; };
    observer.observe(canvas); resize.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel);
    document.addEventListener('visibilitychange', start); preference.addEventListener('change', start);
    return () => { rippleRef.current = () => {}; redraw.current = () => {}; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel); document.removeEventListener('visibilitychange', start); preference.removeEventListener('change', start); };
  }, [mode, count]);
  const interactive = mode === 'map' || !reduced;
  return <canvas ref={ref} className="living-field" role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : undefined} aria-pressed={mode === 'wave' && !reduced ? expanded : undefined} aria-label={mode === 'wave' ? 'Interactive particle ribbon. Activate to send a ripple and change its formation.' : 'Explore challenge strands. Swipe or use arrow keys to change challenges; activate for the next challenge.'} onKeyDown={event => {
    const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (mode === 'map' && (direction || ['Enter', ' '].includes(event.key))) {
      event.preventDefault(); onSelect?.((active + (direction || 1) + count) % count); rippleRef.current();
    } else if (mode === 'wave' && !reduced && ['Enter', ' '].includes(event.key)) {
      event.preventDefault(); setExpanded(value => !value); rippleRef.current();
    }
  }}/>;
}

export function ChallengeMap({ statements, active, onSelect }: { statements: string[]; active: number; onSelect: (index: number) => void }) {
  return <div className="challenge-sculpture" role="group" aria-label="Explore problem statements"><Field mode="map" active={active} count={statements.length} onSelect={onSelect}/><div className="sculpture-index" aria-hidden="true">{String(active + 1).padStart(2, '0')}<span>/ {String(statements.length).padStart(2, '0')}</span></div><div className="sculpture-footer"><div className="sculpture-title" aria-live="polite"><span>PROBLEM STATEMENT</span><strong key={active}>{statements[active]}</strong></div><div className="sculpture-controls">{statements.map((name, i) => <button type="button" key={name} aria-label={name} title={name} aria-pressed={active === i} onClick={() => onSelect(i)}>{String(i + 1).padStart(2, '0')}</button>)}</div></div></div>;
}

export function ParticleWave() { return <div className="particle-wave"><Field mode="wave"/></div>; }
