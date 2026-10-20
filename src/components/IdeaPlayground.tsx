import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, CheckCheck, Code2, Copy, Leaf, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';

const themes = [
  { label: 'AI for good', icon: Sparkles, ideas: [
    { name: 'Make learning click.', description: 'Help students turn a confusing topic into a short, approachable study plan.', steps: ['Choose one topic and one learner', 'Prototype a simple explanation and quiz', 'Ask a friend what actually helped'], outcome: 'A topic-to-study-plan prototype', stretch: 'Add source links and a way to flag an unclear answer' },
    { name: 'Less noise. More signal.', description: 'Turn a long set of public event notes into a useful action list.', steps: ['Start with a sample set of notes', 'Extract tasks, owners, and questions', 'Compare your results with the original'], outcome: 'A notes-to-action-list demo', stretch: 'Let users review and edit every extracted task' },
    { name: 'Find your next read.', description: 'Help someone discover a learning resource based on their interests and current skills.', steps: ['Curate a small set of public resources', 'Ask about interests and experience', 'Explain why each resource is suggested'], outcome: 'A small learning-resource recommender', stretch: 'Add filters for time, format, and accessibility' },
  ] },
  { label: 'Campus life', icon: Leaf, ideas: [
    { name: 'Give good things a second life.', description: 'Make it easier for students to share books and useful items within their campus.', steps: ['Choose one type of reusable item', 'Build a listing and search screen', 'Prototype a safe request flow'], outcome: 'A campus sharing-board prototype', stretch: 'Add availability filters and reporting controls' },
    { name: 'Find your people.', description: 'Help students discover campus clubs and activities that match their interests.', steps: ['Create a few sample club profiles', 'Add interest-based discovery', 'Prototype an event reminder screen'], outcome: 'An interactive club-discovery page', stretch: 'Add an accessible calendar and saved events' },
    { name: 'A little less waiting.', description: 'Help students understand busy times at a shared campus space using sample data.', steps: ['Choose a library, lab, or canteen', 'Create a sample occupancy dataset', 'Show a clear daily activity chart'], outcome: 'A campus activity dashboard', stretch: 'Add a comparison between different days' },
  ] },
  { label: 'Everyday tools', icon: Code2, ideas: [
    { name: 'Small habits. Real progress.', description: 'Create a calm place to plan one achievable goal and see progress over time.', steps: ['Choose one simple habit', 'Build a daily check-in interaction', 'Show progress without guilt or pressure'], outcome: 'A friendly habit-tracker demo', stretch: 'Add flexible goals and a weekly reflection' },
    { name: 'Make teamwork feel lighter.', description: 'Help a small project team see what needs doing and what is getting in the way.', steps: ['Define three example project tasks', 'Build a simple task board', 'Add a way to flag blockers'], outcome: 'A lightweight project-board prototype', stretch: 'Add keyboard controls and task filters' },
    { name: 'Your time, thoughtfully planned.', description: 'Help students split a large project into realistic, manageable work sessions.', steps: ['Start with a sample project deadline', 'Break the project into small milestones', 'Build an editable session planner'], outcome: 'An interactive study-session planner', stretch: 'Add breaks and a way to reschedule missed sessions' },
  ] },
];

