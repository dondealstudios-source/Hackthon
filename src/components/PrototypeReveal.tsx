import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronsLeftRight } from 'lucide-react';
import './prototype-reveal.css';

function Interface({ finished }: { finished: boolean }) {
  const ink = finished ? '#285d3e' : '#7b9271';
  return <svg viewBox="0 0 360 230" aria-hidden="true" className={finished ? 'prototype-finished' : 'prototype-draft'}>
    <rect x="22" y="20" width="316" height="190" rx="13" fill={finished ? '#fffffb' : '#f4f8ed'} stroke={finished ? '#cedfc0' : '#92a783'} strokeDasharray={finished ? undefined : '5 4'}/>
    <path d="M22 50H338" stroke={finished ? '#e1ead8' : '#a7b79c'}/>
    {[37, 48, 59].map(x => <circle key={x} cx={x} cy="35" r="2.5" fill={finished ? '#83a96b' : '#b0bea6'}/>)}
    <rect x="250" y="31" width="68" height="8" rx="4" fill={finished ? '#e1edd6' : 'none'} stroke={finished ? 'none' : '#a7b79c'}/>
    <text x="42" y="80" fill={ink} fontSize="8" fontFamily="monospace" letterSpacing="2">THE NEXT BIG IDEA</text>
    <text x="41" y="107" fill={ink} fontSize="23" fontFamily="Arial, sans-serif" fontWeight={finished ? '600' : '400'}>Made to matter.</text>
    <path d="M43 120H185M43 130H160" stroke={finished ? '#b7c8a8' : '#9dae90'} strokeWidth={finished ? 3 : 1} strokeLinecap="round"/>
    <rect x="42" y="146" width="91" height="25" rx={finished ? 7 : 2} fill={finished ? '#285d3e' : 'none'} stroke={ink}/>
    <text x="57" y="162" fontFamily="Arial, sans-serif" fontSize="9" fill={finished ? '#ffffff' : ink}>Start building</text>
    {finished ? <g className="prototype-leaves"><path d="M263 157C210 137 214 99 229 94C262 98 275 126 263 157Z" fill="#95b973"/><path d="M264 157C255 120 270 85 304 83C317 116 298 145 264 157Z" fill="#285d3e"/><path d="M263 169L267 120" stroke="#5e8248" strokeWidth="2"/><circle cx="260" cy="76" r="10" fill="#c8dda9"/></g> : <g stroke="#99ae8a" fill="none" strokeDasharray="4 3"><rect x="217" y="66" width="100" height="106" rx="5"/><path d="M217 66L317 172M317 66L217 172"/><circle cx="267" cy="118" r="28"/></g>}
    {[42, 140, 238].map((x, i) => <g key={x}><rect x={x} y="185" width="79" height="9" rx="4" fill={finished ? ['#d8e8c7', '#ecf2e4', '#d8e8c7'][i] : 'none'} stroke={finished ? 'none' : '#a7b79c'}/></g>)}
  </svg>;
}

export default function PrototypeReveal() {
  const [reveal, setReveal] = useState(55);
  const reduced = useReducedMotion();
  return <div className="prototype-reveal">
    <div className="prototype-caption"><span>FIRST SKETCH</span><span>WORKING PROTOTYPE</span></div>
    <motion.div className="prototype-stage" initial={reduced ? false : { opacity: 0, y: 16, rotateX: 8 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .65 }}>
      <Interface finished={false}/>
      <div className="prototype-result" style={{ clipPath: `inset(0 0 0 ${reveal}%)` }}><Interface finished/></div>
      <div className="prototype-divider" style={{ left: `${reveal}%` }} aria-hidden="true"><span><ChevronsLeftRight size={17}/></span></div>
    </motion.div>
    <input className="prototype-slider" type="range" min="0" max="100" value={reveal} aria-label="Compare the first sketch with the working prototype" aria-valuetext={`${100 - reveal} percent prototype revealed`} onChange={event => setReveal(Number(event.target.value))}/>
  </div>;
}
