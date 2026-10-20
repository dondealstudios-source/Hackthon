import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import { getFaqs } from '../config/faqs';
import type { EventConfig } from '../config/event';

export default function FaqPage({ config }: { config: EventConfig }) {
  const [search, setSearch] = useState(''), [active, setActive] = useState<number | null>(0);
  const reduced = useReducedMotion();
  const faqs = getFaqs(config);
  useEffect(() => {
    const previousTitle = document.title;
    const previousCanonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]')?.href;
    document.title = 'FAQs | BuildFeast 2027 — VistaCortex';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]');
    if (canonical) canonical.href = 'https://buildfeast.vistacortex.in/faq';
    return () => { document.title = previousTitle; if (canonical && previousCanonical) canonical.href = previousCanonical; };
  }, []);
  return <div className="site-shell faq-page"><a className="skip-link" href="#faq-main">Skip to questions</a><header className="header"><a href="/" className="brand" aria-label="BuildFeast home"><img className="brand-logo" src="/assets/vistacortex-buildfeast-transparent.png" alt="VistaCortex BuildFeast 2027" width="2081" height="756"/></a><a className="faq-page-back" href="/"><ArrowLeft size={14}/>Back to the event</a><a className="button nav-cta" href="/#registration">{config.registrationStatus === 'open' ? 'Register now' : 'Registration details'}<ArrowUpRight size={14}/></a></header>
    <main id="faq-main"><section className="section faq-page-section"><motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}><span className="eyebrow">BUILDFEAST / EVENT INFORMATION</span><h1>Frequently asked<br/>questions.</h1><p className="faq-page-intro">Details about participation, the program, registration, and what comes next.</p></motion.div><div className="faq-page-content"><aside><span className="eyebrow">VISTACORTEX BUILDFEAST 2027</span><p>{config.format}<br/>{config.period}<br/>{config.venue || 'Venues announced soon'}</p><a className="text-button" href="/#problem-statements">Explore the problem statements<ArrowUpRight size={14}/></a></aside><div className="faq-list"><label className="faq-search"><Search size={17}/><input type="search" aria-label="Search frequently asked questions" placeholder="Search questions" value={search} onChange={event => setSearch(event.target.value)}/></label>{faqs.map(([question, answer], i) => <div key={question} className={`faq-item ${active === i ? 'expanded' : ''}`} hidden={!`${question} ${answer}`.toLowerCase().includes(search.toLowerCase())}><h2><button aria-expanded={active === i} aria-controls={`answer-${i}`} onClick={() => setActive(active === i ? null : i)}><span>{question}</span><span className="faq-plus" aria-hidden="true">{active === i ? '−' : '+'}</span></button></h2><div id={`answer-${i}`}><AnimatePresence initial={false}>{active === i && <motion.div initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .25 }} style={{ overflow: 'hidden' }}><p>{answer}</p></motion.div>}</AnimatePresence></div></div>)}{!faqs.some(([q, a]) => `${q} ${a}`.toLowerCase().includes(search.toLowerCase())) && <p role="status" className="faq-empty">No matching questions found.</p>}</div></div></section></main><footer className="faq-page-footer"><span>© {new Date().getFullYear()} VistaCortex</span><a href="/">Back to BuildFeast<ArrowUpRight size={13}/></a></footer></div>;
}
