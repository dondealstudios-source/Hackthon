import { BadgeCheck, CalendarDays, ChevronDown, ClipboardList, GraduationCap, Presentation, Scale, Trophy, Users } from 'lucide-react';
import { getProblemStatements, type EventConfig } from '../config/event';
import './hackathon-details.css';

export default function HackathonDetails({ config }: { config: EventConfig }) {
  const items = [
    { label: 'Eligibility', icon: GraduationCap, value: config.hackathon.eligibility || config.eligibility },
    { label: 'Team size', icon: Users, value: config.hackathon.teamSize || config.teamSize },
    { label: 'Participation rules', icon: ClipboardList, value: config.hackathon.participationRules || config.rulesAcceptedText },
    { label: 'Submission deadline', icon: CalendarDays, value: config.hackathon.submissionDeadline },
    { label: 'Judging criteria', icon: Scale, value: config.hackathon.judgingCriteria },
    { label: 'Final presentation', icon: Presentation, value: config.hackathon.finalPresentation },
    { label: 'Prize categories', icon: Trophy, value: config.hackathon.prizeCategories || (config.prizes.categories.length ? config.prizes.categories.join(', ') : null) },
    { label: 'Certificates', icon: BadgeCheck, value: config.hackathon.certificates },
  ];
  return <details id="hackathon-guide" className="hackathon-details" open>
    <summary><span className="guide-summary-icon"><ClipboardList size={22}/></span><span><strong>Hackathon guide</strong><span>Participation, challenges, and event rules</span></span><ChevronDown className="guide-chevron" size={20}/></summary>
    <div className="guide-content">
      <div className="guide-challenges"><div className="guide-challenges-heading"><h3>Problem statements</h3><span>{getProblemStatements(config).length} challenges</span></div><ul>{getProblemStatements(config).map(name => <li key={name}><span aria-hidden="true"/>{name}</li>)}</ul></div>
      <div className="guide-cards">{items.map(({ label, icon: Icon, value }) => <article key={label} className={`guide-card${value ? '' : ' is-pending'}`}><span className="guide-icon"><Icon size={21} strokeWidth={1.6}/></span><h3>{label}</h3><p>{value || 'To be announced'}</p></article>)}</div>
    </div>
  </details>;
}
