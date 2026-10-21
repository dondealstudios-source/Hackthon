import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Check, MapPin, IndianRupee, ShieldCheck, Users } from 'lucide-react';
import type { EventConfig } from '../config/event';
import EntryForm from './Forms';

export function EventSnapshot({ config }: { config: EventConfig }) {
  const reduced = useReducedMotion();
  const facts = [
    { icon: CalendarDays, label: 'DATE', value: config.period, note: 'Exact dates coming soon' },
    { icon: MapPin, label: 'LOCATION', value: config.format, note: config.venue || 'Venues announced soon' },
    { icon: IndianRupee, label: 'EVENT FEE', value: `₹${config.fee}`, note: config.feeBasis ? (config.feeBasis === 'per_team' ? 'Per team' : 'Per participant') : 'Fee basis to be confirmed' },
    { icon: Users, label: 'PARTICIPATION', value: 'Students & builders', note: config.eligibility || 'Final eligibility coming soon' },
  ];
  return <div className="event-snapshot" aria-label="Event at a glance">{facts.map((fact, i) => <motion.div key={fact.label} initial={reduced ? false : { opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduced ? 0 : i * .07, duration: .4 }}><span className="snapshot-icon"><fact.icon size={20}/></span><span className="eyebrow">{fact.label}</span><strong>{fact.value}</strong><span className="snapshot-note">{fact.note}</span></motion.div>)}</div>;
}

export default function RegistrationSection({ config, onPolicy, initialInterest = '' }: { initialInterest?: string; config: EventConfig; onPolicy: (name: 'privacy' | 'terms' | 'refund') => void }) {
  const open = config.registrationStatus === 'open';
  const reduced = useReducedMotion();
  return <section id="registration" className="section registration-section" aria-labelledby="registration-heading">
    <div className="registration-availability"><span className="registration-status"><span className="status-dot"/>{open ? 'Registration open' : config.registrationStatus === 'closed' ? 'Registration closed · stay connected' : 'Registration coming soon'}</span></div>
    <div className="registration-layout">
      <div className="registration-story"><h2 id="registration-heading" tabIndex={-1}>Take your place<br/><span>at BuildFeast.</span></h2><p>Explore participation details for BuildFeast 2027. Registration dates and final rules will be announced soon.</p><p className="registration-venue"><MapPin size={15}/>{config.venue || 'Offline event · venues announced soon'}</p>
        <ol className="join-journey">{[
          ['Tell us about yourself', 'Your name, institution, and a way to reach you.'],
          ['Choose your interests', 'Let us know what you are excited to learn and build.'],
          [open ? 'Review & register' : 'Review & join the waitlist', open ? 'Review your information and continue to payment.' : 'Record your interest. No payment is collected now.'],
        ].map(([title, text], i) => <motion.li key={title} initial={reduced ? false : { opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .4, delay: reduced ? 0 : i * .1 }}><span>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></motion.li>)}</ol>
        <div className="registration-inclusions"><span><Check size={15}/>Two-day hackathon</span><span><Check size={15}/>In-person collaboration</span><span><Check size={15}/>Offline hackathon</span></div>
        <div className="registration-transparency"><ShieldCheck size={21}/><p>{open ? 'Payment is verified by the server before your registration is confirmed.' : 'Joining the waitlist records your interest. It does not guarantee a place, prize, or internship. Registration dates and final rules will be announced separately.'}</p></div>
      </div>
      <div className="registration-form-card"><div className="registration-card-header"><div><span className="eyebrow">VISTACORTEX / BUILDFEAST 2027</span><h3>{open ? 'Participant registration' : 'Registration details'}</h3></div><span className="registration-card-icon"><ArrowUpRight size={24}/></span></div><EntryForm kind={open ? 'registration' : 'waitlist'} config={config} guided initialInterest={initialInterest}/><div className="registration-policy-links"><button onClick={() => onPolicy('privacy')}>Privacy</button><button onClick={() => onPolicy('terms')}>Event terms</button><button onClick={() => onPolicy('refund')}>Refund policy</button></div></div>
    </div>
  </section>;
}

export function RegistrationDock({ config }: { config: EventConfig }) {
  const [pastHero, setPastHero] = useState(false), [inForm, setInForm] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const hero = document.querySelector('.hero'), form = document.getElementById('registration');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) setPastHero(entry.boundingClientRect.bottom < 0);
        if (entry.target === form) setInForm(entry.isIntersecting);
      }
    });
    if (hero) observer.observe(hero); if (form) observer.observe(form);
    return () => observer.disconnect();
  }, []);
  return <AnimatePresence>{pastHero && !inForm && <motion.aside className="registration-dock" initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 20 }} transition={{ duration: .2 }} aria-label="Join BuildFeast"><div><strong>BuildFeast 2027</strong><span><span className="status-dot"/>{config.registrationStatus === 'open' ? 'Registration open' : 'Registration coming soon'}</span></div><a className="button primary" href="#registration">{config.registrationStatus === 'open' ? 'Register now' : 'View registration'}<ArrowUpRight size={15}/></a></motion.aside>}</AnimatePresence>;
}
