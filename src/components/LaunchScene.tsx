import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export default function LaunchScene() {
  const ref = useRef<HTMLButtonElement>(null);
  const visible = useInView(ref, { amount: .15 });
  const reduced = useReducedMotion();
  const [launching, setLaunching] = useState(false);
  useEffect(() => { if (!launching) return; const timer = window.setTimeout(() => setLaunching(false), 1800); return () => clearTimeout(timer); }, [launching]);
  return <button ref={ref} type="button" className={`launch-scene ${launching ? 'is-launching' : ''}`} data-playing={visible} aria-label="Launch the paper plane" onClick={() => { if (!reduced) setLaunching(true); }} onPointerMove={event => { if (event.pointerType === 'touch' || reduced) return; const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--launch-x', `${((event.clientX - rect.left) / rect.width - .5) * 15}px`); event.currentTarget.style.setProperty('--launch-y', `${((event.clientY - rect.top) / rect.height - .5) * 12}px`); }} onPointerLeave={event => { event.currentTarget.style.setProperty('--launch-x', '0px'); event.currentTarget.style.setProperty('--launch-y', '0px'); }}>
    <svg viewBox="0 0 360 280" fill="none" aria-hidden="true">
      <ellipse cx="177" cy="226" rx="72" ry="9" fill="#9bb47d" opacity=".1"/>
      <path d="M36 190C30 222 73 249 116 223C170 191 131 154 88 180C49 205 105 245 170 211C219 186 270 118 307 60" className="launch-route"/>
      <circle cx="73" cy="82" r="37" className="launch-orbit"/><circle cx="289" cy="200" r="23" className="launch-orbit"/>
      <g className="launch-code-tile"><rect x="42" y="66" width="62" height="44" rx="12" fill="#f6faef" stroke="#bdcfa9"/><path d="M65 81L57 88L65 95M81 81L89 88L81 95M76 78L70 98" stroke="#65874f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></g>
      <g className="launch-check-tile"><rect x="264" y="176" width="45" height="45" rx="13" fill="#d4e5c0" stroke="#a9c28f"/><path d="M276 198L284 205L299 190" stroke="#4a7541" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
      <g className="launch-spark"><path d="M255 54V68M248 61H262" stroke="#87a96a" strokeWidth="1.6" strokeLinecap="round"/><circle cx="141" cy="46" r="3" fill="#a7bf8d"/><circle cx="319" cy="136" r="4" fill="#b9cfa2"/></g>
      <g className="launch-plane"><path d="M100 126L269 65L208 191L169 151L145 173L146 138Z" fill="#c1d9a5" stroke="#6f9356" strokeWidth="1.3" strokeLinejoin="round"/><path d="M100 126L269 65L169 151L146 138Z" fill="#f8fbee" stroke="#7e9e64" strokeWidth="1.3" strokeLinejoin="round"/><path d="M169 151L208 191L269 65Z" fill="#477545" stroke="#477545" strokeLinejoin="round"/><path d="M146 138L145 173L169 151L269 65Z" fill="#91b275" stroke="#6f9356" strokeWidth="1.2" strokeLinejoin="round"/></g>
    </svg>
  </button>;
}
