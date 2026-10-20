import { useEffect, useRef } from 'react';

/** A projected particle sphere. No textures, libraries, or continuous offscreen work. */
export default function Globe() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0, visible = true, phase = 0;
    let mouseX = 0, mouseY = 0;
    const points = Array.from({ length: window.innerWidth < 640 ? 1600 : 3600 }, (_, i) => {
      const y = 1 - (i / 3599) * 2;
      // Normalize with actual count so mobile keeps a whole sphere.
      return { i, y };
    }).map(({ i }, _, arr) => {
      const y = 1 - i / (arr.length - 1) * 2;
      const radius = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(a) * radius, y, z: Math.sin(a) * radius, seed: i };
    });
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * .46, height * .59);
      const cx = width / 2, cy = height * .55;
      const glow = ctx.createRadialGradient(cx, cy, radius * .1, cx, cy, radius * 1.12);
      glow.addColorStop(0, 'rgba(101,155,94,.035)'); glow.addColorStop(.86, 'rgba(101,155,94,.045)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      const angle = phase * .14 + mouseX * .13;
      const tilt = -.18 + mouseY * .08;
      for (const p of points) {
        const x = p.x * Math.cos(angle) + p.z * Math.sin(angle);
        const z = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
        const depth = p.y * Math.sin(tilt) + z * Math.cos(tilt);
        const wave = 1 + .019 * Math.sin(p.y * 14 + phase + p.x * 5);
        const opacity = .12 + (depth + 1) * .31;
        const band = Math.sin(y * 18 + x * 6 + phase * .7) > .74;
        ctx.fillStyle = band && depth > .2 ? `rgba(101,155,94,${opacity * .7})` : `rgba(6,74,51,${opacity})`;
        ctx.beginPath(); ctx.arc(cx + x * radius * wave, cy + y * radius * wave, .45 + (depth + 1) * .5, 0, Math.PI * 2); ctx.fill();
      }
      // Fine orbital lines and flowing waves at the base of the globe.
      ctx.lineWidth = .6;
      for (let row = 0; row < 7; row++) {
        ctx.strokeStyle = `rgba(57,127,94,${.055 + row * .004})`;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const y = cy + radius * .65 + Math.sin(x / width * 9 + phase * .6 + row * .25) * 20 + row * 8;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    const animate = (time: number) => {
      if (visible && !document.hidden && time - last > 40) { phase += .016; draw(); last = time; }
      if (!reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(animate);
    };
    const start = () => { cancelAnimationFrame(frame); draw(); if (!reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(animate); };
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start();
    });
    resize.observe(canvas);
    const observe = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }); observe.observe(canvas);
    const move = (e: PointerEvent) => { if (reduced.matches || !visible) return; const b = canvas.getBoundingClientRect(); mouseX = (e.clientX - b.left) / b.width - .5; mouseY = (e.clientY - b.top) / b.height - .5; };
    const scroll = () => { if (visible && !reduced.matches) mouseY = Math.min(window.scrollY / 1800, .5); };
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('visibilitychange', start); reduced.addEventListener('change', start);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observe.disconnect(); window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scroll); document.removeEventListener('visibilitychange', start); reduced.removeEventListener('change', start); };
  }, []);
  return <canvas ref={ref} className="globe-canvas" aria-label="A slowly rotating dotted globe with flowing particle waves" role="img" />;
}
