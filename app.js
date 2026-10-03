"use strict";
/* ---------- Grundlagen ---------- */
const LAUNCH = new Date(2026, 9, 2); // Tagesrätsel #1
const ROUNDS = 10;
const EARTH = 6371;
const STORE = "orbis:v1:";

const COUNTRIES = COUNTRIES_RAW.map(r => ({de:r[0], en:r[1], iso:r[2], cap:r[3], lat:r[4], lon:r[5], pop:r[6], area:r[7], cont:r[8]}));
const BY_ISO = Object.fromEntries(COUNTRIES.map(c => [c.iso, c]));
const BY_DE = Object.fromEntries(COUNTRIES.map(c => [c.de, c]));
const FLAG_NAMES = Object.assign(Object.fromEntries(COUNTRIES.map(c => [c.iso, c.de])), Object.fromEntries(FLAG_ONLY.map(f => [f[1], f[0]])));
const CONT_NAME = {EU:"Europa", AS:"Asien", AF:"Afrika", NA:"Nord- und Mittelamerika", SA:"Südamerika", OC:"Ozeanien"};
const REGION = {
  EU:[[-25,34],[45,71]], AS:[[26,-10],[150,56]], AF:[[-20,-36],[55,38]],
  NA:[[-128,6],[-56,60]], SA:[[-84,-56],[-33,13]], OC:[[110,-48],[180,0]]
};

