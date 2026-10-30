export const SITE_URL = 'https://buildfeast.vistacortex.in';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const description = 'Join VistaCortex BuildFeast 2027: a two-day offline student hackathon with eight problem statements. Venues announced soon.';

export function renderSeoDocument(html, config, pathname = '/') {
  const faq = /^\/faq\/?$/.test(pathname), organizer = pathname === '/organizer';
  const canonical = SITE_URL + (faq ? '/faq' : '/');
  const title = faq ? 'FAQs | BuildFeast 2027 — VistaCortex' : `${config.name} | Offline Student Hackathon`;
  const summary = faq ? `Answers about ${config.name} registration, fees, offline venues, problem statements and participation.` : description;
  const image = SITE_URL + '/assets/vistacortex-buildfeast-2027.png';
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': SITE_URL + '/#organizer', name: 'VistaCortex', url: config.organizer.url || 'https://www.vistacortex.com/', logo: SITE_URL + (config.organizer.brandLogo || '/assets/vistacortex-organizer-transparent.png') },
      { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: config.name, inLanguage: 'en-IN', publisher: { '@id': SITE_URL + '/#organizer' } },
      { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description: summary, inLanguage: 'en-IN', isPartOf: { '@id': SITE_URL + '/#website' } },
    ],
  };
  const statements = (config.hackathon.problemStatements || '').split(/\r?\n/).filter(Boolean);
  // Exact dates and venue addresses are still pending, so do not invent Event rich-result data.
  const head = `<!-- buildfeast-seo-start -->
<title>${escape(title)}</title>
<meta name="description" content="${escape(summary)}"/>
<meta name="robots" content="${organizer ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="${escape(config.name)}"/>
<meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(summary)}"/><meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${image}"/><meta property="og:image:alt" content="VistaCortex BuildFeast 2027 official logo"/><meta property="og:locale" content="en_IN"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(summary)}"/><meta name="twitter:image" content="${image}"/>
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
<!-- buildfeast-seo-end -->`;
  let output = html.replace(/<!-- buildfeast-seo-start -->[\s\S]*?<!-- buildfeast-seo-end -->/g, '')
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  output = output.replace('</head>', head + '<style>.app-boot{position:fixed;inset:0;z-index:79;display:grid;place-items:center;background:#f8f9f3;overflow:hidden}.app-boot:before{content:"";position:absolute;width:min(50vw,50vh,380px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#cfe2bf99,transparent 68%);animation:boot-glow 2.2s ease-in-out infinite}.app-boot img{position:relative;width:min(60.7vw,60.7vh,474px);height:auto;animation:boot-breathe 2.2s ease-in-out infinite}.app-boot span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}@keyframes boot-breathe{50%{transform:scale(1.025)}}@keyframes boot-glow{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}@media(prefers-reduced-motion:reduce){.app-boot:before,.app-boot img{animation:none}}</style></head>');
  const fallback = faq
    ? `<main><h1>BuildFeast 2027 frequently asked questions</h1><h2>Where is the event?</h2><p>${escape(config.format)}. ${escape(config.venue || 'Venues will be announced soon.')}</p><h2>When is the event?</h2><p>${escape(config.period)}. Exact dates will be announced soon.</p><h2>What is the fee?</h2><p>₹${escape(config.fee)}. ${escape(config.feeBasis ? (config.feeBasis === 'per_team' ? 'Per team.' : 'Per participant.') : 'The fee basis is to be confirmed.')}</p><h2>How can I join?</h2><p>${config.registrationStatus === 'open' ? 'Registration is open.' : 'Registration details will be announced soon.'}</p><a href="/">View the event</a><a href="/#registration">Join BuildFeast</a></main>`
    : `<main><h1>${escape(config.name)}</h1><p>${escape(summary)}</p><p>${escape(config.format)} · ${escape(config.period)} · ${escape(config.venue || 'Venues announced soon')}</p><h2>Hackathon problem statements</h2><ol>${statements.map(name => `<li>${escape(name)}</li>`).join('')}</ol><h2>Program</h2><ol>${config.schedule.map(day => `<li>${escape(day.title)}: ${escape(day.description)}</li>`).join('')}</ol><h2>Official partners</h2><ul>${config.partners.map(partner => `<li>${partner.url ? `<a href="${escape(partner.url)}">${escape(partner.name)}</a>` : escape(partner.name)}</li>`).join('')}</ul><p>${config.registrationStatus === 'open' ? 'Registration is open.' : 'Registration is coming soon.'}</p><nav><a href="/faq">Frequently asked questions</a></nav><noscript>Enable JavaScript to use the interactive graphics and participation form.</noscript></main>`;
  return output.replace(/<div id="root">[\s\S]*?<\/div><!-- buildfeast-fallback-end -->|<div id="root"><\/div>/, `<div id="root">${organizer ? '' : '<div class="app-boot" role="status"><img src="/assets/vistacortex-buildfeast-transparent.png" alt="VistaCortex BuildFeast 2027"/><span>Loading BuildFeast…</span></div><noscript><style>.app-boot{display:none}</style>' + fallback + '</noscript>'}</div><!-- buildfeast-fallback-end -->`);
}
