import { useEffect, useState } from 'react';

const destinations = [
  { id: 'about', name: 'The event' },
  { id: 'problem-statements', name: 'Problem statements' },
  { id: 'program', name: 'Program' },
  { id: 'experience', name: 'The experience' },
  { id: 'registration', name: 'Join BuildFeast' },
];

/** Small, delegated interactions keep motion consistent without rerendering on pointer movement. */
export default function SiteInteractions() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.site-shell');
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const phone = matchMedia('(max-width: 700px)');
    const header = root.querySelector<HTMLElement>('.header');
    let compact = false;
    const scrollHeader = () => { const next = window.scrollY > 24; if (next !== compact) { compact = next; header?.toggleAttribute('data-scrolled', compact); } };
    scrollHeader();
    window.addEventListener('scroll', scrollHeader, { passive: true });
    const surfaceSelector = '.overview-block, .opportunity-panel, .statement-card, .journey-step';
    let lastSurface: HTMLElement | null = null;
    let lastAction: HTMLElement | null = null;
    let frame = 0;
    let pending: { surface: HTMLElement | null; action: HTMLElement | null; x: number; y: number } | null = null;
    const resetSurface = () => { lastSurface?.removeAttribute('data-pointer-active'); lastSurface?.style.removeProperty('--card-pitch'); };
    const resetAction = () => { lastAction?.style.removeProperty('--action-x'); lastAction?.style.removeProperty('--action-y'); };
    const clear = () => { resetSurface(); resetAction(); lastSurface = null; lastAction = null; root.style.removeProperty('--hero-x'); root.style.removeProperty('--hero-y'); };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const target = event.target instanceof Element ? event.target : null;
      pending = { surface: target?.closest<HTMLElement>(surfaceSelector) || null, action: target?.closest<HTMLElement>('.button.primary:not(:disabled), .nav-cta') || null, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const { surface, action, x, y } = pending;
        if (lastAction !== action) { resetAction(); lastAction = action; }
        if (action) {
          const bounds = action.getBoundingClientRect();
          action.style.setProperty('--action-x', `${Math.max(-3, Math.min(3, (x - bounds.left - bounds.width / 2) * .06))}px`);
          action.style.setProperty('--action-y', `${Math.max(-2, Math.min(2, (y - bounds.top - bounds.height / 2) * .08))}px`);
        }
        if (lastSurface !== surface) { resetSurface(); lastSurface = surface; }
        if (surface) {
          const rect = surface.getBoundingClientRect();
          surface.style.setProperty('--pointer-x', `${x - rect.left}px`);
          surface.style.setProperty('--pointer-y', `${y - rect.top}px`);
          if (surface.classList.contains('statement-card')) surface.style.setProperty('--card-pitch', `${((y - rect.top) / rect.height - .5) * -4}deg`);
          surface.setAttribute('data-pointer-active', 'true');
        }
        const hero = root.querySelector<HTMLElement>('.hero');
        if (hero) {
          const rect = hero.getBoundingClientRect();
          if (y >= rect.top && y <= rect.bottom) { root.style.setProperty('--hero-x', `${x - rect.left}px`); root.style.setProperty('--hero-y', `${y - rect.top}px`); }
        }
      });
    };
    const sections = destinations.map(destination => document.getElementById(destination.id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (entered.length) setActive(entered[0].target.id);
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
    // Replay scroll reveals after a surface leaves and re-enters the viewport.
    const onScreen = new Set<Element>();
    const running = new Map<Element, Animation>();
    const arrivals = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          if (phone.matches) continue;
          if (running.has(entry.target)) continue;
          onScreen.delete(entry.target);
          if (entry.target.classList.contains('section')) entry.target.removeAttribute('data-arrived');
          continue;
        }
        if (onScreen.has(entry.target)) continue;
        onScreen.add(entry.target);
        if (entry.target.classList.contains('section')) { entry.target.setAttribute('data-arrived', 'true'); continue; }
        if (reduced.matches || entry.target.contains(document.activeElement)) continue;
        running.get(entry.target)?.cancel();
        const heading = entry.target.matches('h2');
        const panel = entry.target.matches('.registration-form-card, .guest-panel');
        const siblings = entry.target.parentElement ? Array.from(entry.target.parentElement.children) : [];
        const order = Math.max(0, siblings.indexOf(entry.target)) % 4;
        const animation = entry.target.animate(phone.matches ? [
          { opacity: .25, translate: '0 20px' },
          { opacity: 1, translate: '0 0' },
        ] : heading ? [
          { opacity: 0, translate: '0 28px', clipPath: 'inset(0 0 100% 0)' },
          { opacity: 1, translate: '0 0', clipPath: 'inset(0 0 0% 0)' },
        ] : panel ? [
          { opacity: .05, translate: '30px 0', scale: '.985' },
          { opacity: 1, translate: '0 0', scale: '1' },
        ] : [
          { opacity: .05, translate: '0 42px', scale: '.975' },
          { opacity: 1, translate: '0 0', scale: '1' },
        ], { duration: phone.matches ? 520 : heading ? 800 : 700, delay: phone.matches ? 0 : heading || panel ? 0 : order * 65, fill: 'backwards', easing: 'cubic-bezier(.22,1,.36,1)' });
        running.set(entry.target, animation);
        animation.onfinish = () => {
          if (running.get(entry.target) !== animation) return;
          running.delete(entry.target);
          const bounds = entry.target.getBoundingClientRect();
          if (!phone.matches && (bounds.bottom <= 0 || bounds.top >= innerHeight * .92)) onScreen.delete(entry.target);
        };
      }
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.section, .section h2, .hero-visual, .event-snapshot>div, .overview-block, .statement-card, .day-tab, .journey-step, .topic-panel, .opportunity-panel, .partner-card, .registration-form-card, .guest-panel, .challenge-sculpture, .build-stack .stack-perspective, .particle-wave').forEach(section => arrivals.observe(section));
    const cancelMotion = () => { if (reduced.matches) { running.forEach(animation => animation.cancel()); running.clear(); } };
    root.addEventListener('pointermove', move, { passive: true }); root.addEventListener('pointerleave', clear);
    reduced.addEventListener('change', clear);
    reduced.addEventListener('change', cancelMotion);
    return () => { cancelAnimationFrame(frame); clear(); observer.disconnect(); arrivals.disconnect(); running.forEach(animation => animation.cancel()); window.removeEventListener('scroll', scrollHeader); header?.removeAttribute('data-scrolled'); root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', clear); reduced.removeEventListener('change', clear); reduced.removeEventListener('change', cancelMotion); };
  }, []);
  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.nav a');
    links.forEach(link => { if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    return () => links.forEach(link => link.removeAttribute('aria-current'));
  }, [active]);

  return null;
}