let TOPO = null, FLAGS = {}, WORLD = [], FEATURE = {};
function initGeo(){
  WORLD = topojson.feature(TOPO, TOPO.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
  for (const c of COUNTRIES) {
    const cands = WORLD.filter(f => f.properties.name === c.en);
    cands.sort((a,b) => d3.geoArea(b) - d3.geoArea(a));
    if (cands[0]) FEATURE[c.iso] = cands[0];
  }
}

function seedFrom(str){ let h = 1779033703 ^ str.length; for (let i=0;i<str.length;i++){ h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0); }; }
function makeRng(str){ const s = seedFrom(str); let a = s(); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr){ const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j = Math.floor(rng()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
function sample(rng, arr, n){ return shuffle(rng, arr).slice(0, n); }
const esc = s => String(s).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt = n => n.toLocaleString("de-DE");
const km = (a, b) => d3.geoDistance(a, b) * EARTH;
function fmtPop(m){ return m >= 1 ? fmt(Math.round(m*10)/10) + " Mio." : fmt(Math.round(m*1000)) + " Tsd."; }
const fmtArea = a => fmt(a) + " km²";
const fmtDeg = (v, pos, neg) => fmt(Math.abs(Math.round(v*100)/100)) + "° " + (v >= 0 ? pos : neg);

function dayKey(d = new Date()){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function puzzleNo(d = new Date()){ const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((a - LAUNCH) / 864e5) + 1; }

function load(k, fallback){ try { const v = localStorage.getItem(STORE + k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
function save(k, v){ try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch(e){} }

/* Tagesrätsel: kuratierte Fragen laufen der Reihe nach durch, ohne Wiederholung */
function cycle(name, arr, rng, ctx){
  if (!ctx || !ctx.daily) return pick(rng, arr);
  const order = shuffle(makeRng("orbis-pool|" + name), arr.map((_, k) => k));
  return arr[order[(((ctx.n - 1) % arr.length) + arr.length) % arr.length]];
}

/* ---------- Anonyme Statistik (GoatCounter, ohne Cookies, ohne fremdes Script) ----------
   Einstellungen stehen in js/config.js. Eigene Spiele nicht mitzählen: Seite einmal mit ?nicht-zaehlen öffnen. */
const Track = (() => {
  const code = (window.ORBIS_CONFIG && window.ORBIS_CONFIG.goatcounter || "").trim();
  try { if (new URLSearchParams(location.search).has("nicht-zaehlen")) save("nocount", true); } catch(e){}
  const enabled = /^[a-z0-9-]+$/.test(code) && location.protocol === "https:" && !load("nocount", false);
  function send(params){
    if (!enabled) return;
    const u = new URL("https://" + code + ".goatcounter.com/count");
    for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
    u.searchParams.set("rnd", Math.random().toString(36).slice(2));
    try { fetch(u.href, {method:"GET", mode:"no-cors", credentials:"omit", keepalive:true, referrerPolicy:"no-referrer"}); }
    catch(e){ const img = new Image(); img.referrerPolicy = "no-referrer"; img.src = u.href; }
  }
  return {
    enabled,
    page(){ send({p:location.pathname, t:document.title, r:document.referrer || ""}); },
    event(name){ send({p:name, t:name, e:"true"}); }
  };
})();
function trackVisit(){
  const today = dayKey(), first = load("first", null), last = load("lastvisit", null);
  if (!first) { save("first", today); Track.event("besuch-neu"); }
  else if (last !== today) {
    const d = Math.round((Date.parse(today) - Date.parse(first)) / 864e5);
    Track.event("besuch-wiederkehrend");
    if (d > 0 && d <= 60) Track.event("rueckkehr-tag-" + d);
  }
  save("lastvisit", today);
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && S.qs.length && S.i < ROUNDS && !S.left && document.getElementById("score")) {
    S.left = true; Track.event("verlassen-frage-" + (S.i + 1));
  }
});

/* Hauptland ohne weit entfernte Überseegebiete */
const OUTLINE_RADIUS = {au:2500};
function mainland(f, iso){
  const g = f.geometry;
  if (g.type !== "MultiPolygon") return f;
  const parts = g.coordinates.map(c => { const p = {type:"Polygon", coordinates:c}; return {c, a:d3.geoArea(p), m:d3.geoCentroid(p)}; });
  parts.sort((x,y) => y.a - x.a);
  const main = parts[0], radius = OUTLINE_RADIUS[iso] || 1200;
  const keep = parts.filter(p => p === main || p.a > main.a * 0.3 || (km(p.m, main.m) < radius && p.a > main.a * 0.002));
  return {type:"Feature", properties:f.properties, geometry:{type:"MultiPolygon", coordinates:keep.map(p => p.c)}};
}
function nearestPoint(f, pt){
  let best = null, bd = Infinity;
  const visit = ring => { const step = Math.max(1, Math.floor(ring.length / 400)); for (let i=0;i<ring.length;i+=step){ const d = d3.geoDistance(pt, ring[i]); if (d < bd){ bd = d; best = ring[i]; } } };
  const g = f.geometry;
  if (g.type === "Polygon") g.coordinates.forEach(visit); else g.coordinates.forEach(p => p.forEach(visit));
  return {pt:best, km:bd * EARTH};
}
function arrow(from, to){
  const [l1,p1] = from.map(x => x*Math.PI/180), [l2,p2] = to.map(x => x*Math.PI/180);
  const y = Math.sin(l2-l1)*Math.cos(p2), x = Math.cos(p1)*Math.sin(p2) - Math.sin(p1)*Math.cos(p2)*Math.cos(l2-l1);
  const b = (Math.atan2(y,x)*180/Math.PI + 360) % 360;
  const r = [["↑","nördlich"],["↗","nordöstlich"],["→","östlich"],["↘","südöstlich"],["↓","südlich"],["↙","südwestlich"],["←","westlich"],["↖","nordwestlich"]][Math.round(b/45) % 8];
  return [r[0] + "\uFE0E", r[1]];
}

/* ---------- Fragen-Generatoren ---------- */
const MAP_POOL = () => COUNTRIES.filter(c => c.area && c.area >= 25000 && FEATURE[c.iso]);
const OUTLINE_POOL = ["it","de","at","ch","es","pt","gb","ie","pl","cz","sk","hu","hr","gr","ro","ua","tr","jp","kr","in","th","vn","mn","kz","ir","sa","eg","ng","ke","et","za","mg","au","nz","br","ar","cl","pe","co","mx","cu","is","fi","se","ph","id","bo","dk","ba","by","pg","ve","ly","dz","cd","ao"];

const GEN = {
  map(rng){
    const c = pick(rng, MAP_POOL());
    return {type:"map", kind:["🗺️","Karte"], prompt:`Wo liegt ${c.de}?`, c, region:c.cont};
  },
  flag(rng, ctx){
    const group = cycle("flag", FLAG_GROUPS, rng, ctx).filter(i => FLAGS[i]);
    const iso = pick(rng, group);
    let opts = group.filter(i => i !== iso).slice(0, 3);
    while (opts.length < 3) { const r = pick(rng, Object.keys(FLAG_NAMES)); if (r !== iso && !opts.includes(r) && FLAGS[r]) opts.push(r); }
    return {type:"flag", kind:["🏳️","Flagge"], prompt:"Zu welchem Land gehört diese Flagge?", iso, opts:shuffle(rng, [iso, ...opts])};
  },
  compass(rng, ctx){
    const [dir, a, la, loa, b, lb, lob, why] = cycle("compass", COMPASS, rng, ctx);
    const word = {N:"nördlicher", S:"südlicher", E:"östlicher", W:"westlicher"}[dir];
    const A = {name:a, lat:la, lon:loa}, B = {name:b, lat:lb, lon:lob};
    const val = p => dir === "N" ? p.lat : dir === "S" ? -p.lat : dir === "E" ? p.lon : -p.lon;
    const ans = val(A) > val(B) ? a : b;
    const flip = rng() < 0.5;
    return {type:"compass", kind:["🧭","Kompass"], prompt:`Was liegt ${word}?`, dir, places: flip ? [B, A] : [A, B], ans, why};
  },
  capital(rng){
    const trapIsos = Object.keys(CAPITAL_TRAPS).filter(i => BY_ISO[i] && BY_ISO[i].cap);
    const c = rng() < 0.75 ? BY_ISO[pick(rng, trapIsos)] : pick(rng, COUNTRIES.filter(x => x.cap));
    let wrong = CAPITAL_TRAPS[c.iso] ? CAPITAL_TRAPS[c.iso].slice() : sample(rng, COUNTRIES.filter(x => x.cont === c.cont && x.cap && x !== c), 3).map(x => x.cap);
    return {type:"capital", kind:["🏛️","Hauptstadt"], prompt:`Was ist die Hauptstadt von ${c.de}?`, c, opts:shuffle(rng, [c.cap, ...wrong]), ans:c.cap};
  },
  outline(rng){
    const iso = pick(rng, OUTLINE_POOL.filter(i => FEATURE[i]));
    const c = BY_ISO[iso];
    const byDist = COUNTRIES.filter(x => x !== c).sort((a,b) => km([c.lon,c.lat],[a.lon,a.lat]) - km([c.lon,c.lat],[b.lon,b.lat]));
    const same = byDist.filter(x => x.cont === c.cont);
    const near = same.length >= 4 ? same.slice(0, 7) : [...same, ...byDist.filter(x => !same.includes(x))].slice(0, 5);
    const wrong = sample(rng, near, 3);
    return {type:"outline", kind:["✏️","Umriss"], prompt:"Welches Land hat diese Form?", c, opts:shuffle(rng, [c, ...wrong])};
  },
  outlier(rng, ctx){
    const [q, a, others, why] = cycle("outlier", OUTLIERS, rng, ctx);
    return {type:"choice", kind:["🚧","Nachbarn"], prompt:q, opts:shuffle(rng, [a, ...others]), ans:a, why};
  },
  trivia(rng, ctx){
    const [q, a, others, why] = cycle("trivia", TRIVIA, rng, ctx);
    return {type:"choice", kind:["💡","Wissen"], prompt:q, opts:shuffle(rng, [a, ...others]), ans:a, why};
  },
  higher(rng, ctx){
    const [metric, i1, i2, why] = cycle("higher", HIGHER, rng, ctx);
    const pair = rng() < 0.5 ? [BY_ISO[i1], BY_ISO[i2]] : [BY_ISO[i2], BY_ISO[i1]];
    const ans = pair[0][metric] > pair[1][metric] ? pair[0] : pair[1];
    return {type:"higher", kind:["⚖️","Höher oder tiefer"], prompt: metric === "pop" ? "Welches Land hat mehr Einwohner?" : "Welches Land ist größer?", metric, pair, ans, why};
  },
  sort(rng){
    const metric = pick(rng, ["lat","pop","area"]);
    const ok = (a, b) => metric === "lat" ? Math.abs(a.lat - b.lat) >= 2 : Math.max(a[metric], b[metric]) / Math.min(a[metric], b[metric]) >= 1.35;
    const pool = COUNTRIES.filter(c => (metric === "lat" ? c.cap : c[metric]) && c[metric] !== null);
    let chosen = [];
    for (let tries = 0; tries < 400 && chosen.length < 4; tries++) {
      if (tries % 60 === 0) chosen = [];
      const c = pick(rng, pool);
      if (!chosen.includes(c) && chosen.every(x => ok(x, c))) chosen.push(c);
    }
    const order = chosen.slice().sort((a,b) => b[metric] - a[metric]);
    const text = {lat:["Ordne die Hauptstädte von Nord nach Süd.","Ganz oben: die nördlichste"], pop:["Ordne nach Einwohnern – die meisten zuerst.","Tippe die Länder der Reihe nach an"], area:["Ordne nach Fläche – das größte Land zuerst.","Tippe die Länder der Reihe nach an"]}[metric];
    return {type:"sort", kind:["📊","Rangliste"], prompt:text[0], sub:text[1], metric, items:shuffle(rng, chosen), order};
  },
  estimate(rng, ctx){
    const [a, la, loa, b, lb, lob] = cycle("distance", DISTANCES, rng, ctx);
    const d = km([loa, la], [lob, lb]);
    return {type:"estimate", kind:["📏","Schätzen"], prompt:`Wie weit ist es von ${a} nach ${b}?`, sub:"Luftlinie in Kilometern", A:{name:a, lat:la, lon:loa}, B:{name:b, lat:lb, lon:lob}, d};
  },
  detective(rng, ctx){
    const r = cycle("detective", DETECTIVE, rng, ctx);
    return {type:"detective", kind:["🔍","Detektiv"], prompt:"Welches Land wird gesucht?", r, opts:shuffle(rng, r.opts)};
  }
};

function buildPuzzle(seed, ctx){
  const rng = makeRng("orbis|" + seed);
  const plan = ["map","flag","compass","capital","outline", rng() < 0.5 ? "outlier" : "trivia","higher","sort","estimate","detective"];
  return plan.map((t, i) => GEN[t](makeRng("orbis|" + seed + "|" + i + "|" + t), ctx));
}
const dailyCtx = () => ({daily:true, n:puzzleNo()});

/* ---------- Spielzustand ---------- */
const S = {mode:"daily", seed:null, qs:[], i:0, results:[], total:0, busy:false};
const app = document.getElementById("app");
const sheet = document.getElementById("sheet");

function grade(p){ return p >= 800 ? "ok" : p >= 300 ? "mid" : "bad"; }
const GRADE_WORD = {ok:"Volltreffer", mid:"Knapp", bad:"Daneben"};
const GRADE_EMOJI = {ok:"🟩", mid:"🟨", bad:"🟥"};

function header(){
  const segs = Array.from({length:ROUNDS}, (_, k) => {
    const r = S.results[k];
    return `<span class="${r ? grade(r.points) : k === S.i ? "now" : ""}"></span>`;
  }).join("");
  return `<div class="top">
    <button class="iconbtn" id="quit" aria-label="Zurück zum Start" title="Zurück zum Start">${ICON_X}</button>
    <div class="progress" aria-label="Frage ${S.i+1} von ${ROUNDS}">${segs}</div>
    <div class="score mono" id="score">${fmt(S.total)}</div>
  </div>`;
}
const ICON_X = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
function kindLine(q){ return `<div class="kind">${esc(q.kind[1])} · Frage ${S.i+1} von ${ROUNDS}</div>`; }

function startGame(mode){
  S.mode = mode;
  S.seed = mode === "daily" ? dayKey() : "frei-" + Date.now();
  S.qs = buildPuzzle(S.seed, mode === "daily" ? dailyCtx() : {daily:false});
  S.left = false;
  Track.event(mode === "daily" ? "tagesraetsel-start" : "uebung-start");
  S.i = 0; S.results = []; S.total = 0;
  showQuestion();
}

function showQuestion(){
  hideSheet();
  S.busy = false;
  const q = S.qs[S.i];
  app.className = "app" + (q.type === "map" ? " wide" : "");
  app.innerHTML = header() + `<div class="fade">${kindLine(q)}<h2 class="prompt">${esc(q.prompt)}</h2>${q.sub ? `<p class="sub">${esc(q.sub)}</p>` : ""}<div id="body"></div></div>`;
  document.getElementById("quit").onclick = () => { if (confirm("Rätsel abbrechen? Dein Fortschritt in dieser Runde geht verloren.")) { Track.event("abbruch-frage-" + (S.i + 1)); S.left = true; renderHome(); } };
  RENDER[q.type](q, document.getElementById("body"));
  window.scrollTo({top:0});
}

function finish(points, title, text, extra){
  if (S.busy) return; S.busy = true;
  points = Math.max(0, Math.min(1000, Math.round(points)));
  S.results[S.i] = {points, type:S.qs[S.i].type, kind:S.qs[S.i].kind};
  const from = S.total; S.total += points; animateScore(from, S.total);
  const g = grade(points);
  sheet.className = "sheet " + g;
  sheet.innerHTML = `<div class="sheet-in">
      <div class="stamp ${g} land"><div><small>${GRADE_WORD[g]}</small><span>+${points}</span></div></div>
      <div class="msg"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ""}</div>
      <button class="btn block" id="next">${S.i + 1 < ROUNDS ? "Weiter" : "Ergebnis ansehen"}</button>
    </div>`;
  requestAnimationFrame(() => sheet.classList.add("show"));
  const progress = app.querySelectorAll(".progress span")[S.i]; if (progress) progress.className = g;
  const btn = document.getElementById("next");
  btn.onclick = next; setTimeout(() => btn.focus({preventScroll:true}), 300);
  if (extra) extra();
}
function next(){ S.i++; if (S.i < ROUNDS) showQuestion(); else endGame(); }
function hideSheet(){ sheet.classList.remove("show"); }
function animateScore(a, b){
  const el = document.getElementById("score"); if (!el) return;
  const t0 = performance.now(), dur = 600;
  const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && sheet.classList.contains("show")) { const b = document.getElementById("next"); if (b && document.activeElement !== b) { e.preventDefault(); b.click(); } }
});

/* Multiple-Choice-Helfer */
function choiceButtons(container, opts, render, isRight, onDone, cls = ""){
  container.innerHTML = `<div class="opts ${cls}">${opts.map((o, k) => `<button class="opt" data-k="${k}">${render(o)}</button>`).join("")}</div>`;
  const btns = [...container.querySelectorAll(".opt")];
  btns.forEach(b => b.onclick = () => {
    const chosen = opts[+b.dataset.k];
    btns.forEach((x, k) => { x.disabled = true; if (isRight(opts[k])) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); else x.classList.add("dim"); });
    onDone(chosen, isRight(chosen), btns);
  });
}

/* ---------- Darstellung je Fragetyp ---------- */
const RENDER = {
  map(q, body){
    body.innerHTML = `<div class="mapwrap live" id="mw"><svg id="map" role="img" aria-label="Karte von ${esc(CONT_NAME[q.region])}"></svg>
      <div class="maptools"><button id="zin" aria-label="Hineinzoomen">+</button><button id="zout" aria-label="Herauszoomen">−</button></div>
      <div class="maphint">Tippe auf das Land · Ziehen und Zoomen möglich</div></div>`;
    const svg = d3.select("#map"), node = svg.node();
    const w = node.clientWidth, h = node.clientHeight;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    const box = REGION[q.region];
    const proj = d3.geoMercator().fitExtent([[8,8],[w-8,h-8]], {type:"MultiPoint", coordinates:[box[0], [box[1][0], box[0][1]], box[1], [box[0][0], box[1][1]]]});
    const path = d3.geoPath(proj);
    const g = svg.append("g");
    g.selectAll("path").data(WORLD).join("path").attr("class","c").attr("d", path);
    const over = g.append("g");
    const zoom = d3.zoom().scaleExtent([1, 14]).translateExtent([[-w*0.5, -h*0.5],[w*1.5, h*1.5]])
      .on("zoom", e => { g.attr("transform", e.transform); over.selectAll(".pin").attr("r", 7 / e.transform.k).attr("stroke-width", 2.5 / e.transform.k); });
    svg.call(zoom).on("dblclick.zoom", null);
    document.getElementById("zin").onclick = e => { e.stopPropagation(); svg.transition().duration(250).call(zoom.scaleBy, 1.6); };
    document.getElementById("zout").onclick = e => { e.stopPropagation(); svg.transition().duration(250).call(zoom.scaleBy, 1/1.6); };
    const target = FEATURE[q.c.iso];
    svg.on("click", e => {
      if (S.busy) return;
      const [x, y] = d3.pointer(e, g.node());
      const p = proj.invert([x, y]);
      if (!p || isNaN(p[0])) return;
      document.getElementById("mw").classList.remove("live");
      const hit = d3.geoContains(target, p);
      const k = d3.zoomTransform(node).k;
      g.selectAll("path.c").filter(d => d === target).classed("ok", true).raise();
      let points, title, text;
      if (hit) {
        points = 1000; title = `Genau, das ist ${q.c.de}!`; text = q.c.cap ? `Hauptstadt: ${esc(q.c.cap)}.` : "";
      } else {
        const clicked = WORLD.find(f => d3.geoContains(f, p));
        if (clicked) g.selectAll("path.c").filter(d => d === clicked).classed("bad", true);
        const near = nearestPoint(mainland(target, q.c.iso), p);
        const dist = Math.round(near.km);
        points = dist < 60 ? 750 : 700 * Math.exp(-dist / 600);
        const [ar, word] = arrow(p, near.pt);
        const clickedName = clicked ? (COUNTRIES.find(c => FEATURE[c.iso] === clicked) || {}).de : null;
        title = `${fmt(dist)} km daneben`;
        text = `${clickedName ? `Du hast ${esc(clickedName)} getroffen. ` : ""}${esc(q.c.de)} liegt ${word} davon ${ar}`;
        over.append("path").attr("class","line").attr("d", path({type:"LineString", coordinates:[p, near.pt]}));
      }
      over.append("circle").attr("class","pin").attr("cx", x).attr("cy", y).attr("r", 7 / k).style("fill","var(--pin)").style("stroke","var(--card)").attr("stroke-width", 2.5 / k);
      finish(points, title, text);
    });
  },

  flag(q, body){
    body.innerHTML = `<div class="hero"><img class="flag" src="${FLAGS[q.iso]}" alt="Gesuchte Flagge"></div><div id="ch"></div>`;
    choiceButtons(document.getElementById("ch"), q.opts, i => `<span>${esc(FLAG_NAMES[i])}</span>`, i => i === q.iso, (chosen, ok, btns) => {
      btns.forEach((b, k) => b.insertAdjacentHTML("afterbegin", `<img src="${FLAGS[q.opts[k]]}" alt="">`));
      finish(ok ? 1000 : 0, ok ? "Richtig erkannt!" : `Das war ${FLAG_NAMES[q.iso]}.`, ok ? "" : `Daneben siehst du jetzt alle vier Flaggen zum Vergleich.`);
    }, "grid");
  },

  compass(q, body){
    const coord = p => q.dir === "N" || q.dir === "S" ? fmtDeg(p.lat, "N", "S") : fmtDeg(p.lon, "O", "W");
    body.innerHTML = `<div class="versus" id="vs"></div>`;
    const vs = document.getElementById("vs");
    vs.innerHTML = `<button class="opt big" data-k="0">${esc(q.places[0].name)}</button><span class="or">oder</span><button class="opt big" data-k="1">${esc(q.places[1].name)}</button>`;
    const btns = [...vs.querySelectorAll(".opt")];
    btns.forEach(b => b.onclick = () => {
      const chosen = q.places[+b.dataset.k];
      btns.forEach((x, k) => { x.disabled = true; x.classList.add(q.places[k].name === q.ans ? "right" : x === b ? "wrong" : "dim"); x.insertAdjacentHTML("beforeend", `<span class="meta">${coord(q.places[k])}</span>`); });
      const ok = chosen.name === q.ans;
      finish(ok ? 1000 : 0, ok ? "Stimmt!" : `Es ist ${q.ans}.`, esc(q.why));
    });
  },

  capital(q, body){
    choiceButtons(body, q.opts, o => esc(o), o => o === q.ans, (chosen, ok) => {
      const trap = !ok && CAPITAL_TRAPS[q.c.iso] && CAPITAL_TRAPS[q.c.iso].includes(chosen);
      finish(ok ? 1000 : 0, ok ? "Richtig!" : `Die Hauptstadt ist ${q.ans}.`,
        ok ? `${esc(q.ans)} ist die Hauptstadt von ${esc(q.c.de)}.` : trap ? `${esc(chosen)} ist bekannt, aber nicht die Hauptstadt – eine klassische Falle.` : "");
    }, "grid");
  },

  outline(q, body){
    const f = mainland(FEATURE[q.c.iso], q.c.iso);
    const ctr = d3.geoCentroid(f);
    const proj = d3.geoAzimuthalEqualArea().rotate([-ctr[0], -ctr[1]]).fitSize([300, 260], f);
    body.innerHTML = `<div class="hero"><svg viewBox="0 0 300 260" role="img" aria-label="Umriss des gesuchten Landes"><path d="${d3.geoPath(proj)(f)}"></path></svg></div><div id="ch"></div>`;
    choiceButtons(document.getElementById("ch"), q.opts, o => esc(o.de), o => o === q.c, (chosen, ok) => {
      finish(ok ? 1000 : 0, ok ? `Ja, das ist ${q.c.de}!` : `Das war ${q.c.de}.`, `${esc(q.c.de)} liegt in ${esc(CONT_NAME[q.c.cont])}${q.c.area ? ` und ist ${fmtArea(q.c.area)} groß` : ""}.`);
    }, "grid");
  },

  choice(q, body){
    choiceButtons(body, q.opts, o => esc(o), o => o === q.ans, (chosen, ok) => {
      finish(ok ? 1000 : 0, ok ? "Richtig!" : `Richtig wäre: ${q.ans}.`, esc(q.why));
    });
  },

  higher(q, body){
    const val = c => q.metric === "pop" ? fmtPop(c.pop) : fmtArea(c.area);
    body.innerHTML = `<div class="versus" id="vs">
      <button class="opt big" data-k="0"><img src="${FLAGS[q.pair[0].iso]}" alt=""><span>${esc(q.pair[0].de)}</span></button>
      <span class="or">oder</span>
      <button class="opt big" data-k="1"><img src="${FLAGS[q.pair[1].iso]}" alt=""><span>${esc(q.pair[1].de)}</span></button></div>`;
    const btns = [...body.querySelectorAll(".opt")];
    btns.forEach(b => b.onclick = () => {
      const chosen = q.pair[+b.dataset.k];
      btns.forEach((x, k) => { x.disabled = true; x.classList.add(q.pair[k] === q.ans ? "right" : x === b ? "wrong" : "dim"); x.insertAdjacentHTML("beforeend", `<span class="meta">${val(q.pair[k])}</span>`); });
      const ok = chosen === q.ans;
      finish(ok ? 1000 : 0, ok ? "Gut eingeschätzt!" : "Überraschung!", esc(q.why));
    });
  },

  sort(q, body){
    const label = c => q.metric === "lat" ? `${esc(c.cap)} <span class="meta">${esc(c.de)}</span>` : esc(c.de);
    const value = c => q.metric === "lat" ? fmtDeg(c.lat, "N", "S") : q.metric === "pop" ? fmtPop(c.pop) : fmtArea(c.area);
    const picked = [];
    body.innerHTML = `<div class="rank"><div class="opts" id="list"></div></div><div class="below"><button class="btn block" id="check" disabled>Reihenfolge prüfen</button></div>`;
    const list = document.getElementById("list"), check = document.getElementById("check");
    const draw = (done) => {
      list.innerHTML = q.items.map((c, k) => {
        const pos = picked.indexOf(c);
        let cls = pos >= 0 ? "set" : "";
        if (done) cls += q.order[pos] === c ? " right" : " wrong";
        return `<button class="opt ${cls}" data-k="${k}" ${done ? "disabled" : ""}><span class="num">${pos >= 0 ? pos + 1 : ""}</span><span>${label(c)}</span>${done ? `<span class="meta">${value(c)}</span>` : ""}</button>`;
      }).join("");
      list.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const c = q.items[+b.dataset.k], pos = picked.indexOf(c);
        if (pos >= 0) picked.splice(pos); else picked.push(c);
        draw(false); check.disabled = picked.length < 4;
      });
    };
    draw(false);
    check.onclick = () => {
      check.style.display = "none";
      draw(true);
      const right = picked.filter((c, k) => q.order[k] === c).length;
      const correct = q.order.map(c => q.metric === "lat" ? c.cap : c.de).join(", ");
      finish(right * 250, right === 4 ? "Perfekt sortiert!" : `${right} von 4 an der richtigen Stelle`, right === 4 ? "" : `Richtig: ${esc(correct)}.`);
    };
  },

  estimate(q, body){
    const MAXK = 20000, toKm = v => Math.max(50, Math.round(MAXK * Math.pow(v / 1000, 2) / 50) * 50);
    body.innerHTML = `<div class="est"><div class="val" id="val">5.000 km</div>
      <input type="range" id="rng" min="0" max="1000" value="500" aria-label="Entfernung in Kilometern">
      <div class="scale"><span>50 km</span><span>20.000 km</span></div>
      <div id="mapslot"></div></div>
      <div class="below"><button class="btn block" id="lock">Schätzung abgeben</button></div>`;
    const rng = document.getElementById("rng"), val = document.getElementById("val");
    const upd = () => val.textContent = fmt(toKm(+rng.value)) + " km";
    rng.oninput = upd; upd();
    document.getElementById("lock").onclick = () => {
      const guess = toKm(+rng.value), real = Math.round(q.d / 10) * 10;
      rng.disabled = true; document.getElementById("lock").style.display = "none";
      const ratio = Math.abs(Math.log(guess / q.d));
      const points = 1000 * Math.max(0, 1 - ratio / Math.log(2.5));
      val.innerHTML = `${fmt(real)} km<small>Deine Schätzung: ${fmt(guess)} km</small>`;
      document.getElementById("mapslot").innerHTML = miniMap(q.A, q.B);
      const pct = Math.round(Math.abs(guess - q.d) / q.d * 100);
      finish(points, pct <= 5 ? "Wahnsinn, fast exakt!" : `${pct} % ${guess > q.d ? "zu viel" : "zu wenig"}`, `Von ${esc(q.A.name)} nach ${esc(q.B.name)} sind es rund ${fmt(real)} km Luftlinie.`);
    };
  },

  detective(q, body){
    let shown = 1;
    const worth = [1000, 650, 350];
    body.innerHTML = `<div class="clues" id="clues"></div><div class="cluebar"><span class="worth" id="worth"></span><button class="btn ghost" id="more">Nächster Hinweis</button></div><div id="ch"></div>`;
    const drawClues = () => {
      document.getElementById("clues").innerHTML = q.r.clues.map((t, k) => k < shown
        ? `<div class="clue fade"><b>${k+1}</b><span>${esc(t)}</span></div>`
        : `<div class="clue locked"><b>${k+1}</b><span>Hinweis ${k+1} ist noch verdeckt</span></div>`).join("");
      document.getElementById("worth").textContent = `Jetzt raten bringt ${fmt(worth[shown-1])} Punkte`;
      document.getElementById("more").style.display = shown < 3 ? "" : "none";
    };
    drawClues();
    document.getElementById("more").onclick = () => { if (shown < 3) { shown++; drawClues(); } };
    choiceButtons(document.getElementById("ch"), q.opts, o => esc(o), o => o === q.r.a, (chosen, ok) => {
      const used = shown;
      document.getElementById("more").style.display = "none";
      shown = 3; drawClues();
      document.getElementById("worth").textContent = "";
      finish(ok ? worth[used - 1] : 0, ok ? `Fall gelöst: ${q.r.a}!` : `Gesucht war ${q.r.a}.`,
        ok ? `Mit ${used} von 3 Hinweisen gelöst.` : "Oben siehst du jetzt alle drei Hinweise.");
    }, "grid");
  }
};

