import { ArrowUpRight } from 'lucide-react';
import './guest-credit.css';

export default function GuestCredit() {
  return <div className="supporting-credits" role="group" aria-label="Chief guest and student ecosystem partner">
    <a className="guest-credit" href="https://ureproductions.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit URE Groups, chief guest"><img src="/assets/ure-groups.webp" alt="URE Groups logo" width="64" height="64" loading="lazy" decoding="async"/><span><span className="guest-credit-label">Chief guest</span><strong>URE Groups</strong></span><ArrowUpRight size={16}/></a>
    <a className="guest-credit ecosystem-credit" href="https://studentforge.in" target="_blank" rel="noopener noreferrer" aria-label="Visit Student Forge, student ecosystem partner"><span className="ecosystem-artwork"><img src="/assets/student-forge.webp" alt="Student Forge logo" width="1024" height="1536" loading="lazy" decoding="async"/></span><span><span className="guest-credit-label">Student ecosystem partner</span><strong>Student Forge</strong></span><ArrowUpRight size={16}/></a>
  </div>;
}
