import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CalendarDays, MapPin, IndianRupee, Plus, Trash2, UserRound, UsersRound, ShieldCheck, LoaderCircle, CheckCircle2 } from 'lucide-react';
import { getProblemStatements, type EventConfig } from '../config/event';
import './registration-page.css';

type Person = { name: string; email: string; college: string; location: string; phone: string };
type Member = { id: number; name: string; email: string; phone: string };
const steps = ['Your details', 'Participation', 'Your challenge', 'Review'];

export default function RegistrationPage({ config, initialInterest = '' }: { config: EventConfig; initialInterest?: string }) {
  const statements = getProblemStatements(config);
  const [step, setStep] = useState(0);
  const [person, setPerson] = useState<Person>({ name: '', email: '', college: '', location: '', phone: '' });
  const [participation, setParticipation] = useState<'individual' | 'team'>('individual');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const nextId = useRef(1);
  const [interest, setInterest] = useState(() => {
    const chosen = initialInterest || new URLSearchParams(location.search).get('track') || '';
    return statements.includes(chosen) ? chosen : '';
  });
  const [error, setError] = useState('');
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [consent, setConsent] = useState(false);
  const [teamConsent, setTeamConsent] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const honeypot = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/registration/submit', { credentials: 'omit', signal: controller.signal }).then(response => response.ok ? response.json() : null).then(result => setSubmissionsOpen(result?.enabled === true)).catch(() => {});
    return () => controller.abort();
  }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const title = document.title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]');
    const previousCanonical = canonical?.href;
    document.title = 'Registration | BuildFeast 2027 — VistaCortex';
    if (canonical) canonical.href = 'https://buildfeast.vistacortex.in/register';
    return () => { document.title = title; if (canonical && previousCanonical) canonical.href = previousCanonical; };
  }, []);
  const go = (next: number) => {
    if (busy) return;
    setStep(next); setError('');
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      if (matchMedia('(max-width: 800px)').matches) formRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  };
  const advance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (!event.currentTarget.reportValidity()) return;
    if (step === 1 && participation === 'team') {
      if (members.length > 3) { setError('Teams can have up to 4 members, including the team lead.'); return; }
      const emails = [person.email, ...members.map(member => member.email)].map(email => email.trim().toLowerCase());
      if (new Set(emails).size !== emails.length) { setError('Use a different email address for each team member.'); return; }
    }
    if (step === 2 && !interest) { setError('Choose a problem statement to continue.'); return; }
    if (step < 3) { go(step + 1); return; }
    if (!submissionsOpen) { setError('Registration submissions are not open yet.'); return; }
    if (!consent || (participation === 'team' && members.length > 0 && !teamConsent)) { setError('Please confirm the consent fields before submitting.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/registration/submit', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, ...person, participation, teamName: participation === 'team' ? teamName : '', teamMembers: participation === 'team' ? members.map(({ name, email, phone }) => ({ name, email, phone })) : [], interest, consent, teamConsent, website: honeypot.current?.value || '' }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.registrationId) throw new Error(result?.error || 'We couldn’t confirm your entry. Keep this page open and try again.');
      setSuccess(result.registrationId);
      requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    } catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const updatePerson = (field: keyof Person, value: string) => setPerson(current => ({ ...current, [field]: value }));
  const updateMember = (id: number, field: 'name' | 'email' | 'phone', value: string) => setMembers(current => current.map(member => member.id === id ? { ...member, [field]: value } : member));
  const reviewRows = [['Full name', person.name], ['Email address', person.email], ['Institution', person.college], ['City and state', person.location], ['Phone number', person.phone || 'Not provided']];

  return <div className="site-shell reg-page">
    <a className="skip-link" href="#registration-main">Skip to registration</a>
    <header className="header"><a className="brand" href="/" aria-label="BuildFeast home"><img className="brand-logo" src="/assets/brand-wordmark.webp" width="560" height="203" alt={config.name} fetchPriority="high"/></a><a className="reg-back" href="/"><ArrowLeft size={15}/>Back to the event</a></header>
    <main id="registration-main" className="reg-layout">
      <aside className="reg-intro">
        <span className="reg-status"><span className="status-dot"/>{submissionsOpen ? 'Entry submissions open' : 'Registration opening soon'}</span>
        <h1>Bring your idea.<br/><span>Build what’s next.</span></h1>
        <p>Two days of building, collaborating, and solving problems. Start with your details and choose the challenge you want to take on.</p>
        <div className="reg-event-facts">
          <div><CalendarDays size={19}/><span><small>When</small><strong>{config.period}</strong><span>Exact dates coming soon</span></span></div>
          <div><MapPin size={19}/><span><small>Where</small><strong>Two-day offline hackathon</strong><span>{config.venue || 'Venues announced soon'}</span></span></div>
          <div><IndianRupee size={19}/><span><small>Event fee</small><strong>{config.fee === null ? 'To be announced' : '₹' + config.fee}</strong><span>Final participation rules coming soon</span></span></div>
        </div>
        <a className="reg-help" href="/faq">Questions before you begin?<ArrowUpRight size={16}/></a>
      </aside>
      <form ref={formRef} className="reg-form" noValidate onSubmit={advance} aria-labelledby="reg-step-heading">
        <div hidden={!!success}><div className="reg-form-top"><span>BuildFeast 2027</span><span>Step {step + 1} of {steps.length}</span></div>
        <ol className="reg-steps" aria-label="Registration steps">{steps.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}><button type="button" disabled={index > step || busy} onClick={() => go(index)} aria-label={label + (index < step ? ', edit completed step' : '')}><span>{index < step ? <Check size={14}/> : index + 1}</span><span>{label}</span></button></li>)}</ol>
        <div className="reg-progress" aria-hidden="true"><span style={{ width: ((step + 1) / steps.length * 100) + '%' }}/></div>
        <div className="reg-step" key={step}>
          <h2 ref={heading} id="reg-step-heading" tabIndex={-1}>{['Let’s start with you.', 'How will you build?', 'Find your challenge.', 'Make sure it’s you.'][step]}</h2>
          <p className="reg-description">{['Your contact details and institution. Fields marked * are required.', 'Join as an individual or prepare an entry with your team.', 'Choose one of the eight hackathon problem statements.', 'Review your entry. You can go back and edit any section.'][step]}</p>
          {step === 0 && <div className="reg-fields">
            <label>Full name <span>*</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} value={person.name} onChange={event => updatePerson('name', event.target.value)} placeholder="Your full name"/></label>
            <label>Email address <span>*</span><input name="email" autoComplete="email" type="email" required maxLength={254} value={person.email} onChange={event => updatePerson('email', event.target.value)} placeholder="you@example.com"/></label>
            <label className="reg-full">College / institution <span>*</span><input name="college" autoComplete="organization" required minLength={2} maxLength={160} value={person.college} onChange={event => updatePerson('college', event.target.value)} placeholder="Your college or institution"/></label>
            <label>City and state <span>*</span><input name="location" required minLength={2} maxLength={160} value={person.location} onChange={event => updatePerson('location', event.target.value)} placeholder="City, State"/></label>
            <label>Phone number <small>Optional</small><input name="phone" autoComplete="tel" type="tel" pattern="[+0-9 ()-]{7,20}" maxLength={20} value={person.phone} onChange={event => updatePerson('phone', event.target.value)} placeholder="+91"/></label>
          </div>}
          {step === 1 && <>
            <fieldset className="reg-mode"><legend className="sr-only">Participation type</legend>{(['individual', 'team'] as const).map(mode => <label key={mode} className={participation === mode ? 'is-selected' : ''}><input type="radio" name="participation" value={mode} checked={participation === mode} onChange={() => setParticipation(mode)}/>{mode === 'individual' ? <UserRound size={23}/> : <UsersRound size={23}/>}<strong>{mode === 'individual' ? 'Individual' : 'With a team'}</strong><span>{mode === 'individual' ? 'Start your own entry.' : 'Build your entry together.'}</span></label>)}</fieldset>
            {participation === 'team' && <div className="reg-team">
              <label className="reg-team-name">Team name <span>*</span><input name="teamName" required minLength={2} maxLength={120} value={teamName} onChange={event => setTeamName(event.target.value)} placeholder="What’s your team called?"/></label>
              <div className="reg-leader"><span className="reg-avatar">{person.name.trim().slice(0, 1).toUpperCase() || 'Y'}</span><span><strong>{person.name}</strong><span>{person.email}</span></span><small>Team lead</small></div>
              {members.map((member, index) => <fieldset className="reg-member" key={member.id}><legend>Teammate {index + 1}</legend><div className="reg-fields"><label>Full name <span>*</span><input name={'member-name-' + member.id} required minLength={2} maxLength={100} value={member.name} onChange={event => updateMember(member.id, 'name', event.target.value)} placeholder="Teammate’s name"/></label><label>Email address <span>*</span><input name={'member-email-' + member.id} type="email" required maxLength={254} value={member.email} onChange={event => updateMember(member.id, 'email', event.target.value)} placeholder="teammate@example.com"/></label><label className="reg-full">Phone number <small>Optional</small><input name={'member-phone-' + member.id} type="tel" autoComplete="tel" pattern="[+0-9 ()-]{7,20}" maxLength={20} value={member.phone} onChange={event => updateMember(member.id, 'phone', event.target.value)} placeholder="+91"/></label></div><button className="reg-remove" type="button" onClick={() => setMembers(current => current.filter(item => item.id !== member.id))} aria-label={'Remove teammate ' + (index + 1)}><Trash2 size={14}/>Remove</button></fieldset>)}
              <button className="reg-add" type="button" disabled={members.length >= 3 || (config.teamRules.maximum !== null && members.length + 1 >= config.teamRules.maximum)} onClick={() => { const id = nextId.current++; setMembers(current => current.length < 3 ? [...current, { id, name: '', email: '', phone: '' }] : current); }}><Plus size={17}/>Add a teammate</button>
              <p className="reg-note">Up to 4 members per team, including the team lead. Please get each teammate’s permission before entering their details.</p>
            </div>}
            {participation === 'individual' && <p className="reg-note">Final individual eligibility and participation rules will be announced before registration opens.</p>}
          </>}
          {step === 2 && <fieldset className="reg-challenges"><legend className="sr-only">Choose your problem statement</legend>{statements.map((statement, index) => <label key={statement} className={interest === statement ? 'is-selected' : ''}><input type="radio" name="interest" value={statement} required checked={interest === statement} onChange={() => setInterest(statement)}/><span className="reg-challenge-number">{String(index + 1).padStart(2, '0')}</span><strong>{statement}</strong><span className="reg-radio" aria-hidden="true">{interest === statement && <Check size={13}/>}</span></label>)}</fieldset>}
          {step === 3 && <div className="reg-review">
            <section><div className="reg-review-heading"><h3>Your details</h3><button type="button" onClick={() => go(0)}>Edit</button></div><dl>{reviewRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
            <section><div className="reg-review-heading"><h3>{participation === 'team' ? 'Your team' : 'Participation'}</h3><button type="button" onClick={() => go(1)}>Edit</button></div><p>{participation === 'team' ? teamName : 'Individual entry'}</p>{participation === 'team' && <><p className="reg-note">{person.name} · Team lead</p>{members.map(member => <p className="reg-review-member" key={member.id}><strong>{member.name}</strong><span>{member.email}</span><span>{member.phone || 'Phone not provided'}</span></p>)}</>}</section>
            <section><div className="reg-review-heading"><h3>Problem statement</h3><button type="button" onClick={() => go(2)}>Edit</button></div><p>{interest}</p></section>
            <div className="reg-pending" role="status"><ShieldCheck size={22}/><div><strong>{submissionsOpen ? 'Ready to send your entry?' : 'Registration opens soon.'}</strong><p>{submissionsOpen ? 'Submitting records your entry with the organizers. It does not confirm admission or payment. Final participation and fee details will be announced separately.' : 'Your details have not been submitted or saved. Keep this page open to continue reviewing; refreshing clears the entry.'}</p></div></div>
            {submissionsOpen && <div className="reg-consents"><label><input type="checkbox" required disabled={busy} checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I agree to VistaCortex storing these details in the event’s Google Sheet to manage my entry and contact me about BuildFeast 2027.</span></label>{participation === 'team' && members.length > 0 && <label><input type="checkbox" required disabled={busy} checked={teamConsent} onChange={event => setTeamConsent(event.target.checked)}/><span>I have each teammate’s permission to submit their name, email, and any phone number provided for this event.</span></label>}{config.privacyContact && <p>For data questions, contact <a href={'mailto:' + config.privacyContact}>{config.privacyContact}</a>.</p>}<label className="reg-honeypot" aria-hidden="true">Leave this empty<input ref={honeypot} name="website" tabIndex={-1} autoComplete="off"/></label></div>}
          </div>}
          {error && <p className="reg-error" role="alert">{error}</p>}
        </div>
        <div className="reg-actions">{step > 0 ? <button type="button" className="reg-previous" disabled={busy} onClick={() => go(step - 1)}><ArrowLeft size={16}/>Back</button> : <span className="reg-required">* Required fields</span>}{step < 3 ? <button className="button primary" type="submit">{step === 2 ? 'Review entry' : 'Continue'}<ArrowRight size={16}/></button> : <button className="button primary" type="submit" disabled={!submissionsOpen || busy}>{busy ? <><LoaderCircle className="spin" size={16}/>Submitting…</> : submissionsOpen ? <>Submit entry<ArrowRight size={16}/></> : 'Submission opens soon'}</button>}</div>
        <p className="reg-memory-note"><ShieldCheck size={14}/>{submissionsOpen ? 'Your details are sent only when you submit. No tracking cookies or browser storage.' : 'Your entry stays in this page until submissions open. No cookies or browser storage.'}</p></div>
        {success && <div className="reg-success" role="status"><CheckCircle2 size={42}/><h2 ref={heading} tabIndex={-1}>Your entry is in.</h2><p>Thank you for joining BuildFeast 2027. Keep your reference for any questions about your entry.</p><div><small>Your reference</small><strong>{success}</strong></div><p className="reg-note">No payment has been collected. Admission, fees, and final participation details will be confirmed separately.</p><a href="/" className="button primary">Back to the event<ArrowUpRight size={16}/></a></div>}
      </form>
    </main>
    <footer className="reg-footer"><span>Organized by <a href={config.organizer.url || 'https://www.vistacortex.com/'} target="_blank" rel="noopener noreferrer">VistaCortex<ArrowUpRight size={12}/></a></span><a href="/faq">Event FAQs<ArrowUpRight size={13}/></a></footer>
  </div>;
}
