import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, Code2 } from 'lucide-react';
import './demo-stage.css';

const stages = ['Build', 'Preview', 'Demo'];

export default function DemoStage() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: .3 });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!visible || !pageVisible || reduced) return;
    const next = window.setTimeout(() => setStep(current => (current + 1) % stages.length), step === 2 ? 2600 : 1800);
    return () => clearTimeout(next);
  }, [visible, pageVisible, reduced, step]);
  return <div ref={ref} className="demo-stage" data-playing={visible && pageVisible}>
    <div className="demo-stage-top"><span>FROM BUILD TO DEMO</span><span className="demo-status-light" aria-hidden="true"/></div>
    <div className="demo-monitor" aria-hidden="true"><div className="demo-browser"><i/><i/><i/><span>your-project</span></div><div className="demo-screen"><AnimatePresence mode="wait" initial={false}><motion.div key={step} className="demo-screen-content" initial={reduced ? false : { opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : -10 }} transition={{ duration: reduced ? 0 : .25 }}>
      {step === 0 ? <div className="demo-code"><Code2 size={32} strokeWidth={1.3}/>{[80, 58, 92, 66, 45].map((width, i) => <span key={i} style={{ width: `${width}%`, animationDelay: `${i * .16}s` }}/>)}</div> : step === 1 ? <div className="demo-preview"><div className="demo-preview-heading"/><div className="demo-preview-line"/><div className="demo-preview-tiles">{[0, 1, 2].map(i => <motion.span key={i} initial={reduced ? false : { scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: reduced ? 0 : i * .12 }}/>)}</div><div className="demo-preview-action"/></div> : <div className="demo-ready"><div className="demo-success-rings"><span/><span/><span/><Check size={34}/></div><strong>Your idea, in action.</strong><div className="demo-audience"><i/><i/><i/><i/><i/></div></div>}
    </motion.div></AnimatePresence></div><div className="demo-monitor-foot"/></div>
    <div className="demo-bottom"><div className="demo-steps" role="group" aria-label="Project demo stages">{stages.map((name, i) => <button type="button" key={name} aria-pressed={step === i} onClick={() => setStep(i)}><span>{step > i ? <Check size={10}/> : i + 1}</span>{name}</button>)}</div></div>
    <span className="sr-only">An illustrative project progressing from build to preview to demo.</span>
  </div>;
}
