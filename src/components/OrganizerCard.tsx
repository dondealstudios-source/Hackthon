import { ArrowUpRight } from 'lucide-react';
import { defaultEvent, type EventConfig } from '../config/event';
import './organizer-card.css';

export default function OrganizerCard({ config }: { config: EventConfig }) {
  return <a className="organizer-card" href={config.organizer.url || defaultEvent.organizer.url} target="_blank" rel="noopener noreferrer" aria-label="Visit VistaCortex, organizer of BuildFeast"><span className="organizer-artwork"><img src={config.organizer.brandLogo || defaultEvent.organizer.brandLogo} alt="VistaCortex logo" width="1402" height="1122" loading="lazy"/></span><span className="organizer-description"><span className="organizer-label">Organized by</span><strong>VistaCortex</strong><span className="organizer-domain">vistacortex.com<ArrowUpRight size={14}/></span></span><ArrowUpRight className="organizer-visit" size={23}/></a>;
}
