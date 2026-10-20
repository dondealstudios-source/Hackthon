import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { ArrowUpRight, Braces, Layers3, Orbit, Sparkles } from 'lucide-react';

export function BuildStack() {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(true);
  const tiltX = useMotionValue(-12), tiltY = useMotionValue(-20);
  const rotateX = useSpring(tiltX, { stiffness: 130, damping: 19 });
  const rotateY = useSpring(tiltY, { stiffness: 130, damping: 19 });
  return <div className="build-stack" onPointerMove={e => {
    if (reduced || e.pointerType === 'touch') return;
    const bounds = e.currentTarget.getBoundingClientRect();
    tiltX.set(-12 - ((e.clientY - bounds.top) / bounds.height - .5) * 22);
    tiltY.set(-20 + ((e.clientX - bounds.left) / bounds.width - .5) * 35);
  }} onPointerLeave={() => { tiltX.set(-12); tiltY.set(-20); }}>
    <span className="object-eyebrow"><Layers3 size={12}/> THE ANATOMY OF AN IDEA</span>
    <div className="stack-perspective" aria-hidden="true"><motion.div className="stack-object" style={{ rotateX: reduced ? -12 : rotateX, rotateY: reduced ? -20 : rotateY }}>
      {['DATA', 'LOGIC', 'INTERFACE'].map((label, i) => <motion.div className={`stack-layer layer-${i}`} key={label} animate={{ y: expanded ? (i - 1) * -49 : (i - 1) * -10, z: i * 15, rotateZ: expanded ? (i - 1) * -7 : 0 }} transition={{ duration: reduced ? 0 : .65, type: 'tween', ease: [.22, 1, .36, 1] }}><span className="stack-layer-label"><span className="stack-led"/>{label}<span>0{i + 1}</span></span>{i === 0 ? <div className="stack-data">{Array.from({ length: 18 }, (_, n) => <span key={n}/>)}</div> : i === 1 ? <div className="stack-code"><Braces size={30}/><span/><span/><span/></div> : <div className="stack-interface"><span className="stack-ui-orb"/><span/><span/><span className="stack-ui-button"/></div>}</motion.div>)}
    </motion.div></div>
    <button className="object-control" aria-pressed={!expanded} onClick={() => setExpanded(current => !current)}><Layers3 size={14}/>{expanded ? 'Assemble the layers' : 'Explore the layers'}<ArrowUpRight size={14}/></button>
    
  </div>;
}

export function IdeaConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<(() => void) | null>(null);
  const [orbit, setOrbit] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0, phase = 0, visible = false;
    let pointer: { x: number; y: number } | null = null;
    const count = innerWidth < 700 ? 45 : 70;
    const particles = Array.from({ length: count }, (_, i) => ({ seed: i, x: 0, y: 0, initialized: false }));
    let pulses: { x: number; y: number; radius: number }[] = [];
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width * .5, cy = height * .5, radius = Math.min(width * .41, height * .4);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.7);
      glow.addColorStop(0, '#d9e8c85c'); glow.addColorStop(1, '#d9e8c800');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      for (const particle of particles) {
        const a = particle.seed * 2.39996 + phase * .12;
        const r = orbit ? radius * (.65 + (particle.seed % 3) * .14) : Math.sqrt(particle.seed / count) * radius;
        let tx = cx + Math.cos(a) * r * (orbit ? 1.12 : 1.7);
        let ty = cy + Math.sin(a) * r * (orbit ? .75 : 1);
        if (!reduced.matches) { tx += Math.sin(phase + particle.seed * .7) * 7; ty += Math.cos(phase * .8 + particle.seed) * 9; }
        if (pointer && !reduced.matches) {
          const dx = pointer.x - tx, dy = pointer.y - ty, distance = Math.hypot(dx, dy);
          if (distance < 140) { tx += dx * .25; ty += dy * .25; }
        }
        if (!particle.initialized || reduced.matches) { particle.x = tx; particle.y = ty; particle.initialized = true; }
        else { particle.x += (tx - particle.x) * .09; particle.y += (ty - particle.y) * .09; }
      }
      for (let i = 0; i < count; i++) {
        const point = particles[i];
        for (let j = i + 1; j < count; j++) {
          const other = particles[j], distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < 67) { ctx.strokeStyle = `rgba(80,130,65,${(1 - distance / 67) * .3})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(other.x, other.y); ctx.stroke(); }
        }
        ctx.fillStyle = i % 5 === 0 ? '#0b513b' : '#83a86a';
        ctx.beginPath(); ctx.arc(point.x, point.y, i % 5 === 0 ? 3.2 : 1.7, 0, Math.PI * 2); ctx.fill();
        if (i % 13 === 0) { ctx.strokeStyle = '#98b87c55'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(point.x, point.y, 7, 0, Math.PI * 2); ctx.stroke(); }
      }
      for (const pulse of pulses) {
        if (!reduced.matches) pulse.radius += 3;
        ctx.strokeStyle = `rgba(80,140,60,${Math.max(0, 1 - pulse.radius / 250) * .5})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2); ctx.stroke();
      }
      pulses = reduced.matches ? [] : pulses.filter(pulse => pulse.radius < 250);
    };
    const animate = (time: number) => {
      if (time - last > 32) { phase += .018; draw(); last = time; }
      frame = requestAnimationFrame(animate);
    };
    const start = () => { cancelAnimationFrame(frame); draw(); if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(animate); };
    const spark = (x = width / 2, y = height / 2) => { pulses.push({ x, y, radius: reduced.matches ? 90 : 0 }); pulses = pulses.slice(-6); if (reduced.matches) draw(); };
    sparkRef.current = () => spark();
    const move = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const leave = () => { pointer = null; };
    const tap = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); spark(event.clientX - rect.left, event.clientY - rect.top); };
    const resize = new ResizeObserver(() => { width = canvas.clientWidth; height = canvas.clientHeight; const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); start(); });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    resize.observe(canvas); observer.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true }); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', tap, { passive: true });
    reduced.addEventListener('change', start); document.addEventListener('visibilitychange', start);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', tap); reduced.removeEventListener('change', start); document.removeEventListener('visibilitychange', start); sparkRef.current = null; };
  }, [orbit]);
  return <div className="constellation-card">
    <div className="constellation-copy"><span className="eyebrow"><Orbit size={14}/> CONNECTED BY CURIOSITY</span><h3>Good ideas<br/>find each other.</h3><div className="constellation-actions"><button className="object-control" onClick={() => sparkRef.current?.()}><Sparkles size={14}/>Send a spark</button><button className="object-control" aria-pressed={orbit} onClick={() => setOrbit(current => !current)}><Orbit size={14}/>{orbit ? 'Release the stars' : 'Bring into orbit'}</button></div></div>
    <div className="constellation-stage"><canvas ref={canvasRef} role="img" aria-label={orbit ? 'Interactive particle rings. Use the buttons to send a spark or change the formation.' : 'Interactive connected particle constellation. Use the buttons to send a spark or bring particles into orbit.'}/></div>
  </div>;
}
