// P3 측정용: 변환 방식 A~D 를 아주 단순하게 구현해서 같은 시험 그림 12장으로 숫자를 비교한다.
// 실행: node lab/bench/p3-compare.js
// 시험 그림은 코드로 만든다(남의 사진 없음). 결과 숫자는 docs/prep/03-sonification.md 4절에 옮겨 적었다.
// 주의: 비교용 초안이다. 소리는 내지 않고 음표 목록만 만든다. P5 의 lab/compose.js 가 정식 구현.
'use strict';

/* ---------- 시험 그림 12장(결정적) ---------- */
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const W = 128, H = 96;
const KINDS = ['단색 파랑', '단색 빨강', '가로 그라데이션', '노을', '숲', '야경', '흑백', '잡음', '세로 줄무늬', '바둑판', '파스텔', '색 덩어리'];
function makeImage(kind, noiseSeed) {
  const d = new Uint8ClampedArray(W * H * 4), r = rng(11 + KINDS.indexOf(kind));
  const stars = Array.from({ length: 40 }, () => [Math.floor(r() * W), Math.floor(r() * H * 0.6)]);
  const blobs = Array.from({ length: 7 }, () => ({ x: r() * W, y: r() * H, rad: 10 + r() * 22, c: [r() * 255, r() * 255, r() * 255] }));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, t = y / H, u = x / W; let c;
    switch (kind) {
      case '단색 파랑': c = [40, 90, 200]; break;
      case '단색 빨강': c = [210, 50, 40]; break;
      case '가로 그라데이션': c = [30 + 200 * u, 80 + 60 * u, 220 - 180 * u]; break;
      case '노을': c = [250 - 130 * t, 150 - 110 * t + 30 * Math.sin(u * 6), 80 + 50 * t]; break;
      case '숲': { const n = r(); c = [30 + 50 * n, 90 + 90 * n + 30 * Math.sin(u * 20), 30 + 40 * n]; if (t < 0.2) c = [150, 200, 230]; break; }
      case '야경': c = [8 + 10 * t, 10 + 14 * t, 30 + 30 * t]; if (t > 0.6 && (x % 9 < 3) && (y % 7 < 3)) c = [240, 200, 90]; break;
      case '흑백': { const v = 40 + 180 * (0.5 + 0.5 * Math.sin(u * 9 + t * 5)); c = [v, v, v]; break; }
      case '잡음': c = [r() * 255, r() * 255, r() * 255]; break;
      case '세로 줄무늬': c = [[230, 60, 60], [250, 220, 70], [60, 160, 90], [60, 90, 210]][Math.floor(u * 16) % 4]; break;
      case '바둑판': c = ((x >> 3) + (y >> 3)) % 2 ? [245, 245, 245] : [20, 20, 20]; break;
      case '파스텔': c = [235 - 30 * u, 205 + 25 * t, 225 - 20 * t]; break;
      default: c = [240, 235, 225]; for (const b of blobs) if (Math.hypot(x - b.x, y - b.y) < b.rad) c = b.c;
    }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  if (kind === '야경') for (const [sx, sy] of stars) { const i = (sy * W + sx) * 4; d[i] = d[i + 1] = d[i + 2] = 230; }
  if (noiseSeed) { const q = rng(noiseSeed); for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] += Math.round((q() - 0.5) * 6); } // ±3: 브라우저마다 축소 결과가 조금 다른 상황 흉내
  return d;
}

