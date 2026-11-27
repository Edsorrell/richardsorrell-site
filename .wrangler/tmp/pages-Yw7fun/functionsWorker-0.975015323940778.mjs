var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-wsmzvJ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// ../.wrangler/tmp/bundle-wsmzvJ/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../lib/render.js
var SITE_URL = "https://richardsorrell.co.uk";
var esc = /* @__PURE__ */ __name((s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var paras = /* @__PURE__ */ __name((t) => String(t || "").split(/\n\s*\n/).filter(Boolean).map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>").join(""), "paras");
var money = /* @__PURE__ */ __name((n) => {
  n = Number(n);
  return n > 0 ? "\xA3" + n.toLocaleString("en-GB") : "";
}, "money");
var slug = /* @__PURE__ */ __name((s) => String(s || "work").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "work", "slug");
var thumb = /* @__PURE__ */ __name((src) => /^\/img\/[^\/]+$/.test(src || "") ? src.replace("/img/", "/img/sm/") : src, "thumb");
var abs = /* @__PURE__ */ __name((u) => !u ? "" : /^https?:/.test(u) ? u : SITE_URL + (u.startsWith("/") ? "" : "/") + u, "abs");
var telHref = /* @__PURE__ */ __name((p) => String(p || "").replace(/\(0\)/g, "").replace(/[^0-9+]/g, "").replace(/^0/, "+44"), "telHref");
function withInches(sz) {
  sz = String(sz || "");
  if (!sz || /\bin\b|"|inch/i.test(sz))
    return sz;
  const m = sz.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*cm/);
  if (!m)
    return sz;
  const f = /* @__PURE__ */ __name((c) => {
    const v = c / 2.54;
    return (Math.round(v * 2) / 2).toString().replace(/\.0$/, "");
  }, "f");
  return sz + " (" + f(parseFloat(m[1])) + " \xD7 " + f(parseFloat(m[2])) + " in)";
}
__name(withInches, "withInches");
var caption = /* @__PURE__ */ __name((w) => [w.medium, withInches(w.size)].filter(Boolean).join(", ") + (w.year ? (w.medium || w.size ? " \xB7 " : "") + w.year : ""), "caption");
var cap1 = /* @__PURE__ */ __name((s) => {
  s = String(s || "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}, "cap1");
function model(site) {
  const used = {}, works = [];
  const reg = /* @__PURE__ */ __name((group, list) => list.forEach((w, i) => {
    const base = "w-" + slug(w.title);
    let id = base, n = 2;
    while (used[id])
      id = base + "-" + n++;
    used[id] = 1;
    if (group === "hero")
      return;
    works.push(Object.assign({}, w, { _id: id, _group: group, _i: i, _path: "/" + group + "/" + id.slice(2) }));
  }), "reg");
  if (site.hero && site.hero.image)
    reg("hero", [site.hero]);
  reg("paintings", (site.paintings || []).filter((w) => w && w.image));
  reg("drawings", (site.drawings || []).filter((w) => w && w.image));
  const byPath = {};
  works.forEach((w) => {
    byPath[w._path] = w;
  });
  return { works, byPath, paintings: works.filter((w) => w._group === "paintings"), drawings: works.filter((w) => w._group === "drawings") };
}
__name(model, "model");
var altText = /* @__PURE__ */ __name((w) => [w.title, "by Richard Sorrell", [cap1(w.medium), w.size].filter(Boolean).join(", ")].filter(Boolean).join(", "), "altText");
function card(w) {
  const right = w.sold ? '<span class="pr dot">Sold</span>' : w.price ? '<span class="pr">' + money(w.price) + "</span>" : "";
  return '<div class="work" data-sold="' + (w.sold ? 1 : 0) + '"><a href="' + esc(w._path) + '" data-open="' + esc(w._id) + '"><img src="' + esc(thumb(w.image)) + '" alt="' + esc(altText(w)) + '" loading="lazy"></a><div class="cap"><b>' + esc(w.title) + "</b>" + right + "</div></div>";
}
__name(card, "card");
function enquireHref(site, w) {
  const opt = w.price && !w.sold ? " (" + money(w.price) + ")" : "";
  const desc = caption(w);
  const body = 'Hello Richard,\n\nI am interested in "' + w.title + '"' + (desc ? ", " + desc : "") + "," + opt + ".\n\nMy delivery postcode or country is: \n\nThank you,\n";
  return "mailto:" + (site.email || "") + "?subject=" + encodeURIComponent("Enquiry: " + w.title) + "&body=" + encodeURIComponent(body.replace(",.", "."));
}
__name(enquireHref, "enquireHref");
var listHtml = /* @__PURE__ */ __name((items) => (items || []).map((x) => "<li>" + esc(x.name) + (x.note ? " <span>" + esc(x.note) + "</span>" : "") + "</li>").join(""), "listHtml");
function homeParts(site, m) {
  const p = {};
  p.headline = esc(site.headline || "");
  p.intro = esc(site.intro || "");
  p["w-body"] = paras(site.welcome_text);
  const wp = site.welcome_photo || {};
  p["w-cap"] = wp.caption ? "<span>" + esc(wp.caption) + "</span>" : "";
  const news = (site.news || []).filter((n) => n && n.title);
  if (news.length)
    p["news-list"] = news.map((n) => "<article>" + (n.date ? "<time>" + esc(n.date) + "</time>" : "") + "<h3>" + esc(n.title) + "</h3>" + (n.text ? "<p>" + esc(n.text) + "</p>" : "") + (n.link ? '<a class="go" href="' + esc(n.link) + '">Find out more</a>' : "") + "</article>").join("");
  p["paintings-heading"] = esc(site.paintings_heading || "");
  p["paintings-intro"] = esc(site.paintings_intro || "");
  p["paintings-grid"] = m.paintings.map(card).join("");
  if (m.drawings.length) {
    p["drawings-intro"] = esc(site.drawings_intro || "");
    p["drawings-grid"] = m.drawings.map(card).join("");
  }
  p["contact-line"] = 'To buy a painting or arrange a studio visit, call <a href="tel:' + esc(telHref(site.phone)) + '">' + esc(site.phone) + '</a> or email <a href="mailto:' + esc(site.email) + '">' + esc(site.email) + "</a>";
  p.address = esc(site.address).replace(/\n/g, "<br>");
  return p;
}
__name(homeParts, "homeParts");
function aboutParts(site, ex) {
  const shows = (ex.shows || []).slice(0, 5).map((s) => ({ name: s.venue, note: [s.year, s.solo ? "solo" : ""].filter(Boolean).join(", ") }));
  const films = (site.films || []).filter((f) => f && f.title);
  return {
    "about-lede": esc(site.about_lede || ""),
    "about-text": paras(site.about_text),
    societies: listHtml(site.societies),
    collections: listHtml(site.collections),
    recent: listHtml(shows),
    films: films.map((f) => '<a href="' + esc(f.url) + '" target="_blank" rel="noopener"><h3>' + esc(f.title) + "</h3><p>" + esc(f.text) + '</p><span class="go">Watch on YouTube \u2197</span></a>').join("")
  };
}
__name(aboutParts, "aboutParts");
function exhibitionParts(ex) {
  return {
    "ex-intro": esc(ex.intro || ""),
    regular: listHtml(ex.regular),
    shows: (ex.shows || []).filter((s) => s && (s.venue || s.title)).map((s) => {
      let t = (s.title ? "<em>" + esc(s.title) + "</em>, " : "") + esc(s.venue || "");
      if (s.link)
        t = '<a href="' + esc(s.link) + '">' + t + "</a>";
      return '<div class="exrow"><span class="y">' + esc(s.year || "") + '</span><span class="t">' + t + '</span><span class="tag">' + (s.solo ? "Solo" : "") + "</span></div>";
    }).join("")
  };
}
__name(exhibitionParts, "exhibitionParts");
function archiveParts(ar) {
  let out = "";
  (ar.series || []).forEach((s) => {
    const works = (s.works || []).filter((w) => w && w.image);
    out += '<div class="series" id="' + esc(slug(s.title)) + '"><div class="head"><div class="label">' + esc(s.years || "") + "</div><div><h2>" + esc(s.title) + "</h2>" + (s.intro ? '<p class="intro">' + esc(s.intro) + "</p>" : "") + "</div></div>" + (works.length ? '<div class="gallery">' + works.map((w) => '<div class="work"><img src="' + esc(thumb(w.image)) + '" alt="' + esc(altText(w)) + '" loading="lazy"><div class="cap"><b>' + esc(w.title) + "</b></div></div>").join("") + "</div>" : '<p class="empty">Images of this work are being added.</p>') + "</div>";
  });
  return { "ar-intro": esc(ar.intro || ""), series: out };
}
__name(archiveParts, "archiveParts");
var PERSON_ID = SITE_URL + "/#richard";
function person(site) {
  const wp = site.welcome_photo || {};
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Richard Sorrell",
    givenName: "Richard",
    familyName: "Sorrell",
    honorificSuffix: "PPRWS RBA NEAC",
    jobTitle: "Painter",
    url: SITE_URL + "/",
    description: 'British painter, born 1948, of invented figurative pictures \u2013 "people doing things" \u2013 in oil, acrylic and watercolour. Past President of the Royal Watercolour Society and a member of the Royal Society of British Artists and the New English Art Club. Lives and works near Penzance, Cornwall.',
    image: wp.image ? abs(wp.image) : void 0,
    birthDate: "1948-09-24",
    birthPlace: { "@type": "Place", name: "Thundersley, Essex, England" },
    address: { "@type": "PostalAddress", addressLocality: "Penzance", addressRegion: "Cornwall", addressCountry: "GB" },
    email: site.email ? "mailto:" + site.email : void 0,
    telephone: site.phone ? telHref(site.phone) : void 0,
    knowsAbout: ["Figurative painting", "Oil painting", "Acrylic painting", "Watercolour", "Drawing", "Aerial views"],
    alumniOf: [
      { "@type": "EducationalOrganization", name: "Royal Academy Schools" },
      { "@type": "EducationalOrganization", name: "Kingston College of Art" },
      { "@type": "EducationalOrganization", name: "Walthamstow School of Art" }
    ],
    memberOf: [
      { "@type": "Organization", name: "Royal Watercolour Society", alternateName: "RWS", description: "Past President (2006\u20132009)" },
      { "@type": "Organization", name: "Royal Society of British Artists", alternateName: "RBA" },
      { "@type": "Organization", name: "New English Art Club", alternateName: "NEAC" },
      { "@type": "Organization", name: "Art Workers Guild" }
    ],
    parent: [
      { "@type": "Person", name: "Alan Sorrell", sameAs: "https://en.wikipedia.org/wiki/Alan_Sorrell" },
      { "@type": "Person", name: "Elizabeth Sorrell" }
    ],
    sameAs: [
      "https://en.wikipedia.org/wiki/Richard_Sorrell",
      "https://artuk.org/discover/artists/sorrell-richard-b-1948",
      "https://www.newenglishartclub.co.uk/artists/106-richard-sorrell",
      "https://www.banksidegallery.com/artists/174-richard-sorrell-pprws-hon.-re",
      "https://www.artworkersguild.org/membership/find-a-member/sorrell-richard",
      "https://cornwallartists.org/cornwall-artists/richard-sorrell",
      "https://richard-sorrell.blogspot.com/",
      "https://twitter.com/Richard_Sorrell"
    ]
  };
}
__name(person, "person");
function website() {
  return { "@type": "WebSite", "@id": SITE_URL + "/#website", url: SITE_URL + "/", name: "Richard Sorrell", inLanguage: "en-GB", publisher: { "@id": PERSON_ID } };
}
__name(website, "website");
function artwork(site, w) {
  const isDrawing = w._group === "drawings";
  const desc = [caption(w), String(w.note || "").trim()].filter(Boolean).join(". ");
  const o = {
    "@type": w.price || w.sold ? ["VisualArtwork", "Product"] : "VisualArtwork",
    "@id": SITE_URL + w._path + "#artwork",
    name: w.title,
    url: SITE_URL + w._path,
    image: abs(w.image),
    creator: { "@id": PERSON_ID },
    artform: isDrawing ? "Drawing" : "Painting",
    artMedium: w.medium || void 0,
    dateCreated: w.year ? String(w.year) : void 0,
    description: desc || void 0
  };
  if (w.price || w.sold) {
    o.brand = { "@type": "Brand", name: "Richard Sorrell" };
    o.offers = { "@type": "Offer", url: SITE_URL + w._path, priceCurrency: "GBP", availability: w.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock", seller: { "@id": PERSON_ID } };
    if (w.price)
      o.offers.price = String(Number(w.price));
  }
  return o;
}
__name(artwork, "artwork");
var ldScript = /* @__PURE__ */ __name((graph) => '<script type="application/ld+json">' + JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") + "<\/script>", "ldScript");
function workMain(site, m, w) {
  const list = w._group === "drawings" ? m.drawings : m.paintings;
  const k = list.indexOf(w), prev = list[(k - 1 + list.length) % list.length], next = list[(k + 1) % list.length];
  const label = w._group === "drawings" ? "Drawings" : "Paintings";
  const price = w.sold ? '<p class="price">Sold</p>' : w.price ? '<p class="price">' + money(w.price) + "</p>" : "";
  const note = String(w.note || "").trim();
  return '<div class="wrap workpage"><nav class="crumb" aria-label="Breadcrumb"><a href="/">Richard Sorrell</a> <span>/</span> <a href="/#' + w._group + '">' + label + '</a></nav><div class="wp-grid"><figure class="wp-img"><a href="/#' + esc(w._id) + '"><img src="' + esc(w.image) + '" alt="' + esc(altText(w)) + '"></a></figure><div class="wp-side"><h1>' + esc(w.title) + '</h1><p class="meta">' + esc(caption(w)) + "</p>" + (note ? '<div class="body">' + paras(note) + "</div>" : "") + price + '<div class="acts"><a class="btn" href="' + esc(enquireHref(site, w)) + '">' + (w.sold ? "Get in touch" : "Enquire about this " + (w._group === "drawings" ? "drawing" : "painting")) + '</a><a class="btn ghost" href="/#' + esc(w._id) + '/room">View in a room</a></div><p class="small">' + (site.phone ? 'Or call <a href="tel:' + esc(telHref(site.phone)) + '">' + esc(site.phone) + "</a>. " : "") + esc(site.delivery_note || "") + '</p></div></div><nav class="wp-nav"><a href="' + esc(prev._path) + '">\u2190 ' + esc(prev.title) + '</a><a href="/#' + w._group + '">All ' + label.toLowerCase() + '</a><a href="' + esc(next._path) + '">' + esc(next.title) + " \u2192</a></nav></div>";
}
__name(workMain, "workMain");
function llms(site, ex, m) {
  const line = /* @__PURE__ */ __name((w) => "- [" + w.title + "](" + SITE_URL + w._path + "): " + [caption(w), w.sold ? "sold" : money(w.price)].filter(Boolean).join(", ") + (w.note ? ". " + String(w.note).trim().replace(/\s+/g, " ") : ""), "line");
  const strip = /* @__PURE__ */ __name((t) => String(t || "").replace(/\s+\n/g, "\n").trim(), "strip");
  return '# Richard Sorrell PPRWS RBA NEAC\n\n> British painter, born 1948, of invented figurative pictures \u2013 "people doing things" \u2013 in oil, acrylic and watercolour. Past President of the Royal Watercolour Society; member of the RBA and NEAC. Lives and works near Penzance, Cornwall.\n\n' + (site.about_lede ? '"' + String(site.about_lede).trim() + '" \u2013 Richard Sorrell\n\n' : "") + "Official website of the painter Richard Sorrell (born 1948). Paintings and drawings on this site are for sale directly from the artist.\n\n## About\n\n" + strip(site.welcome_text) + "\n\n" + strip(site.about_text) + "\n\n- Biography: " + SITE_URL + "/about\n- Exhibitions: " + SITE_URL + "/exhibitions\n\n## Paintings\n\n" + m.paintings.map(line).join("\n") + "\n\n" + (m.drawings.length ? "## Drawings\n\n" + m.drawings.map(line).join("\n") + "\n\n" : "") + ((ex.regular || []).length ? "## Exhibits regularly with\n\n" + ex.regular.map((r) => "- " + r.name + (r.note ? " (" + r.note + ")" : "")).join("\n") + "\n\n" : "") + ((ex.shows || []).length ? "## Exhibitions\n\n" + ex.shows.filter((s) => s && (s.venue || s.title)).map((s) => "- " + [s.year, s.title, s.venue, s.solo ? "solo" : ""].filter(Boolean).join(", ")).join("\n") + "\n\n" : "") + "## Contact\n\nTo buy a painting or arrange a studio visit: " + [site.phone, site.email].filter(Boolean).join(", ") + ".\n" + (site.address ? String(site.address).replace(/\n/g, ", ") + "\n" : "");
}
__name(llms, "llms");
function sitemap(m, hasArchive) {
  const pages = ["/", "/about", "/exhibitions"].concat(hasArchive ? ["/archive"] : []);
  const u = /* @__PURE__ */ __name((loc, img, title) => "<url><loc>" + esc(SITE_URL + loc) + "</loc>" + (img ? "<image:image><image:loc>" + esc(abs(img)) + "</image:loc><image:title>" + esc(title) + "</image:title></image:image>" : "") + "</url>", "u");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + pages.map((p) => u(p)).join("\n") + "\n" + m.works.map((w) => u(w._path, w.image, w.title + " by Richard Sorrell")).join("\n") + "\n</urlset>\n";
}
__name(sitemap, "sitemap");

// ../lib/pages.js
async function json(env, request, path, fallback) {
  try {
    const r = await env.ASSETS.fetch(new URL(path, request.url));
    if (!r.ok)
      return fallback;
    return await r.json();
  } catch (e) {
    return fallback;
  }
}
__name(json, "json");
async function load(env, request) {
  const [site, ex, ar] = await Promise.all([
    json(env, request, "/data/site.json", null),
    json(env, request, "/data/exhibitions.json", {}),
    json(env, request, "/data/archive.json", {})
  ]);
  if (!site)
    throw new Error("no site data");
  return { site, ex, ar, m: model(site), hasArchive: (ar.series || []).some((s) => (s.works || []).some((w) => w && w.image)) };
}
__name(load, "load");
function fillIds(rw, parts) {
  Object.keys(parts).forEach((id) => {
    rw.on("#" + CSS_escape(id), { element(el) {
      el.setInnerContent(parts[id], { html: true });
    } });
  });
  return rw;
}
__name(fillIds, "fillIds");
var CSS_escape = /* @__PURE__ */ __name((s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c), "CSS_escape");
function common(rw, d, graph) {
  rw.on('script[type="application/ld+json"]', { element(el) {
    el.remove();
  } });
  rw.on("head", { element(el) {
    el.append(ldScript(graph), { html: true });
  } });
  if (d.m.drawings.length)
    rw.on("#nav-drawings", { element(el) {
      el.removeAttribute("style");
    } });
  if (d.hasArchive)
    rw.on("#nav-archive", { element(el) {
      el.removeAttribute("style");
    } });
  rw.on("#foot-email", { element(el) {
    if (d.site.email) {
      el.setAttribute("href", "mailto:" + d.site.email);
      el.setInnerContent(esc(d.site.email), { html: true });
    }
  } });
  return rw;
}
__name(common, "common");
async function htmlAsset(env, request, path) {
  const r = await env.ASSETS.fetch(new URL(path, request.url));
  return r;
}
__name(htmlAsset, "htmlAsset");
var headers = /* @__PURE__ */ __name((r) => {
  const h = new Headers(r.headers);
  h.set("Content-Type", "text/html; charset=utf-8");
  h.set("Cache-Control", "no-cache");
  return h;
}, "headers");
async function page(context, kind) {
  const { request, env } = context;
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok || !(asset.headers.get("content-type") || "").includes("text/html"))
    return asset;
  try {
    const d = await load(env, request);
    const rw = new HTMLRewriter();
    const graph = [person(d.site), website()];
    if (kind === "home") {
      fillIds(rw, homeParts(d.site, d.m));
      if ((d.site.news || []).some((n) => n && n.title))
        rw.on("#news", { element(el) {
          el.removeAttribute("style");
        } });
      if (d.m.drawings.length)
        rw.on("#drawings", { element(el) {
          el.removeAttribute("style");
        } });
      graph.push({
        "@type": "CollectionPage",
        "@id": SITE_URL + "/#page",
        url: SITE_URL + "/",
        name: "Richard Sorrell \u2013 paintings and drawings for sale",
        about: { "@id": SITE_URL + "/#richard" },
        isPartOf: { "@id": SITE_URL + "/#website" },
        hasPart: d.m.works.map((w) => ({ "@id": SITE_URL + w._path + "#artwork" }))
      });
      d.m.works.forEach((w) => graph.push(artwork(d.site, w)));
    } else if (kind === "about") {
      fillIds(rw, aboutParts(d.site, d.ex));
      if (!(d.site.films || []).some((f) => f && f.title))
        rw.on("#film", { element(el) {
          el.setAttribute("style", "display:none");
        } });
      graph.push({ "@type": "ProfilePage", "@id": SITE_URL + "/about#page", url: SITE_URL + "/about", name: "About Richard Sorrell", mainEntity: { "@id": SITE_URL + "/#richard" }, isPartOf: { "@id": SITE_URL + "/#website" } });
    } else if (kind === "exhibitions") {
      fillIds(rw, exhibitionParts(d.ex));
      graph.push({ "@type": "WebPage", "@id": SITE_URL + "/exhibitions#page", url: SITE_URL + "/exhibitions", name: "Exhibitions \u2013 Richard Sorrell", about: { "@id": SITE_URL + "/#richard" }, isPartOf: { "@id": SITE_URL + "/#website" } });
    } else if (kind === "archive") {
      fillIds(rw, archiveParts(d.ar));
    }
    common(rw, d, graph);
    const out = rw.transform(asset);
    return new Response(out.body, { status: asset.status, headers: headers(asset) });
  } catch (e) {
    return asset;
  }
}
__name(page, "page");
async function workPage(context, group) {
  const { request, env, params } = context;
  let d;
  try {
    d = await load(env, request);
  } catch (e) {
    return Response.redirect(new URL("/#" + group, request.url).toString(), 302);
  }
  const w = d.m.byPath["/" + group + "/" + params.slug];
  if (!w)
    return Response.redirect(new URL("/#" + group, request.url).toString(), 302);
  const shell = await htmlAsset(env, request, "/about");
  const title = w.title + " by Richard Sorrell \xB7 " + (group === "drawings" ? "Drawing" : "Painting") + (w.price && !w.sold ? " for sale" : "");
  const desc = (w.title + ", " + caption(w) + ", by Richard Sorrell PPRWS RBA NEAC. " + (w.note ? String(w.note).trim().replace(/\s+/g, " ") + " " : "") + (w.sold ? "Sold." : w.price ? money(w.price) + ", available from the artist." : "Available from the artist.")).slice(0, 300);
  const url = SITE_URL + w._path;
  const graph = [
    person(d.site),
    website(),
    artwork(d.site, w),
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Richard Sorrell", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: group === "drawings" ? "Drawings" : "Paintings", item: SITE_URL + "/#" + group },
      { "@type": "ListItem", position: 3, name: w.title, item: url }
    ] }
  ];
  const rw = new HTMLRewriter().on("title", { element(el) {
    el.setInnerContent(esc(title), { html: true });
  } }).on('meta[name="description"]', { element(el) {
    el.setAttribute("content", desc);
  } }).on('link[rel="canonical"]', { element(el) {
    el.setAttribute("href", url);
  } }).on('meta[property="og:title"]', { element(el) {
    el.setAttribute("content", title);
  } }).on('meta[property="og:description"]', { element(el) {
    el.setAttribute("content", desc);
  } }).on('meta[property="og:url"]', { element(el) {
    el.setAttribute("content", url);
  } }).on('meta[property="og:image"]', { element(el) {
    el.setAttribute("content", abs(w.image));
  } }).on('meta[property="og:type"]', { element(el) {
    el.setAttribute("content", "article");
  } }).on("body", { element(el) {
    el.setAttribute("data-page", "work");
  } }).on("nav a.on", { element(el) {
    el.removeAttribute("class");
  } }).on("main", { element(el) {
    el.setInnerContent(workMain(d.site, d.m, w), { html: true });
  } });
  common(rw, d, graph);
  const out = rw.transform(shell);
  return new Response(out.body, { status: 200, headers: headers(shell) });
}
__name(workPage, "workPage");
async function text(context, kind) {
  const { request, env } = context;
  try {
    const d = await load(env, request);
    if (kind === "sitemap")
      return new Response(sitemap(d.m, d.hasArchive), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    return new Response(llms(d.site, d.ex, d.m), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  } catch (e) {
    return new Response("", { status: 503 });
  }
}
__name(text, "text");

// drawings/[slug].js
var onRequestGet = /* @__PURE__ */ __name((c) => workPage(c, "drawings"), "onRequestGet");

// paintings/[slug].js
var onRequestGet2 = /* @__PURE__ */ __name((c) => workPage(c, "paintings"), "onRequestGet");

// about.js
var onRequestGet3 = /* @__PURE__ */ __name((c) => page(c, "about"), "onRequestGet");

// archive.js
var onRequestGet4 = /* @__PURE__ */ __name((c) => page(c, "archive"), "onRequestGet");

// exhibitions.js
var onRequestGet5 = /* @__PURE__ */ __name((c) => page(c, "exhibitions"), "onRequestGet");

// llms.txt.js
var onRequestGet6 = /* @__PURE__ */ __name((c) => text(c, "llms"), "onRequestGet");

// sitemap.xml.js
var onRequestGet7 = /* @__PURE__ */ __name((c) => text(c, "sitemap"), "onRequestGet");

// index.js
var onRequestGet8 = /* @__PURE__ */ __name((c) => page(c, "home"), "onRequestGet");

// ../.wrangler/tmp/pages-Yw7fun/functionsRoutes-0.2630457902386456.mjs
var routes = [
  {
    routePath: "/drawings/:slug",
    mountPath: "/drawings",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/paintings/:slug",
    mountPath: "/paintings",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/about",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/archive",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/exhibitions",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/llms.txt",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/sitemap.xml",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  }
];

// ../../../../tmp/wr/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../tmp/wr/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-wsmzvJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-wsmzvJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.975015323940778.mjs.map
