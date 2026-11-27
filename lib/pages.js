/* Request handlers used by the files in /functions. If anything goes wrong they
   fall back to the plain static page, so the site never breaks because of this. */
import * as R from './render.js';

async function json(env, request, path, fallback) {
  try {
    const r = await env.ASSETS.fetch(new URL(path, request.url));
    if (!r.ok) return fallback;
    return await r.json();
  } catch (e) { return fallback; }
}
export async function load(env, request) {
  const [site, ex, ar] = await Promise.all([
    json(env, request, '/data/site.json', null),
    json(env, request, '/data/exhibitions.json', {}),
    json(env, request, '/data/archive.json', {})
  ]);
  if (!site) throw new Error('no site data');
  return { site, ex, ar, m: R.model(site), hasArchive: (ar.series || []).some(s => (s.works || []).some(w => w && w.image)) };
}

function fillIds(rw, parts) {
  Object.keys(parts).forEach(id => {
    rw.on('#' + CSS_escape(id), { element(el) { el.setInnerContent(parts[id], { html: true }); } });
  });
  return rw;
}
const CSS_escape = s => s.replace(/[^a-zA-Z0-9_-]/g, c => '\\' + c);

function common(rw, d, graph) {
  rw.on('script[type="application/ld+json"]', { element(el) { el.remove(); } });
  rw.on('head', { element(el) { el.append(R.ldScript(graph), { html: true }); } });
  if (d.m.drawings.length) rw.on('#nav-drawings', { element(el) { el.removeAttribute('style'); } });
  if (d.hasArchive) rw.on('#nav-archive', { element(el) { el.removeAttribute('style'); } });
  rw.on('#foot-email', { element(el) { if (d.site.email) { el.setAttribute('href', 'mailto:' + d.site.email); el.setInnerContent(R.esc(d.site.email), { html: true }); } } });
  return rw;
}

async function htmlAsset(env, request, path) {
  const r = await env.ASSETS.fetch(new URL(path, request.url));
  return r;
}
const headers = r => { const h = new Headers(r.headers); h.set('Content-Type', 'text/html; charset=utf-8'); h.set('Cache-Control', 'no-cache'); return h; };

export async function page(context, kind) {
  const { request, env } = context;
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok || !(asset.headers.get('content-type') || '').includes('text/html')) return asset;
  try {
    const d = await load(env, request);
    const rw = new HTMLRewriter();
    const graph = [R.person(d.site), R.website()];
    if (kind === 'home') {
      fillIds(rw, R.homeParts(d.site, d.m));
      if ((d.site.news || []).some(n => n && n.title)) rw.on('#news', { element(el) { el.removeAttribute('style'); } });
      if (d.m.drawings.length) rw.on('#drawings', { element(el) { el.removeAttribute('style'); } });
      graph.push({ '@type': 'CollectionPage', '@id': R.SITE_URL + '/#page', url: R.SITE_URL + '/', name: 'Richard Sorrell – paintings and drawings for sale', about: { '@id': R.SITE_URL + '/#richard' }, isPartOf: { '@id': R.SITE_URL + '/#website' },
        hasPart: d.m.works.map(w => ({ '@id': R.SITE_URL + w._path + '#artwork' })) });
      d.m.works.forEach(w => graph.push(R.artwork(d.site, w)));
    } else if (kind === 'about') {
      fillIds(rw, R.aboutParts(d.site, d.ex));
      if (!(d.site.films || []).some(f => f && f.title)) rw.on('#film', { element(el) { el.setAttribute('style', 'display:none'); } });
      graph.push({ '@type': 'ProfilePage', '@id': R.SITE_URL + '/about#page', url: R.SITE_URL + '/about', name: 'About Richard Sorrell', mainEntity: { '@id': R.SITE_URL + '/#richard' }, isPartOf: { '@id': R.SITE_URL + '/#website' } });
    } else if (kind === 'exhibitions') {
      fillIds(rw, R.exhibitionParts(d.ex));
      graph.push({ '@type': 'WebPage', '@id': R.SITE_URL + '/exhibitions#page', url: R.SITE_URL + '/exhibitions', name: 'Exhibitions – Richard Sorrell', about: { '@id': R.SITE_URL + '/#richard' }, isPartOf: { '@id': R.SITE_URL + '/#website' } });
    } else if (kind === 'archive') {
      fillIds(rw, R.archiveParts(d.ar));
    }
    common(rw, d, graph);
    const out = rw.transform(asset);
    return new Response(out.body, { status: asset.status, headers: headers(asset) });
  } catch (e) {
    return asset;
  }
}

export async function workPage(context, group) {
  const { request, env, params } = context;
  let d;
  try { d = await load(env, request); } catch (e) { return Response.redirect(new URL('/#' + group, request.url).toString(), 302); }
  const w = d.m.byPath['/' + group + '/' + params.slug];
  if (!w) return Response.redirect(new URL('/#' + group, request.url).toString(), 302);
  const shell = await htmlAsset(env, request, '/about');
  const title = w.title + ' by Richard Sorrell · ' + (group === 'drawings' ? 'Drawing' : 'Painting') + (w.price && !w.sold ? ' for sale' : '');
  const desc = (w.title + ', ' + R.caption(w) + ', by Richard Sorrell PPRWS RBA NEAC. ' + (w.note ? String(w.note).trim().replace(/\s+/g, ' ') + ' ' : '') + (w.sold ? 'Sold.' : (w.price ? R.money(w.price) + ', available from the artist.' : 'Available from the artist.'))).slice(0, 300);
  const url = R.SITE_URL + w._path;
  const graph = [R.person(d.site), R.website(), R.artwork(d.site, w),
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Richard Sorrell', item: R.SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: group === 'drawings' ? 'Drawings' : 'Paintings', item: R.SITE_URL + '/#' + group },
      { '@type': 'ListItem', position: 3, name: w.title, item: url }] }];
  const rw = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(R.esc(title), { html: true }); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', url); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', url); } })
    .on('meta[property="og:image"]', { element(el) { el.setAttribute('content', R.abs(w.image)); } })
    .on('meta[property="og:type"]', { element(el) { el.setAttribute('content', 'article'); } })
    .on('body', { element(el) { el.setAttribute('data-page', 'work'); } })
    .on('nav a.on', { element(el) { el.removeAttribute('class'); } })
    .on('main', { element(el) { el.setInnerContent(R.workMain(d.site, d.m, w), { html: true }); } });
  common(rw, d, graph);
  const out = rw.transform(shell);
  return new Response(out.body, { status: 200, headers: headers(shell) });
}

export async function text(context, kind) {
  const { request, env } = context;
  try {
    const d = await load(env, request);
    if (kind === 'sitemap') return new Response(R.sitemap(d.m, d.hasArchive), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
    return new Response(R.llms(d.site, d.ex, d.m), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    return new Response('', { status: 503 });
  }
}
