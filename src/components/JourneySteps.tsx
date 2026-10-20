import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, AudioLines, Code2, Layers3 } from 'lucide-react';

const stages = [
  { name: 'Learn', icon: AudioLines, text: 'Gain practical knowledge through technical workshops.', tip: 'Start with one new skill.', detail: 'Pick a tool you are curious about. Build a tiny example, ask questions, and keep notes on what you discover.', task: 'Try it: make a small demo using one new technique.' },
  { name: 'Understand', icon: Layers3, text: 'Explore startup registration, compliance, taxes, and business planning.', tip: 'Ask the questions behind the idea.', detail: 'Think about who your idea helps, what problem they face, and which assumptions you need to check before you build.', task: 'Try it: describe your user and their problem in one sentence.' },
  { name: 'Build', icon: Code2, text: 'Apply your skills and develop a solution to a real problem.', tip: 'Make the smallest useful version.', detail: 'Choose one core interaction. Turn it into a working prototype, test it with someone, and improve what feels confusing.', task: 'Try it: sketch three screens and connect the main interaction.' },
  { name: 'Present', icon: ArrowUpRight, text: 'Showcase your work and communicate your ideas during the hackathon.', tip: 'Let your work tell a story.', detail: 'Explain the problem, show your solution, and share what you learned. A clear demo helps people see why your idea matters.', task: 'Try it: practice a one-minute walkthrough of your prototype.' },
];

export default function JourneySteps() {
  const [selected, setSelected] = useState(0);
  const reduced = useReducedMotion();
  const current = stages[selected];
  return <>
    
    <div className="experience-grid journey-steps" role="group" aria-label="Explore the learning journey">{stages.map((stage, i) => <motion.button type="button" key={stage.name} className={`experience-card journey-step ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} aria-controls="journey-detail" onClick={() => setSelected(i)} whileHover={reduced ? undefined : { y: -5 }} transition={{ duration: .2 }}>{selected === i && <motion.span className="journey-active-marker" layoutId="journey-active-marker" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}/>}<span className="experience-icon"><stage.icon/></span><span className="step-number">0{i + 1}</span><strong>{stage.name}.</strong><span className="step-description">{stage.text}</span><span className="step-explore">{selected === i ? 'Exploring this step' : 'Explore this step'}<ArrowUpRight size={15}/></span></motion.button>)}</div>
    <div id="journey-detail" className="journey-detail" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.div key={selected} initial={reduced ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .15 }}><span className="journey-detail-icon"><current.icon size={27}/></span><div><span className="eyebrow">0{selected + 1} / {current.name.toUpperCase()}</span><h3>{current.tip}</h3><p>{current.detail}</p><span className="journey-task"><ArrowRight size={14}/>{current.task}</span></div></motion.div></AnimatePresence></div>
  </>;
}
