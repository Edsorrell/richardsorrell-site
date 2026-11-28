/* Server-side rendering for richardsorrell.co.uk (Cloudflare Pages Functions).
   Puts the real content into each page before it is sent, so search engines and
   AI crawlers that do not run JavaScript can read it. The browser script
   (assets/site.js) still builds the interactive page exactly as before.
   Everything here reads the same JSON files Richard edits in Pages CMS. */

export const SITE_URL = 'https://richardsorrell.co.uk';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const paras = t => String(t || '').split(/\n\s*\n/).filter(Boolean).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
export const money = n => { n = Number(n); return n > 0 ? '£' + n.toLocaleString('en-GB') : ''; };
export const slug = s => String(s || 'work').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'work';
export const thumb = src => /^\/img\/[^\/]+$/.test(src || '') ? src.replace('/img/', '/img/sm/') : src;
export const abs = u => !u ? '' : /^https?:/.test(u) ? u : SITE_URL + (u.startsWith('/') ? '' : '/') + u;
export const telHref = p => String(p || '').replace(/\(0\)/g, '').replace(/[^0-9+]/g, '').replace(/^0/, '+44');

export function withInches(sz) {
  sz = String(sz || ''); if (!sz || /\bin\b|"|inch/i.test(sz)) return sz;
  const m = sz.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*(cm)?\s*$/i); if (!m) return sz;
  const f = c => { const v = c / 2.54; return (Math.round(v * 2) / 2).toString().replace(/\.0$/, ''); };
  return sz + ' (' + f(parseFloat(m[1])) + ' × ' + f(parseFloat(m[2])) + ' in)';
}
export const caption = w => [w.medium, withInches(w.size)].filter(Boolean).join(', ') + (w.year ? ((w.medium || w.size) ? ' · ' : '') + w.year : '');
const cap1 = s => { s = String(s || '').trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; };

/* Same id rules as assets/site.js register(): hero, then paintings, then drawings. */
export function model(site) {
  const used = {}, works = [];
  const reg = (group, list) => list.forEach((w, i) => {
    const base = 'w-' + slug(w.title); let id = base, n = 2;
    while (used[id]) id = base + '-' + (n++);
    used[id] = 1;
    if (group === 'hero') return;
    works.push(Object.assign({}, w, { _id: id, _group: group, _i: i, _path: '/' + group + '/' + id.slice(2) }));
  });
  if (site.hero && site.hero.image) reg('hero', [site.hero]);
  reg('paintings', (site.paintings || []).filter(w => w && w.image));
  reg('drawings', (site.drawings || []).filter(w => w && w.image));
  const byPath = {}; works.forEach(w => { byPath[w._path] = w; });
  return { works, byPath, paintings: works.filter(w => w._group === 'paintings'), drawings: works.filter(w => w._group === 'drawings') };
}

export const altText = w => [w.title, 'by Richard Sorrell', [cap1(w.medium), w.size].filter(Boolean).join(', ')].filter(Boolean).join(', ');

export function card(w) {
  const right = w.sold ? '<span class="pr dot">Sold</span>' : (w.price ? '<span class="pr">' + money(w.price) + '</span>' : '');
  return '<div class="work" data-sold="' + (w.sold ? 1 : 0) + '"><a href="' + esc(w._path) + '" data-open="' + esc(w._id) + '"><img src="' + esc(thumb(w.image)) + '" alt="' + esc(altText(w)) + '" loading="lazy"></a><div class="cap"><b>' + esc(w.title) + '</b>' + right + '</div></div>';
}

export function enquireHref(site, w) {
  const opt = w.price && !w.sold ? ' (' + money(w.price) + ')' : '';
  const desc = caption(w);
  const body = 'Hello Richard,\n\nI am interested in "' + w.title + '"' + (desc ? ', ' + desc : '') + ',' + opt + '.\n\nMy delivery postcode or country is: \n\nThank you,\n';
  return 'mailto:' + (site.email || '') + '?subject=' + encodeURIComponent('Enquiry: ' + w.title) + '&body=' + encodeURIComponent(body.replace(',.', '.'));
}

const listHtml = items => (items || []).map(x => '<li>' + esc(x.name) + (x.note ? ' <span>' + esc(x.note) + '</span>' : '') + '</li>').join('');

