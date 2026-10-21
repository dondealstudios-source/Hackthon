import { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { challengeTargets } from './challenge-particles';

type Target = { x: number; y: number; color: string };
type Particle = Target & { px: number; py: number; vx: number; vy: number; seed: number };

/** Samples the existing logo mark, then animates its particles without altering the brand asset. */
export default function LeafMark({ compact = false, symbol, label = 'BuildFeast leaf symbol' }: { compact?: boolean; symbol?: number; label?: string }) {
  const helpId = useId();
  const ref = useRef<HTMLCanvasElement>(null);
  const scatteredRef = useRef(false);
  const [scattered, setScattered] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    scatteredRef.current = scattered;
    if (!scattered) return;
    const timer = window.setTimeout(() => setScattered(false), 1800);
    return () => window.clearTimeout(timer);
  }, [scattered]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0, phase = 0, visible = false, disposed = false;
    let pointer: { x: number; y: number } | null = null;
    let tiltX = 0, tiltY = 0;
    let particles: Particle[] = [];
    const populate = (targets: Target[]) => {
      particles = targets.map((point, i) => {
        const angle = i * 2.39996;
        return { ...point, px: preference.matches ? point.x : Math.cos(angle) * .58, py: preference.matches ? point.y : Math.sin(angle) * .58, vx: 0, vy: 0, seed: i };
      });
    };
    const fallback: Target[] = [];
    for (let leaf = 0; leaf < 8; leaf++) {
      const angle = leaf * Math.PI / 4 + Math.PI / 8;
      for (let i = 0; i < 100; i++) {
        const t = (i + .5) / 100, along = .1 + t * .29;
        const across = Math.sin(t * Math.PI) * .07 * Math.sin(i * 2.39996);
        fallback.push({ x: Math.cos(angle) * along - Math.sin(angle) * across, y: Math.sin(angle) * along + Math.cos(angle) * across, color: leaf % 2 ? '#659b5e' : '#063d2e' });
      }
    }
    populate(symbol === undefined ? fallback : challengeTargets(symbol));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const size = Math.min(width * .81, height * .82), cx = width / 2, cy = height * .47;
      const desiredX = pointer ? (pointer.x - cx) / width : 0;
      const desiredY = pointer ? (pointer.y - cy) / height : 0;
      tiltX += (desiredX - tiltX) * .055; tiltY += (desiredY - tiltY) * .055;
      const spread = scatteredRef.current && !preference.matches;
      for (const particle of particles) {
        let tx = particle.x, ty = particle.y;
        if (spread) {
          const angle = particle.seed * 2.39996 + phase * .045;
          const radius = .16 + (particle.seed % 107) / 107 * .4;
          tx = Math.cos(angle) * radius; ty = Math.sin(angle) * radius;
        } else if (!preference.matches) {
          const breathe = 1 + Math.sin(phase * (symbol === 0 ? 5 : .5)) * (symbol === 0 ? .025 : .009);
          tx *= breathe; ty *= breathe;
          tx += Math.sin(phase + particle.seed * .9) * .0014;
          ty += Math.cos(phase * .7 + particle.seed) * .0014;
        }
        if (pointer && !preference.matches) {
          const dx = particle.px - (pointer.x - cx) / size;
          const dy = particle.py - (pointer.y - cy) / size;
          const distance = Math.hypot(dx, dy);
          if (distance < .14 && distance > .001) {
            const force = (1 - distance / .14) * .032;
            tx += dx / distance * force; ty += dy / distance * force;
          }
        }
        if (preference.matches) { particle.px = particle.x; particle.py = particle.y; }
        else {
          particle.vx = (particle.vx + (tx - particle.px) * .035) * .79;
          particle.vy = (particle.vy + (ty - particle.py) * .035) * .79;
          particle.px += particle.vx; particle.py += particle.vy;
        }
        const depth = Math.sin(particle.x * 7 + particle.y * 5) * (symbol === undefined ? .055 : .13);
        const x = cx + (particle.px + (preference.matches ? 0 : tiltX * depth)) * size;
        const y = cy + (particle.py + (preference.matches ? 0 : tiltY * depth)) * size;
        ctx.globalAlpha = .68 + (particle.seed % 7) / 7 * .3;
        ctx.fillStyle = particle.color;
        ctx.beginPath(); ctx.arc(x, y, Math.max(.7, size / (symbol === undefined ? 245 : 195)) * (particle.seed % 5 === 0 ? 1.12 : .85), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const animate = (time: number) => {
      if (time - last > 32) { phase += .025; draw(); last = time; }
      frame = requestAnimationFrame(animate);
    };
    const start = () => { cancelAnimationFrame(frame); if (disposed) return; draw(); if (visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(animate); };
    const logo = new Image();
    logo.onload = () => {
      if (disposed) return;
      // The official artwork places the leaf/people mark in the left 27.2%.
      const cropWidth = logo.naturalWidth * .272;
      const sample = document.createElement('canvas');
      sample.width = 190; sample.height = Math.round(190 * logo.naturalHeight / cropWidth);
      const sampleContext = sample.getContext('2d', { willReadFrequently: true });
      if (!sampleContext) return;
      sampleContext.drawImage(logo, 0, 0, cropWidth, logo.naturalHeight, 0, 0, sample.width, sample.height);
      const { data } = sampleContext.getImageData(0, 0, sample.width, sample.height);
      const targets: Target[] = [];
      let minX = sample.width, minY = sample.height, maxX = 0, maxY = 0;
      const step = compact ? 4 : innerWidth < 700 ? 3 : 2;
      for (let y = 0; y < sample.height; y += step) for (let x = 0; x < sample.width; x += step) {
        const offset = (y * sample.width + x) * 4;
        if (data[offset + 3] < 150 || data[offset + 1] < 25) continue;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        targets.push({ x, y, color: `rgb(${data[offset]},${data[offset + 1]},${data[offset + 2]})` });
      }
      if (targets.length) {
        const span = Math.max(maxX - minX, maxY - minY) || 1;
        populate(targets.map(point => ({ ...point, x: (point.x - (minX + maxX) / 2) / span, y: (point.y - (minY + maxY) / 2) / span })));
        start();
      }
    };
    if (symbol === undefined) logo.src = '/assets/vistacortex-buildfeast-transparent.png';
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start();
    });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    const move = (event: PointerEvent) => { if (preference.matches) return; const bounds = canvas.getBoundingClientRect(); pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; };
    const leave = () => { pointer = null; };
    let press: { x: number; y: number } | null = null;
    const down = (event: PointerEvent) => { if (!preference.matches && event.isPrimary && event.button === 0) press = { x: event.clientX, y: event.clientY }; };
    const tap = (event: PointerEvent) => { if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 9) setScattered(current => !current); press = null; if (event.pointerType === 'touch') pointer = null; };
    const cancel = () => { press = null; pointer = null; };
    resize.observe(canvas); observer.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', down, { passive: true }); canvas.addEventListener('pointerup', tap, { passive: true }); canvas.addEventListener('pointercancel', cancel);
    document.addEventListener('visibilitychange', start); preference.addEventListener('change', start);
    return () => { disposed = true; cancelAnimationFrame(frame); logo.onload = null; resize.disconnect(); observer.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', tap); canvas.removeEventListener('pointercancel', cancel); document.removeEventListener('visibilitychange', start); preference.removeEventListener('change', start); };
  }, [compact, symbol]);

  return <div className="leaf-scene"><canvas ref={ref} className="leaf-canvas" role={reduced ? 'img' : 'button'} tabIndex={reduced ? undefined : 0} aria-pressed={reduced ? undefined : scattered} aria-label={reduced ? `${label} rendered in particles` : `Scatter and reform: ${label}`} aria-describedby={helpId} onPointerDown={compact ? event => event.stopPropagation() : undefined} onKeyDown={event => { if (!reduced && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setScattered(current => !current); } }}/><span id={helpId} className="sr-only">Move your pointer to interact. Tap, click, or press Enter to scatter the particles. The symbol reforms automatically.</span></div>;
}
