import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

const logo = '/assets/vistacortex-buildfeast-transparent.png';

/** A brief decorative welcome. The page stays available to assistive technology. */
export default function LogoEntrance() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduced || !playing) return;
    const finish = window.setTimeout(() => setPlaying(false), 1100);
    return () => window.clearTimeout(finish);
  }, [playing, reduced, run]);

  return <>
    <AnimatePresence>{playing && !reduced && <motion.div className="logo-entrance" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }} aria-hidden="true">
      <motion.div className="entrance-halo" initial={{ scale: .75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }}/>
      <div className="entrance-content">
        <motion.span className="entrance-eyebrow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>VISTACORTEX PRESENTS</motion.span>
        <motion.img src={logo} width="2081" height="756" alt="" initial={{ opacity: 0, y: 18, scale: .96, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, y: 0, scale: 1, clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: .85, delay: .1, ease: [.22, 1, .36, 1] }}/>
        <motion.div className="entrance-rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .9, delay: .2 }}/>
        <div className="entrance-tagline">{['Learn.', 'Build.', 'Launch.'].map((word, i) => <motion.span key={word} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: .45 + i * .12 }}>{word}</motion.span>)}</div>
      </div>
      <button className="entrance-skip" tabIndex={-1} onClick={() => setPlaying(false)}>Skip introduction</button>
    </motion.div>}</AnimatePresence>
    {!reduced && <button className="replay-entrance" onClick={() => { setRun(current => current + 1); setPlaying(true); }}><RotateCcw size={12}/>Replay introduction</button>}
  </>;
}