function miniMap(A, B){
  const w = 600, h = 310;
  const proj = d3.geoNaturalEarth1().fitExtent([[4,4],[w-4,h-4]], {type:"Sphere"});
  const path = d3.geoPath(proj);
  const land = WORLD.map(f => `<path class="c" d="${path(f)}"></path>`).join("");
  const arc = path({type:"LineString", coordinates:[[A.lon, A.lat],[B.lon, B.lat]]});
  const pa = proj([A.lon, A.lat]), pb = proj([B.lon, B.lat]);
  const lbl = (p, name) => `<text x="${p[0]}" y="${p[1] - 9}" text-anchor="${p[0] > w - 80 ? "end" : p[0] < 80 ? "start" : "middle"}">${esc(name)}</text>`;
  return `<svg class="mini" viewBox="0 0 ${w} ${h}" role="img" aria-label="Weltkarte mit der Strecke"><path class="sea" d="${path({type:"Sphere"})}"></path>${land}<path class="arc" d="${arc}"></path>
    <circle class="dot" cx="${pa[0]}" cy="${pa[1]}" r="5"></circle><circle class="dot" cx="${pb[0]}" cy="${pb[1]}" r="5"></circle>${lbl(pa, A.name)}${lbl(pb, B.name)}</svg>`;
}

