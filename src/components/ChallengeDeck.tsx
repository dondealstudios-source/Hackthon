import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ChallengeArt from './ChallengeArt';
import './challenge-deck.css';


export default function ChallengeDeck({ statements, active, onSelect }: { statements: string[]; active: number; onSelect: (index: number) => void }) {
  const [direction, setDirection] = useState(1);
  const reduced = useReducedMotion();
  const next = (step: number) => { setDirection(step); onSelect((active + step + statements.length) % statements.length); };
  return <div className="challenge-deck" role="group" aria-roledescription="carousel" aria-label="Hackathon challenges" tabIndex={0} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); next(event.key === 'ArrowRight' ? 1 : -1); }
  }}>
    <div className="deck-stage">
      <div className="deck-backing deck-backing-far" aria-hidden="true"/>
      <div className="deck-backing deck-backing-near" aria-hidden="true"/>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.article key={active} custom={direction} className="deck-face" drag={reduced ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={.16} onDragEnd={(_event, info) => { if (Math.abs(info.offset.x) > 45 || Math.abs(info.velocity.x) > 450) next(info.offset.x < 0 || info.velocity.x < -450 ? 1 : -1); }} variants={{ enter: (step: number) => ({ opacity: 0, x: reduced ? 0 : step * 70, rotate: reduced ? 0 : step * 3, scale: reduced ? 1 : .98 }), center: { opacity: 1, x: 0, rotate: 0, scale: 1 }, exit: (step: number) => ({ opacity: 0, x: reduced ? 0 : step * -90, rotate: reduced ? 0 : step * -4, scale: reduced ? 1 : .97 }) }} initial="enter" animate="center" exit="exit" transition={{ duration: reduced ? 0 : .38, ease: [.22, 1, .36, 1] }}>
          <div className="deck-copy"><span className="deck-kicker">BUILDFEAST / CHALLENGE {String(active + 1).padStart(2, '0')}</span><h3>{statements[active]}</h3><span className="deck-footer-label">A problem worth solving.</span></div>
          <div className="deck-topic-illustration"><ChallengeArt index={active}/></div>
          <span className="deck-watermark" aria-hidden="true">{String(active + 1).padStart(2, '0')}</span>
        </motion.article>
      </AnimatePresence>
    </div>
    <div className="deck-navigation"><div className="deck-progress" aria-hidden="true">{statements.map((name, i) => <span key={name} className={active === i ? 'current' : ''}/>)}</div><span className="deck-count" aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(statements.length).padStart(2, '0')}<span className="sr-only">: {statements[active]}</span></span><div className="deck-arrows"><button type="button" aria-label="Previous challenge" onClick={() => next(-1)}><ArrowLeft size={19}/></button><button type="button" aria-label="Next challenge" onClick={() => next(1)}><ArrowRight size={19}/></button></div></div>
  </div>;
}