/* ---------- Page content, keyed by element id ---------- */
export function homeParts(site, m) {
  const p = {};
  p.headline = esc(site.headline || '');
  p.intro = esc(site.intro || '');
  p['w-body'] = paras(site.welcome_text);
  const wp = site.welcome_photo || {};
  p['w-cap'] = wp.caption ? '<span>' + esc(wp.caption) + '</span>' : '';
  const news = (site.news || []).filter(n => n && n.title);
  if (news.length) p['news-list'] = news.map(n => '<article>' + (n.date ? '<time>' + esc(n.date) + '</time>' : '') + '<h3>' + esc(n.title) + '</h3>' + (n.text ? '<p>' + esc(n.text) + '</p>' : '') + (n.link ? '<a class="go" href="' + esc(n.link) + '">Find out more</a>' : '') + '</article>').join('');
  p['paintings-heading'] = esc(site.paintings_heading || '');
  p['paintings-intro'] = esc(site.paintings_intro || '');
  p['paintings-grid'] = m.paintings.map(card).join('');
  if (m.drawings.length) { p['drawings-intro'] = esc(site.drawings_intro || ''); p['drawings-grid'] = m.drawings.map(card).join(''); }
  p['contact-line'] = 'To buy a painting or arrange a studio visit, call <a href="tel:' + esc(telHref(site.phone)) + '">' + esc(site.phone) + '</a> or email <a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a>';
  p.address = esc(site.address).replace(/\n/g, '<br>');
  return p;
}
export function aboutParts(site, ex) {
  const shows = (ex.shows || []).slice(0, 5).map(s => ({ name: s.venue, note: [s.year, s.solo ? 'solo' : ''].filter(Boolean).join(', ') }));
  const films = (site.films || []).filter(f => f && f.title);
  return {
    'about-lede': esc(site.about_lede || ''), 'about-text': paras(site.about_text),
    societies: listHtml(site.societies), collections: listHtml(site.collections), recent: listHtml(shows),
    films: films.map(f => '<a href="' + esc(f.url) + '" target="_blank" rel="noopener"><h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p><span class="go">Watch on YouTube ↗</span></a>').join('')
  };
}
export function exhibitionParts(ex) {
  return {
    'ex-intro': esc(ex.intro || ''), regular: listHtml(ex.regular),
    shows: (ex.shows || []).filter(s => s && (s.venue || s.title)).map(s => {
      let t = (s.title ? '<em>' + esc(s.title) + '</em>, ' : '') + esc(s.venue || '');
      if (s.link) t = '<a href="' + esc(s.link) + '">' + t + '</a>';
      return '<div class="exrow"><span class="y">' + esc(s.year || '') + '</span><span class="t">' + t + '</span><span class="tag">' + (s.solo ? 'Solo' : '') + '</span></div>';
    }).join('')
  };
}
export function archiveParts(ar) {
  let out = '';
  (ar.series || []).forEach(s => {
    const works = (s.works || []).filter(w => w && w.image);
    out += '<div class="series" id="' + esc(slug(s.title)) + '"><div class="head"><div class="label">' + esc(s.years || '') + '</div><div><h2>' + esc(s.title) + '</h2>' + (s.intro ? '<p class="intro">' + esc(s.intro) + '</p>' : '') + '</div></div>' +
      (works.length ? '<div class="gallery">' + works.map(w => '<div class="work"><img src="' + esc(thumb(w.image)) + '" alt="' + esc(altText(w)) + '" loading="lazy"><div class="cap"><b>' + esc(w.title) + '</b></div></div>').join('') + '</div>' : '<p class="empty">Images of this work are being added.</p>') + '</div>';
  });
  return { 'ar-intro': esc(ar.intro || ''), series: out };
}