/* ---------- 분석(02 문서의 필수 특징만) ---------- */
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dd = mx - mn;
  let h = 0; if (dd) { h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h = (h * 60 + 360) % 360; }
  return { h, s: dd ? dd / (1 - Math.abs(2 * l - 1)) : 0, l };
}
function analyze(d) {
  const n = W * H, L = new Float64Array(n); let sb = 0, ss = 0, sw = 0;
  const bins = new Map();
  const cols = Array.from({ length: 16 }, () => ({ r: 0, g: 0, b: 0, n: 0, up: 0, lw: 0, rows: [0, 0, 0], rn: [0, 0, 0] }));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, i = p * 4, r = d[i], g = d[i + 1], b = d[i + 2], l = lum(r, g, b), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    L[p] = l; sb += l; ss += mx ? (mx - mn) / mx : 0; sw += (r - b) / 255;
    const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4), e = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 }; e.n++; e.r += r; e.g += g; e.b += b; bins.set(key, e);
    const c = cols[Math.min(15, Math.floor(x * 16 / W))]; c.r += r; c.g += g; c.b += b; c.n++; c.up += l * (1 - y / H); c.lw += l;
    const row = Math.min(2, Math.floor(y * 3 / H)); c.rows[row] += l; c.rn[row]++;
  }
  const bri = sb / n; let v = 0; for (let p = 0; p < n; p++) v += (L[p] - bri) ** 2;
  let edge = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const a = (dx, dy) => L[(y + dy) * W + x + dx] * 255;
    const gx = a(1, -1) + 2 * a(1, 0) + a(1, 1) - a(-1, -1) - 2 * a(-1, 0) - a(-1, 1), gy = a(-1, 1) + 2 * a(0, 1) + a(1, 1) - a(-1, -1) - 2 * a(0, -1) - a(1, -1);
    if (Math.hypot(gx, gy) > 80) edge++;
  }
  const cand = [...bins.entries()].map(([key, e]) => { const c = [e.r / e.n, e.g / e.n, e.b / e.n], mx = Math.max(...c), mn = Math.min(...c); return { key, c, score: e.n * (0.35 + (mx ? (mx - mn) / mx : 0)) }; })
    .sort((a, b) => b.score - a.score || a.key - b.key);
  const pal = [];
  for (const x of cand) { if (pal.every(y => Math.hypot(x.c[0] - y.c[0], x.c[1] - y.c[1], x.c[2] - y.c[2]) > 48)) pal.push(x); if (pal.length >= 5) break; }
  return {
    brightness: bri, contrast: Math.sqrt(v / n), saturation: ss / n, warmth: sw / n, edgeDensity: edge / n,
    palette: pal.map(x => hsl(...x.c)),
    columns: cols.map(c => ({ ...hsl(c.r / c.n, c.g / c.n, c.b / c.n), lum: c.lw / c.n, lift: c.lw ? c.up / c.lw : 0.5, rows: c.rows.map((s, k) => s / c.rn[k]) })),
  };
}

