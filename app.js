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
const fmt = n => n.toLocaleString(LOCALE());
const km = (a, b) => d3.geoDistance(a, b) * EARTH;
function fmtPop(m){ return m >= 1 ? fmt(Math.round(m*10)/10) + L(" Mio.", " million") : fmt(Math.round(m*1000) * (LANG === "en" ? 1000 : 1)) + L(" Tsd.", ""); }
const fmtArea = a => fmt(a) + " km²";
const fmtDeg = (v, pos, neg) => fmt(Math.abs(Math.round(v*100)/100)) + "° " + (v >= 0 ? pos : neg);

function dayKey(d = new Date()){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function puzzleNo(d = new Date()){ const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((a - LAUNCH) / 864e5) + 1; }

function load(k, fallback){ try { const v = localStorage.getItem(STORE + k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
function save(k, v){ try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch(e){} }

/* ---------- Sprache: Deutsch oder Englisch ---------- */
// Fehlt data_en.js (z. B. nicht hochgeladen oder alte Version im Zwischenspeicher), läuft das Spiel trotzdem auf Deutsch.
const EN = {
  term: typeof TERM_EN !== "undefined" ? TERM_EN : null,
  compass: typeof COMPASS_EN !== "undefined" ? COMPASS_EN : [],
  higher: typeof HIGHER_EN !== "undefined" ? HIGHER_EN : [],
  outliers: typeof OUTLIERS_EN !== "undefined" ? OUTLIERS_EN : [],
  trivia: typeof TRIVIA_EN !== "undefined" ? TRIVIA_EN : [],
  detective: typeof DETECTIVE_EN !== "undefined" ? DETECTIVE_EN : []
};
let LANG = (() => {
  if (!EN.term) return "de";
  try { const q = new URLSearchParams(location.search).get("lang"); if (q === "de" || q === "en") { save("lang", q); return q; } } catch(e){}
  const stored = load("lang", null); if (stored === "de" || stored === "en") return stored;
  const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
  return String(prefs[0] || "en").toLowerCase().startsWith("de") ? "de" : "en";
})();
const L = (de, en) => LANG === "en" ? en : de;          // Text in beiden Sprachen
const N = s => (LANG === "en" && EN.term && EN.term[s]) ? EN.term[s] : s;   // Namen und Begriffe
const LOCALE = () => LANG === "en" ? "en-US" : "de-DE";
const CONT_EN = {EU:"Europe", AS:"Asia", AF:"Africa", NA:"North and Central America", SA:"South America", OC:"Oceania"};
const contName = c => LANG === "en" ? CONT_EN[c] : CONT_NAME[c];
function applyLang(){
  document.documentElement.lang = LANG;
  document.title = L("Orbis – das tägliche Geografie-Rätsel", "Orbis – the daily geography puzzle");
}
function setLang(l){
  if (l === LANG || !EN.term) return;
  LANG = l; save("lang", l); applyLang();
  Track.event("sprache-gewechselt-" + l);
  renderHome();
}

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
  if (!first) { save("first", today); Track.event("besuch-neu"); Track.event("neu-sprache-" + LANG); }
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
  const words = LANG === "en" ? ["north","northeast","east","southeast","south","southwest","west","northwest"] : ["nördlich","nordöstlich","östlich","südöstlich","südlich","südwestlich","westlich","nordwestlich"];
  const r = [["↑",words[0]],["↗",words[1]],["→",words[2]],["↘",words[3]],["↓",words[4]],["↙",words[5]],["←",words[6]],["↖",words[7]]][Math.round(b/45) % 8];
  return [r[0] + "\uFE0E", r[1]];
}

/* ---------- Fragen-Generatoren ---------- */
const MAP_POOL = () => COUNTRIES.filter(c => c.area && c.area >= 25000 && FEATURE[c.iso]);
const OUTLINE_POOL = ["it","de","at","ch","es","pt","gb","ie","pl","cz","sk","hu","hr","gr","ro","ua","tr","jp","kr","in","th","vn","mn","kz","ir","sa","eg","ng","ke","et","za","mg","au","nz","br","ar","cl","pe","co","mx","cu","is","fi","se","ph","id","bo","dk","ba","by","pg","ve","ly","dz","cd","ao"];

const GEN = {
  map(rng){
    const c = pick(rng, MAP_POOL());
    return {type:"map", kind:["🗺️",L("Karte","Map")], prompt:L(`Wo liegt ${c.de}?`, `Where is ${N(c.de)}?`), c, region:c.cont};
  },
  flag(rng, ctx){
    const group = cycle("flag", FLAG_GROUPS, rng, ctx).filter(i => FLAGS[i]);
    const iso = pick(rng, group);
    let opts = group.filter(i => i !== iso).slice(0, 3);
    while (opts.length < 3) { const r = pick(rng, Object.keys(FLAG_NAMES)); if (r !== iso && !opts.includes(r) && FLAGS[r]) opts.push(r); }
    return {type:"flag", kind:["🏳️",L("Flagge","Flag")], prompt:L("Zu welchem Land gehört diese Flagge?", "Which country does this flag belong to?"), iso, opts:shuffle(rng, [iso, ...opts])};
  },
  compass(rng, ctx){
    const item = cycle("compass", COMPASS, rng, ctx);
    const [dir, a, la, loa, b, lb, lob] = item;
    const why = L(item[7], EN.compass[COMPASS.indexOf(item)]);
    const word = LANG === "en" ? {N:"further north", S:"further south", E:"further east", W:"further west"}[dir] : {N:"nördlicher", S:"südlicher", E:"östlicher", W:"westlicher"}[dir];
    const A = {name:a, lat:la, lon:loa}, B = {name:b, lat:lb, lon:lob};
    const val = p => dir === "N" ? p.lat : dir === "S" ? -p.lat : dir === "E" ? p.lon : -p.lon;
    const ans = val(A) > val(B) ? a : b;
    const flip = rng() < 0.5;
    return {type:"compass", kind:["🧭",L("Kompass","Compass")], prompt:L(`Was liegt ${word}?`, `Which is ${word}?`), dir, places: flip ? [B, A] : [A, B], ans, why};
  },
  capital(rng){
    const trapIsos = Object.keys(CAPITAL_TRAPS).filter(i => BY_ISO[i] && BY_ISO[i].cap);
    const c = rng() < 0.75 ? BY_ISO[pick(rng, trapIsos)] : pick(rng, COUNTRIES.filter(x => x.cap));
    let wrong = CAPITAL_TRAPS[c.iso] ? CAPITAL_TRAPS[c.iso].slice() : sample(rng, COUNTRIES.filter(x => x.cont === c.cont && x.cap && x !== c), 3).map(x => x.cap);
    return {type:"capital", kind:["🏛️",L("Hauptstadt","Capital")], prompt:L(`Was ist die Hauptstadt von ${c.de}?`, `What is the capital of ${N(c.de)}?`), c, opts:shuffle(rng, [c.cap, ...wrong]), ans:c.cap};
  },
  outline(rng){
    const iso = pick(rng, OUTLINE_POOL.filter(i => FEATURE[i]));
    const c = BY_ISO[iso];
    const byDist = COUNTRIES.filter(x => x !== c).sort((a,b) => km([c.lon,c.lat],[a.lon,a.lat]) - km([c.lon,c.lat],[b.lon,b.lat]));
    const same = byDist.filter(x => x.cont === c.cont);
    const near = same.length >= 4 ? same.slice(0, 7) : [...same, ...byDist.filter(x => !same.includes(x))].slice(0, 5);
    const wrong = sample(rng, near, 3);
    return {type:"outline", kind:["✏️",L("Umriss","Outline")], prompt:L("Welches Land hat diese Form?", "Which country has this shape?"), c, opts:shuffle(rng, [c, ...wrong])};
  },
  outlier(rng, ctx){
    const item = cycle("outlier", OUTLIERS, rng, ctx);
    const [q, a, others, why] = item, en = (EN.outliers[OUTLIERS.indexOf(item)] || []);
    return {type:"choice", kind:["🚧",L("Nachbarn","Neighbors")], prompt:L(q, en[0]), opts:shuffle(rng, [a, ...others]), ans:a, why:L(why, en[1])};
  },
  trivia(rng, ctx){
    const item = cycle("trivia", TRIVIA, rng, ctx);
    const [q, a, others, why] = item, en = (EN.trivia[TRIVIA.indexOf(item)] || []);
    return {type:"choice", kind:["💡",L("Wissen","Trivia")], prompt:L(q, en[0]), opts:shuffle(rng, [a, ...others]), ans:a, why:L(why, en[1])};
  },
  higher(rng, ctx){
    const item = cycle("higher", HIGHER, rng, ctx);
    const [metric, i1, i2] = item, why = L(item[3], EN.higher[HIGHER.indexOf(item)]);
    const pair = rng() < 0.5 ? [BY_ISO[i1], BY_ISO[i2]] : [BY_ISO[i2], BY_ISO[i1]];
    const ans = pair[0][metric] > pair[1][metric] ? pair[0] : pair[1];
    return {type:"higher", kind:["⚖️",L("Höher oder tiefer","Higher or lower")], prompt: metric === "pop" ? L("Welches Land hat mehr Einwohner?", "Which country has more people?") : L("Welches Land ist größer?", "Which country is bigger?"), metric, pair, ans, why};
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
    const text = LANG === "en"
      ? {lat:["Sort the capitals from north to south.","Northernmost first"], pop:["Sort by population – most people first.","Tap the countries in order"], area:["Sort by area – biggest country first.","Tap the countries in order"]}[metric]
      : {lat:["Ordne die Hauptstädte von Nord nach Süd.","Ganz oben: die nördlichste"], pop:["Ordne nach Einwohnern – die meisten zuerst.","Tippe die Länder der Reihe nach an"], area:["Ordne nach Fläche – das größte Land zuerst.","Tippe die Länder der Reihe nach an"]}[metric];
    return {type:"sort", kind:["📊",L("Rangliste","Ranking")], prompt:text[0], sub:text[1], metric, items:shuffle(rng, chosen), order};
  },
  estimate(rng, ctx){
    const [a, la, loa, b, lb, lob] = cycle("distance", DISTANCES, rng, ctx);
    const d = km([loa, la], [lob, lb]);
    return {type:"estimate", kind:["📏",L("Schätzen","Estimate")], prompt:L(`Wie weit ist es von ${a} nach ${b}?`, `How far is it from ${N(a)} to ${N(b)}?`), sub:L("Luftlinie in Kilometern", "As the crow flies, in kilometers"), A:{name:N(a), lat:la, lon:loa}, B:{name:N(b), lat:lb, lon:lob}, d};
  },
  detective(rng, ctx){
    const r = cycle("detective", DETECTIVE, rng, ctx);
    const clues = L(r.clues, EN.detective[DETECTIVE.indexOf(r)]);
    return {type:"detective", kind:["🔍",L("Detektiv","Detective")], prompt:L("Welches Land wird gesucht?", "Which country are we looking for?"), r, clues, opts:shuffle(rng, r.opts)};
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
const GRADE_WORD_DE = {ok:"Volltreffer", mid:"Knapp", bad:"Daneben"}, GRADE_WORD_EN = {ok:"Spot on", mid:"Close", bad:"Missed"};
const gradeWord = g => (LANG === "en" ? GRADE_WORD_EN : GRADE_WORD_DE)[g];
const GRADE_EMOJI = {ok:"🟩", mid:"🟨", bad:"🟥"};

function header(){
  const segs = Array.from({length:ROUNDS}, (_, k) => {
    const r = S.results[k];
    return `<span class="${r ? grade(r.points) : k === S.i ? "now" : ""}"></span>`;
  }).join("");
  return `<div class="top">
    <button class="iconbtn" id="quit" aria-label="${L("Zurück zum Start","Back to start")}" title="${L("Zurück zum Start","Back to start")}">${ICON_X}</button>
    <div class="progress" aria-label="${L(`Frage ${S.i+1} von ${ROUNDS}`, `Question ${S.i+1} of ${ROUNDS}`)}">${segs}</div>
    <div class="score mono" id="score">${fmt(S.total)}</div>
  </div>`;
}
const ICON_X = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
function kindLine(q){ return `<div class="kind">${esc(q.kind[1])} · ${L(`Frage ${S.i+1} von ${ROUNDS}`, `Question ${S.i+1} of ${ROUNDS}`)}</div>`; }

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
  document.getElementById("quit").onclick = () => { if (confirm(L("Rätsel abbrechen? Dein Fortschritt in dieser Runde geht verloren.", "Quit this puzzle? Your progress in this round will be lost."))) { Track.event("abbruch-frage-" + (S.i + 1)); S.left = true; renderHome(); } };
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
      <div class="stamp ${g} land"><div><small>${gradeWord(g)}</small><span>+${points}</span></div></div>
      <div class="msg"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ""}</div>
      <button class="btn block" id="next">${S.i + 1 < ROUNDS ? L("Weiter", "Continue") : L("Ergebnis ansehen", "See results")}</button>
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
    body.innerHTML = `<div class="mapwrap live" id="mw"><svg id="map" role="img" aria-label="${L("Karte von", "Map of")} ${esc(contName(q.region))}"></svg>
      <div class="maptools"><button id="zin" aria-label="${L("Hineinzoomen","Zoom in")}">+</button><button id="zout" aria-label="${L("Herauszoomen","Zoom out")}">−</button></div>
      <div class="maphint">${L("Tippe auf das Land · Ziehen und Zoomen möglich", "Tap the country · drag and zoom to explore")}</div></div>`;
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
        points = 1000; title = L(`Genau, das ist ${q.c.de}!`, `Yes, that's ${N(q.c.de)}!`); text = q.c.cap ? `${L("Hauptstadt", "Capital")}: ${esc(N(q.c.cap))}.` : "";
      } else {
        const clicked = WORLD.find(f => d3.geoContains(f, p));
        if (clicked) g.selectAll("path.c").filter(d => d === clicked).classed("bad", true);
        const near = nearestPoint(mainland(target, q.c.iso), p);
        const dist = Math.round(near.km);
        points = dist < 60 ? 750 : 700 * Math.exp(-dist / 600);
        const [ar, word] = arrow(p, near.pt);
        const clickedName = clicked ? (COUNTRIES.find(c => FEATURE[c.iso] === clicked) || {}).de : null;
        title = L(`${fmt(dist)} km daneben`, `${fmt(dist)} km off`);
        text = L(`${clickedName ? `Du hast ${esc(clickedName)} getroffen. ` : ""}${esc(q.c.de)} liegt ${word} davon ${ar}`,
                 `${clickedName ? `You hit ${esc(N(clickedName))}. ` : ""}${esc(N(q.c.de))} lies to the ${word} ${ar}`);
        over.append("path").attr("class","line").attr("d", path({type:"LineString", coordinates:[p, near.pt]}));
      }
      over.append("circle").attr("class","pin").attr("cx", x).attr("cy", y).attr("r", 7 / k).style("fill","var(--pin)").style("stroke","var(--card)").attr("stroke-width", 2.5 / k);
      finish(points, title, text);
    });
  },

  flag(q, body){
    body.innerHTML = `<div class="hero"><img class="flag" src="${FLAGS[q.iso]}" alt="${L("Gesuchte Flagge","Mystery flag")}"></div><div id="ch"></div>`;
    choiceButtons(document.getElementById("ch"), q.opts, i => `<span>${esc(N(FLAG_NAMES[i]))}</span>`, i => i === q.iso, (chosen, ok, btns) => {
      btns.forEach((b, k) => b.insertAdjacentHTML("afterbegin", `<img src="${FLAGS[q.opts[k]]}" alt="">`));
      finish(ok ? 1000 : 0, ok ? L("Richtig erkannt!", "Correct!") : L(`Das war ${FLAG_NAMES[q.iso]}.`, `That was ${N(FLAG_NAMES[q.iso])}.`), ok ? "" : L("Daneben siehst du jetzt alle vier Flaggen zum Vergleich.", "All four flags are now shown side by side for comparison."));
    }, "grid");
  },

  compass(q, body){
    const coord = p => q.dir === "N" || q.dir === "S" ? fmtDeg(p.lat, "N", "S") : fmtDeg(p.lon, L("O", "E"), "W");
    body.innerHTML = `<div class="versus" id="vs"></div>`;
    const vs = document.getElementById("vs");
    vs.innerHTML = `<button class="opt big" data-k="0">${esc(N(q.places[0].name))}</button><span class="or">${L("oder","or")}</span><button class="opt big" data-k="1">${esc(N(q.places[1].name))}</button>`;
    const btns = [...vs.querySelectorAll(".opt")];
    btns.forEach(b => b.onclick = () => {
      const chosen = q.places[+b.dataset.k];
      btns.forEach((x, k) => { x.disabled = true; x.classList.add(q.places[k].name === q.ans ? "right" : x === b ? "wrong" : "dim"); x.insertAdjacentHTML("beforeend", `<span class="meta">${coord(q.places[k])}</span>`); });
      const ok = chosen.name === q.ans;
      finish(ok ? 1000 : 0, ok ? L("Stimmt!", "Correct!") : L(`Es ist ${q.ans}.`, `It's ${N(q.ans)}.`), esc(q.why));
    });
  },

  capital(q, body){
    choiceButtons(body, q.opts, o => esc(N(o)), o => o === q.ans, (chosen, ok) => {
      const trap = !ok && CAPITAL_TRAPS[q.c.iso] && CAPITAL_TRAPS[q.c.iso].includes(chosen);
      finish(ok ? 1000 : 0, ok ? L("Richtig!", "Correct!") : L(`Die Hauptstadt ist ${q.ans}.`, `The capital is ${N(q.ans)}.`),
        ok ? L(`${esc(q.ans)} ist die Hauptstadt von ${esc(q.c.de)}.`, `${esc(N(q.ans))} is the capital of ${esc(N(q.c.de))}.`)
           : trap ? L(`${esc(chosen)} ist bekannt, aber nicht die Hauptstadt – eine klassische Falle.`, `${esc(N(chosen))} is well known, but it's not the capital – a classic trap.`) : "");
    }, "grid");
  },

  outline(q, body){
    const f = mainland(FEATURE[q.c.iso], q.c.iso);
    const ctr = d3.geoCentroid(f);
    const proj = d3.geoAzimuthalEqualArea().rotate([-ctr[0], -ctr[1]]).fitSize([300, 260], f);
    body.innerHTML = `<div class="hero"><svg viewBox="0 0 300 260" role="img" aria-label="${L("Umriss des gesuchten Landes","Outline of the mystery country")}"><path d="${d3.geoPath(proj)(f)}"></path></svg></div><div id="ch"></div>`;
    choiceButtons(document.getElementById("ch"), q.opts, o => esc(N(o.de)), o => o === q.c, (chosen, ok) => {
      finish(ok ? 1000 : 0, ok ? L(`Ja, das ist ${q.c.de}!`, `Yes, that's ${N(q.c.de)}!`) : L(`Das war ${q.c.de}.`, `That was ${N(q.c.de)}.`),
        L(`${esc(q.c.de)} liegt in ${esc(contName(q.c.cont))}${q.c.area ? ` und ist ${fmtArea(q.c.area)} groß` : ""}.`,
          `${esc(N(q.c.de))} is in ${esc(contName(q.c.cont))}${q.c.area ? ` and covers ${fmtArea(q.c.area)}` : ""}.`));
    }, "grid");
  },

  choice(q, body){
    choiceButtons(body, q.opts, o => esc(N(o)), o => o === q.ans, (chosen, ok) => {
      finish(ok ? 1000 : 0, ok ? L("Richtig!", "Correct!") : L(`Richtig wäre: ${q.ans}.`, `The answer is ${N(q.ans)}.`), esc(q.why));
    });
  },

  higher(q, body){
    const val = c => q.metric === "pop" ? fmtPop(c.pop) : fmtArea(c.area);
    body.innerHTML = `<div class="versus" id="vs">
      <button class="opt big" data-k="0"><img src="${FLAGS[q.pair[0].iso]}" alt=""><span>${esc(N(q.pair[0].de))}</span></button>
      <span class="or">${L("oder","or")}</span>
      <button class="opt big" data-k="1"><img src="${FLAGS[q.pair[1].iso]}" alt=""><span>${esc(N(q.pair[1].de))}</span></button></div>`;
    const btns = [...body.querySelectorAll(".opt")];
    btns.forEach(b => b.onclick = () => {
      const chosen = q.pair[+b.dataset.k];
      btns.forEach((x, k) => { x.disabled = true; x.classList.add(q.pair[k] === q.ans ? "right" : x === b ? "wrong" : "dim"); x.insertAdjacentHTML("beforeend", `<span class="meta">${val(q.pair[k])}</span>`); });
      const ok = chosen === q.ans;
      finish(ok ? 1000 : 0, ok ? L("Gut eingeschätzt!", "Good call!") : L("Überraschung!", "Surprise!"), esc(q.why));
    });
  },

  sort(q, body){
    const label = c => q.metric === "lat" ? `${esc(N(c.cap))} <span class="meta">${esc(N(c.de))}</span>` : esc(N(c.de));
    const value = c => q.metric === "lat" ? fmtDeg(c.lat, "N", "S") : q.metric === "pop" ? fmtPop(c.pop) : fmtArea(c.area);
    const picked = [];
    body.innerHTML = `<div class="rank"><div class="opts" id="list"></div></div><div class="below"><button class="btn block" id="check" disabled>${L("Reihenfolge prüfen", "Check order")}</button></div>`;
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
      const correct = q.order.map(c => N(q.metric === "lat" ? c.cap : c.de)).join(", ");
      finish(right * 250, right === 4 ? L("Perfekt sortiert!", "Perfectly sorted!") : L(`${right} von 4 an der richtigen Stelle`, `${right} of 4 in the right place`), right === 4 ? "" : `${L("Richtig", "Correct order")}: ${esc(correct)}.`);
    };
  },

  estimate(q, body){
    const MAXK = 20000, toKm = v => Math.max(50, Math.round(MAXK * Math.pow(v / 1000, 2) / 50) * 50);
    body.innerHTML = `<div class="est"><div class="val" id="val">${fmt(5000)} km</div>
      <input type="range" id="rng" min="0" max="1000" value="500" aria-label="${L("Entfernung in Kilometern", "Distance in kilometers")}">
      <div class="scale"><span>50 km</span><span>${fmt(20000)} km</span></div>
      <div id="mapslot"></div></div>
      <div class="below"><button class="btn block" id="lock">${L("Schätzung abgeben", "Lock in guess")}</button></div>`;
    const rng = document.getElementById("rng"), val = document.getElementById("val");
    const upd = () => val.textContent = fmt(toKm(+rng.value)) + " km";
    rng.oninput = upd; upd();
    document.getElementById("lock").onclick = () => {
      const guess = toKm(+rng.value), real = Math.round(q.d / 10) * 10;
      rng.disabled = true; document.getElementById("lock").style.display = "none";
      const ratio = Math.abs(Math.log(guess / q.d));
      const points = 1000 * Math.max(0, 1 - ratio / Math.log(2.5));
      val.innerHTML = `${fmt(real)} km<small>${L("Deine Schätzung", "Your guess")}: ${fmt(guess)} km</small>`;
      document.getElementById("mapslot").innerHTML = miniMap(q.A, q.B);
      const pct = Math.round(Math.abs(guess - q.d) / q.d * 100);
      finish(points, pct <= 5 ? L("Wahnsinn, fast exakt!", "Wow, almost exact!") : L(`${pct} % ${guess > q.d ? "zu viel" : "zu wenig"}`, `${pct}% too ${guess > q.d ? "high" : "low"}`),
        L(`Von ${esc(q.A.name)} nach ${esc(q.B.name)} sind es rund ${fmt(real)} km Luftlinie.`, `${esc(q.A.name)} to ${esc(q.B.name)} is about ${fmt(real)} km as the crow flies.`));
    };
  },

  detective(q, body){
    let shown = 1;
    const worth = [1000, 650, 350];
    body.innerHTML = `<div class="clues" id="clues"></div><div class="cluebar"><span class="worth" id="worth"></span><button class="btn ghost" id="more">${L("Nächster Hinweis", "Next clue")}</button></div><div id="ch"></div>`;
    const drawClues = () => {
      document.getElementById("clues").innerHTML = q.clues.map((t, k) => k < shown
        ? `<div class="clue fade"><b>${k+1}</b><span>${esc(t)}</span></div>`
        : `<div class="clue locked"><b>${k+1}</b><span>${L(`Hinweis ${k+1} ist noch verdeckt`, `Clue ${k+1} is still hidden`)}</span></div>`).join("");
      document.getElementById("worth").textContent = L(`Jetzt raten bringt ${fmt(worth[shown-1])} Punkte`, `Guess now for ${fmt(worth[shown-1])} points`);
      document.getElementById("more").style.display = shown < 3 ? "" : "none";
    };
    drawClues();
    document.getElementById("more").onclick = () => { if (shown < 3) { shown++; drawClues(); } };
    choiceButtons(document.getElementById("ch"), q.opts, o => esc(N(o)), o => o === q.r.a, (chosen, ok) => {
      const used = shown;
      document.getElementById("more").style.display = "none";
      shown = 3; drawClues();
      document.getElementById("worth").textContent = "";
      finish(ok ? worth[used - 1] : 0, ok ? L(`Fall gelöst: ${q.r.a}!`, `Case solved: ${N(q.r.a)}!`) : L(`Gesucht war ${q.r.a}.`, `The answer was ${N(q.r.a)}.`),
        ok ? L(`Mit ${used} von 3 Hinweisen gelöst.`, `Solved with ${used} of 3 clues.`) : L("Oben siehst du jetzt alle drei Hinweise.", "All three clues are now shown above."));
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
  return `<svg class="mini" viewBox="0 0 ${w} ${h}" role="img" aria-label="${L("Weltkarte mit der Strecke", "World map showing the route")}"><path class="sea" d="${path({type:"Sphere"})}"></path>${land}<path class="arc" d="${arc}"></path>
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
    const ch = activeChallenge();
    if (ch) Track.event(S.total > ch.score ? "herausforderung-gewonnen" : "herausforderung-verloren");
  } else Track.event("uebung-fertig");
  S.left = true;
  renderResult({score:S.total, grid, results:S.results}, S.mode);
}

/* ---------- Herausforderung per Link ---------- */
const SITE = String((window.ORBIS_CONFIG && window.ORBIS_CONFIG.site) || location.host || "orbis-geo.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
let CHALLENGE = null;
function readChallenge(){
  try {
    const q = new URLSearchParams(location.search);
    const h = q.get("h"), n = q.get("n");
    if (h !== null || n !== null) {
      if (/^\d{1,5}$/.test(h || "") && /^\d{1,5}$/.test(n || "") && +h <= 10000 && +n >= 1 && +n <= puzzleNo()) {
        CHALLENGE = {score:+h, no:+n};
        save("challenge", CHALLENGE);
        Track.event("herausforderung-geoeffnet");
      }
      q.delete("h"); q.delete("n"); q.delete("lang");
      const rest = q.toString();
      history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash);
    } else {
      const c = load("challenge", null);
      if (c && Number.isInteger(c.score) && Number.isInteger(c.no)) CHALLENGE = c;
    }
  } catch(e){}
}
const activeChallenge = () => (CHALLENGE && CHALLENGE.no === puzzleNo()) ? CHALLENGE : null;
function duelHtml(mine, theirs){
  const won = mine > theirs, tie = mine === theirs, close = theirs - mine < 1000;
  const title = won ? L("Herausforderung gewonnen!", "Challenge won!") : tie ? L("Unentschieden!", "It's a tie!")
              : close ? L("Ganz knapp verloren!", "So close!") : L("Diesmal nicht – morgen wieder!", "Not this time – try again tomorrow!");
  return `<div class="duel ${won ? "won" : tie ? "tie" : "lost"}"><h3>${title}</h3>
    <div class="duel-row"><div><b>${fmt(mine)}</b>${L("Du", "You")}</div><span>${L("gegen", "vs.")}</span><div><b>${fmt(theirs)}</b>${L("Herausforderer", "Challenger")}</div></div></div>`;
}

function shareText(res){
  const no = puzzleNo();
  return L(`Orbis #${no} – ${fmt(res.score)} von ${fmt(10000)} Punkten\n${res.grid}\nKannst du mich schlagen? https://${SITE}/?h=${res.score}&n=${no}`,
           `Orbis #${no} – ${fmt(res.score)} of ${fmt(10000)} points\n${res.grid}\nCan you beat me? https://${SITE}/?h=${res.score}&n=${no}`);
}

function renderResult(res, mode){
  app.className = "app";
  const st = load("stats", {played:0, best:0, streak:0});
  const verdict = res.score >= 9000 ? L("Weltklasse!", "World class!") : res.score >= 7500 ? L("Starke Reise!", "Great journey!") : res.score >= 5000 ? L("Solide Runde.", "Solid round.") : L("Morgen wird besser.", "Tomorrow will be better.");
  const cells = res.results.map((r, k) => { const g = grade(r.points); return `<div class="cell"><div class="stamp ${g}" data-k="${k}" title="${esc(r.kind[1])}"><span>${k + 1}</span></div>${fmt(r.points)}</div>`; }).join("");
  app.innerHTML = `<div class="fade">
    <div class="top"><button class="iconbtn" id="home" aria-label="${L("Zum Start", "Back to start")}">${ICON_X}</button><div class="grow"></div></div>
    <h1 class="res-title">${mode === "daily" ? `${L("Tagesrätsel", "Daily puzzle")} #${puzzleNo()}` : L("Übungsrunde", "Practice round")}</h1>
    <div class="passport">
      <h2>${verdict}</h2>
      <div class="total">${fmt(res.score)}<small> / ${fmt(10000)}</small></div>
      <div class="stamps">${cells}</div>
    </div>
    ${mode === "daily" && activeChallenge() ? duelHtml(res.score, activeChallenge().score) : ""}
    ${mode === "daily" ? `<div class="actions">
      <button class="btn" id="share">${L("Freunde herausfordern", "Challenge friends")}</button>
      <textarea class="sharebox" id="sharebox" rows="2" readonly hidden>${esc(shareText(res))}</textarea>
      <button class="btn ghost" id="practice">${L("Übungsrunde spielen", "Play a practice round")}</button>
    </div>
    ${statsHtml(st.streak, st)}
    <p class="next-in">${L("Nächstes Tagesrätsel in", "Next daily puzzle in")} <b id="cd"></b></p>`
    : `<div class="actions"><button class="btn" id="practice">${L("Noch eine Übungsrunde", "Another practice round")}</button><button class="btn ghost" id="home2">${L("Zum Start", "Back to start")}</button></div>`}
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
    await navigator.clipboard.writeText(text); toast(L("Kopiert! Jetzt in WhatsApp, Reddit & Co. einfügen", "Copied! Paste it into WhatsApp, Reddit & co."));
  } catch(e) {
    const box = document.getElementById("sharebox");
    if (box) { box.hidden = false; box.focus(); box.select(); try { document.execCommand("copy"); toast(L("Ergebnis kopiert", "Result copied")); } catch(_){ toast(L("Text markiert – bitte kopieren", "Text selected – please copy it")); } }
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
function statsHtml(streak, st){
  return `<div class="stats"><div><b>${streak}</b>${L("Tage in Folge", "Day streak")}</div><div><b>${fmt(st.best)}</b>${L("Bestwert", "Best score")}</div><div><b>${st.played}</b>${L("Gespielt", "Played")}</div></div>`;
}
function renderHome(){
  hideSheet();
  app.className = "app";
  applyLang();
  const today = load("day:" + dayKey(), null);
  const st = load("stats", {played:0, best:0, streak:0, last:null});
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  const streak = (st.last === dayKey() || st.last === yesterday) ? st.streak : 0;
  const dateStr = new Date().toLocaleDateString(LOCALE(), {weekday:"long", day:"numeric", month:"long"});
  const ch = activeChallenge();
  app.innerHTML = `<div class="intro fade">
    ${EN.term ? `<div class="langs" role="group" aria-label="Sprache / Language">
      <button class="lang ${LANG === "de" ? "on" : ""}" data-l="de" aria-pressed="${LANG === "de"}">Deutsch</button>
      <button class="lang ${LANG === "en" ? "on" : ""}" data-l="en" aria-pressed="${LANG === "en"}">English</button>
    </div>` : ""}
    ${globeSvg()}
    <h1>Orbis</h1>
    <div class="no">${L("Tagesrätsel", "Daily puzzle")} #${puzzleNo()} · ${esc(dateStr)}</div>
    <p>${L(`Zehn Fragen rund um die Welt, jeden Tag neu und für alle gleich. Bis zu ${fmt(1000)} Punkte pro Frage.`,
           `Ten questions about the world, new every day and the same for everyone. Up to ${fmt(1000)} points per question.`)}</p>
    ${ch && !today ? `<div class="challenge"><b>${L("Du wurdest herausgefordert!", "You've been challenged!")}</b> ${L(`Jemand hat beim heutigen Rätsel ${fmt(ch.score)} Punkte geholt. Schaffst du mehr?`, `Someone scored ${fmt(ch.score)} points in today's puzzle. Can you beat that?`)}</div>` : ""}
    ${ch && today ? duelHtml(today.score, ch.score) : ""}
    <div class="actions">
      ${today ? `<button class="btn" id="seeres">${L("Heutiges Ergebnis ansehen", "See today's result")}</button><button class="btn ghost" id="practice">${L("Übungsrunde spielen", "Play a practice round")}</button>`
              : `<button class="btn" id="play">${ch ? L("Herausforderung annehmen", "Accept the challenge") : L("Rätsel starten", "Start puzzle")}</button><button class="linkbtn" id="practice">${L("Erst eine Übungsrunde spielen", "Try a practice round first")}</button>`}
    </div>
    ${statsHtml(streak, st)}
    ${legalLinks()}
  </div>`;
  app.querySelectorAll(".langs .lang").forEach(b => b.onclick = () => setLang(b.dataset.l));
  const play = document.getElementById("play"); if (play) play.onclick = () => startGame("daily");
  const seer = document.getElementById("seeres"); if (seer) seer.onclick = () => renderResult(today, "daily");
  document.getElementById("practice").onclick = () => startGame("practice");
}

function legalLinks(){
  return `<nav class="legal" aria-label="${L("Rechtliches", "Legal")}"><a href="impressum.html">${L("Impressum", "Legal notice")}</a><a href="datenschutz.html">${L("Datenschutz", "Privacy")}</a></nav>`;
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
  applyLang();
  app.innerHTML = `<div class="loading">${L("Die Welt wird geladen …", "Loading the world …")}</div>`;
  try {
    if (!window.d3 || !window.topojson) throw new Error("Bibliotheken fehlen");
    const [topo, flags] = await Promise.all([
      fetch("countries-50m.json").then(r => { if (!r.ok) throw new Error("Karte"); return r.json(); }),
      fetch("flags.json").then(r => { if (!r.ok) throw new Error("Flaggen"); return r.json(); })
    ]);
    TOPO = topo; FLAGS = flags;
    initGeo();
    trackVisit();
    readChallenge();
    Track.page();
    renderHome();
  } catch(e) {
    console.error(e);
    app.innerHTML = `<div class="err"><h2>${L("Die Karte konnte nicht geladen werden", "The map couldn't be loaded")}</h2><p>${L("Prüfe deine Internetverbindung und lade die Seite neu.", "Check your internet connection and reload the page.")}</p></div>`;
  }
}
window.addEventListener("error", () => {
  if (!app.querySelector(".err") && !app.querySelector(".intro, .prompt, .passport")) {
    app.innerHTML = `<div class="err"><h2>Da ist etwas schiefgelaufen · Something went wrong</h2><p>Bitte lade die Seite neu. · Please reload the page.</p></div>`;
  }
});
boot();
