import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

function Field({ mode, active = 0, count = 8 }: { mode: 'map' | 'wave'; active?: number; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
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
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const cy = height / 2;
      if (mode === 'map') {
        const columns = width < 700 ? 64 : 105;
        for (let strand = 0; strand < count; strand++) {
          const selected = strand === values.current.active;
          const points: { x: number; y: number; z: number }[] = [];
          for (let column = 0; column < columns; column++) {
            const u = column / (columns - 1);
            const angle = u * Math.PI * 2.2 + phase * .55 + strand / count * Math.PI * 2;
            const envelope = Math.sin(u * Math.PI) ** .65;
            const z = Math.cos(angle), x = width * (.05 + u * .9);
            const proximity = pointer && !preference.matches ? Math.exp(-(((x - pointer.x) / 150) ** 2)) : 0;
            const push = pointer ? (pointer.y - cy) * proximity * .27 : 0;
            const y = height * .43 + Math.sin(angle) * height * .22 * envelope + (u - .5) * height * .16 + push;
            points.push({ x, y, z });
          }
          ctx.globalAlpha = selected ? .5 : .12;
          ctx.strokeStyle = selected ? '#285d3e' : '#7a9e59'; ctx.lineWidth = selected ? 1.4 : .7;
          ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
          points.forEach((point, index) => {
            const depth = (point.z + 1) / 2;
            ctx.globalAlpha = (selected ? .45 : .12) + depth * (selected ? .55 : .35);
            ctx.fillStyle = selected ? '#235d3d' : '#81a65f';
            const pulse = selected && (index + Math.floor(phase * 12)) % 18 < 3 ? 1.5 : 1;
            ctx.beginPath(); ctx.arc(point.x, point.y, (.65 + depth * (selected ? 2.1 : 1.15)) * pulse, 0, Math.PI * 2); ctx.fill();
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
          const amplitude = 22 + blend * 28 + proximity * 17;
          const y = cy + Math.sin(u * Math.PI * (2.4 + blend) + phase * .65 + row * .19) * amplitude + (row - rows / 2) * 4 + push;
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
    const tap = () => { if (mode === 'wave' && !preference.matches) setExpanded(value => !value); };
    observer.observe(canvas); resize.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', tap, { passive: true }); document.addEventListener('visibilitychange', start); preference.addEventListener('change', start);
    return () => { redraw.current = () => {}; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', tap); document.removeEventListener('visibilitychange', start); preference.removeEventListener('change', start); };
  }, [mode, count]);
  return <canvas ref={ref} className="living-field" role={mode === 'wave' && !reduced ? 'button' : 'img'} tabIndex={mode === 'wave' && !reduced ? 0 : undefined} aria-pressed={mode === 'wave' && !reduced ? expanded : undefined} aria-label={mode === 'wave' ? 'Interactive flowing particle ribbon. Activate to change its formation.' : 'Flowing particle strands representing the hackathon problem statements'} onKeyDown={event => { if (mode === 'wave' && !reduced && ['Enter', ' '].includes(event.key)) { event.preventDefault(); setExpanded(value => !value); } }}/>;
}

export function ChallengeMap({ statements, active, onSelect }: { statements: string[]; active: number; onSelect: (index: number) => void }) {
  return <div className="challenge-sculpture" role="group" aria-label="Explore problem statements"><Field mode="map" active={active} count={statements.length}/><div className="sculpture-index" aria-hidden="true">{String(active + 1).padStart(2, '0')}<span>/ {String(statements.length).padStart(2, '0')}</span></div><div className="sculpture-footer"><div className="sculpture-title" aria-live="polite"><span>PROBLEM STATEMENT</span><strong key={active}>{statements[active]}</strong></div><div className="sculpture-controls">{statements.map((name, i) => <button type="button" key={name} aria-label={name} title={name} aria-pressed={active === i} onClick={() => onSelect(i)}>{String(i + 1).padStart(2, '0')}</button>)}</div></div></div>;
}

export function ParticleWave() { return <div className="particle-wave"><Field mode="wave"/></div>; }
