import { useEffect, useRef, useState } from 'react';

export function MotionRibbon() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="motion-ribbon" data-playing={visible} role="region" aria-label="BuildFeast: learn, build, launch">
    <div className="ribbon-viewport" aria-hidden="true"><div className="ribbon-track">{[0, 1].map(copy => <div className="ribbon-group" key={copy}><span>Learn by doing.</span><i/><span className="ribbon-outline">Build with purpose.</span><i/><span>Launch your ideas.</span><i/><span className="ribbon-outline">BuildFeast 2027.</span><i/></div>)}</div></div>

  </div>;
}

export function LeafAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="leaf-atmosphere" data-playing={visible} aria-hidden="true"><span/><span/><span/></div>;
}
