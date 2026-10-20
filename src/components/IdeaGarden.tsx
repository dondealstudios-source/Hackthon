import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './idea-garden.css';

type Seed = { x: number; y: number; born: number; angle: number };

export default function IdeaGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const addRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const [count, setCount] = useState(3);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0, clock = 0, visible = false;
    let wind = 0, targetWind = 0;
    let down: { x: number; y: number } | null = null;
    let seeds: Seed[] = [];
    const reset = () => {
      seeds = [{ x: .2, y: .78, born: clock, angle: -.16 }, { x: .5, y: .84, born: clock + .12, angle: .05 }, { x: .8, y: .73, born: clock + .24, angle: .2 }];
      setCount(3); draw();
    };
    const grow = (x: number, y: number) => {
      seeds = [...seeds.slice(-9), { x: Math.max(.08, Math.min(.92, x)), y: Math.max(.53, Math.min(.91, y)), born: clock, angle: (x - .5) * .5 }];
      setCount(seeds.length); draw();
    };
    const leaf = (x: number, y: number, angle: number, size: number, pale: boolean) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillStyle = pale ? '#8bb268' : '#285f40';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(size * .9, -size * .8, size * 1.6, 0); ctx.quadraticCurveTo(size * .7, size * .7, 0, 0); ctx.fill();
      ctx.strokeStyle = '#f4f8ec66'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(size * 1.3, 0); ctx.stroke(); ctx.restore();
    };
    function draw() {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);
      wind += (targetWind - wind) * .08;
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const progress = reduced.matches ? 1 : Math.min(1, Math.max(0, (clock - seed.born) / 1.15));
        const ease = 1 - (1 - progress) ** 3;
        const x = seed.x * width, y = seed.y * height;
        if (i > 0) {
          const previous = seeds[i - 1];
          const px = previous.x * width, py = previous.y * height;
          ctx.strokeStyle = '#94b57c'; ctx.globalAlpha = ease * .4; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo((px + x) / 2, Math.min(height - 5, Math.max(py, y) + 22), px + (x - px) * ease, py + (y - py) * ease); ctx.stroke(); ctx.globalAlpha = 1;
        }
        ctx.save(); ctx.translate(x, y);
        ctx.rotate(seed.angle + (reduced.matches ? 0 : wind * .12 + Math.sin(clock * 1.2 + i) * .025));
        const length = Math.min(94, height * .38) * ease;
        ctx.strokeStyle = '#699151'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-10, -length * .5, 0, -length); ctx.stroke();
        for (let n = 0; n < 5; n++) {
          const t = (n + 1) / 6;
          const sprout = Math.max(0, Math.min(1, (ease - t * .55) * 2));
          const side = n % 2 === 0 ? -1 : 1;
          leaf(-Math.sin(t * Math.PI) * 5, -length * t, side < 0 ? -2.6 + t * .2 : -.6, (10 + (1 - t) * 9) * sprout, n % 3 !== 0);
        }
        leaf(0, -length, -Math.PI / 2, 13 * ease, true);
        ctx.restore();
        ctx.fillStyle = '#285f40'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        if (!reduced.matches && progress < 1) {
          ctx.strokeStyle = `rgba(105,145,81,${(1 - progress) * .4})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(x, y, 5 + progress * 24, 2 + progress * 8, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
    const animate = (time: number) => {
      if (time - last >= 32) { clock += Math.min((time - last) / 1000, .05); last = time; draw(); }
      frame = requestAnimationFrame(animate);
    };
    const start = () => { cancelAnimationFrame(frame); last = performance.now(); draw(); if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(animate); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    const resize = new ResizeObserver(() => { width = canvas.clientWidth; height = canvas.clientHeight; const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start(); });
    const move = (event: PointerEvent) => { if (event.pointerType !== 'touch') targetWind = ((event.clientX - canvas.getBoundingClientRect().left) / width - .5) * 2; };
    const press = (event: PointerEvent) => { if (event.isPrimary && event.button === 0) down = { x: event.clientX, y: event.clientY }; };
    const release = (event: PointerEvent) => { if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 10) { const rect = canvas.getBoundingClientRect(); grow((event.clientX - rect.left) / width, (event.clientY - rect.top) / height); } down = null; };
    const cancel = () => { down = null; targetWind = 0; };
    addRef.current = () => grow(.12 + ((seeds.length * .618) % .76), .72 + (seeds.length % 3) * .06);
    resetRef.current = reset; reset(); observer.observe(canvas); resize.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerdown', press); canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('pointerleave', cancel);
    document.addEventListener('visibilitychange', start); reduced.addEventListener('change', start);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); addRef.current = () => {}; resetRef.current = () => {}; canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('pointerleave', cancel); document.removeEventListener('visibilitychange', start); reduced.removeEventListener('change', start); };
  }, []);
  return <div className="idea-garden"><div className="garden-copy"><span className="eyebrow">THE IDEA GARDEN</span><h3>Good ideas<br/>grow together.</h3><div className="garden-tools"><span aria-live="polite">{String(count).padStart(2, '0')} ideas connected</span><button type="button" aria-label="Reset idea garden" title="Reset garden" onClick={() => resetRef.current()}><RotateCcw size={15}/></button></div></div><canvas ref={canvasRef} role="button" tabIndex={0} aria-label="Grow the idea garden. Tap an empty spot or press Enter to plant a new idea. Up to ten ideas connect together." onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); addRef.current(); } }}/></div>;
}
