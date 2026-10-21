import { ArrowUpRight } from 'lucide-react';
import './guest-credit.css';

export default function GuestCredit() {
  return <a className="guest-credit" href="https://ureproductions.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit URE Productions, chief guest"><img src="/assets/ure-productions-transparent.png" alt="URE Productions logo" width="64" height="64" loading="lazy"/><span><span className="guest-credit-label">Chief guest</span><strong>URE Productions</strong></span><ArrowUpRight size={16}/></a>;
}
