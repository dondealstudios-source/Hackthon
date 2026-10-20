import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, CheckCircle2, LoaderCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getProblemStatements, type EventConfig } from '../config/event';
import { api } from '../lib/http';
export { api } from '../lib/http';

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (name: string, fn: () => void) => void }; } }
export default function EntryForm({ kind, config, guided = false, initialInterest = '' }: { kind: 'waitlist' | 'question' | 'registration'; config: EventConfig; guided?: boolean; initialInterest?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(''), [participation, setParticipation] = useState('individual');
  const [step, setStep] = useState(0), [review, setReview] = useState<Record<string, string>>({});
  const reduced = useReducedMotion();
  const [interest, setInterest] = useState(initialInterest);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  useEffect(() => { api('/api/privacy-status').then(status => setSubmissionsOpen(status.formSubmissionsEnabled === true)).catch(() => setSubmissionsOpen(false)); }, []);
  useEffect(() => { if (initialInterest) setInterest(initialInterest); }, [initialInterest]);
  const advance = (form: HTMLFormElement) => {
    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
    for (const field of fields) if (!field.reportValidity()) return;
    setReview(Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)])));
    setStep(current => Math.min(current + 1, 2)); setError('');
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return;
    if (guided && step < 2) { advance(e.currentTarget); return; }
    if (!submissionsOpen) { setError('Submissions are not open yet.'); return; }
    setBusy(true); setError('');
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    try {
      if (kind === 'registration') {
        const order = await api('/api/registration/order', payload);
        if (!window.Razorpay) await new Promise<void>((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Payment checkout could not load. Retry to resume your order.')); document.body.appendChild(script); });
        if (!window.Razorpay) throw new Error('Payment checkout is unavailable. Please retry.');
        const checkout = new window.Razorpay({ key: order.key, amount: order.amount, currency: 'INR', order_id: order.orderId, name: config.name, prefill: { name: payload.name, email: payload.email }, handler: async (payment: unknown) => { try { const verified = await api('/api/registration/verify', payment); setSuccess(`Registration confirmed. Your registration ID is ${verified.registrationId}. Save this ID for your records.`); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }, modal: { ondismiss: () => { setBusy(false); setError('Checkout closed. Your registration is not marked paid. You can retry safely.'); } } });
        checkout.on('payment.failed', () => { setBusy(false); setError('Payment failed. Please retry; your registration is not marked paid.'); }); checkout.open(); return;
      }
      const result = await api(kind === 'question' ? '/api/questions' : '/api/waitlist', payload);
      setSuccess(result.message); form.reset();
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  };
  if (!submissionsOpen) return <div className="submissions-paused"><h3>{kind === 'question' ? 'Questions open soon.' : 'Registration opens soon.'}</h3><p>Personal details are not being collected at this time.</p><a className="text-button" href="/faq">View event information<ArrowUpRight size={14}/></a></div>;
  if (success) return <motion.div className="success" role="status" initial={reduced ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}><CheckCircle2 size={36}/><h3>{kind === 'question' ? 'Question received.' : kind === 'registration' ? 'You’re registered.' : 'You’re on the list.'}</h3><p>{success}</p></motion.div>;
  return <form onSubmit={submit} className="entry-form" onKeyDown={e => { if (guided && step < 2 && e.key === 'Enter' && e.target instanceof HTMLInputElement) { e.preventDefault(); advance(e.currentTarget); } }}>
    {guided && <><ol className="registration-stepper" aria-label="Registration progress">{['Your details', 'Your interests', 'Review & join'].map((label, i) => <li key={label} className={i === step ? 'current' : i < step ? 'complete' : ''} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={12}/> : i + 1}</span>{label}</li>)}</ol><div className="registration-progress" aria-hidden="true"><motion.span animate={{ width: `${(step + 1) / 3 * 100}%` }} transition={{ duration: reduced ? 0 : .35 }}/></div><motion.h3 key={step} className="form-step-heading" initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>{step === 0 ? 'Participant details' : step === 1 ? 'Choose your interests' : 'Review your details'}</motion.h3></>}
    <>{interest && getProblemStatements(config).includes(interest) && <p className="problem-selection-note">Selected problem statement: <strong>{interest}</strong></p>}</>
    <p className="form-intro">{kind === 'question' ? 'What would you like to ask the guest professional? Submit your question for the startup mentoring session.' : kind === 'registration' ? `Registration fee: ₹${config.fee} ${config.feeBasis === 'per_team' ? 'per team' : 'per participant'}.` : 'Be the first to hear when registration opens. A little curiosity can lead to something big.'}</p>
    {kind === 'registration' && <p>{config.rulesAcceptedText || 'Finalized rules are not available yet.'}</p>}
    {kind === 'registration' && <p className="small muted">{config.feeBasis === 'per_participant' ? 'This payment registers you only. Other team members must register separately.' : 'This payment covers the team entered below, subject to the finalized team-size rules.'}</p>}
    <fieldset className="form-stage" data-step="0" hidden={guided && step !== 0}><legend className="sr-only">Your details</legend><div className="form-grid"><label>Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your full name"/></label><label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
    {kind !== 'question' && <><label>College / institution<input name="college" required maxLength={160} placeholder="Your college or institution"/></label><label>City and state<input name="location" required maxLength={160} placeholder="City, State"/></label><label className="full">Phone number <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" pattern="[+0-9 ()-]{7,20}" maxLength={20} placeholder="+91"/></label></>}
    {kind === 'question' && <label className="full">Your question<textarea name="question" required minLength={10} maxLength={2000} rows={4} placeholder="What should a first-time founder know?"/></label>}</div>
    </fieldset>
    {kind !== 'question' && <fieldset className="form-stage" data-step="1" hidden={guided && step !== 1}><legend className="sr-only">Your interests</legend><div className="form-grid"><label className="full">Interest area<select name="interest" required value={interest} onChange={e => setInterest(e.target.value)}><option value="" disabled>Select your interest</option>{getProblemStatements(config).map(name => <option key={name} value={name}>{name}</option>)}<option>Exploring all of it</option></select></label><label className="full">How would you like to participate?<select name="participation" required value={participation} onChange={e => setParticipation(e.target.value)}><option value="individual">Individual interest</option><option value="team">Team interest</option></select></label>{kind === 'registration' && participation === 'team' && <><label className="full">Team name<input name="teamName" required maxLength={120}/></label><label className="full">Team members (including you)<textarea name="teamMembers" required maxLength={10000} rows={4} placeholder="Full name | email address — one member per line"/></label></>}</div><p className="form-intro preference-note">{participation === 'team' ? 'Bring your team spirit. Final team-size and participation rules will be announced before registration.' : 'Start with your own curiosity. Final individual participation rules will be announced before registration.'}</p></fieldset>}
    <div hidden={guided && step !== 2}>
    {guided && <dl className="registration-review">{[['Name', review.name], ['Email', review.email], ['Institution', review.college], ['Interest', review.interest], ['Participation', review.participation === 'team' ? 'Team interest' : 'Individual interest']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
    <label className="honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <label className="consent"><input name="consent" type="checkbox" value="yes" required/>{kind === 'question' ? 'I consent to storing my details and question for the mentoring session.' : 'I agree to receive BuildFeast event updates and to storing my details for this purpose.'}</label>
    {kind === 'registration' && <label className="consent"><input name="rules" type="checkbox" value="yes" required/>I accept the finalized event rules and registration terms.</label>}
    {kind === 'registration' && participation === 'team' && <label className="consent"><input name="teamConsent" type="checkbox" value="yes" required/>I have permission from each member to submit their name and email for this event.</label>}
    <p className="small muted">Your information is accessible only to authorized organizers. Review the Privacy Policy in the footer before submitting.</p>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {guided && <div className="registration-form-nav">{step > 0 && <button type="button" className="text-button" disabled={busy} onClick={() => { setStep(current => current - 1); setError(''); }}>← Back</button>}{step < 2 && <button type="button" className="button primary" onClick={e => advance(e.currentTarget.form!)}>Continue<ArrowUpRight size={16}/></button>}</div>}
    {(!guided || step === 2) && <button disabled={busy} className="button primary form-submit">{busy ? <><LoaderCircle className="spin" size={16}/>Submitting…</> : <>{kind === 'question' ? 'Submit question' : kind === 'registration' ? `Continue to payment · ₹${config.fee}` : 'Join the waitlist'}<ArrowUpRight size={16}/></>}</button>}
  </form>;
}
