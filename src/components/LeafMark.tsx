import { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { challengeTargets } from './challenge-particles';

type Target = { x: number; y: number; color: string };
type Particle = Target & { px: number; py: number; vx: number; vy: number; seed: number; depth: number; sinX: number; cosX: number; sinY: number; cosY: number };

// Coordinates are prepared at build time; share one small request across instances.
let logoTargets: Promise<Target[]> | undefined;
function loadLogoTargets() {
  return logoTargets ??= fetch('/assets/leaf-particles.json', { credentials: 'omit' })
    .then(response => { if (!response.ok) throw new Error('Particle map unavailable'); return response.json() as Promise<number[][]>; })
    .then(points => {
      if (!Array.isArray(points) || !points.length) throw new Error('Empty particle map');
      return points.map(([x, y, color]) => ({ x: x / 1000, y: y / 1000, color: color ? '#659b5e' : '#063d2e' }));
    }).catch(error => { logoTargets = undefined; throw error; });
}

/** The official emblem and themed silhouettes share the same lightweight particle renderer. */
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
    let restingImage: HTMLCanvasElement | null = null;
    let interactiveUntil = performance.now() + 2200, wasScattered = false;
    let groups: { color: string; opacity: number; points: Particle[] }[] = [];
    const populate = (targets: Target[]) => {
      restingImage = null; interactiveUntil = performance.now() + 2200;
      particles = targets.map((point, i) => {
        const angle = i * 2.39996;
        return { ...point, px: preference.matches ? point.x : Math.cos(angle) * .58, py: preference.matches ? point.y : Math.sin(angle) * .58, vx: 0, vy: 0, seed: i, depth: Math.sin(point.x * 7 + point.y * 5) * (symbol === undefined ? .055 : .13), sinX: Math.sin(i * .9), cosX: Math.cos(i * .9), sinY: Math.sin(i), cosY: Math.cos(i) };
      });
      const batches = new Map<string, { color: string; opacity: number; points: Particle[] }>();
      for (const particle of particles) {
        const shade = particle.seed % 3, key = particle.color + shade;
        if (!batches.has(key)) batches.set(key, { color: particle.color, opacity: .72 + shade * .1, points: [] });
        batches.get(key)!.points.push(particle);
      }
      groups = [...batches.values()];
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
      const spread = scatteredRef.current && !preference.matches;
      if (spread !== wasScattered) { wasScattered = spread; interactiveUntil = performance.now() + 2200; }
      // The settled mark breathes as one cached image. Physics resumes immediately
      // for pointer/touch interactions, avoiding thousands of idle calculations.
      if (!pointer && !spread && (preference.matches || performance.now() > interactiveUntil)) {
        if (!restingImage) {
          const image = document.createElement('canvas');
          image.width = canvas.width; image.height = canvas.height;
          const imageContext = image.getContext('2d');
          if (imageContext) {
            imageContext.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
            const radius = Math.max(.7, size / (symbol === undefined ? 245 : 195));
            for (const group of groups) {
              imageContext.fillStyle = group.color; imageContext.globalAlpha = group.opacity; imageContext.beginPath();
              for (const point of group.points) {
                const x = cx + point.x * size, y = cy + point.y * size;
                const r = radius * (point.seed % 5 === 0 ? 1.12 : .85);
                imageContext.moveTo(x + r, y); imageContext.arc(x, y, r, 0, Math.PI * 2);
              }
              imageContext.fill();
            }
            restingImage = image;
          }
        }
        if (restingImage) {
          const breathe = preference.matches ? 1 : 1 + Math.sin(phase * (symbol === 0 ? 5 : .5)) * (symbol === 0 ? .025 : .009);
          ctx.save(); ctx.translate(cx, cy); ctx.scale(breathe, breathe);
          ctx.drawImage(restingImage, -cx, -cy, width, height); ctx.restore();
          return;
        }
      }
      const desiredX = pointer ? (pointer.x - cx) / width : 0;
      const desiredY = pointer ? (pointer.y - cy) / height : 0;
      tiltX += (desiredX - tiltX) * .055; tiltY += (desiredY - tiltY) * .055;
      const breathe = 1 + Math.sin(phase * (symbol === 0 ? 5 : .5)) * (symbol === 0 ? .025 : .009);
      const sinPhase = Math.sin(phase), cosPhase = Math.cos(phase);
      const sinSlow = Math.sin(phase * .7), cosSlow = Math.cos(phase * .7);
      const radius = Math.max(.7, size / (symbol === undefined ? 245 : 195));
      for (const group of groups) {
        ctx.fillStyle = group.color; ctx.globalAlpha = group.opacity; ctx.beginPath();
        for (const particle of group.points) {
          let tx = particle.x, ty = particle.y;
          if (spread) {
            const angle = particle.seed * 2.39996 + phase * .045;
            const radius = .16 + (particle.seed % 107) / 107 * .4;
            tx = Math.cos(angle) * radius; ty = Math.sin(angle) * radius;
          } else if (!preference.matches) {
            tx *= breathe; ty *= breathe;
            tx += (sinPhase * particle.cosX + cosPhase * particle.sinX) * .0014;
            ty += (cosSlow * particle.cosY - sinSlow * particle.sinY) * .0014;
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
          const depth = particle.depth;
          const x = cx + (particle.px + (preference.matches ? 0 : tiltX * depth)) * size;
          const y = cy + (particle.py + (preference.matches ? 0 : tiltY * depth)) * size;
          const dotRadius = radius * (particle.seed % 5 === 0 ? 1.12 : .85);
          ctx.moveTo(x + dotRadius, y); ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const animate = (time: number) => {
      if (time - last > 32) { phase += .025; draw(); last = time; }
      frame = requestAnimationFrame(animate);
    };
    const start = () => { cancelAnimationFrame(frame); if (disposed) return; draw(); if (visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(animate); };
    if (symbol === undefined) loadLogoTargets().then(targets => {
      if (disposed) return;
      populate(targets); start();
    }).catch(() => { /* The procedural mark stays available if the asset request fails. */ });
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight; restingImage = null;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start();
    });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    const move = (event: PointerEvent) => { if (preference.matches) return; interactiveUntil = performance.now() + 1500; const bounds = canvas.getBoundingClientRect(); pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; };
    const leave = () => { pointer = null; interactiveUntil = performance.now() + 1500; };
    let press: { x: number; y: number } | null = null;
    const down = (event: PointerEvent) => { if (!preference.matches && event.isPrimary && event.button === 0) press = { x: event.clientX, y: event.clientY }; };
    const tap = (event: PointerEvent) => { if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 9) setScattered(current => !current); press = null; if (event.pointerType === 'touch') pointer = null; };
    const cancel = () => { press = null; pointer = null; };
    resize.observe(canvas); observer.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', down, { passive: true }); canvas.addEventListener('pointerup', tap, { passive: true }); canvas.addEventListener('pointercancel', cancel);
    document.addEventListener('visibilitychange', start); preference.addEventListener('change', start);
    return () => { disposed = true; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', tap); canvas.removeEventListener('pointercancel', cancel); document.removeEventListener('visibilitychange', start); preference.removeEventListener('change', start); };
  }, [compact, symbol]);

  return <div className="leaf-scene"><canvas ref={ref} className="leaf-canvas" role={reduced ? 'img' : 'button'} tabIndex={reduced ? undefined : 0} aria-pressed={reduced ? undefined : scattered} aria-label={reduced ? `${label} rendered in particles` : `Scatter and reform: ${label}`} aria-describedby={helpId} onPointerDown={compact ? event => event.stopPropagation() : undefined} onKeyDown={event => { if (!reduced && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setScattered(current => !current); } }}/><span id={helpId} className="sr-only">Move your pointer to interact. Tap, click, or press Enter to scatter the particles. The symbol reforms automatically.</span></div>;
}
