/* =========================================================
   Oniscidea — moteur d'illustration
   Tout est dessiné en SVG à partir de paramètres :
   - Draw.isopod(look)   : un cloporte vu de dessus (ou de dessous)
   - Draw.scene()        : le sol forestier du héros
   - Draw.plateBg(milieu): le fond de planche d'une fiche
   - Draw.tank(setup)    : la coupe d'un terrarium
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Utilitaires ---------- */
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = typeof seed === 'number' ? seed : hashStr(String(seed));
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hex2rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  const lighten = (c, t) => mix(c, '#ffffff', t);
  const darken = (c, t) => mix(c, '#000000', t);
  const r1 = n => Math.round(n * 10) / 10;
  let uid = 0;
  const nid = p => p + '-' + (++uid).toString(36);

  /* ---------- Morphologies ----------
     L : longueur de référence, W : largeur max
     head/per/ple/tel : fractions de L (tête, péréion, pléon, pléotelson)
     prof : largeur relative des 7 péréionites ; plp : des 5 pléonites
     k : courbure des segments ; flare : recul des épimères
     ant : longueur des antennes ; uro : longueur des uropodes          */
  const SHAPES = {
    armadillidium: { L: 220, W: 132, head: .12, hw: .56, per: .63, ple: .15, tel: .08, prof: [.86, .95, .99, 1, .99, .96, .9], plp: [.86, .8, .72, .62, .5], k: .085, flare: .015, ant: .3, uro: .03, uroType: 'flush', tip: 'round', legs: .045, gloss: .26, telType: 'trunc' },
    cubaris: { L: 210, W: 146, head: .12, hw: .64, per: .64, ple: .15, tel: .08, prof: [.9, .98, 1, 1, .99, .96, .9], plp: [.88, .82, .74, .64, .52], k: .1, flare: .03, ant: .28, uro: .02, uroType: 'flush', tip: 'round', legs: .035, gloss: .2, telType: 'hourglass', frontal: true },
    porcellio: { L: 232, W: 118, head: .11, hw: .5, per: .6, ple: .16, tel: .1, prof: [.84, .94, .99, 1, .98, .93, .84], plp: [.62, .58, .52, .44, .34], k: .1, flare: .05, ant: .42, uro: .15, uroType: 'long', tip: 'point', legs: .12, gloss: .08, telType: 'point', lobes: true },
    oniscus: { L: 232, W: 134, head: .11, hw: .48, per: .62, ple: .15, tel: .1, prof: [.88, .97, 1, 1, .98, .94, .86], plp: [.7, .63, .56, .47, .37], k: .12, flare: .06, ant: .36, uro: .1, uroType: 'long', tip: 'point', legs: .1, gloss: .22, telType: 'point', lobes: true },
    philoscia: { L: 232, W: 100, head: .12, hw: .56, per: .62, ple: .15, tel: .09, prof: [.9, .96, 1, 1, .98, .95, .9], plp: [.6, .56, .5, .42, .32], k: .07, flare: .03, ant: .56, uro: .11, uroType: 'long', tip: 'round', legs: .16, gloss: .32, telType: 'point' },
    ligia: { L: 244, W: 98, head: .1, hw: .62, per: .6, ple: .16, tel: .1, prof: [.9, .96, 1, 1, .98, .95, .9], plp: [.84, .78, .72, .64, .56], k: .05, flare: .04, ant: .9, uro: .34, uroType: 'fork', tip: 'point', legs: .28, gloss: .2, telType: 'wide' },
    trichoniscus: { L: 222, W: 94, head: .13, hw: .6, per: .6, ple: .15, tel: .09, prof: [.88, .95, 1, 1, .98, .94, .88], plp: [.62, .58, .52, .45, .36], k: .06, flare: .02, ant: .42, uro: .1, uroType: 'long', tip: 'round', legs: .12, gloss: .16, telType: 'trunc' },
    tylos: { L: 212, W: 138, head: .12, hw: .58, per: .66, ple: .13, tel: .08, prof: [.9, .97, 1, 1, .99, .96, .9], plp: [.82, .76, .68, .6, .52], k: .08, flare: .01, ant: .12, uro: 0, uroType: 'none', tip: 'round', legs: .03, gloss: .32, telType: 'round' },
    agnarid: { L: 228, W: 128, head: .11, hw: .52, per: .62, ple: .15, tel: .1, prof: [.86, .95, .99, 1, .98, .94, .86], plp: [.66, .61, .55, .47, .37], k: .1, flare: .045, ant: .38, uro: .09, uroType: 'long', tip: 'point', legs: .11, gloss: .1, telType: 'point', lobes: true }
  };

  function geometry(shape, tweak) {
    const S = Object.assign({}, SHAPES[shape] || SHAPES.porcellio, tweak || {});
    const L = S.L, W = S.W;
    const g = { S, L, W, segs: [], pleon: [] };
    const hh = L * S.head, hw = W * S.hw;
    g.head = { y: 0, h: hh, w: hw };
    let y = hh * 0.7;
    const ph = L * S.per / 7;
    for (let i = 0; i < 7; i++) {
      const w = W * S.prof[i];
      g.segs.push({ y, h: ph, w, k: L * S.k * (w / W) * (i === 0 ? 1.7 : 1), flare: L * S.flare * (i >= 4 ? 1.35 : 1), i });
      y += ph;
    }
    const plh = L * S.ple / 5;
    for (let i = 0; i < 5; i++) {
      const w = W * S.plp[i];
      g.pleon.push({ y, h: plh, w, k: L * S.k * 0.55 * (w / W), flare: L * S.flare * 0.7, i, pl: true });
      y += plh;
    }
    const th = L * S.tel;
    g.telson = { y, h: th, w: W * S.plp[4] * (S.telType === 'wide' ? 1 : 0.78) };
    y += th;
    g.len = y;
    g.antLen = L * S.ant;
    g.uroLen = L * S.uro;
    g.legLen = L * S.legs;
    return g;
  }

  // position verticale d'un point du segment (t de 0 à 1, x en unités)
  function yAt(s, x, t) {
    const hw = s.w / 2;
    const q = Math.min(1, Math.abs(x) / hw);
    return s.y + t * s.h + s.k * q * q;
  }

  function segPath(s, tip) {
    const hw = s.w / 2;
    const ov = s.h * 0.3;
    const ySF = s.y + s.k;
    const yR = s.y + s.h + ov;
    const ySR = yR + s.k + s.flare;
    const tipX = hw * (tip === 'point' ? 0.955 : 0.99);
    const cF = 2 * s.y - ySF;
    const cR = 2 * yR - ySR;
    const bulge = tip === 'round' ? s.h * 0.42 : s.h * 0.16;
    return `M${r1(-hw)},${r1(ySF)} Q0,${r1(cF)} ${r1(hw)},${r1(ySF)} Q${r1(hw + bulge)},${r1((ySF + ySR) / 2)} ${r1(tipX)},${r1(ySR)} Q0,${r1(cR)} ${r1(-tipX)},${r1(ySR)} Q${r1(-hw - bulge)},${r1((ySF + ySR) / 2)} ${r1(-hw)},${r1(ySF)}Z`;
  }
  function rearArc(s, tip) {
    const hw = s.w / 2, ov = s.h * 0.3;
    const yR = s.y + s.h + ov, ySR = yR + s.k + s.flare;
    const tipX = hw * (tip === 'point' ? 0.955 : 0.99);
    return `M${r1(tipX)},${r1(ySR)} Q0,${r1(2 * yR - ySR)} ${r1(-tipX)},${r1(ySR)}`;
  }

  function headPath(g) {
    const { h, w } = g.head, a = w / 2;
    return `M${r1(-a)},${r1(h * 1.08)} C${r1(-a * 1.1)},${r1(h * 0.3)} ${r1(-a * 0.62)},0 0,0 C${r1(a * 0.62)},0 ${r1(a * 1.1)},${r1(h * 0.3)} ${r1(a)},${r1(h * 1.08)}Z`;
  }

  function telsonPath(g) {
    const t = g.telson, a = t.w / 2, y = t.y - t.h * 0.1, h = t.h * 1.1;
    switch (g.S.telType) {
      case 'trunc': return `M${r1(-a)},${r1(y)} L${r1(a)},${r1(y)} Q${r1(a * 0.8)},${r1(y + h * 0.7)} ${r1(a * 0.34)},${r1(y + h)} L${r1(-a * 0.34)},${r1(y + h)} Q${r1(-a * 0.8)},${r1(y + h * 0.7)} ${r1(-a)},${r1(y)}Z`;
      case 'hourglass': return `M${r1(-a)},${r1(y)} L${r1(a)},${r1(y)} Q${r1(a * 0.2)},${r1(y + h * 0.45)} ${r1(a * 0.44)},${r1(y + h)} L${r1(-a * 0.44)},${r1(y + h)} Q${r1(-a * 0.2)},${r1(y + h * 0.45)} ${r1(-a)},${r1(y)}Z`;
      case 'round': return `M${r1(-a)},${r1(y)} L${r1(a)},${r1(y)} Q${r1(a)},${r1(y + h)} 0,${r1(y + h)} Q${r1(-a)},${r1(y + h)} ${r1(-a)},${r1(y)}Z`;
      case 'wide': return `M${r1(-a)},${r1(y)} L${r1(a)},${r1(y)} Q${r1(a * 0.95)},${r1(y + h * 0.8)} ${r1(a * 0.25)},${r1(y + h)} L0,${r1(y + h * 1.12)} L${r1(-a * 0.25)},${r1(y + h)} Q${r1(-a * 0.95)},${r1(y + h * 0.8)} ${r1(-a)},${r1(y)}Z`;
      default: return `M${r1(-a)},${r1(y)} L${r1(a)},${r1(y)} Q${r1(a * 0.45)},${r1(y + h * 0.55)} 0,${r1(y + h * 1.05)} Q${r1(-a * 0.45)},${r1(y + h * 0.55)} ${r1(-a)},${r1(y)}Z`;
    }
  }

  function uropods(g, col, stroke) {
    const S = g.S, t = g.telson, a = t.w / 2, U = g.uroLen;
    let out = '';
    for (const sgn of [-1, 1]) {
      if (S.uroType === 'long') {
        const bx = sgn * a * 0.72, by = t.y + t.h * 0.15;
        const ex = sgn * (a * 0.95 + U * 0.22), ey = t.y + t.h + U;
        const mx = sgn * (a * 1.35), my = t.y + t.h * 0.7;
        out += `<path d="M${r1(bx - sgn * 3)},${r1(by)} Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)} Q${r1(sgn * a * 0.55)},${r1(t.y + t.h * 0.8)} ${r1(bx - sgn * 3)},${r1(by)}Z" fill="${col}" stroke="${stroke}" stroke-width=".8"/>`;
        out += `<path d="M${r1(sgn * a * 0.45)},${r1(t.y + t.h * 0.6)} L${r1(sgn * (a * 0.6 + U * 0.08))},${r1(t.y + t.h + U * 0.45)}" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`;
      } else if (S.uroType === 'fork') {
        const bx = sgn * a * 0.7, by = t.y + t.h * 0.8;
        const px = sgn * (a * 0.8), py = t.y + t.h + U * 0.18;
        out += `<path d="M${r1(bx)},${r1(by)} L${r1(px)},${r1(py)}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
        out += `<path d="M${r1(px)},${r1(py)} Q${r1(px + sgn * U * 0.08)},${r1(py + U * 0.5)} ${r1(px + sgn * U * 0.28)},${r1(py + U * 0.95)}" stroke="${col}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        out += `<path d="M${r1(px)},${r1(py)} Q${r1(px - sgn * U * 0.02)},${r1(py + U * 0.5)} ${r1(px + sgn * U * 0.06)},${r1(py + U * 0.82)}" stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      } else if (S.uroType === 'flush') {
        const y0 = t.y - t.h * 0.05, y1 = t.y + t.h * 0.95;
        out += `<path d="M${r1(sgn * a * 0.9)},${r1(y0)} L${r1(sgn * a * 1.45)},${r1(y0 + t.h * 0.2)} Q${r1(sgn * a * 1.25)},${r1(y1 - 2)} ${r1(sgn * a * 0.42)},${r1(y1)}Z" fill="${col}" stroke="${stroke}" stroke-width=".8"/>`;
      }
    }
    return out;
  }

  function antennae(g, col, joint, anim) {
    const A = g.antLen, a = g.head.w / 2, hh = g.head.h;
    if (A <= 0) return '';
    let out = '';
    const W0 = Math.max(2.2, g.W * 0.045);
    for (const sgn of [-1, 1]) {
      const p0 = [sgn * a * 0.5, hh * 0.28];
      const long = A > g.L * 0.6;
      const p2 = long ? [sgn * (a * 0.7 + A * 0.62), -A * 0.62] : [sgn * (a * 0.55 + A * 0.55), -A * 0.76];
      const p1 = [sgn * (a * 0.95 + A * 0.22), -A * 0.42];
      const n = long ? 12 : 7;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
        const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
        pts.push([x, y]);
      }
      let segs = '';
      for (let i = 0; i < n; i++) {
        const w = W0 * (1 - i / n * 0.72);
        segs += `<line x1="${r1(pts[i][0])}" y1="${r1(pts[i][1])}" x2="${r1(pts[i + 1][0])}" y2="${r1(pts[i + 1][1])}" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round"/>`;
        if (i > 0 && i < n) segs += `<circle cx="${r1(pts[i][0])}" cy="${r1(pts[i][1])}" r="${r1(w * 0.42)}" fill="${joint}"/>`;
      }
      if (anim) {
        const c = `${r1(p0[0])} ${r1(p0[1])}`, amp = 3 * sgn, dur = sgn > 0 ? 3.4 : 2.9;
        out += `<g><animateTransform attributeName="transform" type="rotate" values="${-amp} ${c};${amp} ${c};${-amp} ${c}" dur="${dur}s" repeatCount="indefinite"/>${segs}</g>`;
      } else out += segs;
    }
    return out;
  }

  function legs(g, col, long) {
    let out = '';
    const Lg = g.legLen * (long ? 2.6 : 1);
    if (Lg <= 0.5) return '';
    for (let i = 0; i < 7; i++) {
      const s = g.segs[i], hw = s.w / 2;
      const yb = s.y + s.h * 0.55 + s.k * 0.8;
      const dir = (i - 3) * 0.28;
      for (const sgn of [-1, 1]) {
        const x0 = sgn * hw * 0.78, x1 = sgn * (hw + Lg * 0.55), y1 = yb + dir * Lg * 0.3;
        const x2 = sgn * (hw + Lg), y2 = yb + dir * Lg + Lg * 0.25;
        out += `<path d="M${r1(x0)},${r1(yb)} L${r1(x1)},${r1(y1 - Lg * 0.18)} L${r1(x2)},${r1(y2)}" stroke="${col}" stroke-width="${r1(Math.max(1.6, g.W * 0.028))}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
    return out;
  }

  /* ---------- Motifs appliqués segment par segment ---------- */
  function patternFor(pat, s, look, R, isPleon) {
    const hw = s.w / 2, c2 = look.c2 || '#e8e0c8', c3 = look.c3 || darken(look.c1, .3);
    let out = '';
    const tMid = 0.55;
    switch (pat) {
      case 'spots': {
        const rows = look.spotRows || 'both';
        const rr = s.h * (isPleon ? 0.18 : 0.24);
        if (rows !== 'lat') for (const sg of [-1, 1]) out += `<ellipse cx="${r1(sg * hw * 0.27)}" cy="${r1(yAt(s, sg * hw * 0.27, tMid))}" rx="${r1(rr * 1.25)}" ry="${r1(rr)}" fill="${c2}"/>`;
        if (rows !== 'para') for (const sg of [-1, 1]) out += `<ellipse cx="${r1(sg * hw * 0.7)}" cy="${r1(yAt(s, sg * hw * 0.7, tMid + .05))}" rx="${r1(rr * 1.1)}" ry="${r1(rr * 0.9)}" fill="${c2}"/>`;
        if (rows === 'center') out += `<ellipse cx="0" cy="${r1(yAt(s, 0, tMid))}" rx="${r1(rr * 1.3)}" ry="${r1(rr)}" fill="${c2}"/>`;
        break;
      }
      case 'edge': {
        const x0 = hw * (look.edgeW ? 1 - look.edgeW : 0.74);
        for (const sg of [-1, 1]) out += `<rect x="${r1(sg > 0 ? x0 : -hw * 1.3)}" y="${r1(s.y - 4)}" width="${r1(hw * 1.3 - x0)}" height="${r1(s.h * 2 + s.k + s.flare + 8)}" fill="${look.edgeCol || c2}"/>`;
        break;
      }
      case 'stripes': {
        out += `<rect x="${r1(-hw * 1.3)}" y="${r1(s.y + s.h * 0.52)}" width="${r1(hw * 2.6)}" height="${r1(s.h * 0.34)}" fill="${c2}" transform="translate(0 ${r1(s.k * 0.55)})"/>`;
        break;
      }
      case 'bands': {
        if (s.i % 2 === 0) out += `<rect x="${r1(-hw * 1.3)}" y="${r1(s.y - 2)}" width="${r1(hw * 2.6)}" height="${r1(s.h * 2)}" fill="${c2}"/>`;
        break;
      }
      case 'dorsal': {
        const dw = look.dorsalW || 0.13;
        out += `<rect x="${r1(-hw * dw)}" y="${r1(s.y - 4)}" width="${r1(hw * dw * 2)}" height="${r1(s.h * 2)}" fill="${c2}"/>`;
        break;
      }
      case 'lines': {
        for (const sg of [-1, 1]) {
          out += `<rect x="${r1(sg * hw * 0.44 - hw * 0.07)}" y="${r1(s.y - 4)}" width="${r1(hw * 0.14)}" height="${r1(s.h * 2 + s.k)}" fill="${c2}"/>`;
          out += `<rect x="${r1(sg * hw * 0.8 - hw * 0.05)}" y="${r1(s.y - 4)}" width="${r1(hw * 0.1)}" height="${r1(s.h * 2 + s.k * 2)}" fill="${c3}"/>`;
        }
        break;
      }
      case 'marble': {
        const n = isPleon ? 2 : 4;
        for (let j = 0; j < n; j++) {
          const x = (R() * 2 - 1) * hw * 0.9, t = 0.2 + R() * 0.7;
          const col = R() < 0.6 ? c2 : c3;
          out += `<ellipse cx="${r1(x)}" cy="${r1(yAt(s, x, t))}" rx="${r1(s.h * (0.35 + R() * 0.55))}" ry="${r1(s.h * (0.25 + R() * 0.3))}" fill="${col}" transform="rotate(${r1(R() * 60 - 30)} ${r1(x)} ${r1(yAt(s, x, t))})"/>`;
        }
        break;
      }
      case 'dalmatian': {
        const n = isPleon ? 2 : 6;
        for (let j = 0; j < n; j++) {
          const x = (R() * 2 - 1) * hw * 0.92, t = 0.2 + R() * 0.7;
          out += `<circle cx="${r1(x)}" cy="${r1(yAt(s, x, t))}" r="${r1(s.h * (0.08 + R() * 0.14))}" fill="${c2}"/>`;
        }
        break;
      }
      case 'speckle': {
        const n = isPleon ? 4 : 12;
        for (let j = 0; j < n; j++) {
          const x = (R() * 2 - 1) * hw * 0.9, t = 0.15 + R() * 0.75;
          out += `<circle cx="${r1(x)}" cy="${r1(yAt(s, x, t))}" r="${r1(s.h * (0.04 + R() * 0.06))}" fill="${R() < .5 ? c2 : c3}" opacity=".85"/>`;
        }
        break;
      }
      case 'tubercles': {
        const n = isPleon ? 3 : 7, col = look.tubCol || lighten(look.c1, .22);
        for (let j = 0; j < n; j++) {
          const x = ((j + 0.5) / n * 2 - 1) * hw * 0.82, t = 0.45 + (j % 2) * 0.18;
          out += `<circle cx="${r1(x)}" cy="${r1(yAt(s, x, t))}" r="${r1(s.h * 0.1)}" fill="${col}" opacity=".7"/>`;
        }
        break;
      }
      case 'ribs': {
        for (const xf of [-.72, -.4, -.12, .12, .4, .72]) {
          const x = xf * hw;
          out += `<line x1="${r1(x)}" y1="${r1(yAt(s, x, .1))}" x2="${r1(x)}" y2="${r1(yAt(s, x, 1.05))}" stroke="${lighten(look.c1, .35)}" stroke-width="${r1(s.h * 0.14)}" stroke-linecap="round" opacity=".8"/>`;
        }
        break;
      }
      case 'blotch': {
        for (const sg of [-1, 1]) out += `<ellipse cx="${r1(sg * hw * 0.42)}" cy="${r1(yAt(s, sg * hw * 0.42, .5))}" rx="${r1(hw * 0.3)}" ry="${r1(s.h * 0.55)}" fill="${c2}"/>`;
        break;
      }
      case 'band-rear': {
        out += `<rect x="${r1(-hw * 1.3)}" y="${r1(s.y + s.h * 0.78)}" width="${r1(hw * 2.6)}" height="${r1(s.h * 0.6)}" fill="${c2}" transform="translate(0 ${r1(s.k * 0.7)})"/>`;
        break;
      }
    }
    return out;
  }

  function spikes(g, look, R) {
    let out = '';
    const col = look.spikeCol || look.c2 || lighten(look.c1, .3);
    const all = g.segs.concat(g.pleon.slice(0, 3));
    for (const s of all) {
      const hw = s.w / 2, h = s.h * (s.pl ? 0.7 : 1.1);
      for (const xf of (s.pl ? [-.3, .3] : [-.72, -.32, .32, .72])) {
        const x = xf * hw, y = yAt(s, x, .6);
        out += `<path d="M${r1(x - h * 0.28)},${r1(y)} L${r1(x)},${r1(y + h * 0.75)} L${r1(x + h * 0.28)},${r1(y)} Q${r1(x)},${r1(y - h * 0.3)} ${r1(x - h * 0.28)},${r1(y)}Z" fill="${col}" stroke="${darken(col, .4)}" stroke-width=".6"/>`;
        out += `<circle cx="${r1(x - h * 0.06)}" cy="${r1(y + h * 0.05)}" r="${r1(h * 0.08)}" fill="#fff" opacity=".45"/>`;
      }
    }
    return out;
  }

  function eyes(g, look) {
    if (look.blind) return '';
    const a = g.head.w / 2, hh = g.head.h;
    const n = look.eyeN || (g.S === SHAPES.trichoniscus ? 3 : 9);
    const col = look.eyeCol || '#0d0b08';
    let out = '';
    for (const sg of [-1, 1]) {
      const cx = sg * a * 0.74, cy = hh * 0.5, rr = Math.max(1.5, g.W * 0.018);
      out += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rr * (n > 3 ? 2.2 : 1.4))}" ry="${r1(rr * (n > 3 ? 2.6 : 1.5))}" fill="${col}"/>`;
      for (let i = 0; i < Math.min(n, 9); i++) {
        const ang = i / Math.min(n, 9) * Math.PI * 2;
        out += `<circle cx="${r1(cx + Math.cos(ang) * rr * 1.1)}" cy="${r1(cy + Math.sin(ang) * rr * 1.3)}" r="${r1(rr * 0.42)}" fill="${lighten(col, .25)}"/>`;
      }
      out += `<circle cx="${r1(cx - rr * 0.6)}" cy="${r1(cy - rr * 0.9)}" r="${r1(rr * 0.45)}" fill="#fff" opacity=".7"/>`;
    }
    return out;
  }

  /* ---------- Le cloporte ---------- */
  function isopod(look, opts) {
    opts = opts || {};
    look = Object.assign({ shape: 'porcellio', c1: '#7a7468' }, look || {});
    const g = geometry(look.shape, look.tweak);
    const S = g.S;
    const R = rng(look.seed || (look.c1 + look.c2 + look.shape + (look.pat || '')));
    const pats = Array.isArray(look.pat) ? look.pat : (look.pat ? [look.pat] : []);
    const base = look.c1;
    const edgeStroke = darken(base, .5);
    const gid = nid('g'), sid = nid('s'), clipBody = nid('c');

    const legCol = look.legCol || mix(lighten(base, .25), '#d8cdb5', .35);
    const antCol = look.antCol || darken(base, .12);
    const ventral = !!opts.ventral;

    let defs = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${r1(-g.W / 2)}" y1="0" x2="${r1(g.W / 2)}" y2="0">
      <stop offset="0" stop-color="${darken(base, .38)}"/><stop offset=".28" stop-color="${base}"/><stop offset=".5" stop-color="${lighten(base, .12)}"/><stop offset=".72" stop-color="${base}"/><stop offset="1" stop-color="${darken(base, .38)}"/></linearGradient>
      <radialGradient id="${sid}" cx="0" cy="${r1(g.len * 0.42)}" r="${r1(g.len * 0.5)}" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 ${r1(g.len * 0.42)}) scale(.28 1) translate(0 ${r1(-g.len * 0.42)})">
      <stop offset="0" stop-color="#fff" stop-opacity="${r1((look.gloss != null ? look.gloss : S.gloss) * 1.5)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

    let body = '';
    // Ombre portée
    if (!opts.noShadow) body += `<ellipse cx="0" cy="${r1(g.len * 0.55)}" rx="${r1(g.W * 0.56)}" ry="${r1(g.len * 0.5)}" fill="#000" opacity=".22" transform="translate(${r1(g.W * 0.04)} ${r1(g.len * 0.03)})"/>`;
    if (!ventral) body += `<g class="${opts.animLegs ? 'legs-anim' : ''}">${legs(g, legCol, false)}</g>`;
    body += antennae(g, antCol, lighten(antCol, .3), opts.animAnt);
    body += uropods(g, look.uroCol || mix(base, look.c2 || base, look.uroMix || 0), edgeStroke);

    const allSegs = [];
    // Du pléotelson vers la tête : chaque segment antérieur recouvre le suivant
    const telFill = look.telCol || `url(#${gid})`;
    body += `<path d="${telsonPath(g)}" fill="${telFill}" stroke="${edgeStroke}" stroke-width=".8"/>`;
    if (pats.includes('dorsal') && !ventral) {
      const t = g.telson;
      body += `<path d="M${r1(-t.w * .08)},${r1(t.y)} L${r1(t.w * .08)},${r1(t.y)} L0,${r1(t.y + t.h * .8)}Z" fill="${look.c2}"/>`;
    }
    const order = g.pleon.slice().reverse().concat(g.segs.slice(1).reverse());
    const drawSeg = (s) => {
      const d = segPath(s, S.tip);
      allSegs.push(d);
      const cid = nid('k');
      let seg = `<path d="${d}" fill="url(#${gid})" stroke="${edgeStroke}" stroke-width=".8"/>`;
      if (!ventral && pats.length) {
        let p = '';
        for (const pt of pats) if (pt !== 'spikes') p += patternFor(pt, s, look, R, !!s.pl);
        if (p) seg += `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})">${p}</g>`;
      }
      // marge postérieure sombre + reflet antérieur
      seg += `<path d="${rearArc(s, S.tip)}" stroke="${darken(base, .55)}" stroke-width="${r1(Math.max(1, s.h * .1))}" fill="none" opacity=".55"/>`;
      seg += `<path d="M${r1(-s.w * .36)},${r1(yAt(s, -s.w * .36, .18))} Q0,${r1(s.y + s.h * .1 - s.k * .2)} ${r1(s.w * .36)},${r1(yAt(s, s.w * .36, .18))}" stroke="#fff" stroke-width="${r1(Math.max(.7, s.h * .07))}" fill="none" opacity="${r1(.12 + (look.gloss != null ? look.gloss : S.gloss) * .5)}"/>`;
      return seg;
    };
    for (const s of order) body += drawSeg(s);

    // Tête puis premier péréionite qui l'enveloppe
    const hp = headPath(g);
    body += `<path d="${hp}" fill="${look.headCol || `url(#${gid})`}" stroke="${edgeStroke}" stroke-width=".8"/>`;
    if (S.lobes) {
      const a = g.head.w / 2;
      for (const sg of [-1, 1]) body += `<ellipse cx="${r1(sg * a * 0.86)}" cy="${r1(g.head.h * 0.36)}" rx="${r1(a * 0.2)}" ry="${r1(g.head.h * 0.24)}" fill="${look.headCol || darken(base, .08)}" stroke="${edgeStroke}" stroke-width=".7"/>`;
    }
    if (S.frontal) body += `<path d="M${r1(-g.head.w * .42)},${r1(g.head.h * .22)} Q0,${r1(-g.head.h * .25)} ${r1(g.head.w * .42)},${r1(g.head.h * .22)}" stroke="${lighten(look.headCol || base, .3)}" stroke-width="2" fill="none" opacity=".8"/>`;
    if (!ventral) body += eyes(g, look);
    body += drawSeg(g.segs[0]);

    if (!ventral && pats.includes('spikes')) body += spikes(g, look, R);
    if (ventral) body += ventralOverlay(g) + legs(g, legCol, true);
    // Brillance dorsale
    if (!ventral) body += `<ellipse cx="0" cy="${r1(g.len * 0.42)}" rx="${r1(g.W * 0.3)}" ry="${r1(g.len * 0.46)}" fill="url(#${sid})" pointer-events="none"/>`;

    // Cadre
    const A = g.antLen;
    const long = A > g.L * 0.6;
    const antX = g.head.w / 2 * (long ? 0.7 : 0.55) + A * (long ? 0.62 : 0.55);
    const legX = g.W / 2 + g.legLen * (ventral ? 2.6 : 1);
    const halfW = Math.max(antX + 6, legX + 6, g.W * 0.6 + 4) + (opts.padX || 0);
    const top = -(A * (long ? 0.62 : 0.76)) - 8 - (opts.padY || 0);
    const bottom = g.len + Math.max(g.uroLen, 4) + 10 + (opts.padY || 0);
    const vb = [-halfW, top, halfW * 2, bottom - top];
    const extra = opts.overlay ? opts.overlay(g, vb) : '';
    const cls = opts.cls ? ` class="${opts.cls}"` : '';
    const title = opts.title ? `<title>${opts.title}</title>` : '';
    const role = opts.title ? ' role="img"' : ' aria-hidden="true"';
    return `<svg${cls} viewBox="${vb.map(r1).join(' ')}" xmlns="http://www.w3.org/2000/svg"${role} preserveAspectRatio="xMidYMid meet">${title}<defs>${defs}</defs><g transform="${opts.rotate ? `rotate(${opts.rotate} 0 ${r1(g.len / 2)})` : ''}">${body}</g>${extra}</svg>`;
  }

  /* ---------- Vue ventrale pour la page anatomie ---------- */
  function ventralOverlay(g) {
    let out = '';
    const pale = '#efe6d0';
    // sternites (bande médiane)
    for (const s of g.segs) out += `<rect x="${r1(-s.w * 0.2)}" y="${r1(s.y + s.k * .3)}" width="${r1(s.w * 0.4)}" height="${r1(s.h * .92)}" rx="3" fill="#b9ad93" stroke="#6b604a" stroke-width=".7"/>`;
    // dépôts calciques sur les sternites 1 à 4
    for (let i = 0; i < 4; i++) { const s = g.segs[i]; out += `<ellipse cx="0" cy="${r1(s.y + s.h * .55 + s.k * .3)}" rx="${r1(s.w * .15)}" ry="${r1(s.h * .28)}" fill="#fbf8f0"/>`; }
    // marsupium
    const m0 = g.segs[1], m1 = g.segs[4];
    out += `<ellipse cx="0" cy="${r1((m0.y + m1.y + m1.h) / 2 + 4)}" rx="${r1(m0.w * .3)}" ry="${r1((m1.y + m1.h - m0.y) / 2)}" fill="#e8d9ae" fill-opacity=".35" stroke="#e8d9ae" stroke-dasharray="4 3" stroke-width="1.2"/>`;
    // pléopodes : 5 paires de plaques, pseudotrachées blanches sur les deux premières
    for (let i = 0; i < 5; i++) {
      const s = g.pleon[i];
      for (const sg of [-1, 1]) {
        out += `<path d="M${r1(sg * 2)},${r1(s.y)} Q${r1(sg * s.w * .38)},${r1(s.y - 2)} ${r1(sg * s.w * .36)},${r1(s.y + s.h * 1.2)} L${r1(sg * 2)},${r1(s.y + s.h * 1.3)}Z" fill="#c9bb9c" stroke="#6b604a" stroke-width=".7"/>`;
        if (i < 2) out += `<ellipse cx="${r1(sg * s.w * .22)}" cy="${r1(s.y + s.h * .6)}" rx="${r1(s.w * .09)}" ry="${r1(s.h * .45)}" fill="${pale}" stroke="#fff" stroke-width=".6"/>`;
      }
    }
    // pièces buccales
    const hh = g.head.h;
    out += `<path d="M-10,${r1(hh * .45)} Q0,${r1(hh * .2)} 10,${r1(hh * .45)} L7,${r1(hh * .95)} L-7,${r1(hh * .95)}Z" fill="#8a7d63" stroke="#4d4433" stroke-width=".7"/>`;
    return out;
  }

  /* ---------- Scène forestière du héros ---------- */
  function leafSymbols() {
    return `
    <symbol id="lf-beech" viewBox="-30 -46 60 92" overflow="visible"><path d="M0,-44 C20,-34 26,4 2,44 C-24,8 -22,-30 0,-44Z" fill="currentColor"/><path d="M0,-40 L1,42 M0,-26 L14,-30 M0,-14 L17,-16 M1,-2 L17,-2 M1,10 L15,13 M1,22 L11,26 M0,-26 L-13,-30 M0,-14 L-16,-16 M1,-2 L-17,-2 M1,10 L-15,12 M1,22 L-11,25" stroke="#000" stroke-opacity=".28" stroke-width="1.2" fill="none"/></symbol>
    <symbol id="lf-oak" viewBox="-34 -48 68 96" overflow="visible"><path d="M0,-46 C8,-44 6,-36 12,-34 C20,-32 16,-24 22,-20 C30,-16 22,-8 26,-2 C32,6 22,10 22,16 C24,24 14,24 12,30 C10,38 4,40 2,46 L-2,46 C-4,40 -10,38 -12,30 C-14,24 -24,24 -22,16 C-22,10 -32,6 -26,-2 C-22,-8 -30,-16 -22,-20 C-16,-24 -20,-32 -12,-34 C-6,-36 -8,-44 0,-46Z" fill="currentColor"/><path d="M0,-42 L0,46 M0,-26 L14,-22 M0,-8 L18,-2 M0,10 L16,18 M0,-26 L-14,-22 M0,-8 L-18,-2 M0,10 L-16,18" stroke="#000" stroke-opacity=".28" stroke-width="1.3" fill="none"/></symbol>
    <symbol id="lf-birch" viewBox="-26 -30 52 60" overflow="visible"><path d="M0,-28 C18,-18 22,8 0,28 C-22,8 -18,-18 0,-28Z" fill="currentColor"/><path d="M0,-24 L0,26 M0,-10 L10,-14 M0,2 L13,-1 M0,14 L10,12 M0,-10 L-10,-14 M0,2 L-13,-1 M0,14 L-10,12" stroke="#000" stroke-opacity=".25" stroke-width="1" fill="none"/></symbol>`;
  }

  function fern(x, y, len, ang, col, R, cls) {
    // fronde : rachis courbe + pinnules alternées
    const pts = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = ang + t * t * 0.9;
      pts.push([x + Math.sin(a) * len * t, y - Math.cos(a) * len * t]);
    }
    let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
    for (let i = 1; i <= n; i++) d += ` L${r1(pts[i][0])},${r1(pts[i][1])}`;
    let out = `<path d="${d}" stroke="${col}" stroke-width="3" fill="none"/>`;
    for (let i = 2; i < n; i++) {
      const t = i / n, [px, py] = pts[i];
      const a = ang + t * t * 0.9;
      const pl = len * 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 4;
      for (const sg of [-1, 1]) {
        const pa = a + sg * 1.15;
        const ex = px + Math.sin(pa) * pl, ey = py - Math.cos(pa) * pl;
        const mx = px + Math.sin(pa - sg * .3) * pl * .6, my = py - Math.cos(pa - sg * .3) * pl * .6;
        out += `<path d="M${r1(px)},${r1(py)} Q${r1(mx)},${r1(my - 6)} ${r1(ex)},${r1(ey)} Q${r1(mx)},${r1(my + 6)} ${r1(px)},${r1(py)}Z" fill="${col}"/>`;
      }
    }
    return `<g class="${cls || ''}">${out}</g>`;
  }

  function mushroom(x, y, s, cap, R) {
    const h = 34 * s, w = 30 * s;
    return `<g>
      <path d="M${r1(x - 4 * s)},${r1(y)} Q${r1(x - 3 * s)},${r1(y - h * .6)} ${r1(x - 2 * s)},${r1(y - h)} L${r1(x + 3 * s)},${r1(y - h)} Q${r1(x + 4 * s)},${r1(y - h * .5)} ${r1(x + 5 * s)},${r1(y)}Z" fill="#e9dcc0"/>
      <path d="M${r1(x - w / 2)},${r1(y - h + 2 * s)} Q${r1(x - w / 2)},${r1(y - h - 18 * s)} ${r1(x)},${r1(y - h - 19 * s)} Q${r1(x + w / 2)},${r1(y - h - 18 * s)} ${r1(x + w / 2)},${r1(y - h + 2 * s)} Q${r1(x)},${r1(y - h - 3 * s)} ${r1(x - w / 2)},${r1(y - h + 2 * s)}Z" fill="${cap}"/>
      <path d="M${r1(x - w * .32)},${r1(y - h - 8 * s)} Q${r1(x - w * .1)},${r1(y - h - 17 * s)} ${r1(x + w * .12)},${r1(y - h - 15 * s)}" stroke="#fff" stroke-opacity=".35" stroke-width="${r1(2.2 * s)}" fill="none" stroke-linecap="round"/>
      ${R() < .6 ? `<circle cx="${r1(x - w * .15)}" cy="${r1(y - h - 10 * s)}" r="${r1(2 * s)}" fill="#f4ecd8" opacity=".85"/><circle cx="${r1(x + w * .2)}" cy="${r1(y - h - 8 * s)}" r="${r1(1.6 * s)}" fill="#f4ecd8" opacity=".85"/>` : ''}
    </g>`;
  }

  function mossMound(cx, cy, rx, ry, R, cols) {
    let out = '';
    const n = Math.round(rx * ry / 55);
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d * (Math.sin(a) < 0 ? 1 : .35);
      out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(2 + R() * 3.6)}" fill="${cols[Math.floor(R() * cols.length)]}"/>`;
    }
    return out;
  }

  function scene(opts) {
    opts = opts || {};
    const R = rng('sous-bois');
    const W = 1600, H = 900;
    const sky = nid('sky'), shaft = nid('sh'), fog = nid('fog'), fade = nid('fd'), logG = nid('lg'), blur = nid('bl'), cut = nid('cut');
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sc-sky1)"/><stop offset=".7" stop-color="var(--sc-sky2)"/></linearGradient>
      <linearGradient id="${shaft}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sc-shaft)" stop-opacity=".9"/><stop offset="1" stop-color="var(--sc-shaft)" stop-opacity="0"/></linearGradient>
      <linearGradient id="${fog}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sc-fog)" stop-opacity="0"/><stop offset=".55" stop-color="var(--sc-fog)" stop-opacity=".55"/><stop offset="1" stop-color="var(--sc-fog)" stop-opacity="0"/></linearGradient>
      <linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bg)" stop-opacity="0"/><stop offset="1" stop-color="var(--bg)" stop-opacity="1"/></linearGradient>
      <linearGradient id="${logG}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4430"/><stop offset=".45" stop-color="#3d2d1f"/><stop offset="1" stop-color="#21180f"/></linearGradient>
      <radialGradient id="${cut}"><stop offset="0" stop-color="#caa878"/><stop offset=".8" stop-color="#9c7a4f"/><stop offset="1" stop-color="#5e452c"/></radialGradient>
      <filter id="${blur}"><feGaussianBlur stdDeviation="6"/></filter>
      ${leafSymbols()}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${sky})"/>`;

    // Rayons de lumière
    s += `<g class="shaft">`;
    for (const [x, w, a] of [[980, 120, 18], [1180, 70, 18], [1320, 160, 18], [760, 60, 18]]) {
      s += `<polygon points="${x},-20 ${x + w},-20 ${x + w + 360},${H * .8} ${x + 200},${H * .8}" fill="url(#${shaft})" opacity=".55" transform="rotate(${-a / 6} ${x} 0)"/>`;
    }
    s += `</g>`;

    // Troncs lointains
    for (const [x, w, c] of [[140, 90, 'var(--sc-far)'], [520, 60, 'var(--sc-far)'], [1440, 120, 'var(--sc-far)'], [1060, 44, 'var(--sc-far)'], [330, 36, 'var(--sc-mid)'], [1290, 64, 'var(--sc-mid)']]) {
      s += `<path d="M${x},${H} L${x + w * .12},0 L${x + w * .88},0 L${x + w},${H}Z" fill="${c}"/>`;
    }
    s += `<rect y="${H * .25}" width="${W}" height="${H * .5}" fill="url(#${fog})"/>`;

    // Fougères de fond
    s += `<g opacity=".95">`;
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 185 + R() * 60;
      s += fern(x, 690, 230 + R() * 140, -0.9 + R() * 1.8, i % 2 ? 'var(--sc-mid)' : 'var(--sc-far)', R, 'sway');
    }
    s += `</g>`;

    // Sol
    s += `<path d="M0,${H * .7} C300,${H * .64} 520,${H * .72} 820,${H * .67} S1350,${H * .63} ${W},${H * .69} L${W},${H} L0,${H}Z" fill="var(--sc-ground)"/>`;

    // Mousse
    const mossCols = ['#3f5a25', '#4f6e2c', '#5f8034', '#6f9038', '#2f4520', '#86a348'];
    s += mossMound(120, 660, 110, 30, R, mossCols);
    s += mossMound(720, 646, 120, 28, R, mossCols);

    // Tronc couché
    s += `<g>
      <path d="M880,560 Q1180,520 1560,548 L1620,550 L1620,690 Q1240,700 900,662 Q840,640 850,600 Q858,566 880,560Z" fill="url(#${logG})"/>`;
    for (let i = 0; i < 14; i++) {
      const y = 570 + i * 8 + R() * 4;
      s += `<path d="M${920 + R() * 40},${y} Q${1180 + R() * 60},${y - 18 + R() * 8} ${1600},${y - 6}" stroke="#1a130c" stroke-opacity=".45" stroke-width="${1 + R() * 1.6}" fill="none"/>`;
    }
    s += `<ellipse cx="880" cy="612" rx="44" ry="54" fill="url(#${cut})"/>`;
    for (let i = 1; i < 8; i++) s += `<ellipse cx="${880 + i * .6}" cy="${612 + i * .4}" rx="${44 - i * 5.4}" ry="${54 - i * 6.6}" fill="none" stroke="#6e5234" stroke-opacity=".55" stroke-width="1.1"/>`;
    s += `<path d="M880,612 L862,570 M880,612 L906,660" stroke="#3b2a1a" stroke-width="1.4" opacity=".6"/>`;
    s += mossMound(1180, 548, 150, 18, R, mossCols);
    s += mossMound(1450, 552, 110, 16, R, mossCols);
    // polypore en console
    s += `<path d="M1300,610 Q1360,590 1400,612 Q1350,626 1300,618Z" fill="#b98a4e"/><path d="M1308,612 Q1352,600 1392,613" stroke="#e8cf9c" stroke-width="2" fill="none" opacity=".7"/>`;
    s += `<path d="M1330,640 Q1380,626 1412,644 Q1372,654 1330,648Z" fill="#a8783f"/>`;
    // champignons
    s += mushroom(1050, 552, 1.3, '#b4532f', R) + mushroom(1090, 548, .9, '#c26a3a', R) + mushroom(1122, 548, .7, '#a84a2a', R);
    s += mushroom(760, 650, 1.1, '#c9a25c', R) + mushroom(788, 648, .7, '#d4b16b', R);
    s += `</g>`;

    // Litière de feuilles
    const leafCols = ['#8a4b22', '#a2622a', '#6e3b1c', '#b07a35', '#5b3a1e', '#7a5a2a', '#9c4a2c', '#c08a3e', '#4f3a22', '#6d6a2e'];
    const kinds = ['lf-beech', 'lf-oak', 'lf-birch'];
    s += `<g>`;
    for (let i = 0; i < 190; i++) {
      const y = 640 + Math.pow(R(), .8) * 280;
      const x = R() * W;
      const depth = (y - 640) / 280;
      const sc = .35 + depth * .55 + R() * .2;
      const col = leafCols[Math.floor(R() * leafCols.length)];
      const k = kinds[Math.floor(R() * kinds.length)];
      const dim = 0.35 + depth * 0.65;
      s += `<use href="#${k}" x="-30" y="-46" width="60" height="92" color="${mix(col, '#120f0a', 1 - dim)}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(R() * 360)}) scale(${r1(sc)})"/>`;
    }
    // brindilles et glands
    for (let i = 0; i < 12; i++) {
      const x = R() * W, y = 700 + R() * 200, l = 40 + R() * 90, a = R() * 3;
      s += `<path d="M${r1(x)},${r1(y)} l${r1(Math.cos(a) * l)},${r1(Math.sin(a) * l * .3)}" stroke="#3a2a1a" stroke-width="${r1(2 + R() * 2)}" stroke-linecap="round"/>`;
    }
    for (const [x, y] of [[560, 800], [1240, 760], [300, 850]]) {
      s += `<g transform="translate(${x} ${y}) rotate(${r1(R() * 80 - 40)})"><ellipse cx="0" cy="6" rx="9" ry="12" fill="#8a6a2e"/><path d="M-11,0 Q0,-12 11,0 Q0,4 -11,0Z" fill="#5a4222"/></g>`;
    }
    s += `</g>`;

    // Cloportes en marche
    const walkers = opts.walkers || [];
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    walkers.forEach((w, i) => {
      const path = w.path;
      const sym = w.svg.replace('<svg', `<svg x="-60" y="-80" width="120" height="160"`);
      if (reduce) {
        s += `<g transform="translate(${w.still[0]} ${w.still[1]}) rotate(${w.still[2]}) scale(${w.scale})">${sym}</g>`;
      } else {
        s += `<g><g><animateMotion dur="${w.dur}s" repeatCount="indefinite" rotate="auto" path="${path}" begin="${-w.offset}s"/><g transform="rotate(90) scale(${w.scale})">${sym}</g></g></g>`;
      }
    });

    // Premier plan flou
    s += `<g filter="url(#${blur})" opacity=".9">`;
    s += `<use href="#lf-oak" x="-34" y="-48" width="68" height="96" color="#3b2412" transform="translate(90 880) rotate(-30) scale(3.2)"/>`;
    s += `<use href="#lf-beech" x="-30" y="-46" width="60" height="92" color="#4a2c14" transform="translate(1540 860) rotate(40) scale(3)"/>`;
    s += `</g>`;
    s += fern(1560, 900, 420, -1.1, '#1d2a16', R, 'sway');
    s += `<rect y="${H * .82}" width="${W}" height="${H * .18}" fill="url(#${fade})"/>`;
    s += `</svg>`;
    return s;
  }

  /* ---------- Fond de planche selon le milieu ---------- */
  function plateBg(milieu, seed) {
    const R = rng(seed || milieu);
    const W = 400, H = 500;
    const g1 = nid('pb'), vg = nid('vg');
    const themes = {
      foret: { a: '#27301d', b: '#171a11' },
      tropical: { a: '#1f3322', b: '#10170f' },
      mediterraneen: { a: '#3a3020', b: '#1c170f' },
      desert: { a: '#4a3a24', b: '#241b10' },
      littoral: { a: '#2c3434', b: '#151a1a' },
      grotte: { a: '#2a2a28', b: '#121211' },
      humide: { a: '#1f2f26', b: '#0f1612' },
      fourmiliere: { a: '#3a2a1c', b: '#1a120b' },
      urbain: { a: '#2e2c26', b: '#161511' }
    };
    const t = themes[milieu] || themes.foret;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><radialGradient id="${g1}" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></radialGradient>
      <radialGradient id="${vg}" cx="50%" cy="50%" r="60%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>${leafSymbols()}</defs>
      <rect width="${W}" height="${H}" fill="url(#${g1})"/>`;
    const leafCols = ['#6e3b1c', '#8a4b22', '#5b3a1e', '#7a5a2a', '#4f3a22'];
    if (milieu === 'foret' || milieu === 'urbain' || milieu === 'fourmiliere') {
      for (let i = 0; i < 26; i++) s += `<use href="#${['lf-beech', 'lf-oak', 'lf-birch'][i % 3]}" x="-30" y="-46" width="60" height="92" color="${mix(leafCols[i % 5], '#000', .35 + R() * .3)}" transform="translate(${r1(R() * W)} ${r1(R() * H)}) rotate(${r1(R() * 360)}) scale(${r1(.6 + R() * .7)})" opacity=".8"/>`;
    }
    if (milieu === 'tropical' || milieu === 'humide') {
      s += mossMound(80, 470, 160, 60, R, ['#28401f', '#335026', '#3f5f2c', '#22371a']);
      s += mossMound(360, 430, 110, 70, R, ['#28401f', '#335026', '#3f5f2c', '#22371a']);
      for (let i = 0; i < 18; i++) s += `<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r1(1.5 + R() * 3.5)}" fill="#bfe3e6" opacity="${r1(.15 + R() * .25)}"/>`;
      for (let i = 0; i < 8; i++) s += `<use href="#lf-beech" x="-30" y="-46" width="60" height="92" color="${mix('#3a4a22', '#000', .3 + R() * .3)}" transform="translate(${r1(R() * W)} ${r1(R() * H * .6)}) rotate(${r1(R() * 360)}) scale(${r1(.8 + R())})" opacity=".7"/>`;
    }
    if (milieu === 'mediterraneen' || milieu === 'desert') {
      for (let i = 0; i < 70; i++) { const rx = 4 + R() * 16; s += `<ellipse cx="${r1(R() * W)}" cy="${r1(R() * H)}" rx="${r1(rx)}" ry="${r1(rx * (.6 + R() * .3))}" fill="${mix('#6e5a3e', '#2a2216', R() * .7)}" opacity=".7"/>`; }
      for (let i = 0; i < 260; i++) s += `<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r1(.6 + R() * 1.2)}" fill="#c9b184" opacity="${r1(.1 + R() * .2)}"/>`;
      if (milieu === 'mediterraneen') for (let i = 0; i < 6; i++) s += `<path d="M${r1(R() * W)},${r1(R() * H)} q${r1(20 + R() * 30)},${r1(-10 - R() * 20)} ${r1(50 + R() * 40)},${r1(-5)}" stroke="#5f5a2c" stroke-width="2" fill="none" opacity=".5"/>`;
    }
    if (milieu === 'littoral') {
      for (let i = 0; i < 12; i++) s += `<path d="M-10,${r1(40 + i * 40 + R() * 10)} q100,-14 210,0 t220,0" stroke="#8f9a92" stroke-width="1.4" fill="none" opacity=".18"/>`;
      for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H; s += `<path d="M${r1(x)},${r1(y)} q10,-16 20,0 q-10,6 -20,0Z" fill="#cfc2a4" opacity=".35"/>`; }
      for (let i = 0; i < 40; i++) { const rx = 5 + R() * 14; s += `<ellipse cx="${r1(R() * W)}" cy="${r1(R() * H)}" rx="${r1(rx)}" ry="${r1(rx * .7)}" fill="${mix('#5d625e', '#1d2020', R() * .6)}" opacity=".7"/>`; }
    }
    if (milieu === 'grotte') {
      for (let i = 0; i < 9; i++) { const x = 20 + i * 45 + R() * 20, l = 30 + R() * 90; s += `<path d="M${r1(x - 10)},0 Q${r1(x)},${r1(l)} ${r1(x + 2)},${r1(l + 6)} Q${r1(x + 4)},${r1(l)} ${r1(x + 12)},0Z" fill="#4a4843" opacity=".7"/>`; }
      for (let i = 0; i < 30; i++) s += `<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r1(1 + R() * 2)}" fill="#d9d4c4" opacity="${r1(.08 + R() * .18)}"/>`;
    }
    if (milieu === 'fourmiliere') {
      for (let i = 0; i < 5; i++) s += `<path d="M${r1(R() * W)},${r1(R() * H)} q${r1(60 - R() * 120)},${r1(60 + R() * 40)} ${r1(80 - R() * 160)},${r1(120)}" stroke="#120c07" stroke-width="${r1(10 + R() * 8)}" fill="none" stroke-linecap="round" opacity=".6"/>`;
    }
    s += `<rect width="${W}" height="${H}" fill="url(#${vg})"/></svg>`;
    return s;
  }

  /* ---------- Coupe de terrarium ---------- */
  const MATS = {
    terreau: { c: '#3b2a1b', label: 'Terreau sans engrais' },
    humus: { c: '#2d2015', label: 'Humus de feuillus' },
    bois: { c: '#6b4a2b', label: 'Bois blanc pourri' },
    feuilles: { c: '#8a4b22', label: 'Feuilles mortes' },
    argile: { c: '#8c6a45', label: 'Argile / terre de jardin' },
    sable: { c: '#c7ab78', label: 'Sable fin' },
    calcaire: { c: '#cfc6b1', label: 'Gravier calcaire / craie' },
    sphaigne: { c: '#6d8a3e', label: 'Sphaigne' },
    coco: { c: '#5a3a22', label: 'Fibre de coco' },
    mousse: { c: '#4e6e2c', label: 'Mousse vivante' },
    cailloux: { c: '#7e7a70', label: 'Pierres plates' },
    drainage: { c: '#6b6f73', label: 'Couche drainante' }
  };

  function tank(setup, opts) {
    opts = opts || {};
    const R = rng(setup.id);
    const W = 860;
    const x0 = 64, x1 = 600, bot = 460;
    const totalCm = (setup.layers || []).reduce((a, l) => a + l.h, 0) || 1;
    const depthPx = Math.max(110, Math.min(300, totalCm * 17));
    const top = bot - depthPx - 170;
    const vbY = top - 78, H = bot - vbY + 56;
    const glass = nid('gl'), hum = nid('hu'), dry = nid('dr');
    let s = `<svg class="tank-svg" viewBox="0 ${vbY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"><title>Coupe du terrarium : ${setup.nom}</title>
      <defs>
        <linearGradient id="${glass}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".08"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".02"/><stop offset="1" stop-color="#ffffff" stop-opacity=".06"/></linearGradient>
        <linearGradient id="${hum}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5aa0b0" stop-opacity=".26"/><stop offset="1" stop-color="#5aa0b0" stop-opacity="0"/></linearGradient>
        <linearGradient id="${dry}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#e0a24a" stop-opacity=".22"/><stop offset="1" stop-color="#e0a24a" stop-opacity="0"/></linearGradient>
        ${leafSymbols()}
      </defs>
      <rect x="0" y="${vbY}" width="${W}" height="${H}" fill="var(--bg-2)"/>`;

    // couches
    const layers = setup.layers || [];
    const total = totalCm;
    let y = bot;
    const labels = [];
    layers.forEach((l, i) => {
      const h = l.h / total * depthPx;
      const m = MATS[l.mat] || { c: '#555', label: l.mat };
      const yt = y - h;
      let d = `M${x0},${r1(y)} L${x0},${r1(yt)}`;
      const steps = 12;
      for (let k = 1; k <= steps; k++) {
        const x = x0 + (x1 - x0) * k / steps;
        const slope = setup.slope ? (setup.slope * (k / steps - .5) * 30) : 0;
        d += ` L${r1(x)},${r1(yt + (R() - .5) * 6 + slope * (i === layers.length - 1 ? 1 : .6))}`;
      }
      d += ` L${x1},${r1(y)}Z`;
      s += `<path d="${d}" fill="${m.c}"/>`;
      // texture
      for (let k = 0; k < h * 3; k++) {
        const px = x0 + R() * (x1 - x0), py = yt + 6 + R() * Math.max(2, h - 8);
        s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(.8 + R() * 1.8)}" fill="${R() < .5 ? lighten(m.c, .18) : darken(m.c, .25)}" opacity=".7"/>`;
      }
      if (l.mat === 'bois') for (let k = 0; k < 5; k++) { const px = x0 + 30 + R() * (x1 - x0 - 90); s += `<rect x="${r1(px)}" y="${r1(yt + 4 + R() * (h - 12))}" width="${r1(30 + R() * 40)}" height="${r1(7 + R() * 5)}" rx="4" fill="${lighten(m.c, .15)}" stroke="${darken(m.c, .35)}" stroke-width="1"/>`; }
      if (l.mat === 'calcaire') for (let k = 0; k < 16; k++) s += `<ellipse cx="${r1(x0 + R() * (x1 - x0))}" cy="${r1(yt + 4 + R() * (h - 6))}" rx="${r1(3 + R() * 5)}" ry="${r1(2 + R() * 3)}" fill="#ece6d6"/>`;
      labels.push({ y: yt + h / 2, text: `${m.label}`, sub: `${l.h} cm`, col: m.c });
      y = yt;
    });
    const surf = y;

    // gradient humide / sec
    if (setup.gradient) {
      s += `<rect x="${x0}" y="${top}" width="${(x1 - x0) * .55}" height="${bot - top}" fill="url(#${hum})"/>`;
      s += `<rect x="${x0 + (x1 - x0) * .45}" y="${top}" width="${(x1 - x0) * .55}" height="${bot - top}" fill="url(#${dry})"/>`;
      for (let k = 0; k < 16; k++) s += `<path d="M${r1(x0 + 20 + R() * 180)},${r1(top + 20 + R() * (surf - top - 40))} q3,6 0,9 q-3,-3 0,-9Z" fill="#9fd0da" opacity=".7"/>`;
    }

    // décor de surface
    const items = setup.items || [];
    items.forEach(it => {
      const x = x0 + (x1 - x0) * it.x;
      if (it.t === 'liege') {
        const w = (it.w || .32) * (x1 - x0);
        s += `<path d="M${r1(x)},${r1(surf + 4)} Q${r1(x + w / 2)},${r1(surf - 70)} ${r1(x + w)},${r1(surf + 4)} L${r1(x + w - 12)},${r1(surf + 4)} Q${r1(x + w / 2)},${r1(surf - 52)} ${r1(x + 12)},${r1(surf + 4)}Z" fill="#8a6440" stroke="#4a3320" stroke-width="1.5"/>`;
        for (let k = 0; k < 8; k++) { const px = x + 14 + R() * (w - 28); s += `<circle cx="${r1(px)}" cy="${r1(surf - 30 - R() * 20 + Math.abs(px - x - w / 2) * .5)}" r="${r1(1.5 + R() * 2)}" fill="#5a3f26"/>`; }
      } else if (it.t === 'feuilles') {
        const w = (it.w || .6) * (x1 - x0);
        for (let k = 0; k < 22; k++) s += `<use href="#${['lf-beech', 'lf-oak', 'lf-birch'][k % 3]}" x="-30" y="-46" width="60" height="92" color="${['#8a4b22', '#a2622a', '#6e3b1c', '#b07a35', '#5b3a1e'][k % 5]}" transform="translate(${r1(x + R() * w)} ${r1(surf - 2 - R() * 10)}) rotate(${r1(70 + R() * 40)}) scale(${r1(.35 + R() * .25)} ${r1(.18 + R() * .1)})"/>`;
      } else if (it.t === 'mousse') {
        s += mossMound(x, surf - 2, (it.w || .12) * (x1 - x0), 14, R, ['#3f5a25', '#4f6e2c', '#5f8034', '#6f9038']);
      } else if (it.t === 'seiche') {
        s += `<ellipse cx="${r1(x)}" cy="${r1(surf - 6)}" rx="34" ry="9" fill="#f1ece0" stroke="#c9c1ad" stroke-width="1.2"/><path d="M${r1(x - 26)},${r1(surf - 6)} Q${r1(x)},${r1(surf - 12)} ${r1(x + 26)},${r1(surf - 6)}" stroke="#d8d0bc" fill="none"/>`;
      } else if (it.t === 'pierre') {
        s += `<path d="M${r1(x - 46)},${r1(surf + 2)} Q${r1(x - 40)},${r1(surf - 26)} ${r1(x)},${r1(surf - 28)} Q${r1(x + 44)},${r1(surf - 24)} ${r1(x + 50)},${r1(surf + 2)}Z" fill="#7e7a70" stroke="#4c4942" stroke-width="1.2"/><path d="M${r1(x - 20)},${r1(surf - 20)} q20,-6 40,0" stroke="#a6a196" fill="none" opacity=".6"/>`;
      } else if (it.t === 'gamelle') {
        s += `<path d="M${r1(x - 24)},${r1(surf - 12)} L${r1(x + 24)},${r1(surf - 12)} L${r1(x + 18)},${r1(surf + 2)} L${r1(x - 18)},${r1(surf + 2)}Z" fill="#b8b2a4" stroke="#6e6a60" stroke-width="1.2"/><ellipse cx="${r1(x - 6)}" cy="${r1(surf - 14)}" rx="8" ry="4" fill="#7d9a3a"/><ellipse cx="${r1(x + 8)}" cy="${r1(surf - 14)}" rx="7" ry="3.5" fill="#c77b34"/>`;
      } else if (it.t === 'branche') {
        s += `<path d="M${r1(x)},${r1(surf + 2)} Q${r1(x + 60)},${r1(surf - 60)} ${r1(x + 150)},${r1(surf - 90)}" stroke="#5a4029" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M${r1(x + 80)},${r1(surf - 48)} l30,-40" stroke="#5a4029" stroke-width="6" stroke-linecap="round"/>`;
      } else if (it.t === 'plante') {
        for (let k = 0; k < 5; k++) s += `<path d="M${r1(x)},${r1(surf)} Q${r1(x + (k - 2) * 18)},${r1(surf - 60)} ${r1(x + (k - 2) * 34)},${r1(surf - 90 - R() * 30)}" stroke="#4f7a32" stroke-width="3" fill="none"/><ellipse cx="${r1(x + (k - 2) * 34)}" cy="${r1(surf - 96 - R() * 20)}" rx="12" ry="6" fill="#5f8a3a" transform="rotate(${(k - 2) * 20} ${r1(x + (k - 2) * 34)} ${r1(surf - 96)})"/>`;
      } else if (it.t === 'eau') {
        s += `<path d="M${r1(x - 40)},${r1(surf - 4)} Q${r1(x)},${r1(surf + 18)} ${r1(x + 40)},${r1(surf - 4)}Z" fill="#4f8c9c" opacity=".8"/><path d="M${r1(x - 30)},${r1(surf - 2)} q15,-4 30,0 t30,0" stroke="#bfe3ea" fill="none" opacity=".6"/>`;
      } else if (it.t === 'coquillage') {
        s += `<path d="M${r1(x - 16)},${r1(surf)} Q${r1(x)},${r1(surf - 26)} ${r1(x + 16)},${r1(surf)}Z" fill="#e7dcc6" stroke="#a89a7e"/><path d="M${r1(x)},${r1(surf - 20)} L${r1(x - 8)},${r1(surf)} M${r1(x)},${r1(surf - 20)} L${r1(x + 8)},${r1(surf)} M${r1(x)},${r1(surf - 20)} L${r1(x)},${r1(surf)}" stroke="#a89a7e"/>`;
      } else if (it.t === 'fourmi') {
        s += `<circle cx="${r1(x)}" cy="${r1(surf - 4)}" r="3" fill="#1a120b"/><circle cx="${r1(x + 6)}" cy="${r1(surf - 4)}" r="4" fill="#1a120b"/>`;
      }
    });

    // bac en verre
    s += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bot - top}" fill="url(#${glass})" stroke="var(--ink-3)" stroke-width="2.5" rx="6"/>`;
    // couvercle + aération
    const vent = setup.vent || 'moyenne';
    s += `<rect x="${x0 - 8}" y="${top - 16}" width="${x1 - x0 + 16}" height="14" rx="4" fill="var(--bg-4)" stroke="var(--ink-3)" stroke-width="1.5"/>`;
    const ventW = vent === 'forte' ? .5 : vent === 'moyenne' ? .28 : .12;
    const vx = x0 + (x1 - x0) * (setup.gradient ? .55 : .5 - ventW / 2);
    for (let k = 0; k < (x1 - x0) * ventW / 8; k++) s += `<line x1="${r1(vx + k * 8)}" y1="${top - 13}" x2="${r1(vx + k * 8)}" y2="${top - 5}" stroke="var(--ink-2)" stroke-width="2"/>`;
    // flèches d'air
    for (let k = 0; k < (vent === 'forte' ? 3 : vent === 'moyenne' ? 2 : 1); k++) {
      const ax = vx + 20 + k * 50;
      s += `<path d="M${r1(ax)},${top - 22} q-8,-14 0,-26 q8,-12 0,-24" stroke="var(--moss)" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`;
    }
    if (setup.sideVent) {
      for (let k = 0; k < 6; k++) s += `<circle cx="${x1}" cy="${r1(top + 30 + k * 12)}" r="2.8" fill="var(--bg)" stroke="var(--ink-2)"/>`;
    }
    // étiquettes à droite
    const lx = x1 + 22;
    const labelYs = labels.map(l => l.y);
    // éviter les chevauchements
    for (let i = 1; i < labels.length; i++) if (labelYs[i - 1] - labelYs[i] < 44) labelYs[i] = labelYs[i - 1] - 44;
    labels.forEach((l, i) => {
      const ly = labelYs[i];
      s += `<path d="M${x1 - 30},${r1(l.y)} L${x1 + 8},${r1(l.y)} L${lx - 4},${r1(ly)}" stroke="var(--ink-3)" fill="none" stroke-width="1"/>`;
      s += `<rect x="${lx}" y="${r1(ly - 8)}" width="14" height="14" rx="3" fill="${l.col}"/>`;
      s += `<text x="${lx + 20}" y="${r1(ly + 4)}" fill="var(--ink)" font-family="Hanken Grotesk, sans-serif" font-size="17">${l.text}</text>`;
      s += `<text x="${lx + 20}" y="${r1(ly + 23)}" fill="var(--ink-3)" font-family="IBM Plex Mono, monospace" font-size="14">${l.sub}</text>`;
    });
    // cotes
    s += `<path d="M${x0 - 20},${r1(surf)} L${x0 - 20},${bot}" stroke="var(--ink-3)" stroke-width="1"/><path d="M${x0 - 26},${r1(surf)} h12 M${x0 - 26},${bot} h12" stroke="var(--ink-3)"/>`;
    s += `<text x="${x0 - 30}" y="${r1((surf + bot) / 2)}" fill="var(--ink-2)" font-family="IBM Plex Mono, monospace" font-size="14" text-anchor="middle" transform="rotate(-90 ${x0 - 30} ${r1((surf + bot) / 2)})">${total} cm</text>`;
    s += `<text x="${(x0 + x1) / 2}" y="${bot + 36}" fill="var(--ink-2)" font-family="IBM Plex Mono, monospace" font-size="15" text-anchor="middle">${setup.dims}</text>`;
    if (setup.gradient) {
      s += `<text x="${x0 + 14}" y="${top + 24}" fill="#6fb3c2" font-family="IBM Plex Mono, monospace" font-size="14">ZONE HUMIDE</text>`;
      s += `<text x="${x1 - 14}" y="${top + 24}" fill="#d9a352" font-family="IBM Plex Mono, monospace" font-size="14" text-anchor="end">ZONE SÈCHE</text>`;
    }
    s += `<text x="${x0}" y="${top - 32}" fill="var(--ink-2)" font-family="IBM Plex Mono, monospace" font-size="14">AÉRATION ${vent.toUpperCase()}</text>`;
    s += `</svg>`;
    return s;
  }

  /* ---------- Petits pictos ---------- */
  function sprout(level) {
    const stems = {
      1: `<path d="M60 110 Q60 80 62 60" stroke="currentColor" stroke-width="3" fill="none"/><path d="M62 70 Q40 58 36 40 Q56 44 62 70Z M62 62 Q82 48 90 30 Q68 34 62 62Z" fill="currentColor"/>`,
      2: `<path d="M60 112 Q58 70 64 30" stroke="currentColor" stroke-width="3" fill="none"/><path d="M60 88 Q36 80 28 60 Q52 62 60 88Z M62 72 Q88 64 96 44 Q70 46 62 72Z M63 50 Q44 40 42 22 Q60 28 63 50Z M64 38 Q80 28 84 12 Q66 18 64 38Z" fill="currentColor"/>`,
      3: `<path d="M60 112 L60 50" stroke="currentColor" stroke-width="4"/><path d="M60 54 Q20 54 14 34 Q14 12 60 8 Q106 12 106 34 Q100 54 60 54Z" fill="currentColor"/><circle cx="42" cy="30" r="5" fill="var(--bg-3)"/><circle cx="72" cy="22" r="4" fill="var(--bg-3)"/><circle cx="84" cy="38" r="3" fill="var(--bg-3)"/>`
    };
    return `<svg class="sprout" viewBox="0 0 120 120" aria-hidden="true">${stems[level] || stems[1]}</svg>`;
  }

  window.Draw = { isopod, scene, plateBg, tank, sprout, geometry, ventralOverlay, rng, mix, lighten, darken, SHAPES, MATS };
})();