export default function IdeaPlayground() {
  const reduced = useReducedMotion();
  const [theme, setTheme] = useState(0), [ideaIndex, setIdeaIndex] = useState(0);
  const [expanded, setExpanded] = useState(false), [checked, setChecked] = useState<number[]>([]), [notice, setNotice] = useState('');
  const idea = themes[theme].ideas[ideaIndex];
  const steps = expanded ? [...idea.steps, idea.stretch] : idea.steps;
  const reset = () => { setChecked([]); setNotice(''); };
  const copy = async () => {
    const plan = `BuildFeast idea playground — practice prompt\n${idea.name}\n${idea.description}\n\nStarter checklist:\n${steps.map(step => `- ${step}`).join('\n')}\n\nPrototype: ${idea.outcome}\n\nFor inspiration only. The confirmed hackathon problem statements are listed on the event website.`;
    try { await navigator.clipboard.writeText(plan); setNotice('Idea copied. Make it your own!'); }
    catch { setNotice('Copy is unavailable in this browser. You can select and copy the idea text.'); }
  };

  return <section id="playground" className="section playground-section">
    <div className="section-top"><span className="eyebrow"><Sparkles size={14}/> THE IDEA PLAYGROUND</span><span className="tiny-note">CURIOSITY LOOKS GOOD ON YOU.</span></div>
    <div className="playground-layout">
      <div className="playground-intro">
        <span className="playground-badge"><span className="status-dot"/> A LITTLE SPARK GOES A LONG WAY</span>
        <h2>Your next idea<br/>starts with <span>a what if.</span></h2>
        <p>Pick a direction. Explore a small challenge. Take the first step toward something you could build.</p>
        <div className="idea-themes" role="group" aria-label="Choose an idea theme">{themes.map((item, i) => <button key={item.label} aria-pressed={theme === i} onClick={() => { setTheme(i); setIdeaIndex(0); reset(); }}><item.icon size={17}/>{item.label}{theme === i && <Check size={14}/>}</button>)}</div>
        <div className="playground-note"><Lightbulb size={19}/><p>These are practice prompts for inspiration. Explore the official problem statements above when choosing your hackathon direction.</p></div>
      </div>
      <div className="idea-workspace">
        <div className="idea-workspace-top"><span><span className="status-dot"/> YOUR BUILD CANVAS</span><span>{String(ideaIndex + 1).padStart(2, '0')} / 03</span></div>
        <div className="idea-content"><AnimatePresence initial={false}>
          <motion.div className="idea-content-panel" key={`${theme}-${ideaIndex}`} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -8 }} transition={{ duration: reduced ? 0 : .18 }}>
            <div className="idea-heading"><span className="idea-symbol"><Leaf size={24}/></span><span className="eyebrow">{themes[theme].label.toUpperCase()} / PRACTICE PROMPT</span></div>
            <h3>{idea.name}</h3><p className="idea-description">{idea.description}</p>
            <label className="idea-stretch"><input type="checkbox" checked={expanded} onChange={e => { setExpanded(e.target.checked); reset(); }}/><span>Add a stretch goal</span><span className="switch-track" aria-hidden="true"/></label>
            <div className="idea-checklist"><p>YOUR STARTER CHECKLIST <span>{checked.length} / {steps.length}</span></p>{steps.map((step, i) => <label key={step} className={checked.includes(i) ? 'checked' : ''}><input type="checkbox" checked={checked.includes(i)} onChange={() => { setChecked(current => current.includes(i) ? current.filter(n => n !== i) : [...current, i]); setNotice(''); }}/><span className="checkmark" aria-hidden="true"><Check size={13}/></span><span>{step}</span></label>)}</div>
            <div className="idea-progress" aria-hidden="true"><motion.span animate={{ width: `${checked.length / steps.length * 100}%` }} transition={{ duration: reduced ? 0 : .3 }}/></div>
            <div className="idea-outcome" aria-live="polite">{checked.length === steps.length ? <><CheckCheck size={17}/><span>All steps checked. Ready to bring your idea to life?</span></> : <><ArrowRight size={16}/><span>Start small: {idea.outcome.toLowerCase()}.</span></>}</div>
          </motion.div>
        </AnimatePresence></div>
        <div className="idea-actions"><button className="button primary" onClick={() => { setIdeaIndex((ideaIndex + 1) % themes[theme].ideas.length); reset(); }}><RefreshCw size={15}/>Another idea</button><button className="button secondary" onClick={copy}><Copy size={15}/>Copy idea</button></div>
        <p className="copy-notice" role="status">{notice}</p>
      </div>
    </div>
  </section>;
}
