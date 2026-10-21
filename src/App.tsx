import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Menu, Trophy, X } from 'lucide-react';
import { defaultEvent, type EventConfig } from './config/event';
import LeafMark from './components/LeafMark';
import { ParticleWave } from './components/LivingGraphics';
import IdeaGarden from './components/IdeaGarden';
import PrototypeReveal from './components/PrototypeReveal';
import DemoStage from './components/DemoStage';
import HackathonDetails from './components/HackathonDetails';
import LaunchScene from './components/LaunchScene';
import OrganizerCard from './components/OrganizerCard';
import GuestCredit from './components/GuestCredit';
import { MotionRibbon, LeafAtmosphere } from './components/MotionDetails';
import Modal from './components/Modal';
import EntryForm from './components/Forms';
import Dashboard from './Dashboard';
import FaqPage from './components/FaqPage';
import IdeaPlayground from './components/IdeaPlayground';
import ProblemStatements from './components/ProblemStatements';
import SiteInteractions from './components/SiteInteractions';
import JourneySteps from './components/JourneySteps';
import LogoEntrance from './components/LogoEntrance';
import { IdeaConstellation } from './components/InteractiveObjects';
import RegistrationSection, { EventSnapshot, RegistrationDock } from './components/RegistrationSection';

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}
function Brand({ config }: { config: EventConfig }) {
  return config.organizer.logo ? <img className="brand-logo" src={['/assets/vistacortex-logo-dark.png', '/assets/vistacortex-logo.png', '/assets/vistacortex-buildfeast-2027.png'].includes(config.organizer.logo) ? '/assets/vistacortex-buildfeast-transparent.png' : config.organizer.logo} alt={config.name}/> : <span className="brand-wordmark">vista<span>cortex</span></span>;
}
export default function App() {
  const [config, setConfig] = useState<EventConfig>(defaultEvent), [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<'waitlist' | 'question' | 'registration' | 'privacy' | 'terms' | 'refund' | null>(null);
  const [selectedProblem, setSelectedProblem] = useState('');
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const [activeDay, setActiveDay] = useState(0);
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => { setPathname(window.location.pathname); setMenu(false); setModal(null); requestAnimationFrame(() => { const target = window.location.hash && document.getElementById(window.location.hash.slice(1)); if (target) target.scrollIntoView({ behavior: 'instant' }); else window.scrollTo(0, 0); }); };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !['/', '/faq', '/faq/'].includes(url.pathname) || url.pathname === location.pathname) return;
      event.preventDefault(); history.pushState(null, '', url.pathname + url.search + url.hash); update();
    };
    document.addEventListener('click', navigate); window.addEventListener('popstate', update);
    return () => { document.removeEventListener('click', navigate); window.removeEventListener('popstate', update); };
  }, []);
  useEffect(() => { fetch('/api/config', { credentials: 'omit' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => setConfig({ ...data, name: data.name === 'VistaCortex BuildFest 2027' ? defaultEvent.name : data.name })).catch(() => {}); }, []);
  if (pathname === '/organizer') return <Dashboard />;
  if (/^\/faq\/?$/.test(pathname)) return <FaqPage config={config}/>;
  const join = () => { document.getElementById('registration')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); document.getElementById('registration-heading')?.focus({ preventScroll: true }); setMenu(false); };
  const cta = config.registrationStatus === 'open' ? 'Register now' : 'Registration details';
  const status = config.registrationStatus === 'open' ? 'Registrations open' : config.registrationStatus === 'closed' ? 'Registrations closed' : 'Registrations opening soon';
  const icons = ['01', '02'];
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <motion.div className="reading-progress" style={{ scaleX: reduced ? scrollYProgress : progress }} aria-hidden="true"/>
    <div className="site-shell">
      <header className="header"><a href="#" className="brand" aria-label="VistaCortex home"><Brand config={config}/></a><nav className={menu ? 'nav open' : 'nav'} aria-label="Main navigation"><a href="#problem-statements" onClick={() => setMenu(false)}>Problem statements</a><a href="#program" onClick={() => setMenu(false)}>Program</a><a href="#registration" onClick={() => setMenu(false)}>Join the event</a><a href="/faq" onClick={() => setMenu(false)}>FAQs</a></nav><button className="button nav-cta" onClick={join}>{cta}<ArrowUpRight size={14}/></button><button className="menu-toggle icon-button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></header>
      <motion.main id="main" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5, ease: [.22, 1, .36, 1] }}>
        <section className="hero editorial-hero" aria-labelledby="event-title">
          <div className="hero-editorial-grid">
            <Reveal className="hero-content">
              <p className="hero-edition">VISTACORTEX PRESENTS <span>THE 2027 EDITION</span></p>
              <h1 id="event-title">BuildFeast<span className="hero-year">2027<span className="edition-period">.</span></span></h1>
              <p className="hero-lead">An in-person hackathon for student builders.</p>
              <p className="hero-description">Two days. Eight problem statements. An offline hackathon to collaborate, build, and turn your idea into a working prototype.</p>
              <div className="hero-actions"><button className="button primary" onClick={join}>{cta}<ArrowUpRight size={17}/></button><a className="button secondary" href="#problem-statements">Explore the challenges<ArrowRight size={16}/></a></div>
              <div className="hero-availability"><span className="status-dot"/><span>{status}</span><span className="availability-rule"/><span>{config.venue || 'Venues announced soon'}</span></div>
            </Reveal>
            <div className="hero-visual"><LeafAtmosphere/><div className="globe-stage"><LeafMark/></div><div className="visual-caption"><a href="#program">Discover the program<ArrowUpRight size={15}/></a></div></div>
          </div>
          <div className="hero-bottom"><span>{config.period} <span className="hero-bottom-divider">/</span> {config.format}</span><a href="#about">About the event<ArrowDown size={14}/></a></div>
        </section>

        <EventSnapshot config={config}/><MotionRibbon/>

        <section id="about" className="section about-section"><Reveal><div className="section-heading split-heading"><h2>A program with<br/>a practical outcome.</h2><p>BuildFeast brings learning and building into the same room. Develop your skills, understand the business behind an idea, and put your work in front of others.</p></div></Reveal><div className="overview-grid">
          <Reveal className="overview-block"><span className="overview-number">01</span><h3>Learn by doing.</h3><p>Explore a problem statement, experiment with practical tools, and learn as you build your solution.</p><a className="text-button" href="#program">View the program<ArrowUpRight size={15}/></a></Reveal>
          <Reveal className="overview-block"><span className="overview-number">02</span><h3>Build with your team.</h3><p>Work together in person, exchange ideas, and develop a solution to a problem that matters.</p><a className="text-button" href="#experience">Explore the experience<ArrowUpRight size={15}/></a></Reveal>
          <Reveal className="overview-block"><span className="overview-number">03</span><h3>Build something that works.</h3><p>Choose a problem statement, develop a prototype, and present the thinking behind your solution.</p><a className="text-button" href="#problem-statements">Find your challenge<ArrowUpRight size={15}/></a></Reveal>
        </div><IdeaGarden/></section>

        <ProblemStatements config={config} onChoose={name => { setSelectedProblem(name); join(); }}/>

        <section id="program" className="section program-section"><Reveal><div className="section-heading"><h2>Two days.<br/><span className="muted-heading">One working idea.</span></h2><p>Choose your challenge. Collaborate in person. Build a solution.</p></div></Reveal><div className="timeline hackathon-days" role="tablist" aria-label="Program days">{config.schedule.map((day, i) => <button key={day.day} role="tab" id={`day-tab-${i}`} aria-controls="day-panel" aria-selected={activeDay === i} tabIndex={activeDay === i ? 0 : -1} onKeyDown={e => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? config.schedule.length - 1 : (activeDay + (e.key === 'ArrowRight' ? 1 : config.schedule.length - 1)) % config.schedule.length; setActiveDay(next); document.getElementById(`day-tab-${next}`)?.focus(); } }} className={activeDay === i ? 'day-tab active' : 'day-tab'} onClick={() => setActiveDay(i)}>{activeDay === i && <motion.span className="program-active-marker" layoutId="program-active-marker" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}/>}<span className="day-node">{icons[i]}</span><span className="eyebrow">DAY {day.day}</span><strong>{day.title}</strong><span className="day-date">{day.date || 'Date coming soon'}</span></button>)}</div>
          <div className="program-panel-frame"><AnimatePresence initial={false}><motion.div style={{ gridArea: '1 / 1' }} key={activeDay} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10 }} transition={{ duration: .2 }} id="day-panel" role="tabpanel" aria-labelledby={`day-tab-${activeDay}`} className="day-panel" tabIndex={0}><div className="day-panel-copy"><span className="eyebrow cyan">DAY {config.schedule[activeDay].day} / {config.schedule[activeDay].title.toUpperCase()}</span><h3>{config.schedule[activeDay].theme.replace(/[.]$/, '')}<span className="cyan-period">.</span></h3><p>{config.schedule[activeDay].description}</p></div><div className="day-panel-art">{activeDay === 0 ? <PrototypeReveal/> : <DemoStage/>}</div></motion.div></AnimatePresence></div><div className="program-controls"><span>YOUR JOURNEY · {String(activeDay + 1).padStart(2, '0')} / 02</span><button className="text-button" onClick={() => setActiveDay((activeDay + 1) % config.schedule.length)}>Explore next day <ArrowRight size={16}/></button></div>
          <p className="schedule-note"><span className="status-dot"/>Two-day offline hackathon. Venue and detailed timings will be announced soon. {config.dateAnnouncement}</p>
          <HackathonDetails config={config}/>
        </section>

        <section id="experience" className="section experience-section"><Reveal><div className="section-heading"><h2>From learning<br/>to launching.</h2><p>A practical approach, from the first question to the final presentation.</p></div></Reveal><JourneySteps/></section>

        <section id="opportunities" className="section opportunities-section"><Reveal><div className="section-heading"><h2>Make your work<br/><span className="muted-heading">count.</span></h2></div></Reveal><div className="opportunity-grid"><Reveal className="opportunity-panel"><Trophy className="opportunity-icon" size={30} strokeWidth={1}/><span className="eyebrow">PRIZE MONEY</span><h3>Build. Present. Compete.</h3><p>Bring your creativity, build a meaningful solution, and compete for prize money at VistaCortex BuildFeast 2027.</p><dl><div><dt>Prize money</dt><dd>{config.prizes.available ? 'Available' : 'To be announced'}</dd></div><div><dt>Prize amount</dt><dd>{config.prizes.amount || 'To be announced'}</dd></div><div><dt>Categories</dt><dd>{config.prizes.categories.length ? config.prizes.categories.join(', ') : 'To be announced'}</dd></div></dl></Reveal><Reveal className="opportunity-panel internship-panel"><ArrowUpRight className="opportunity-icon" size={32}/><span className="eyebrow">INTERNSHIP OPPORTUNITIES</span><h3>A route to your next role.</h3><p>{config.internships.selectedParticipants} selected participants will receive internship opportunities worth ₹{config.internships.statedValue.toLocaleString('en-IN')}.</p><dl><div><dt>Selected participants</dt><dd>{config.internships.selectedParticipants}</dd></div><div><dt>Stated internship value</dt><dd>₹{config.internships.statedValue.toLocaleString('en-IN')}</dd></div><div><dt>Roles / duration</dt><dd>{config.internships.roles || 'To be announced'} / {config.internships.duration || 'To be announced'}</dd></div><div><dt>Selection criteria</dt><dd>{config.internships.selectionCriteria || 'To be announced'}</dd></div></dl><p className="small muted">Competitive opportunities, subject to finalized eligibility and selection criteria. {config.internships.allocation || 'Value allocation across participants is to be confirmed.'}</p></Reveal></div></section>

        <div id="flowing-threads" className="thread-interlude"><ParticleWave/></div>

        <section id="partners" className="section partners-section"><Reveal><h2>In good company.</h2><p>Organized by VistaCortex, with support from our official partners.</p></Reveal><OrganizerCard config={config}/><div className="partner-grid">{config.partners.map(p => <Reveal key={p.name} className="partner-card"><span className="small-label">OFFICIAL PARTNER</span>{p.logo && p.url ? <a className="partner-logo-link" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.name} website`}><img src={p.logo} alt={p.name}/><ArrowUpRight className="partner-visit-icon" size={20}/></a> : <>{p.logo ? <img src={p.logo} alt={p.name}/> : <strong>{p.name}</strong>}{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.name}`}><ArrowUpRight size={20}/></a> : <span className="partner-corner"><ArrowUpRight size={16}/></span>}</>}</Reveal>)}</div><GuestCredit/></section>

        <section id="idea-studio" className="section studio-section"><details className="studio-disclosure"><summary><div><span className="eyebrow">THE IDEA STUDIO</span><h2>Looking for a starting point?</h2><p>Explore practice prompts and an interactive idea canvas.</p></div><span className="studio-open-label">Open the studio<ChevronDown size={19}/></span></summary><div className="studio-body"><IdeaConstellation/><IdeaPlayground/></div></details></section>

        <RegistrationSection config={config} onPolicy={setModal} initialInterest={selectedProblem}/>



        <section id="next-step" className="closing-section"><div className="closing-grid"/><Reveal><span className="eyebrow"><span className="status-dot"/> VISTACORTEX BUILDFEAST 2027</span><h2>Your idea.<br/>Your next step.</h2><p>Join the community of students ready to build.</p><button className="button primary" onClick={join}>{cta}<ArrowUpRight size={17}/></button><span className="closing-status">{status.toUpperCase()} · {config.format.toUpperCase()} · ₹{config.fee}</span></Reveal><LaunchScene/></section>
      </motion.main>
      <footer><LogoEntrance/><div className="footer-top"><div><a href="#" className="brand"><Brand config={config}/></a><p>{config.name}<br/><span>{config.tagline}</span></p><a className="footer-organizer" href={config.organizer.url || defaultEvent.organizer.url} target="_blank" rel="noopener noreferrer">ORGANIZED BY VISTACORTEX<ArrowUpRight size={11}/></a></div><div className="footer-links"><a href="#problem-statements">Problem statements</a><a href="#about">The event</a><a href="#program">Program</a><a href="#opportunities">Opportunities</a><a href="/faq">FAQs</a></div><div className="footer-info"><span className="eyebrow">OFFICIAL PARTNERS</span>{config.partners.map(p => p.url ? <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer">{p.name}<ArrowUpRight size={11}/></a> : <span key={p.name}>{p.name}</span>)}<p><span className="status-dot"/>{status}</p>{config.contact.email ? <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a> : <span className="small muted">Contact details announced soon</span>}{config.socials.map((s: { name: string; url: string }) => <a href={s.url} key={s.name} rel="noreferrer" target="_blank">{s.name}</a>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} VistaCortex. All rights reserved.</span><div><button onClick={() => setModal('privacy')}>Privacy Policy</button><button onClick={() => setModal('terms')}>Terms & Conditions</button><button onClick={() => setModal('refund')}>Refund policy</button></div><a href="#">Back to top<ArrowUpRight size={12}/></a></div></footer>
    </div>
    <SiteInteractions/>
    <RegistrationDock config={config}/>
    {modal && <Modal onClose={() => setModal(null)} title={modal === 'waitlist' ? 'Your next chapter awaits.' : modal === 'question' ? 'Ask before you launch.' : modal === 'registration' ? 'Let’s make it official.' : modal === 'privacy' ? 'Privacy Policy' : modal === 'terms' ? 'Terms & Conditions' : 'Refund & cancellation policy'}>{['waitlist', 'question', 'registration'].includes(modal) ? <EntryForm kind={modal as 'waitlist' | 'question' | 'registration'} config={config}/> : <div className="policy-copy">{modal === 'privacy' ? <><p>When enabled, waitlist submissions collect your name, email, institution, location, optional phone number, interests, participation preference, and consent. </p><p>If submissions are enabled before Google Sheets is integrated, these records are stored in the event database and are available to authenticated organizers to manage event updates. Browsing uses no analytics, tracking cookies, local storage, or session storage. Form submissions are currently disabled until the registration storage is connected. Organizer sign-in uses a short-lived token held only in page memory; refreshing the page signs the organizer out.</p><p>Third-party payment checkout is disabled by default. If enabled later, its provider may apply separate privacy and storage practices.</p><p>Before public launch, VistaCortex must publish its confirmed privacy contact and retention/deletion policy. {config.privacyContact || 'Privacy contact details are pending.'}</p></> : modal === 'terms' ? <><p>This is an offline event planned for late February 2027. Venues will be announced soon. Exact dates, eligibility, team size, certificates, deadlines, and final rules will be announced soon. This is a two-day offline hackathon.</p><p>A waitlist submission records interest and does not guarantee admission, prizes, or an internship. Internship opportunities are competitive. Their ₹20,000 stated value allocation and full terms remain to be confirmed.</p><p>{config.rulesAcceptedText || 'Paid registrations remain inactive until finalized rules, fee basis, refund policy, and payment credentials are configured.'}</p></> : <p>{config.refundPolicy || 'The refund and cancellation policy is being finalized and will be published before paid registration opens. No payment is collected while registration is inactive.'}</p>}</div>}</Modal>}
  </>;
}