/* ---------- Ende, Teilen, Statistik ---------- */
function endGame(){
  hideSheet();
  const grid = S.results.map(r => GRADE_EMOJI[grade(r.points)]).join("");
  if (S.mode === "daily") {
    const key = dayKey();
    save("day:" + key, {score:S.total, grid, results:S.results});
    const st = load("stats", {played:0, best:0, streak:0, last:null});
    const yesterday = dayKey(new Date(Date.now() - 864e5));
    if (st.last !== key) { st.streak = st.last === yesterday ? st.streak + 1 : 1; st.played++; st.last = key; }
    st.best = Math.max(st.best, S.total);
    save("stats", st);
    Track.event("tagesraetsel-fertig");
    Track.event("punkte-" + Math.min(9, Math.floor(S.total / 1000)) * 1000);
  } else Track.event("uebung-fertig");
  S.left = true;
  renderResult({score:S.total, grid, results:S.results}, S.mode);
}

function shareText(res){
  return `Orbis #${puzzleNo()} 🌍 ${fmt(res.score)}/10.000\n${res.grid}`;
}

function renderResult(res, mode){
  app.className = "app";
  const st = load("stats", {played:0, best:0, streak:0});
  const verdict = res.score >= 9000 ? "Weltklasse!" : res.score >= 7500 ? "Starke Reise!" : res.score >= 5000 ? "Solide Runde." : "Morgen wird besser.";
  const cells = res.results.map((r, k) => { const g = grade(r.points); return `<div class="cell"><div class="stamp ${g}" data-k="${k}" title="${esc(r.kind[1])}"><span>${k + 1}</span></div>${fmt(r.points)}</div>`; }).join("");
  app.innerHTML = `<div class="fade">
    <div class="top"><button class="iconbtn" id="home" aria-label="Zum Start">${ICON_X}</button><div class="grow"></div></div>
    <h1 class="res-title">${mode === "daily" ? `Tagesrätsel #${puzzleNo()}` : "Übungsrunde"}</h1>
    <div class="passport">
      <h2>${verdict}</h2>
      <div class="total">${fmt(res.score)}<small> / 10.000</small></div>
      <div class="stamps">${cells}</div>
    </div>
    ${mode === "daily" ? `<div class="actions">
      <button class="btn" id="share">Ergebnis teilen</button>
      <textarea class="sharebox" id="sharebox" rows="2" readonly hidden>${esc(shareText(res))}</textarea>
      <button class="btn ghost" id="practice">Übungsrunde spielen</button>
    </div>
    <div class="stats"><div><b>${st.streak}</b>Tage in Folge</div><div><b>${fmt(st.best)}</b>Bestwert</div><div><b>${st.played}</b>Gespielt</div></div>
    <p class="next-in">Nächstes Tagesrätsel in <b id="cd"></b></p>`
    : `<div class="actions"><button class="btn" id="practice">Noch eine Übungsrunde</button><button class="btn ghost" id="home2">Zum Start</button></div>`}
    ${legalLinks()}
  </div>`;
  app.querySelectorAll(".stamps .stamp").forEach(el => el.style.animationDelay = (+el.dataset.k * 60) + "ms");
  document.getElementById("home").onclick = renderHome;
  const h2 = document.getElementById("home2"); if (h2) h2.onclick = renderHome;
  document.getElementById("practice").onclick = () => startGame("practice");
  const sh = document.getElementById("share");
  if (sh) sh.onclick = () => share(shareText(res));
  countdown();
}

async function share(text){
  Track.event("geteilt");
  try {
    if (navigator.share && matchMedia("(pointer:coarse)").matches) { await navigator.share({text}); return; }
    await navigator.clipboard.writeText(text); toast("Ergebnis kopiert – jetzt einfügen und teilen");
  } catch(e) {
    const box = document.getElementById("sharebox");
    if (box) { box.hidden = false; box.focus(); box.select(); try { document.execCommand("copy"); toast("Ergebnis kopiert"); } catch(_){ toast("Text markiert – bitte kopieren"); } }
  }
}
function toast(t){ const el = document.getElementById("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2200); }
let cdTimer;
function countdown(){
  clearInterval(cdTimer);
  const tick = () => {
    const el = document.getElementById("cd"); if (!el) return clearInterval(cdTimer);
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((mid - now) / 1000));
    el.textContent = `${Math.floor(s/3600)} h ${String(Math.floor(s%3600/60)).padStart(2,"0")} min`;
    if (s === 0) renderHome();
  };
  tick(); cdTimer = setInterval(tick, 20000);
}

/* ---------- Startseite ---------- */
function renderHome(){
  hideSheet();
  app.className = "app";
  const today = load("day:" + dayKey(), null);
  const st = load("stats", {played:0, best:0, streak:0, last:null});
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  const streak = (st.last === dayKey() || st.last === yesterday) ? st.streak : 0;
  const dateStr = new Date().toLocaleDateString("de-DE", {weekday:"long", day:"numeric", month:"long"});
  app.innerHTML = `<div class="intro fade">
    ${globeSvg()}
    <h1>Orbis</h1>
    <div class="no">Tagesrätsel #${puzzleNo()} · ${esc(dateStr)}</div>
    <p>Zehn Fragen rund um die Welt, jeden Tag neu und für alle gleich. Bis zu 1.000 Punkte pro Frage.</p>
    <div class="actions">
      ${today ? `<button class="btn" id="seeres">Heutiges Ergebnis ansehen</button><button class="btn ghost" id="practice">Übungsrunde spielen</button>`
              : `<button class="btn" id="play">Rätsel starten</button><button class="linkbtn" id="practice">Erst eine Übungsrunde spielen</button>`}
    </div>
    <div class="stats"><div><b>${streak}</b>Tage in Folge</div><div><b>${fmt(st.best)}</b>Bestwert</div><div><b>${st.played}</b>Gespielt</div></div>
    ${legalLinks()}
  </div>`;
  const play = document.getElementById("play"); if (play) play.onclick = () => startGame("daily");
  const seer = document.getElementById("seeres"); if (seer) seer.onclick = () => renderResult(today, "daily");
  document.getElementById("practice").onclick = () => startGame("practice");
}

function legalLinks(){
  return `<nav class="legal" aria-label="Rechtliches"><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></nav>`;
}

function globeSvg(){
  const proj = d3.geoOrthographic().rotate([-12, -35]).fitSize([120,120], {type:"Sphere"});
  const path = d3.geoPath(proj);
  const grat = path(d3.geoGraticule10());
  const land = WORLD.map(f => path(f)).filter(Boolean).join("");
  return `<svg class="globe" viewBox="0 0 120 120" aria-hidden="true"><path class="g-sea" d="${path({type:"Sphere"})}"></path><path class="g-grat" d="${grat}"></path><path class="g-land" d="${land}"></path></svg>`;
}

/* ---------- Start ---------- */
async function boot(){
  app.innerHTML = `<div class="loading">Die Welt wird geladen …</div>`;
  try {
    if (!window.d3 || !window.topojson) throw new Error("Bibliotheken fehlen");
    const [topo, flags] = await Promise.all([
      fetch("data/countries-50m.json").then(r => { if (!r.ok) throw new Error("Karte"); return r.json(); }),
      fetch("data/flags.json").then(r => { if (!r.ok) throw new Error("Flaggen"); return r.json(); })
    ]);
    TOPO = topo; FLAGS = flags;
    initGeo();
    trackVisit();
    Track.page();
    renderHome();
  } catch(e) {
    console.error(e);
    app.innerHTML = `<div class="err"><h2>Die Karte konnte nicht geladen werden</h2><p>Prüfe deine Internetverbindung und lade die Seite neu.</p></div>`;
  }
}
boot();
