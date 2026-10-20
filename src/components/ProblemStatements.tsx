import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Bot, Check, Compass, Cpu, GraduationCap, HeartPulse, Landmark, RadioTower, ShieldCheck, Shuffle } from 'lucide-react';
import { getProblemStatements, type EventConfig } from '../config/event';
import { ChallengeMap } from './LivingGraphics';

const icons = [HeartPulse, Bot, ShieldCheck, Landmark, GraduationCap, Compass, RadioTower, Cpu];

export default function ProblemStatements({ config, onChoose }: { config: EventConfig; onChoose: (statement: string) => void }) {
  const statements = getProblemStatements(config);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const shuffleTimer = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const stopShuffle = () => { if (shuffleTimer.current !== null) window.clearInterval(shuffleTimer.current); shuffleTimer.current = null; setPreview(null); setShuffling(false); };
  useEffect(() => () => { if (shuffleTimer.current !== null) window.clearInterval(shuffleTimer.current); }, []);
  const surprise = () => {
    if (shuffling || statements.length < 2) return;
    const choice = (active + 1 + Math.floor(Math.random() * (statements.length - 1))) % statements.length;
    if (reduced) { setActive(choice); return; }
    setShuffling(true);
    let tick = 0;
    shuffleTimer.current = window.setInterval(() => {
      tick++;
      if (tick < 6) setPreview((active + tick) % statements.length);
      else { stopShuffle(); setActive(choice); }
    }, 110);
  };
  return <section id="problem-statements" className="section statements-section" aria-labelledby="statements-heading">
    <div className="section-top"><span className="eyebrow">02 / PROBLEM STATEMENTS</span><span className="tiny-note">{String(statements.length).padStart(2, '0')} PROBLEM STATEMENTS</span></div>
    <div className="section-heading split-heading"><h2 id="statements-heading">Choose your<br/><span className="muted-heading">problem statement.</span></h2><p>Explore the hackathon’s problem statements and choose the one you would like to build for.</p></div>
    <ChallengeMap statements={statements} active={active} onSelect={index => { stopShuffle(); setActive(index); }}/>
    <div className="challenge-discovery"><button type="button" className={`surprise-control ${shuffling ? 'is-shuffling' : ''}`} onClick={surprise} disabled={shuffling || statements.length < 2}><Shuffle size={14}/>{shuffling ? 'Finding a challenge…' : 'Surprise me'}</button></div>
    <div className="statements-grid" role="group" aria-label="Hackathon problem statements">{statements.map((name, i) => {
      const Icon = icons[i % icons.length];
      return <motion.button key={name} type="button" className={`statement-card ${active === i ? 'selected' : ''} ${preview === i ? 'previewed' : ''}`} aria-pressed={active === i} aria-controls="selected-statement" onClick={() => { stopShuffle(); setActive(i); }} initial={reduced ? false : { opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .35, delay: reduced ? 0 : (i % 4) * .05 }} whileHover={reduced ? undefined : { y: -2 }}><span className="statement-number">{String(i + 1).padStart(2, '0')}</span><span className="statement-icon"><Icon size={25}/></span><strong>{name}</strong><span className="statement-card-bottom">{active === i ? <><Check size={13}/>Selected to explore</> : <>Explore this problem<ArrowUpRight size={14}/></>}</span></motion.button>;
    })}</div>
    <div id="selected-statement" className="selected-statement"><div aria-live="polite"><span className="eyebrow">YOUR DIRECTION</span><motion.h3 key={statements[active]} initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, ease: [.22, 1, .36, 1] }}>{statements[active]}</motion.h3><p>Add this problem statement to your registration interests.</p></div><button className="button primary" disabled={shuffling} onClick={() => onChoose(statements[active])}>Choose this problem<ArrowUpRight size={16}/></button></div>
  </section>;
}
