import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
const ChallengeArt = lazy(() => import('./ChallengeArt'));
import './logo-entrance.css';

const logo = '/assets/brand-wordmark.webp';
const DURATION = 5200;

/** The eight challenge domains, drawn with the same animated art used in the challenge deck. */
const domains = 8;

/** A brief decorative welcome. The page stays available to assistive technology. */
export default function LogoEntrance() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduced || !playing) return;
    const finish = window.setTimeout(() => setPlaying(false), DURATION);
    return () => window.clearTimeout(finish);
  }, [playing, reduced, run]);

  // Fixed pseudo-random dots so the field is stable between renders.
  const dots = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (i % 3) * .35;
    const radius = 22 + ((i * 37) % 19);
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, size: 4 + ((i * 7) % 11), delay: (i % 6) * .3, drift: 8 + (i % 4) * 4 };
  }), []);

  return <>
    <AnimatePresence>{playing && !reduced && <motion.div key={run} className="intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.06 }} transition={{ duration: .6, ease: 'easeInOut' }} aria-hidden="true">
      <div className="intro-stage">
        <motion.div className="intro-glow" initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: .2 }}/>
        {[0, 1].map(i => <motion.span key={i} className="intro-ripple" initial={{ opacity: .55, scale: .2 }} animate={{ opacity: 0, scale: 1 }} transition={{ duration: 2, delay: .3 + i * .55, ease: 'easeOut' }}/>)}

        <svg className="intro-ring" viewBox="0 0 100 100">
          <motion.circle cx="50" cy="50" r="49.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.7, ease: 'easeInOut' }}/>
        </svg>
        <motion.svg className="intro-ring intro-ring-inner" viewBox="0 0 100 100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}><circle cx="50" cy="50" r="40"/></motion.svg>

        <div className="intro-dots">{dots.map((d, i) => <span key={i} style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, marginLeft: -d.size / 2, marginTop: -d.size / 2, '--drift': `${d.drift}px`, animationDelay: `${.5 + d.delay}s, ${d.delay}s` } as React.CSSProperties}/>)}</div>

        <div className="intro-orbit">{Array.from({ length: domains }, (_, i) => {
          const angle = (i / domains) * 360 - 90;
          return <div key={i} className="intro-node" style={{ transform: `rotate(${angle}deg) translate(var(--r)) rotate(${-angle}deg)` }}>
            <span><motion.i initial={{ opacity: 0, scale: 0, rotate: -120 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 130, damping: 12, delay: .7 + i * .17 }}><Suspense fallback={null}><ChallengeArt index={i}/></Suspense></motion.i></span>
          </div>;
        })}</div>

        <div className="intro-content">
          <motion.span className="intro-eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: .5 }}>Vistacortex&nbsp;&nbsp;&nbsp;&nbsp;presents</motion.span>
          <div className="intro-logo"><img src={logo} width="560" height="203" alt=""/><span className="intro-shine" style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }}><i/></span></div>
          <div className="intro-tagline">{['Learn', 'Build', 'Launch'].map((word, i) => <motion.span key={word} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: 2.2 + i * .28 }}>{word}</motion.span>)}</div>
        </div>
      </div>
      <button className="intro-skip" tabIndex={-1} onClick={() => setPlaying(false)}>Skip Intro<ArrowRight size={12}/></button>
    </motion.div>}</AnimatePresence>
    {!reduced && <button className="replay-entrance" onClick={() => { setRun(current => current + 1); setPlaying(true); }}><RotateCcw size={12}/>Replay introduction</button>}
  </>;
}