/* ---------- 음악 공통 ---------- */
const PENTA_MAJ = [0, 2, 4, 7, 9], PENTA_MIN = [0, 3, 5, 7, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
const bin = (v, lo, hi, k) => Math.max(0, Math.min(k - 1, Math.floor((v - lo) / (hi - lo) * k)));       // 값을 k 구간으로
const deg = (scale, root, idx) => root + scale[((idx % scale.length) + scale.length) % scale.length] + 12 * Math.floor(idx / scale.length);
const STEPS = 64; // 8분음표 64개 = 4/4 여덟 마디

// A. 팔레트 → 멜로디(지금 app.js 규칙: C 5음계 고정, 색상 36도마다 한 음, 빠르기 108 고정)
function composeA(f) {
  const ev = [], pal = f.palette.filter(c => c.s >= 0.12);
  for (let s = 0; s < STEPS; s++) {
    if (!pal.length) break; const c = pal[s % pal.length];
    ev.push({ t: s / 2, midi: deg(PENTA_MAJ, 60, Math.floor(c.h / 36) % 10), dur: 0.5, vel: 0.35 + c.s * 0.6, inst: 'lead' });
    if (s % 2 === 0) ev.push({ t: s / 2, midi: deg(PENTA_MAJ, 36, Math.floor(pal[0].h / 36) % 10), dur: 1, vel: 0.4, inst: 'bass' });
  }
  return { tempo: 108, root: 0, scale: MAJOR, ev };
}
// B. 좌→우 스캔 악보(C 5음계 고정, 칸마다 2박: 밝은 부분이 위쪽일수록 높은 음, 칸 밝기로 둘째 음)
function composeB(f) {
  const ev = [];
  f.columns.forEach((c, k) => {
    const a = bin(c.lift, 0.3, 0.7, 10), b = bin(c.lum, 0, 1, 10);
    ev.push({ t: k * 2, midi: deg(PENTA_MAJ, 60, a), dur: 1, vel: 0.4 + c.s * 0.5, inst: 'lead' });
    ev.push({ t: k * 2 + 1, midi: deg(PENTA_MAJ, 60, b), dur: 1, vel: 0.35 + c.s * 0.4, inst: 'lead' });
  });
  return { tempo: 96, root: 0, scale: MAJOR, ev };
}
// C. 영역별 레이어(C 5음계 고정: 위 1/3 = 패드, 가운데 = 멜로디, 아래 = 베이스)
function composeC(f) {
  const ev = [];
  for (let bar = 0; bar < 8; bar++) {
    const cs = f.columns.slice(bar * 2, bar * 2 + 2), avg = k => (cs[0].rows[k] + cs[1].rows[k]) / 2;
    ev.push({ t: bar * 4, midi: deg(PENTA_MAJ, 72, bin(avg(0), 0, 1, 5)), dur: 4, vel: 0.3, inst: 'pad' });
    ev.push({ t: bar * 4, midi: deg(PENTA_MAJ, 36, bin(avg(2), 0, 1, 5)), dur: 2, vel: 0.5, inst: 'bass' });
    ev.push({ t: bar * 4 + 2, midi: deg(PENTA_MAJ, 36, bin(avg(2), 0, 1, 5)), dur: 2, vel: 0.4, inst: 'bass' });
    cs.forEach((c, j) => { for (let q = 0; q < 2; q++) ev.push({ t: bar * 4 + j * 2 + q, midi: deg(PENTA_MAJ, 60, bin(c.rows[1], 0, 1, 8) + q * (c.lift > 0.5 ? 1 : -1)), dur: 1, vel: 0.45, inst: 'lead' }); });
  }
  return { tempo: 96, root: 0, scale: MAJOR, ev };
}
// D. 분위기 판정 → 조성·빠르기·화음 진행 + 스캔으로 멜로디 윤곽 + 가장자리 밀도로 리듬 밀도
const PROG = { maj: [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 0]], min: [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6]] }; // 음계 도수(0=으뜸)
const RHYTHM = [[1, 0, 0, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 0, 1, 0], [1, 0, 1, 0, 1, 0, 1, 0], [1, 0, 1, 1, 1, 0, 1, 0], [1, 1, 1, 0, 1, 1, 1, 0]];
function composeD(f) {
  const gray = f.saturation < 0.08;
  const valence = 0.69 * f.brightness + 0.22 * f.saturation + 0.1 * Math.max(0, f.warmth);
  const major = bin(valence, 0, 0.8, 4) >= 2, scale = major ? MAJOR : MINOR, penta = major ? PENTA_MAJ : PENTA_MIN;
  const dens = bin(f.edgeDensity, 0, 0.25, 5), tempo = 72 + 12 * Math.round((dens + bin(f.saturation, 0, 0.8, 5)) / 2);
  const main = f.palette[0], root = gray ? 9 : [0, 7, 2, 9, 4, 5][Math.floor(main.h / 60) % 6];          // 대표색 색상 60도마다 조(으뜸음)
  const prog = PROG[major ? 'maj' : 'min'][Math.min(2, Math.max(0, f.palette.length - 2)) % 3], pat = RHYTHM[dens];
  const reg = bin(f.brightness, 0, 1, 3) - 1, ev = [];
  for (let bar = 0; bar < 8; bar++) {
    const ch = prog[bar % 4], last = bar === 7, tones = [0, 2, 4].map(k => deg(scale, 48 + root, ch + k));
    tones.forEach(m => ev.push({ t: bar * 4, midi: m, dur: 4, vel: 0.28, inst: 'pad' }));
    ev.push({ t: bar * 4, midi: deg(scale, 36 + root, ch), dur: last ? 4 : 2, vel: 0.5, inst: 'bass' });
    if (!last && dens >= 1) ev.push({ t: bar * 4 + 2, midi: deg(scale, 36 + root, ch + (dens >= 3 ? 4 : 0)), dur: 2, vel: 0.42, inst: 'bass' });
    if (last) { ev.push({ t: bar * 4, midi: 60 + root + 12 * reg + (major ? 0 : 0), dur: 4, vel: 0.6, inst: 'lead' }); break; }   // 으뜸음으로 끝
    for (let q = 0; q < 8; q++) {
      if (!pat[q]) continue; const c = f.columns[(bar * 2 + (q >> 2)) % 16], strong = q % 4 === 0;
      const idx = bin(c.lift, 0.3, 0.7, 5) + bin(c.lum, 0, 1, 4) + (q % 4 === 3 ? 1 : 0);
      let m = deg(penta, 60 + root + 12 * reg, idx);
      if (strong) { const pcs = tones.map(x => x % 12); for (let k = 0; k < 4 && !pcs.includes(m % 12); k++) m = deg(penta, 60 + root + 12 * reg, idx - k - 1); if (!pcs.includes(m % 12)) m = tones[0] + 12 + 12 * reg; } // 센박은 화음 구성음
      ev.push({ t: bar * 4 + q / 2, midi: m, dur: pat[q + 1] ? 0.5 : 1, vel: (strong ? 0.6 : 0.45) + c.s * 0.2, inst: 'lead' });
    }
  }
  return { tempo, root, scale, ev };
}

