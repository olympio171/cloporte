/* =========================================================
   Oniscidea — application
   Routage par ancre (#especes, #sp.<id>, #anatomie, #elevage,
   #terrariums…) et rendu des vues.
   ========================================================= */
(function () {
  'use strict';

  const SP = window.CLOPORTES;
  const C = window.CONTENT;
  const D = window.Draw;
  const L = C.LABELS;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = n => String(n).replace('.', ',');
  const pad3 = n => String(n).padStart(3, '0');
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  };

  /* ---------- Ordre du catalogue ---------- */
  const famIndex = f => { const i = C.FAMILY_ORDER.indexOf(f); return i < 0 ? 99 : i; };
  const ORDERED = SP.map((s, i) => ({ s, i }))
    .sort((a, b) => famIndex(a.s.fam) - famIndex(b.s.fam) || a.i - b.i)
    .map(x => x.s);
  ORDERED.forEach((s, i) => { s.no = i + 1; });
  const BY_ID = Object.fromEntries(SP.map(s => [s.id, s]));

  /* ---------- Petits composants ---------- */
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ROLL = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 6.5h10M2.6 9.5h10.8" stroke="currentColor" stroke-width="1.2"/></svg>';
  const LEAF = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32C8 16 18 7 34 6c0 17-9 27-26 26z" fill="currentColor" opacity=".25"/><path d="M8 32C8 16 18 7 34 6c0 17-9 27-26 26zM8 32L26 14" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>';

  function levelChip(n) { return `<span class="chip chip-dot chip-lvl-${n}">${L.niveau[n].court}</span>`; }
  function sizeTxt(s) { return `${num(s.taille[0])}–${num(s.taille[1])} mm`; }

  function lookOf(s, morph) {
    if (!morph) return s.look;
    const base = { shape: s.look.shape, tweak: s.look.tweak, blind: s.look.blind, eyeN: s.look.eyeN };
    return Object.assign(base, morph);
  }

  const artCache = new Map();
  function art(s, opts) {
    const key = s.id + '|' + (opts ? JSON.stringify(opts) : '');
    if (!artCache.has(key)) artCache.set(key, D.isopod(s.look, opts || {}));
    return artCache.get(key);
  }

  function card(s) {
    return `<a class="specimen" href="#sp.${s.id}">
      <div class="specimen-plate">${art(s)}<span class="specimen-no">N° ${pad3(s.no)}</span>${s.roule ? `<span class="specimen-roll chip" title="Se roule en boule">${ROLL} boule</span>` : ''}</div>
      <div class="specimen-label">
        <span class="latin">${esc(s.sci)}</span>
        <span class="common">${esc(s.nom)}</span>
        <div class="specimen-meta">${levelChip(s.niveau)}<span class="chip">${sizeTxt(s)}</span></div>
      </div>
    </a>`;
  }

  function edge(fromVar, toVar, seed) {
    const R = D.rng(seed || fromVar + toVar);
    let d = 'M0,46 L0,' + Math.round(18 + R() * 10);
    for (let x = 90; x <= 1440; x += 90) d += ` Q${x - 45},${Math.round(6 + R() * 30)} ${x},${Math.round(14 + R() * 20)}`;
    d += ' L1440,46Z';
    let pebbles = '';
    for (let i = 0; i < 9; i++) pebbles += `<ellipse cx="${Math.round(R() * 1440)}" cy="${Math.round(34 + R() * 8)}" rx="${Math.round(4 + R() * 9)}" ry="${Math.round(2 + R() * 4)}" fill="var(${fromVar})" opacity=".55"/>`;
    return `<div style="background:var(${fromVar})" aria-hidden="true"><svg class="edge" viewBox="0 0 1440 46" preserveAspectRatio="none"><path d="${d}" fill="var(${toVar})"/>${pebbles}</svg></div>`;
  }

  /* ---------- Géométrie d'une illustration (échelle, taille réelle) ---------- */
  function bodyInfo(look, opts) {
    const svg = D.isopod(look, opts || {});
    const m = svg.match(/viewBox="([^"]+)"/);
    const vb = m ? m[1].split(' ').map(Number) : [0, 0, 100, 100];
    const g = D.geometry(look.shape, look.tweak);
    return { svg, vb, len: g.len };
  }

  /* ---------- Réglages d'élevage dérivés ---------- */
  function bacSize(s) {
    const m = s.taille[1];
    if (m <= 5) return 'Boîte de 2 à 5 L';
    if (m <= 10) return 'Bac de 5 à 15 L';
    if (m <= 16) return 'Bac de 15 à 30 L';
    if (m <= 22) return 'Bac de 30 à 50 L';
    return 'Bac de 50 L et plus';
  }
  const DEFAULT_RECIPES = {
    1: [{ mat: 'terreau', pct: 50 }, { mat: 'sable', pct: 30 }, { mat: 'feuilles', pct: 10 }, { mat: 'calcaire', pct: 10 }],
    2: [{ mat: 'terreau', pct: 50 }, { mat: 'feuilles', pct: 20 }, { mat: 'bois', pct: 20 }, { mat: 'calcaire', pct: 10 }],
    3: [{ mat: 'terreau', pct: 40 }, { mat: 'bois', pct: 25 }, { mat: 'humus', pct: 25 }, { mat: 'calcaire', pct: 10 }],
    4: [{ mat: 'coco', pct: 35 }, { mat: 'bois', pct: 25 }, { mat: 'sphaigne', pct: 20 }, { mat: 'feuilles', pct: 20 }]
  };
  function setupFor(s) {
    const get = id => C.SETUPS.find(x => x.id === id);
    const direct = C.SETUPS.find(x => x.especes.includes(s.id));
    if (direct) return direct;
    if (s.milieu === 'fourmiliere') return null;
    if (s.milieu === 'desert') return get('setup-terrier');
    if (s.milieu === 'littoral') return get('setup-littoral');
    if (s.milieu === 'mediterraneen' || s.hum === 1) return get('setup-garrigue');
    if (s.milieu === 'tropical' || (s.milieu === 'grotte' && s.temp[0] >= 18)) return s.niveau === 3 ? get('setup-karst') : get('setup-bioactif');
    if (s.hum >= 3) return get('setup-sous-bois');
    return get('setup-depart');
  }
  function recipeTxt(r) { return r.map(x => `${(D.MATS[x.mat] || { label: x.mat }).label.toLowerCase()} ${x.pct} %`).join(', '); }
  function recipeBars(r) {
    return `<div class="recipe">${r.map(x => {
      const m = D.MATS[x.mat] || { c: '#777', label: x.mat };
      return `<div class="recipe-row"><span>${m.label}</span><span class="mono">${x.pct} %</span><div class="recipe-bar"><i style="width:${x.pct}%;background:${m.c}"></i></div></div>`;
    }).join('')}</div>`;
  }

  /* =========================================================
     ACCUEIL
     ========================================================= */
  function viewHome() {
    const pick = (id, morphName) => {
      const s = BY_ID[id];
      const mo = morphName && (s.morphs || []).find(m => m.n === morphName);
      return lookOf(s, mo);
    };
    const walkers = [
      { look: pick('porcellio-scaber'), path: 'M -140 800 C 300 760, 520 860, 820 790 S 1400 740, 1760 820', dur: 74, offset: 12, scale: .34, still: [640, 800, 8] },
      { look: pick('armadillidium-vulgare', 'Orange Vigor'), path: 'M 1760 720 C 1400 700, 1200 790, 900 745 S 300 700, -160 770', dur: 96, offset: 60, scale: .3, still: [1180, 752, 190] },
      { look: pick('porcellio-laevis', 'Dairy Cow'), path: 'M -160 872 C 400 850, 800 905, 1200 852 S 1600 880, 1770 862', dur: 58, offset: 30, scale: .38, still: [300, 860, -4] }
    ].map(w => Object.assign(w, { svg: D.isopod(w.look, { noShadow: true }) }));

    const counts = [1, 2, 3].map(n => SP.filter(s => s.niveau === n).length);
    const plateLook = pick('porcellio-scaber', 'Calico');

    const html = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-scene">${D.scene({ walkers })}</div>
      <div class="spores" id="spores"></div>
      <div class="hero-content">
        <p class="eyebrow hero-eyebrow">Encyclopédie des cloportes · 100 espèces</p>
        <h1 id="hero-title"><span class="latin">Oniscidea</span>Le peuple de la litière</h1>
        <p class="hero-lede">Crustacés sortis de la mer, recycleurs infatigables des sous-bois, bijoux vivants des terrariums. Explorez leur vie, leur anatomie et l'art de les élever.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#especes">Explorer les 100 espèces ${ARROW}</a>
          <a class="btn btn-ghost" href="#elevage">Commencer un élevage</a>
        </div>
      </div>
    </section>
    ${edge('--bg', '--stratum-1', 'e1')}
    <section class="stratum" data-s="1" aria-labelledby="qui">
      <span class="stratum-tag">0–5 cm · litière</span>
      <div class="wrap">
        <div class="intro-grid">
          <div class="prose" style="display:grid;gap:var(--s-4)">
            <p class="eyebrow">Qui sont-ils ?</p>
            <h2 id="qui" style="font-size:clamp(2rem,4.6vw,3.6rem)">Des crustacés qui ont quitté la mer</h2>
            <p class="dropcap">Les cloportes ne sont pas des insectes. Ce sont des crustacés, cousins des crabes et des crevettes, qui ont conquis la terre ferme il y a environ 300 millions d'années. Ils en gardent des traces : un sang bleu, des branchies transformées en poumons, un besoin constant d'humidité.</p>
            <p>On en connaît plus de 3 700 espèces, des plages aux déserts, des grottes aux forêts tropicales. Dans un sol de forêt, ils fragmentent les feuilles mortes et le bois, accélèrent le travail des champignons et des bactéries, et rendent au sol ses minéraux. Sans eux, la litière s'accumulerait.</p>
            <div class="etym">
              <p class="eyebrow">D'où vient le mot</p>
              <p>« Cloporte » viendrait de <em>clos porc</em>, le porc enfermé. Le latin <strong>Porcellio</strong> signifie d'ailleurs « porcelet ». Partout, on l'a comparé à un petit cochon : <em>sow bug</em> en anglais, <em>cochinilla</em> en espagnol, <em>porcellino di terra</em> en italien.</p>
            </div>
          </div>
          <figure class="intro-plate plate" style="margin:0">
            <div class="plate-bg">${D.plateBg('foret', 'intro')}</div>
            <div class="plate-specimen">${D.isopod(plateLook, { animAnt: !reduceMotion, title: 'Porcellio scaber, forme Calico' })}</div>
            <span class="plate-no">Pl. I · Porcellio scaber « Calico »</span>
          </figure>
        </div>
        <div class="spacer"></div>
        <div class="facts">
          <div class="fact"><span class="fact-num">3 700<small>+</small></span><p>espèces de cloportes décrites dans le monde, et bien d'autres encore inconnues.</p></div>
          <div class="fact"><span class="fact-num">14</span><p>pattes chez l'adulte : sept paires identiques, d'où le nom d'isopode, « pieds égaux ».</p></div>
          <div class="fact"><span class="fact-num">2<small> temps</small></span><p>pour chaque mue : d'abord l'arrière du corps, puis l'avant, quelques heures à quelques jours plus tard.</p></div>
          <div class="fact"><span class="fact-num">1<small> poche</small></span><p>le marsupium, sous le ventre de la femelle, où les œufs se développent avant l'éclosion.</p></div>
        </div>
      </div>
    </section>
    ${edge('--stratum-1', '--stratum-2', 'e2')}
    <section class="stratum" data-s="2" aria-labelledby="vedettes">
      <span class="stratum-tag">5–20 cm · humus</span>
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Galerie</p>
          <h2 id="vedettes">Dix espèces qui fascinent</h2>
          <p>Du canard en caoutchouc thaïlandais au cloporte du Sahara qui vit en famille, un premier aperçu de la diversité du groupe.</p>
        </div>
        <div class="shelf">${C.VEDETTES.map(id => card(BY_ID[id])).join('')}</div>
        <p style="margin-top:var(--s-4)"><a class="link-arrow" href="#especes">Parcourir les 100 fiches ${ARROW.replace('<svg', '<svg width="18" height="18"')}</a></p>
      </div>
    </section>
    ${edge('--stratum-2', '--stratum-3', 'e3')}
    <section class="stratum" data-s="3" aria-labelledby="niveaux">
      <span class="stratum-tag">20–40 cm · racines</span>
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Élever des cloportes</p>
          <h2 id="niveaux">Trois paliers, de la boîte à chaussures au karst thaïlandais</h2>
          <p>Chaque fiche indique un niveau. Commencez par une espèce robuste, puis montez en exigence à mesure que vous apprenez à lire vos bacs.</p>
        </div>
        <div class="levels">
          ${C.NIVEAUX.map((lv, i) => `
            <a class="level-card" href="#elevage-${['debutant', 'intermediaire', 'expert'][i]}" style="--lvl:var(--lvl-${lv.n})">
              ${D.sprout(lv.n)}
              <span class="level-meter">${[1, 2, 3].map(k => `<i class="${k <= lv.n ? 'on' : ''}"></i>`).join('')}</span>
              <h3>${lv.titre}</h3>
              <p>${esc(lv.accroche)}. ${esc(L.niveau[lv.n].desc)}</p>
              <span class="mono" style="font-size:.78rem;color:var(--ink-3)">${counts[i]} espèces</span>
            </a>`).join('')}
        </div>
      </div>
    </section>
    ${edge('--stratum-3', '--stratum-4', 'e4')}
    <section class="stratum" data-s="4" aria-labelledby="role">
      <span class="stratum-tag">40 cm et plus · roche mère</span>
      <div class="wrap">
        <div class="intro-grid" style="align-items:start">
          <div class="prose" style="display:grid;gap:var(--s-4)">
            <p class="eyebrow">Écologie</p>
            <h2 id="role" style="font-size:clamp(2rem,4.6vw,3.2rem)">Au menu de toute la forêt</h2>
            <p>Abondants, lents et riches en calcium, les cloportes nourrissent une foule de prédateurs. Certains se sont même spécialisés pour percer leur armure.</p>
            <p>Ils rendent aussi un service discret : en stockant les métaux lourds dans leur glande digestive, ils servent de sentinelles pour mesurer la pollution des sols.</p>
            <p><a class="link-arrow" href="#anatomie">Comprendre leur anatomie ${ARROW.replace('<svg', '<svg width="18" height="18"')}</a></p>
          </div>
          <div class="predators">
            <div class="predator"><strong>La dysdère</strong><em>Dysdera crocata</em><p>Araignée aux chélicères énormes, spécialiste des cloportes qu'elle transperce à travers la carapace.</p></div>
            <div class="predator"><strong>Les musaraignes</strong><em>Sorex, Crocidura</em><p>Elles fouillent la litière nuit et jour et consomment de grandes quantités de cloportes.</p></div>
            <div class="predator"><strong>Les lithobies</strong><em>Lithobius</em><p>Mille-pattes chasseurs rapides, ils capturent les cloportes sous les pierres.</p></div>
            <div class="predator"><strong>Crapauds et carabes</strong><em>Bufo, Carabus</em><p>Chasseurs nocturnes des sols humides, grands amateurs de proies riches en calcium.</p></div>
          </div>
        </div>
      </div>
    </section>`;

    return {
      html, title: 'Oniscidea · encyclopédie des cloportes',
      mount() {
        const box = $('#spores');
        if (!box || reduceMotion) return;
        const R = D.rng('spores');
        let s = '';
        for (let i = 0; i < 22; i++) {
          s += `<span class="spore" style="left:${(R() * 100).toFixed(1)}%;top:${(20 + R() * 70).toFixed(1)}%;animation-duration:${(9 + R() * 12).toFixed(1)}s;animation-delay:${(-R() * 18).toFixed(1)}s;--dx:${Math.round(R() * 120 - 40)}px;width:${(2 + R() * 3).toFixed(1)}px;height:${(2 + R() * 3).toFixed(1)}px"></span>`;
        }
        box.innerHTML = s;
      }
    };
  }

  /* =========================================================
     CATALOGUE
     ========================================================= */
  const FILTERS = { q: '', lv: [], fam: '', milieu: '', zone: '', roule: '', sort: 'famille' };
  try { const saved = JSON.parse(sessionStorage.getItem('oniscidea-filters') || 'null'); if (saved) Object.assign(FILTERS, saved); } catch (e) { /* ignoré */ }
  function saveFilters() { try { sessionStorage.setItem('oniscidea-filters', JSON.stringify(FILTERS)); } catch (e) { /* ignoré */ } }

  function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function filtered() {
    const q = norm(FILTERS.q.trim());
    let list = ORDERED.filter(s => {
      if (q && !norm([s.sci, s.nom, s.en, s.fam, s.orig].join(' ')).includes(q)) return false;
      if (FILTERS.lv.length && !FILTERS.lv.includes(s.niveau)) return false;
      if (FILTERS.fam && s.fam !== FILTERS.fam) return false;
      if (FILTERS.milieu && s.milieu !== FILTERS.milieu) return false;
      if (FILTERS.zone && !s.zone.includes(FILTERS.zone)) return false;
      if (FILTERS.roule === 'oui' && !s.roule) return false;
      if (FILTERS.roule === 'non' && s.roule) return false;
      return true;
    });
    if (FILTERS.sort === 'nom') list = list.slice().sort((a, b) => a.sci.localeCompare(b.sci));
    if (FILTERS.sort === 'taille') list = list.slice().sort((a, b) => b.taille[1] - a.taille[1] || a.sci.localeCompare(b.sci));
    if (FILTERS.sort === 'niveau') list = list.slice().sort((a, b) => (a.niveau || 9) - (b.niveau || 9) || a.no - b.no);
    return list;
  }

  function resultsHtml() {
    const list = filtered();
    if (!list.length) return { n: 0, html: `<div class="empty"><p style="font-family:var(--f-display);font-size:1.6rem;color:var(--ink)">Aucun cloporte sous cette pierre.</p><p>Aucune espèce ne correspond à ces critères. Élargissez la recherche ou réinitialisez les filtres.</p><button class="btn btn-ghost" type="button" data-reset>Réinitialiser les filtres</button></div>` };
    if (FILTERS.sort !== 'famille') return { n: list.length, html: `<div class="grid-specimens">${list.map(card).join('')}</div>` };
    const groups = {};
    list.forEach(s => { (groups[s.fam] = groups[s.fam] || []).push(s); });
    const html = C.FAMILY_ORDER.filter(f => groups[f]).map(f => `
      <section class="family-group" aria-labelledby="fam-${f}">
        <div class="family-title"><h2 id="fam-${f}"><span class="latin">${f}</span></h2><span>${esc(C.FAMILLES[f].nom)} · ${groups[f].length} espèce${groups[f].length > 1 ? 's' : ''}</span></div>
        <div class="grid-specimens">${groups[f].map(card).join('')}</div>
      </section>`).join('');
    return { n: list.length, html };
  }

  function viewCatalog() {
    const famOpts = C.FAMILY_ORDER.map(f => `<option value="${f}"${FILTERS.fam === f ? ' selected' : ''}>${f}</option>`).join('');
    const milOpts = Object.entries(L.milieu).map(([k, v]) => `<option value="${k}"${FILTERS.milieu === k ? ' selected' : ''}>${v}</option>`).join('');
    const zoneOpts = Object.entries(L.zone).map(([k, v]) => `<option value="${k}"${FILTERS.zone === k ? ' selected' : ''}>${v}</option>`).join('');
    const html = `
    <div class="wrap">
      <header class="catalog-head">
        <p class="eyebrow">Catalogue · ${SP.length} espèces · ${C.FAMILY_ORDER.length} familles</p>
        <h1>Les espèces</h1>
        <p class="muted prose">Chaque fiche porte un numéro d'inventaire, comme dans une collection de muséum. Filtrez par niveau d'élevage, famille, milieu ou région du monde.</p>
      </header>
      <div class="filters" role="search">
        <div class="filter-row">
          <label class="search" for="f-q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input id="f-q" type="search" placeholder="Nom latin, nom commun, famille, pays…" value="${esc(FILTERS.q)}" autocomplete="off" aria-label="Rechercher une espèce"></label>
          <select class="select" id="f-sort" aria-label="Trier">
            <option value="famille"${FILTERS.sort === 'famille' ? ' selected' : ''}>Par famille</option>
            <option value="nom"${FILTERS.sort === 'nom' ? ' selected' : ''}>Nom latin (A→Z)</option>
            <option value="taille"${FILTERS.sort === 'taille' ? ' selected' : ''}>Plus grands d'abord</option>
            <option value="niveau"${FILTERS.sort === 'niveau' ? ' selected' : ''}>Du plus facile au plus exigeant</option>
          </select>
        </div>
        <div class="filter-row">
          <div class="toggle-group" role="group" aria-label="Niveau d'élevage">
            ${[1, 2, 3, 0].map(n => `<button class="toggle" type="button" data-lvl="${n}" aria-pressed="${FILTERS.lv.includes(n)}">${L.niveau[n].nom}</button>`).join('')}
          </div>
          <select class="select" id="f-fam" aria-label="Famille"><option value="">Toutes les familles</option>${famOpts}</select>
          <select class="select" id="f-mil" aria-label="Milieu"><option value="">Tous les milieux</option>${milOpts}</select>
          <select class="select" id="f-zone" aria-label="Région"><option value="">Toutes les régions</option>${zoneOpts}</select>
          <select class="select" id="f-roule" aria-label="Conglobation">
            <option value="">Boule ou non</option>
            <option value="oui"${FILTERS.roule === 'oui' ? ' selected' : ''}>Se roule en boule</option>
            <option value="non"${FILTERS.roule === 'non' ? ' selected' : ''}>Ne se roule pas</option>
          </select>
          <span class="result-count" id="f-count" aria-live="polite"></span>
        </div>
      </div>
      <div id="results"></div>
    </div>`;

    return {
      html, title: 'Les 100 espèces · Oniscidea',
      mount() {
        const update = () => {
          const r = resultsHtml();
          $('#results').innerHTML = r.html;
          $('#f-count').textContent = `${r.n} espèce${r.n > 1 ? 's' : ''}`;
          saveFilters();
        };
        $('#f-q').addEventListener('input', e => { FILTERS.q = e.target.value; update(); });
        $('#f-sort').addEventListener('change', e => { FILTERS.sort = e.target.value; update(); });
        $('#f-fam').addEventListener('change', e => { FILTERS.fam = e.target.value; update(); });
        $('#f-mil').addEventListener('change', e => { FILTERS.milieu = e.target.value; update(); });
        $('#f-zone').addEventListener('change', e => { FILTERS.zone = e.target.value; update(); });
        $('#f-roule').addEventListener('change', e => { FILTERS.roule = e.target.value; update(); });
        $$('.toggle[data-lvl]').forEach(b => b.addEventListener('click', () => {
          const n = Number(b.dataset.lvl);
          FILTERS.lv = FILTERS.lv.includes(n) ? FILTERS.lv.filter(x => x !== n) : FILTERS.lv.concat(n);
          b.setAttribute('aria-pressed', FILTERS.lv.includes(n));
          update();
        }));
        $('#results').addEventListener('click', e => {
          if (!e.target.closest('[data-reset]')) return;
          Object.assign(FILTERS, { q: '', lv: [], fam: '', milieu: '', zone: '', roule: '', sort: 'famille' });
          saveFilters();
          render();
        });
        update();
      }
    };
  }

  /* =========================================================
     FICHE ESPÈCE
     ========================================================= */
  function viewSpecies(id) {
    const s = BY_ID[id];
    if (!s) return viewNotFound();
    const fam = C.FAMILLES[s.fam] || { nom: s.fam, desc: '' };
    const lv = L.niveau[s.niveau];
    const hum = L.hum[s.hum], vent = L.vent[s.vent];
    const setup = setupFor(s);
    const recipe = setup ? setup.recette : DEFAULT_RECIPES[s.hum];
    const idx = s.no - 1;
    const prev = ORDERED[(idx - 1 + ORDERED.length) % ORDERED.length];
    const next = ORDERED[(idx + 1) % ORDERED.length];
    const morphs = (s.morphs || []).filter(m => typeof m === 'object' && m.c1);

    // barre d'échelle : longueur réelle du corps
    const info = bodyInfo(s.look, { animAnt: !reduceMotion, title: s.sci });
    const scaleUnits = [20, 10, 5, 2, 1, .5];
    const unit = scaleUnits.find(u => u <= s.taille[1] * 0.6) || .5;
    const bodyPx = Math.min(62 / info.vb[2], 100 / info.vb[3]) * info.len; // en % de la largeur de planche
    const barPct = Math.max(4, Math.min(60, unit / s.taille[1] * bodyPx));

    // taille réelle approximative (unités CSS mm)
    const lifeH = (s.taille[1] * info.vb[3] / info.len).toFixed(1);

    const shapeTraits = [];
    const S = D.SHAPES[s.look.shape] || {};
    const uroType = (s.look.tweak && s.look.tweak.uroType) || S.uroType;
    shapeTraits.push(s.roule ? 'Se roule en boule pour se protéger.' : 'Ne se roule pas : il fuit ou se plaque au sol.');
    shapeTraits.push({ long: 'Uropodes longs, bien visibles à l\'arrière.', fork: 'Uropodes longs et fourchus, typiques des ligies.', flush: 'Uropodes courts, affleurant le bord du corps.', none: 'Uropodes invisibles de dessus.' }[uroType] || '');
    shapeTraits.push(s.look.blind ? 'Aucun œil : espèce aveugle.' : (s.look.eyeN && s.look.eyeN <= 3 ? 'Yeux réduits à quelques ommatidies.' : 'Yeux composés bien développés.'));
    if (s.look.pat && [].concat(s.look.pat).includes('tubercles')) shapeTraits.push('Cuticule couverte de tubercules.');
    if (s.look.pat && [].concat(s.look.pat).includes('spikes')) shapeTraits.push('Épines ou tubercules coniques sur le dos.');

    const related = ORDERED.filter(x => x.id !== s.id && x.fam === s.fam).slice(0, 3);
    if (related.length < 3) ORDERED.filter(x => x.id !== s.id && x.fam !== s.fam && x.milieu === s.milieu).slice(0, 3 - related.length).forEach(x => related.push(x));

    const kept = s.niveau > 0;
    const prot = !kept ? '—' : (s.repro === 3 || s.taille[1] >= 20 ? 'Deux à trois fois par semaine' : 'Une fois par semaine');
    const sections = [
      ['sec-nature', 'Dans la nature'],
      ['sec-vie', 'Vie et comportement'],
      ['sec-anatomie', 'Anatomie'],
      ['sec-repro', 'Reproduction'],
      ['sec-elevage', kept ? 'Élevage' : 'Observer'],
      ['sec-setup', 'Terrarium'],
      ['sec-conseils', 'Conseils'],
      morphs.length > 1 ? ['sec-morphes', 'Morphes'] : null,
      ['sec-fait', 'Le saviez-vous'],
      ['sec-proches', 'Espèces proches']
    ].filter(Boolean);
    let secN = 0;
    const H = (id, title) => `<h2 id="h-${id}"><span class="idx">${pad3(++secN).slice(1)}</span>${title}</h2>`;

    const gauges = `
      <div class="gauges">
        <div class="gauge"><div class="gauge-head"><span>Température</span><strong>${s.temp[0]} à ${s.temp[1]} °C</strong></div>
          <div class="gauge-bar gauge-temp"><i style="left:${(s.temp[0] / 36 * 100).toFixed(1)}%;width:${((s.temp[1] - s.temp[0]) / 36 * 100).toFixed(1)}%"></i></div>
          <div class="gauge-scale"><span>0 °C</span><span>12</span><span>24</span><span>36 °C</span></div></div>
        <div class="gauge"><div class="gauge-head"><span>Humidité</span><strong>${hum.nom} · ${hum.hr}</strong></div><div class="pips">${[1, 2, 3, 4].map(k => `<i class="${k <= s.hum ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="gauge"><div class="gauge-head"><span>Aération</span><strong>${vent.nom}</strong></div><div class="pips">${[1, 2, 3].map(k => `<i class="${k <= s.vent ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="gauge"><div class="gauge-head"><span>Reproduction</span><strong>${L.repro[s.repro]}</strong></div><div class="pips">${[1, 2, 3].map(k => `<i class="${k <= s.repro ? 'on' : ''}"></i>`).join('')}</div></div>
      </div>`;

    const elevageBlock = kept ? `
      <div class="two-col" style="align-items:start">
        <div class="datasheet">
          <h3>Fiche technique · N° ${pad3(s.no)}</h3>
          <dl class="ds-rows">
            <div class="ds-row"><dt>Niveau</dt><dd>${lv.nom}. ${esc(lv.desc)}</dd></div>
            <div class="ds-row"><dt>Bac</dt><dd>${bacSize(s)} pour une colonie de départ de 10 à 20 individus</dd></div>
            <div class="ds-row"><dt>Température</dt><dd>${s.temp[0]} à ${s.temp[1]} °C</dd></div>
            <div class="ds-row"><dt>Humidité</dt><dd>${hum.nom} (${hum.hr}). ${esc(hum.txt)}</dd></div>
            <div class="ds-row"><dt>Aération</dt><dd>${vent.nom}. ${esc(vent.txt)}</dd></div>
            <div class="ds-row"><dt>Substrat</dt><dd>${esc(recipeTxt(recipe))}</dd></div>
            <div class="ds-row"><dt>Alimentation</dt><dd>${esc(s.alim)}</dd></div>
            <div class="ds-row"><dt>Protéines</dt><dd>${prot}</dd></div>
            <div class="ds-row"><dt>Calcium</dt><dd>Os de seiche ou craie en permanence</dd></div>
            <div class="ds-row"><dt>Cohabitation</dt><dd>${s.milieu === 'fourmiliere' ? 'Uniquement avec sa colonie de fourmis hôte' : 'Seul, avec des collemboles comme équipe de nettoyage'}</dd></div>
          </dl>
        </div>
        ${gauges}
      </div>` : `
      <div class="two-col" style="align-items:start">
        <div class="observe">
          <p class="eyebrow">Espèce d'observation</p>
          <p>Cette espèce n'est pas maintenue en élevage, ou ne devrait pas l'être : elle est protégée, liée à un milieu impossible à reproduire, ou simplement absente des circuits d'éleveurs.</p>
          <p>Pour la voir, cherchez-la dans son milieu : ${esc(L.milieu[s.milieu].toLowerCase())}, de préférence la nuit, à la lampe. Observez, photographiez, puis remettez chaque pierre en place.</p>
        </div>
        ${gauges}
      </div>`;

    const setupBlock = setup ? `
      <div class="setup-mini">
        <figure class="tank-figure"><div class="tank-scroll">${D.tank(setup)}</div><figcaption>${esc(setup.nom)} · ${esc(setup.sous)}</figcaption></figure>
        <div style="display:grid;gap:var(--s-4)">
          <p>${kept ? 'Le montage conseillé pour cette espèce' : 'Le milieu à reproduire si vous deviez l\'étudier'} : <strong>${esc(setup.nom)}</strong>. ${esc(setup.desc)}</p>
          ${recipeBars(recipe)}
          <a class="link-arrow" href="#${setup.id}">Voir le montage complet ${ARROW.replace('<svg', '<svg width="18" height="18"')}</a>
        </div>
      </div>` : `<div class="observe"><p>Cette espèce vit exclusivement dans les fourmilières. Elle ne peut être maintenue qu'au sein d'une colonie de fourmis hôte, dans un nid d'observation adapté à celles-ci.</p></div>`;

    const html = `
    <article class="wrap" itemscope itemtype="https://schema.org/Taxon">
      <nav class="crumbs" aria-label="Fil d'Ariane"><a href="#especes">Espèces</a><span aria-hidden="true">/</span><span>${s.fam}</span><span aria-hidden="true">/</span><span>N° ${pad3(s.no)}</span></nav>
      <header class="sp-hero">
        <figure class="plate" style="margin:0">
          <div class="plate-bg">${D.plateBg(s.milieu, s.id)}</div>
          <div class="plate-specimen" id="plate-specimen">${info.svg}</div>
          ${morphs.length > 1 ? `<div class="plate-morphs" role="group" aria-label="Formes de couleur">${morphs.map((m, i) => `<button type="button" class="morph-btn" data-morph="${i}" aria-pressed="${i === 0}"><i style="background:linear-gradient(135deg, ${m.c1} 50%, ${m.edgeCol || m.c2 || m.c1} 50%)"></i>${esc(m.n)}</button>`).join('')}</div>` : `<span class="plate-no">N° ${pad3(s.no)}</span>`}
          <div class="plate-scale" aria-label="Échelle : ${num(unit)} mm"><i style="width:${barPct.toFixed(1)}cqw;min-width:14px"></i><span>${num(unit)} mm</span></div>
        </figure>
        <div class="sp-title">
          <p class="eyebrow">${esc(fam.nom)} · <span class="latin" style="text-transform:none;letter-spacing:0">${s.fam}</span></p>
          <h1 itemprop="name">${esc(s.sci)}</h1>
          <p class="common">${esc(s.nom)}${s.en ? ` <span class="muted" style="font-size:.7em">· ${esc(s.en)}</span>` : ''}</p>
          <div class="sp-chips">${levelChip(s.niveau)}<span class="chip">${esc(L.statut[s.statut] || s.statut)}</span>${s.roule ? `<span class="chip">${ROLL} Se roule</span>` : ''}<span class="chip">${esc(L.milieu[s.milieu])}</span></div>
          <p class="sp-intro">${esc(s.intro)}</p>
          <dl class="stats">
            <div class="stat"><dt>Taille</dt><dd>${sizeTxt(s)}</dd></div>
            <div class="stat"><dt>Longévité</dt><dd>${esc(s.vie)}</dd></div>
            <div class="stat"><dt>Température</dt><dd>${s.temp[0]}–${s.temp[1]} °C</dd></div>
            <div class="stat"><dt>Humidité</dt><dd>${hum.nom}</dd></div>
            <div class="stat"><dt>Reproduction</dt><dd>${L.repro[s.repro]}</dd></div>
            <div class="stat"><dt>Origine</dt><dd style="font-family:var(--f-body);font-size:.92rem;line-height:1.35">${esc(s.orig)}</dd></div>
          </dl>
        </div>
      </header>

      <div class="sp-body">
        <nav class="toc" aria-label="Sommaire de la fiche">${sections.map(([id, t]) => `<a href="#${id}" data-scroll="${id}">${t}</a>`).join('')}</nav>
        <div class="sp-sections">
          <section class="sp-section" id="sec-nature" aria-labelledby="h-sec-nature">${H('sec-nature', 'Dans la nature')}
            <p>${esc(s.habitat)}</p>
            <dl class="spec-list">
              <div><dt>Répartition</dt><dd>${esc(s.orig)}</dd></div>
              <div><dt>Milieu</dt><dd>${esc(L.milieu[s.milieu])}</dd></div>
              <div><dt>Régions</dt><dd>${s.zone.map(z => L.zone[z]).join(', ')}</dd></div>
              <div><dt>Statut</dt><dd>${esc(L.statut[s.statut] || s.statut)}</dd></div>
            </dl>
          </section>

          <section class="sp-section" id="sec-vie" aria-labelledby="h-sec-vie">${H('sec-vie', 'Vie et comportement')}
            <div class="two-col">
              <div class="note-card"><p class="eyebrow">Comportement</p><p>${esc(s.comport)}</p></div>
              <div class="note-card"><p class="eyebrow">Régime</p><p>${esc(s.alim)}</p></div>
            </div>
          </section>

          <section class="sp-section" id="sec-anatomie" aria-labelledby="h-sec-anatomie">${H('sec-anatomie', 'Anatomie')}
            <p>${esc(s.anat)}</p>
            <div class="two-col" style="align-items:center">
              <ul class="leaf-list">${shapeTraits.filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')}<li>${esc(fam.desc)}</li></ul>
              <div class="note-card" style="justify-items:center;text-align:center">
                <p class="eyebrow">À taille réelle</p>
                <div style="height:${lifeH}mm;max-height:220px;display:grid;place-items:center">${D.isopod(s.look, { noShadow: true }).replace('<svg', `<svg style="height:${lifeH}mm;max-height:220px;width:auto"`)}</div>
                <p style="font-size:.85rem;color:var(--ink-3)">Adulte de ${num(s.taille[1])} mm, sur un écran calibré à 96 ppp.</p>
              </div>
            </div>
          </section>

          <section class="sp-section" id="sec-repro" aria-labelledby="h-sec-repro">${H('sec-repro', 'Reproduction')}
            <p>${esc(s.reproTxt)}</p>
            <dl class="spec-list">
              <div><dt>Portée</dt><dd>${s.portee ? `${s.portee[0]} à ${s.portee[1]} jeunes` : 'Non documentée'}</dd></div>
              <div><dt>Maturité</dt><dd>${esc(s.matur || 'Non documentée')}</dd></div>
              <div><dt>Longévité</dt><dd>${esc(s.vie)}</dd></div>
              <div><dt>Rythme</dt><dd>${L.repro[s.repro]}</dd></div>
            </dl>
          </section>

          <section class="sp-section" id="sec-elevage" aria-labelledby="h-sec-elevage">${H('sec-elevage', kept ? 'Élevage' : 'Observer')}
            ${elevageBlock}
          </section>

          <section class="sp-section" id="sec-setup" aria-labelledby="h-sec-setup">${H('sec-setup', 'Terrarium')}
            ${setupBlock}
          </section>

          <section class="sp-section" id="sec-conseils" aria-labelledby="h-sec-conseils">${H('sec-conseils', 'Conseils')}
            <div class="two-col" style="align-items:start">
              <div style="display:grid;gap:var(--s-3)"><p class="eyebrow">${kept ? 'Les conseils d\'éleveur' : 'Pour l\'observer'}</p><ol class="tips">${s.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
              <div style="display:grid;gap:var(--s-3)"><p class="eyebrow" style="color:var(--rust)">À éviter</p><ul class="tips warn">${s.pieges.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
            </div>
          </section>

          ${morphs.length > 1 ? `<section class="sp-section" id="sec-morphes" aria-labelledby="h-sec-morphes">${H('sec-morphes', 'Morphes')}
            <p>Formes de couleur connues en élevage ou dans la nature. Cliquez sur une forme pour l'afficher sur la planche.</p>
            <div class="morph-list">${morphs.map((m, i) => `<button type="button" class="morph-card" data-morph="${i}" style="font:inherit;color:inherit;cursor:pointer;text-align:left">${D.isopod(lookOf(s, m), { noShadow: true })}<span><strong>${esc(m.n)}</strong><span>${i === 0 ? 'Forme de référence' : 'Variante'}</span></span></button>`).join('')}</div>
          </section>` : ''}

          <section class="sp-section" id="sec-fait" aria-labelledby="h-sec-fait">${H('sec-fait', 'Le saviez-vous')}
            <div class="funfact">${LEAF}<p>${esc(s.fait)}</p></div>
          </section>

          <section class="sp-section" id="sec-proches" aria-labelledby="h-sec-proches">${H('sec-proches', 'Espèces proches')}
            <div class="grid-specimens">${related.map(card).join('')}</div>
            <nav class="pager" aria-label="Fiches voisines">
              <a href="#sp.${prev.id}"><small>← N° ${pad3(prev.no)}</small><span class="latin">${esc(prev.sci)}</span></a>
              <a href="#sp.${next.id}"><small>N° ${pad3(next.no)} →</small><span class="latin">${esc(next.sci)}</span></a>
            </nav>
          </section>
        </div>
      </div>
    </article>`;

    return {
      html, title: `${s.sci} · ${s.nom} · Oniscidea`,
      mount() {
        const setMorph = i => {
          const m = morphs[i];
          $('#plate-specimen').innerHTML = D.isopod(lookOf(s, m), { animAnt: !reduceMotion, title: `${s.sci}, forme ${m.n}` });
          $$('.morph-btn').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.morph) === i)));
        };
        $$('.morph-btn').forEach(b => b.addEventListener('click', () => setMorph(Number(b.dataset.morph))));
        $$('.morph-card').forEach(b => b.addEventListener('click', () => {
          setMorph(Number(b.dataset.morph));
          $('.sp-hero').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }));
        // sommaire actif
        if ('IntersectionObserver' in window) {
          const links = new Map($$('.toc a').map(a => [a.dataset.scroll, a]));
          const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
              if (en.isIntersecting) {
                links.forEach(a => a.classList.remove('active'));
                const a = links.get(en.target.id);
                if (a) a.classList.add('active');
              }
            });
          }, { rootMargin: '-30% 0px -60% 0px' });
          $$('.sp-section').forEach(sec => io.observe(sec));
          cleanup.push(() => io.disconnect());
        }
      }
    };
  }

  /* =========================================================
     ANATOMIE
     ========================================================= */
  function anatomyAnchors(g, ventral) {
    const hh = g.head.h, a = g.head.w / 2, A = g.antLen;
    const s = g.segs, p = g.pleon, t = g.telson;
    const legL = g.legLen * (ventral ? 2.6 : 1);
    return {
      antenna: [-(a * 0.55 + A * 0.55) * 0.7, -A * 0.5],
      antennule: [a * 0.22, hh * 0.1],
      eye: [a * 0.74, hh * 0.5],
      head: [-a * 0.25, hh * 0.62],
      pereon: [0, s[3].y + s[3].h * 0.5],
      epimeron: [s[2].w / 2 * 0.86, s[2].y + s[2].h * 0.8 + s[2].k],
      leg: [-(s[4].w / 2 + legL * 0.7), s[4].y + s[4].h * 0.55 + s[4].k * 0.8 + legL * 0.12],
      pleon: [0, p[2].y + p[2].h * 0.5],
      telson: [0, t.y + t.h * 0.42],
      uropod: [t.w / 2 * 0.95 + g.uroLen * 0.2, t.y + t.h + g.uroLen * 0.55],
      mouth: [0, hh * 0.72],
      sternal: [0, s[1].y + s[1].h * 0.55 + s[1].k * 0.3],
      marsupium: [-s[3].w * 0.2, s[3].y + s[3].h * 0.5],
      pleopod: [-p[2].w * 0.24, p[2].y + p[2].h * 0.6],
      lung: [p[0].w * 0.22, p[0].y + p[0].h * 0.6]
    };
  }

  function anatomySvg(ventral) {
    const look = ventral
      ? { shape: 'porcellio', c1: '#a89f8e', seed: 'anat-v' }
      : { shape: 'porcellio', c1: '#7b746a', pat: 'tubercles', tubCol: '#a49c8c', seed: 'anat' };
    const parts = ventral ? C.ANATOMIE.ventral : C.ANATOMIE.dorsal;
    return D.isopod(look, {
      ventral, padX: 112, padY: 6, title: ventral ? 'Cloporte vu de dessous' : 'Cloporte vu de dessus',
      overlay(g, vb) {
        const an = anatomyAnchors(g, ventral);
        const left = vb[0] + 6, right = vb[0] + vb[2] - 6;
        let alt = 0;
        const items = parts.map(p => {
          const [x, y] = an[p.anchor];
          let side = x < -1 ? -1 : x > 1 ? 1 : (alt++ % 2 ? -1 : 1);
          return { p, x, y, side, ly: y };
        });
        [-1, 1].forEach(side => {
          const col = items.filter(i => i.side === side).sort((a, b) => a.y - b.y);
          for (let i = 1; i < col.length; i++) if (col[i].ly - col[i - 1].ly < 22) col[i].ly = col[i - 1].ly + 22;
        });
        return items.map(i => {
          const lx = i.side < 0 ? left : right;
          const tx = lx;
          const tw = i.p.nom.length * 6.2 + 10;
          const lineEnd = i.side < 0 ? lx + tw : lx - tw;
          return `<g class="hotspot" data-part="${i.p.id}" tabindex="0" role="button" aria-label="${esc(i.p.nom)}">
            <line x1="${i.x.toFixed(1)}" y1="${i.y.toFixed(1)}" x2="${lineEnd.toFixed(1)}" y2="${i.ly.toFixed(1)}"/>
            <circle class="pulse" cx="${i.x.toFixed(1)}" cy="${i.y.toFixed(1)}" r="6"/>
            <circle class="ring" cx="${i.x.toFixed(1)}" cy="${i.y.toFixed(1)}" r="5.5"/>
            <text x="${tx.toFixed(1)}" y="${(i.ly + 4).toFixed(1)}" text-anchor="${i.side < 0 ? 'start' : 'end'}">${esc(i.p.nom)}</text>
          </g>`;
        }).join('');
      }
    });
  }

  const ICONS = {
    molt: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M100 18c-30 0-44 18-46 50h92c-2-32-16-50-46-50z" fill="var(--moss)" opacity=".85"/><path d="M54 76c1 30 16 52 46 54 30-2 45-24 46-54z" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="5 5"/><path d="M58 40h84M55 58h90" stroke="var(--bg)" stroke-width="3"/><path d="M60 92h80M66 110h68" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="152" y="50" fill="var(--ink-2)" font-size="12" font-family="IBM Plex Mono, monospace">2</text><text x="152" y="108" fill="var(--ink-2)" font-size="12" font-family="IBM Plex Mono, monospace">1</text></svg>',
    ball: '<svg viewBox="0 0 200 150" aria-hidden="true"><circle cx="100" cy="76" r="52" fill="var(--moss)" opacity=".85"/><path d="M56 50a52 52 0 0 1 88 0M50 68a52 52 0 0 1 100 0M49 86a52 52 0 0 1 102 0M54 104a52 52 0 0 1 92 0" stroke="var(--bg)" stroke-width="3" fill="none"/><ellipse cx="84" cy="54" rx="14" ry="7" fill="#fff" opacity=".18"/></svg>',
    lung: '<svg viewBox="0 0 200 150" aria-hidden="true"><g stroke="var(--moss)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M100 135V70M100 70L70 40M100 70l30-30M70 40L55 18M70 40l-2-26M130 40l15-22M130 40l2-26M100 90l-28 4M100 90l28 4M72 94l-16 14M128 94l16 14"/></g><circle cx="55" cy="18" r="5" fill="var(--lichen)"/><circle cx="68" cy="14" r="5" fill="var(--lichen)"/><circle cx="145" cy="18" r="5" fill="var(--lichen)"/><circle cx="132" cy="14" r="5" fill="var(--lichen)"/><circle cx="56" cy="108" r="5" fill="var(--lichen)"/><circle cx="144" cy="108" r="5" fill="var(--lichen)"/></svg>',
    blood: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M100 14C82 46 66 66 66 90a34 34 0 0 0 68 0c0-24-16-44-34-76z" fill="#5a8fb0"/><path d="M84 88a16 16 0 0 0 12 22" stroke="#cfe6f2" stroke-width="4" fill="none" stroke-linecap="round"/><text x="140" y="130" fill="var(--ink-2)" font-size="14" font-family="IBM Plex Mono, monospace">Cu</text></svg>',
    gas: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="100" cy="122" rx="60" ry="14" fill="var(--moss)" opacity=".8"/><g fill="none" stroke="var(--lichen)" stroke-width="2.5"><circle cx="80" cy="88" r="8"/><circle cx="110" cy="70" r="11"/><circle cx="92" cy="40" r="7"/><circle cx="126" cy="30" r="9"/><circle cx="70" cy="56" r="5"/></g><text x="136" y="92" fill="var(--ink-2)" font-size="13" font-family="IBM Plex Mono, monospace">NH₃</text></svg>',
    group: '<svg viewBox="0 0 200 150" aria-hidden="true"><g fill="var(--moss)"><ellipse cx="84" cy="70" rx="18" ry="26" transform="rotate(-20 84 70)"/><ellipse cx="116" cy="74" rx="18" ry="26" transform="rotate(15 116 74)" opacity=".85"/><ellipse cx="100" cy="100" rx="17" ry="24" transform="rotate(80 100 100)" opacity=".7"/><ellipse cx="62" cy="104" rx="14" ry="20" transform="rotate(50 62 104)" opacity=".6"/><ellipse cx="140" cy="108" rx="14" ry="20" transform="rotate(-40 140 108)" opacity=".6"/></g></svg>'
  };

  function viewAnatomy() {
    const cycleArt = [
      D.isopod({ shape: 'porcellio', c1: '#6a6560', pat: 'tubercles' }, { noShadow: true, padX: 10 }),
      D.isopod({ shape: 'porcellio', c1: '#b5ac9a' }, { noShadow: true, ventral: true, padX: 10 }),
      D.isopod({ shape: 'porcellio', c1: '#efe9dc', gloss: .4 }, { noShadow: true, padX: 90, padY: 90 }),
      D.isopod({ shape: 'porcellio', c1: '#b3aca0', pat: 'speckle', c2: '#d8d2c6', c3: '#8a847a' }, { noShadow: true, padX: 40, padY: 40 }),
      D.isopod({ shape: 'porcellio', c1: '#5d5f60', pat: 'tubercles' }, { noShadow: true })
    ];
    const html = `
    <div class="wrap">
      <header class="catalog-head">
        <p class="eyebrow">Morphologie · cycle de vie · adaptations</p>
        <h1>Anatomie d'un cloporte</h1>
        <div class="two-col" style="align-items:start">
          <p class="muted prose">Un cloporte est construit comme un crustacé en armure : une tête, sept segments thoraciques porteurs de pattes, un abdomen court. Touchez les points de la planche pour découvrir chaque organe, puis retournez l'animal pour voir ce qu'il cache sous le ventre.</p>
          <div class="tree" aria-label="Classification">${C.TAXO.map(([r, n]) => `<div><span>${r}</span><strong>${n}</strong></div>`).join('')}</div>
        </div>
      </header>

      <section class="anat" aria-label="Planche anatomique interactive">
        <div class="anat-figure">
          <div class="anat-toggle" role="group" aria-label="Face"><button type="button" data-face="dorsal" aria-pressed="true">Face dorsale</button><button type="button" data-face="ventral" aria-pressed="false">Face ventrale</button></div>
          <div id="anat-svg">${anatomySvg(false)}</div>
          <p class="anat-caption" id="anat-caption">Planche II · Porcellio sp., vue dorsale. Les points indiquent les organes décrits à droite.</p>
        </div>
        <div class="anat-parts" id="anat-parts"></div>
      </section>
    </div>

    <div class="spacer"></div>
    ${edge('--bg', '--stratum-2', 'a1')}
    <section class="stratum" data-s="2" aria-labelledby="cycle">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow">Cycle de vie</p><h2 id="cycle">De l'œuf à l'adulte</h2><p>Pas de larve ni de métamorphose : les jeunes sortent du ventre de leur mère déjà formés, puis grandissent de mue en mue.</p></div>
        <ol class="cycle" style="list-style:none;padding:0;margin:0">
          ${C.CYCLE.map((c, i) => `<li class="cycle-step">${cycleArt[i]}<span class="mono">${esc(c.t)}</span><h3>${esc(c.k)}</h3><p>${esc(c.d)}</p></li>`).join('')}
        </ol>
      </div>
    </section>
    ${edge('--stratum-2', '--stratum-3', 'a2')}
    <section class="stratum" data-s="3" aria-labelledby="adapt">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow">Adaptations</p><h2 id="adapt">Six solutions pour vivre hors de l'eau</h2></div>
        <div class="feature-band">${C.ADAPTATIONS.map(a => `<div class="feature">${ICONS[a.icon]}<h3>${esc(a.t)}</h3><p>${esc(a.d)}</p></div>`).join('')}</div>
      </div>
    </section>
    ${edge('--stratum-3', '--stratum-4', 'a3')}
    <section class="stratum" data-s="4" aria-labelledby="gloss">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow">Vocabulaire</p><h2 id="gloss">Glossaire</h2></div>
        <dl class="glossary">${C.GLOSSAIRE.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
      </div>
    </section>`;

    return {
      html, title: 'Anatomie · Oniscidea',
      mount() {
        let face = 'dorsal', active = null;
        const renderParts = () => {
          const parts = C.ANATOMIE[face];
          $('#anat-parts').innerHTML = parts.map((p, i) => `
            <div class="part${p.id === active ? ' active' : ''}" id="part-${p.id}">
              <button type="button" aria-expanded="${p.id === active}" data-part="${p.id}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span><h3>${esc(p.nom)}</h3><span class="sub">${esc(p.sci)}</span></span><span aria-hidden="true" class="mono" style="color:var(--moss)">${p.id === active ? '−' : '+'}</span></button>
              ${p.id === active ? `<div class="part-body"><p>${esc(p.txt)}</p></div>` : ''}
            </div>`).join('');
          $$('#anat-svg .hotspot').forEach(h => h.classList.toggle('active', h.dataset.part === active));
        };
        const activate = (id, fromFigure) => {
          active = active === id && !fromFigure ? null : id;
          renderParts();
          if (fromFigure && active) {
            const el = $('#part-' + id);
            if (el && window.innerWidth < 940) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          }
        };
        const bindHotspots = () => {
          $$('#anat-svg .hotspot').forEach(h => {
            h.addEventListener('click', () => activate(h.dataset.part, true));
            h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(h.dataset.part, true); } });
          });
        };
        $('#anat-parts').addEventListener('click', e => { const b = e.target.closest('button[data-part]'); if (b) activate(b.dataset.part, false); });
        $$('.anat-toggle button').forEach(b => b.addEventListener('click', () => {
          face = b.dataset.face; active = null;
          $$('.anat-toggle button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          $('#anat-svg').innerHTML = anatomySvg(face === 'ventral');
          $('#anat-caption').textContent = face === 'ventral' ? 'Planche III · Porcellio sp., vue ventrale d\'une femelle. Le marsupium est figuré en pointillés.' : 'Planche II · Porcellio sp., vue dorsale. Les points indiquent les organes décrits à droite.';
          bindHotspots(); renderParts();
        }));
        active = 'antennes';
        bindHotspots(); renderParts();
      }
    };
  }

  /* =========================================================
     GUIDE D'ÉLEVAGE
     ========================================================= */
  const LEVEL_SLUGS = { debutant: 1, intermediaire: 2, expert: 3 };
  function viewGuide(levelSlug) {
    let current = LEVEL_SLUGS[levelSlug] || 1;
    const menu = [
      ['Feuilles mortes', 'En permanence', 'Chêne, hêtre, charme, noisetier, catappa. Base de l\'alimentation et abri.'],
      ['Bois blanc pourri', 'En permanence', 'Hêtre, chêne, bouleau bien décomposés. Fibres, champignons et cachettes.'],
      ['Calcium', 'En permanence', 'Os de seiche, craie, coquilles d\'œufs ou d\'escargots broyées. Indispensable aux mues.'],
      ['Légumes', '1 à 2 fois par semaine', 'Courgette, carotte, concombre, patate douce. Retirer après 48 heures.'],
      ['Protéines', '1 fois par semaine', 'Flocons de poisson, granulés pour crevettes, insectes séchés. Évite le cannibalisme.'],
      ['Champignons, lichens', 'Occasionnel', 'Champignons de Paris, lichens tombés au sol, mousses. Très appréciés.'],
      ['À éviter', 'Jamais', 'Aliments cuisinés, salés ou traités, bois de résineux frais, végétaux traités aux pesticides.']
    ];
    const panel = n => {
      const lv = C.NIVEAUX.find(x => x.n === n);
      const rec = ORDERED.filter(s => s.niveau === n).sort((a, b) => (a.statut === 'courant' ? 0 : 1) - (b.statut === 'courant' ? 0 : 1) || a.no - b.no).slice(0, 8);
      return `<div class="level-panel" style="--lvl:var(--lvl-${n})" role="tabpanel" id="panel-${n}" aria-labelledby="tab-${n}">
        <div class="level-intro">
          <div><p class="eyebrow" style="color:var(--lvl)">Niveau ${lv.titre.toLowerCase()}</p><h2>${esc(lv.accroche)}</h2><p class="muted prose">${esc(lv.intro)}</p></div>
          <div class="note-card"><p class="eyebrow" style="color:var(--lvl)">Le matériel</p><ul class="checklist">${lv.checklist.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
        </div>
        <div class="topics">${lv.topics.map((t, i) => `<div class="topic"><span class="eyebrow">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t.t)}</h3><p>${esc(t.d)}</p></div>`).join('')}</div>
        <div><div class="section-head" style="margin-bottom:var(--s-4)"><h2 style="font-size:clamp(1.6rem,3vw,2.3rem)">Espèces conseillées</h2><p>Une sélection parmi les ${ORDERED.filter(s => s.niveau === n).length} espèces de niveau ${lv.titre.toLowerCase()}.</p></div>
          <div class="grid-specimens">${rec.map(card).join('')}</div></div>
        <div class="two-col" style="align-items:start">
          <div class="note-card"><p class="eyebrow" style="color:var(--rust)">Erreurs fréquentes</p><ul class="tips warn">${lv.erreurs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>
          <div class="note-card"><p class="eyebrow">Étape suivante</p><p>${n < 3 ? `Quand vos colonies se reproduisent régulièrement, passez au niveau ${C.NIVEAUX[n].titre.toLowerCase()}.` : 'Partagez vos observations avec d\'autres éleveurs : les données d\'élevage des espèces rares sont encore très lacunaires.'}</p><a class="link-arrow" href="#terrariums">Voir les setups de terrarium ${ARROW.replace('<svg', '<svg width="18" height="18"')}</a></div>
        </div>
      </div>`;
    };
    const html = `
    <div class="wrap">
      <header class="catalog-head">
        <p class="eyebrow">Guide d'élevage</p>
        <h1>Élever des cloportes</h1>
        <p class="muted prose">Trois niveaux, du premier bac au maintien d'espèces rares. Choisissez le vôtre : chaque palier rassemble le matériel, les notions clés, les erreurs à éviter et les espèces adaptées.</p>
      </header>
      <div class="tabs" role="tablist" aria-label="Niveau">
        ${C.NIVEAUX.map(lv => `<button class="tab" role="tab" type="button" id="tab-${lv.n}" aria-controls="panel-${lv.n}" aria-selected="${lv.n === current}" data-level="${lv.n}" style="--lvl:var(--lvl-${lv.n})"><strong>${lv.titre}</strong><span>${esc(lv.accroche)}</span></button>`).join('')}
      </div>
      <div id="level-panel">${panel(current)}</div>
    </div>
    <div class="spacer"></div>
    ${edge('--bg', '--stratum-2', 'g1')}
    <section class="stratum" data-s="2" aria-labelledby="menu">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow">Pour tous les niveaux</p><h2 id="menu">Le menu du cloporte</h2><p>Des détritivores peu difficiles, mais qui ont besoin de variété, de calcium et d'un peu de protéines.</p></div>
        <div class="table-wrap"><table class="menu-table"><thead><tr><th scope="col">Aliment</th><th scope="col">Fréquence</th><th scope="col">Détails</th></tr></thead>
        <tbody>${menu.map(r => `<tr><td>${r[0]}</td><td><span class="freq">${r[1]}</span></td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>
      </div>
    </section>
    ${edge('--stratum-2', '--stratum-3', 'g2')}
    <section class="stratum" data-s="3" aria-labelledby="pb">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow">Dépannage</p><h2 id="pb">Problèmes courants</h2><p>Les questions que tous les éleveurs finissent par se poser.</p></div>
        <div class="problems">${C.PROBLEMES.map(p => `<details class="problem"><summary>${esc(p.q)}</summary><div class="problem-body"><p>${esc(p.r)}</p></div></details>`).join('')}</div>
      </div>
    </section>`;
    return {
      html, title: 'Guide d\'élevage · Oniscidea',
      mount() {
        const tabs = $$('.tab');
        const select = n => {
          current = n;
          tabs.forEach(t => t.setAttribute('aria-selected', String(Number(t.dataset.level) === n)));
          $('#level-panel').innerHTML = panel(n);
          const slug = Object.keys(LEVEL_SLUGS).find(k => LEVEL_SLUGS[k] === n);
          try { history.replaceState(null, '', '#elevage-' + slug); } catch (e) { /* ignoré */ }
        };
        tabs.forEach(t => {
          t.addEventListener('click', () => select(Number(t.dataset.level)));
          t.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const n = ((current - 1 + (e.key === 'ArrowRight' ? 1 : 2)) % 3) + 1;
            select(n); $('#tab-' + n).focus();
          });
        });
      }
    };
  }

  /* =========================================================
     TERRARIUMS
     ========================================================= */
  function viewSetups() {
    const html = `
    <div class="wrap">
      <header class="catalog-head">
        <p class="eyebrow">Setups · coupes cotées</p>
        <h1>Terrariums</h1>
        <p class="muted prose">Sept montages éprouvés, du bac de départ au karst tropical. Chaque coupe indique les couches de substrat, leur épaisseur, les zones humides et sèches, et la position de l'aération.</p>
      </header>
      <div class="two-col" style="margin-bottom:var(--s-7)">
        <div class="note-card"><p class="eyebrow">Principe 1</p><h3>Le gradient</h3><p>Un côté humide, un côté sec. Les cloportes se déplacent selon leurs besoins, en particulier au moment de la mue.</p></div>
        <div class="note-card"><p class="eyebrow">Principe 2</p><h3>L'aération</h3><p>L'humidité sans air qui circule fait moisir et tue. Plus l'espèce vient d'un milieu sec, plus l'aération doit être forte.</p></div>
        <div class="note-card"><p class="eyebrow">Principe 3</p><h3>Le substrat nourricier</h3><p>Le sol est aussi le garde-manger : feuilles, bois pourri et humus se décomposent et nourrissent la colonie en continu.</p></div>
      </div>
      <nav class="setup-index" aria-label="Montages">
        ${C.SETUPS.map(st => `<a href="#${st.id}"><span class="chip chip-dot chip-lvl-${st.niveau}" style="justify-self:start">${L.niveau[st.niveau].court}</span><strong>${esc(st.nom)}</strong><span>${esc(st.sous)}</span></a>`).join('')}
      </nav>
      <div class="setups">
        ${C.SETUPS.map(st => `
        <section class="setup" id="${st.id}" aria-labelledby="t-${st.id}">
          <figure class="tank-figure">
            <div class="tank-scroll">${D.tank(st)}</div>
            <ul class="legend">${st.layers.slice().reverse().map(l => `<li><i style="background:${(D.MATS[l.mat] || {}).c}"></i>${(D.MATS[l.mat] || { label: l.mat }).label}</li>`).join('')}</ul>
          </figure>
          <div class="setup-text">
            <div class="tag-row">${levelChip(st.niveau)}<span class="chip">${esc(st.sous)}</span></div>
            <h2 id="t-${st.id}">${esc(st.nom)}</h2>
            <p>${esc(st.desc)}</p>
            <dl class="spec-list">
              <div><dt>Dimensions</dt><dd>${esc(st.dims)}</dd></div>
              <div><dt>Température</dt><dd>${esc(st.temp)}</dd></div>
              <div><dt>Humidité</dt><dd>${esc(st.hum)}</dd></div>
              <div><dt>Aération</dt><dd>${st.vent.charAt(0).toUpperCase() + st.vent.slice(1)}</dd></div>
            </dl>
            <div><p class="eyebrow" style="margin-bottom:.6rem">Recette du substrat</p>${recipeBars(st.recette)}</div>
            <div><p class="eyebrow" style="margin-bottom:.6rem">Montage</p><ol class="steps">${st.etapes.map(e => `<li>${esc(e)}</li>`).join('')}</ol></div>
            <div><p class="eyebrow" style="margin-bottom:.6rem">Entretien</p><ul class="leaf-list">${st.entretien.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>
            <div><p class="eyebrow" style="margin-bottom:.6rem">Espèces adaptées</p><div class="species-pills">${st.especes.map(id => BY_ID[id]).filter(Boolean).map(s => `<a class="species-pill" href="#sp.${s.id}">${esc(s.sci)}</a>`).join('')}</div></div>
          </div>
        </section>`).join('')}
      </div>
    </div>
    <div class="spacer"></div>`;
    return { html, title: 'Terrariums · Oniscidea' };
  }

  function viewNotFound() {
    return {
      html: `<div class="wrap"><div class="empty" style="min-height:50vh;align-content:center"><p class="eyebrow">Erreur 404</p><h1 style="font-size:clamp(2.4rem,6vw,4rem)">Rien sous cette écorce</h1><p>Cette page n'existe pas ou a été déplacée.</p><a class="btn btn-primary" href="#especes">Retour aux espèces ${ARROW}</a></div></div>`,
      title: 'Page introuvable · Oniscidea'
    };
  }

  /* =========================================================
     ROUTEUR
     ========================================================= */
  let cleanup = [];
  function parse() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'accueil';
    if (h.startsWith('sp.')) return { view: 'espece', id: h.slice(3) };
    if (h === 'elevage' || h.startsWith('elevage-')) return { view: 'elevage', level: h.slice(8) };
    if (h.startsWith('setup-')) return { view: 'terrariums', anchor: h };
    if (h.startsWith('sec-')) return null; // ancres internes d'une fiche
    if (['accueil', 'especes', 'anatomie', 'terrariums'].includes(h)) return { view: h };
    return { view: '404' };
  }

  let lastView = null;
  function render() {
    const r = parse();
    if (!r) return;
    cleanup.forEach(fn => { try { fn(); } catch (e) { /* ignoré */ } });
    cleanup = [];
    let v;
    switch (r.view) {
      case 'accueil': v = viewHome(); break;
      case 'especes': v = viewCatalog(); break;
      case 'espece': v = viewSpecies(r.id); break;
      case 'anatomie': v = viewAnatomy(); break;
      case 'elevage': v = viewGuide(r.level); break;
      case 'terrariums': v = viewSetups(); break;
      default: v = viewNotFound();
    }
    const main = $('#main');
    main.innerHTML = `<div class="view">${v.html}</div>`;
    document.title = v.title;
    const navKey = r.view === 'espece' ? 'especes' : r.view;
    $$('.nav a').forEach(a => { if (a.dataset.nav === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#nav').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    if (v.mount) v.mount();
    if (r.anchor) {
      const el = document.getElementById(r.anchor);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    } else if (lastView !== null) {
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    }
    lastView = r.view;
    updateDepth();
  }

  /* ---------- Défilement vers les sections internes ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-scroll]');
    if (!a) return;
    const el = document.getElementById(a.dataset.scroll);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- Jauge de profondeur ---------- */
  const LAYERS = [[0, 'litière'], [.2, 'humus'], [.45, 'horizon minéral'], [.75, 'roche mère']];
  let depthTick = false;
  function updateDepth() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    const fill = $('#depth-fill');
    if (fill) fill.style.height = (p * 100).toFixed(1) + '%';
    const cm = $('#depth-cm');
    if (cm) cm.textContent = Math.round(p * 80) + ' cm';
    const layer = LAYERS.filter(l => p >= l[0]).pop();
    const ly = $('#depth-layer');
    if (ly) ly.textContent = layer[1];
  }
  addEventListener('scroll', () => {
    if (depthTick) return;
    depthTick = true;
    requestAnimationFrame(() => { updateDepth(); depthTick = false; });
  }, { passive: true });

  /* ---------- Thème et menu ---------- */
  const root = document.documentElement;
  const savedTheme = store.get('oniscidea-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  function effectiveTheme() {
    const t = root.getAttribute('data-theme');
    if (t) return t;
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg>';
  function paintThemeBtn() {
    const b = $('#theme-toggle');
    const dark = effectiveTheme() === 'dark';
    b.innerHTML = dark ? SUN : MOON;
    b.setAttribute('aria-label', dark ? 'Passer au thème clair' : 'Passer au thème sombre');
  }
  $('#theme-toggle').addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('oniscidea-theme', next);
    paintThemeBtn();
  });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
  });
  paintThemeBtn();

  addEventListener('hashchange', render);
  render();
})();