/* ---------- Structured data (schema.org JSON-LD) ---------- */
const PERSON_ID = SITE_URL + '/#richard';
export function person(site) {
  const wp = site.welcome_photo || {};
  return {
    '@type': 'Person', '@id': PERSON_ID, name: 'Richard Sorrell', givenName: 'Richard', familyName: 'Sorrell',
    honorificSuffix: 'PPRWS RBA NEAC', jobTitle: 'Painter', url: SITE_URL + '/',
    description: 'British painter, born 1948, of invented figurative pictures – "people doing things" – in oil, acrylic and watercolour. Past President of the Royal Watercolour Society and a member of the Royal Society of British Artists and the New English Art Club. Lives and works near Penzance, Cornwall.',
    image: wp.image ? abs(wp.image) : undefined,
    birthDate: '1948-09-24', birthPlace: { '@type': 'Place', name: 'Thundersley, Essex, England' },
    address: { '@type': 'PostalAddress', addressLocality: 'Penzance', addressRegion: 'Cornwall', addressCountry: 'GB' },
    email: site.email ? 'mailto:' + site.email : undefined, telephone: site.phone ? telHref(site.phone) : undefined,
    knowsAbout: ['Figurative painting', 'Oil painting', 'Acrylic painting', 'Watercolour', 'Drawing', 'Aerial views'],
    alumniOf: [
      { '@type': 'EducationalOrganization', name: 'Royal Academy Schools' },
      { '@type': 'EducationalOrganization', name: 'Kingston College of Art' },
      { '@type': 'EducationalOrganization', name: 'Walthamstow School of Art' }
    ],
    memberOf: [
      { '@type': 'Organization', name: 'Royal Watercolour Society', alternateName: 'RWS', description: 'Past President (2006–2009)' },
      { '@type': 'Organization', name: 'Royal Society of British Artists', alternateName: 'RBA' },
      { '@type': 'Organization', name: 'New English Art Club', alternateName: 'NEAC' },
      { '@type': 'Organization', name: 'Art Workers Guild' }
    ],
    parent: [
      { '@type': 'Person', name: 'Alan Sorrell', sameAs: 'https://en.wikipedia.org/wiki/Alan_Sorrell' },
      { '@type': 'Person', name: 'Elizabeth Sorrell' }
    ],
    sameAs: [
      'https://en.wikipedia.org/wiki/Richard_Sorrell',
      'https://artuk.org/discover/artists/sorrell-richard-b-1948',
      'https://www.newenglishartclub.co.uk/artists/106-richard-sorrell',
      'https://www.banksidegallery.com/artists/174-richard-sorrell-pprws-hon.-re',
      'https://www.artworkersguild.org/membership/find-a-member/sorrell-richard',
      'https://cornwallartists.org/cornwall-artists/richard-sorrell',
      'https://richard-sorrell.blogspot.com/',
      'https://twitter.com/Richard_Sorrell'
    ]
  };
}
export function website() {
  return { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: 'Richard Sorrell', inLanguage: 'en-GB', publisher: { '@id': PERSON_ID } };
}
export function artwork(site, w) {
  const isDrawing = w._group === 'drawings';
  const desc = [caption(w), String(w.note || '').trim()].filter(Boolean).join('. ');
  const o = {
    '@type': w.price || w.sold ? ['VisualArtwork', 'Product'] : 'VisualArtwork',
    '@id': SITE_URL + w._path + '#artwork', name: w.title, url: SITE_URL + w._path, image: abs(w.image),
    creator: { '@id': PERSON_ID }, artform: isDrawing ? 'Drawing' : 'Painting',
    artMedium: w.medium || undefined, dateCreated: w.year ? String(w.year) : undefined,
    description: desc || undefined
  };
  if (w.price || w.sold) {
    o.brand = { '@type': 'Brand', name: 'Richard Sorrell' };
    o.offers = { '@type': 'Offer', url: SITE_URL + w._path, priceCurrency: 'GBP', availability: w.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', seller: { '@id': PERSON_ID } };
    if (w.price) o.offers.price = String(Number(w.price));
  }
  return o;
}
export const ldScript = graph => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') + '</script>';

/* ---------- A page for each painting and drawing ---------- */
export function workMain(site, m, w) {
  const list = w._group === 'drawings' ? m.drawings : m.paintings;
  const k = list.indexOf(w), prev = list[(k - 1 + list.length) % list.length], next = list[(k + 1) % list.length];
  const label = w._group === 'drawings' ? 'Drawings' : 'Paintings';
  const price = w.sold ? '<p class="price">Sold</p>' : (w.price ? '<p class="price">' + money(w.price) + '</p>' : '');
  const note = String(w.note || '').trim();
  return '<div class="wrap workpage">' +
    '<nav class="crumb" aria-label="Breadcrumb"><a href="/">Richard Sorrell</a> <span>/</span> <a href="/#' + w._group + '">' + label + '</a></nav>' +
    '<div class="wp-grid"><figure class="wp-img"><a href="/#' + esc(w._id) + '"><img src="' + esc(w.image) + '" alt="' + esc(altText(w)) + '"></a></figure>' +
    '<div class="wp-side"><h1>' + esc(w.title) + '</h1><p class="meta">' + esc(caption(w)) + '</p>' +
    (note ? '<div class="body">' + paras(note) + '</div>' : '') + price +
    '<div class="acts"><a class="btn" href="' + esc(enquireHref(site, w)) + '">' + (w.sold ? 'Get in touch' : 'Enquire about this ' + (w._group === 'drawings' ? 'drawing' : 'painting')) + '</a>' +
    '<a class="btn ghost" href="/#' + esc(w._id) + '/room">View in a room</a></div>' +
    '<p class="small">' + (site.phone ? 'Or call <a href="tel:' + esc(telHref(site.phone)) + '">' + esc(site.phone) + '</a>. ' : '') + esc(site.delivery_note || '') + '</p>' +
    '</div></div>' +
    '<nav class="wp-nav"><a href="' + esc(prev._path) + '">← ' + esc(prev.title) + '</a><a href="/#' + w._group + '">All ' + label.toLowerCase() + '</a><a href="' + esc(next._path) + '">' + esc(next.title) + ' →</a></nav>' +
    '</div>';
}

/* ---------- llms.txt: a plain summary for AI tools ---------- */
export function llms(site, ex, m) {
  const line = w => '- [' + w.title + '](' + SITE_URL + w._path + '): ' + [caption(w), w.sold ? 'sold' : money(w.price)].filter(Boolean).join(', ') + (w.note ? '. ' + String(w.note).trim().replace(/\s+/g, ' ') : '');
  const strip = t => String(t || '').replace(/\s+\n/g, '\n').trim();
  return '# Richard Sorrell PPRWS RBA NEAC\n\n> British painter, born 1948, of invented figurative pictures – "people doing things" – in oil, acrylic and watercolour. Past President of the Royal Watercolour Society; member of the RBA and NEAC. Lives and works near Penzance, Cornwall.\n\n' + (site.about_lede ? '"' + String(site.about_lede).trim() + '" – Richard Sorrell\n\n' : '') +
    'Official website of the painter Richard Sorrell (born 1948). Paintings and drawings on this site are for sale directly from the artist.\n\n' +
    '## About\n\n' + strip(site.welcome_text) + '\n\n' + strip(site.about_text) + '\n\n' +
    '- Biography: ' + SITE_URL + '/about\n- Exhibitions: ' + SITE_URL + '/exhibitions\n\n' +
    '## Paintings\n\n' + m.paintings.map(line).join('\n') + '\n\n' +
    (m.drawings.length ? '## Drawings\n\n' + m.drawings.map(line).join('\n') + '\n\n' : '') +
    ((ex.regular || []).length ? '## Exhibits regularly with\n\n' + ex.regular.map(r => '- ' + r.name + (r.note ? ' (' + r.note + ')' : '')).join('\n') + '\n\n' : '') +
    ((ex.shows || []).length ? '## Exhibitions\n\n' + ex.shows.filter(s => s && (s.venue || s.title)).map(s => '- ' + [s.year, s.title, s.venue, s.solo ? 'solo' : ''].filter(Boolean).join(', ')).join('\n') + '\n\n' : '') +
    '## Contact\n\n' + 'To buy a painting or arrange a studio visit: ' + [site.phone, site.email].filter(Boolean).join(', ') + '.\n' + (site.address ? String(site.address).replace(/\n/g, ', ') + '\n' : '');
}

export function sitemap(m, hasArchive) {
  const pages = ['/', '/about', '/exhibitions'].concat(hasArchive ? ['/archive'] : []);
  const u = (loc, img, title) => '<url><loc>' + esc(SITE_URL + loc) + '</loc>' + (img ? '<image:image><image:loc>' + esc(abs(img)) + '</image:loc><image:title>' + esc(title) + '</image:title></image:image>' : '') + '</url>';
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    pages.map(p => u(p)).join('\n') + '\n' + m.works.map(w => u(w._path, w.image, w.title + ' by Richard Sorrell')).join('\n') + '\n</urlset>\n';
}