/* ---------- 지표 ---------- */
const seconds = s => (Math.max(...s.ev.map(e => e.t + e.dur), 0)) * 60 / s.tempo;
const inScale = s => s.ev.length ? s.ev.filter(e => s.scale.includes(((e.midi - s.root) % 12 + 12) % 12)).length / s.ev.length : 1;
function signature(s) {
  const pc = new Array(12).fill(0), contour = new Array(STEPS).fill(0);
  for (const e of s.ev) { pc[e.midi % 12] += e.dur; if (e.inst === 'lead') { const k = Math.round(e.t * 2); if (k < STEPS) contour[k] = Math.max(contour[k], e.midi); } }
  return { pc, contour, tempo: s.tempo };
}
// 차이 지표(0=같음, 1=전혀 다름): 0.3×음 구성 차이 + 0.5×멜로디 윤곽 차이 + 0.2×빠르기 차이
function distance(a, b) {
  const dot = a.pc.reduce((s, v, i) => s + v * b.pc[i], 0), na = Math.hypot(...a.pc), nb = Math.hypot(...b.pc);
  const dpc = na && nb ? 1 - dot / (na * nb) : (na || nb ? 1 : 0);
  let dc = 0; for (let i = 0; i < STEPS; i++) dc += (!a.contour[i] !== !b.contour[i]) ? 1 : Math.min(12, Math.abs(a.contour[i] - b.contour[i])) / 12;
  return 0.3 * dpc + 0.5 * dc / STEPS + 0.2 * Math.min(1, Math.abs(a.tempo - b.tempo) / 48);
}

/* ---------- 실행 ---------- */
const METHODS = { 'A 팔레트→멜로디': composeA, 'B 좌→우 스캔': composeB, 'C 영역별 레이어': composeC, 'D 분위기+스캔 변주': composeD };
const feats = KINDS.map(k => analyze(makeImage(k))), featsNoisy = KINDS.map(k => analyze(makeImage(k, 99)));
console.log('방식 | 음계 안 음 비율 | 길이(초) 최소~최대 | 같은 입력 2번 같음 | 음표 0개인 그림 | 그림 쌍 차이 최소/중앙값 | 차이<0.05 쌍(66쌍 중) | ±3 잡음에도 완전히 같음(12장 중) | ±3 잡음에도 음높이·박자·빠르기 같음(12장 중)');
for (const [name, fn] of Object.entries(METHODS)) {
  const songs = feats.map(fn), sig = songs.map(signature), dist = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) dist.push(distance(sig[i], sig[j]));
  dist.sort((a, b) => a - b);
  const secs = songs.filter(s => s.ev.length).map(seconds);
  const same = feats.every((f, i) => JSON.stringify(fn(f)) === JSON.stringify(songs[i]));
  const stable = featsNoisy.filter((f, i) => JSON.stringify(fn(f)) === JSON.stringify(songs[i])).length;
  const notes = x => JSON.stringify([x.tempo, x.root, x.ev.map(e => [e.t, e.midi, e.dur, e.inst])]);
  const stableNotes = featsNoisy.filter((f, i) => notes(fn(f)) === notes(songs[i])).length;
  console.log([name, (Math.min(...songs.map(inScale)) * 100).toFixed(0) + '%', Math.min(...secs).toFixed(1) + '~' + Math.max(...secs).toFixed(1), same ? '예' : '아니오',
    songs.filter(s => !s.ev.length).length, Math.abs(dist[0]).toFixed(3) + ' / ' + dist[dist.length >> 1].toFixed(3), dist.filter(x => x < 0.05).length, stable, stableNotes].join(' | '));
}
console.log('\n방식 D 가 그림마다 고른 값');
feats.forEach((f, i) => { const s = composeD(f); console.log(`${KINDS[i]}: ${s.scale === MAJOR ? '장조' : '단조'}, 으뜸음 ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][s.root]}, ${s.tempo}BPM, ${seconds(s).toFixed(1)}초, 음표 ${s.ev.length}개 (밝기 ${f.brightness.toFixed(2)} 채도 ${f.saturation.toFixed(2)} 가장자리 ${f.edgeDensity.toFixed(3)} 색 ${f.palette.length}개)`); });
