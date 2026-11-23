// P2 측정용: 사진 특징 계산이 얼마나 걸리는지 node 에서 잰다.
// 실행: node lab/bench/p2-bench.js
// 시험 그림은 코드로 만든다(남의 사진 없음). 결과 숫자는 docs/prep/02-image-analysis.md 4절에 옮겨 적었다.
// 주의: 여기 구현은 속도·결과 비교용 초안이다. P5 의 lab/analyze.js 가 정식 구현.
'use strict';

/* ---------- 시험 그림(결정적) ---------- */
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function makeImage(w, h, kind) {
  const d = new Uint8ClampedArray(w * h * 4), r = rng(7);
  const blobs = Array.from({ length: 6 }, () => ({ x: r() * w, y: r() * h, rad: (0.08 + r() * 0.2) * w, c: [r() * 255, r() * 255, r() * 255] }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, t = y / h;
    let c;
    if (kind === 'flat') c = [40, 90, 200];
    else if (kind === 'sunset') c = [250 - 120 * t, 140 - 100 * t + 40 * Math.sin(x / w * 6), 70 + 60 * t];
    else if (kind === 'noise') c = [r() * 255, r() * 255, r() * 255];
    else { // 'scene': 그라데이션 하늘 + 색 덩어리 + 잔무늬
      c = [90 + 100 * t, 150 - 40 * t, 230 - 150 * t];
      for (const b of blobs) { const dd = Math.hypot(x - b.x, y - b.y); if (dd < b.rad) c = b.c.map(v => v * (1 - 0.3 * dd / b.rad)); }
      const n = (r() - 0.5) * 24; c = c.map(v => v + n);
    }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return { data: d, w, h };
}

/* ---------- 팔레트 3종 ---------- */
// (1) 지금 app.js 방식: 4비트 칸 히스토그램 + 서로 먼 색 고르기
function paletteBins(data, k) {
  const n = new Uint32Array(4096), sr = new Float64Array(4096), sg = new Float64Array(4096), sb = new Float64Array(4096);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = (data[i] >> 4) << 8 | (data[i + 1] >> 4) << 4 | (data[i + 2] >> 4);
    n[key]++; sr[key] += data[i]; sg[key] += data[i + 1]; sb[key] += data[i + 2];
  }
  const cand = [];
  for (let key = 0; key < 4096; key++) if (n[key]) {
    const c = [sr[key] / n[key], sg[key] / n[key], sb[key] / n[key]];
    const mx = Math.max(...c), mn = Math.min(...c), s = mx ? (mx - mn) / mx : 0;
    cand.push({ c, n: n[key], score: n[key] * (0.35 + s) });
  }
  cand.sort((a, b) => b.score - a.score || 0);
  for (const gap of [70, 48, 30, 12]) {
    const out = [];
    for (const x of cand) { if (out.every(y => Math.hypot(x.c[0] - y.c[0], x.c[1] - y.c[1], x.c[2] - y.c[2]) > gap)) out.push(x); if (out.length >= k) break; }
    if (out.length >= Math.min(k, 3) || gap === 12) return out.map(o => o.c);
  }
  return [];
}
// (2) 중앙값 분할: 가장 넓게 퍼진 색 축을 가운데에서 자르기를 k 상자가 될 때까지
function paletteMedianCut(data, k) {
  const px = [];
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) px.push(i);
  if (!px.length) return [];
  let boxes = [px];
  const range = (box, ch) => { let lo = 255, hi = 0; for (const i of box) { const v = data[i + ch]; if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo; };
  while (boxes.length < k) {
    let bi = -1, bch = 0, best = 0;
    boxes.forEach((b, j) => { for (let ch = 0; ch < 3; ch++) { const sc = range(b, ch) * Math.sqrt(b.length); if (sc > best) { best = sc; bi = j; bch = ch; } } });
    if (bi < 0) break;
    const b = boxes[bi].slice().sort((p, q) => data[p + bch] - data[q + bch] || p - q), mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.filter(b => b.length).map(b => { let r = 0, g = 0, bl = 0; for (const i of b) { r += data[i]; g += data[i + 1]; bl += data[i + 2]; } return [r / b.length, g / b.length, bl / b.length]; });
}
// (3) k-평균: 시작점은 중앙값 분할 결과(무작위 없음 → 결정적), 반복 8회
function paletteKMeans(data, k, iters = 8) {
  let cen = paletteMedianCut(data, k);
  for (let it = 0; it < iters; it++) {
    const sum = cen.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      let bj = 0, bd = Infinity;
      for (let j = 0; j < cen.length; j++) { const dr = data[i] - cen[j][0], dg = data[i + 1] - cen[j][1], db = data[i + 2] - cen[j][2], dd = dr * dr + dg * dg + db * db; if (dd < bd) { bd = dd; bj = j; } }
      const s = sum[bj]; s[0] += data[i]; s[1] += data[i + 1]; s[2] += data[i + 2]; s[3]++;
    }
    cen = cen.map((c, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c);
  }
  return cen;
}
// 팔레트 품질: 각 픽셀을 가장 가까운 팔레트 색으로 바꿨을 때의 평균 제곱 오차(낮을수록 사진을 잘 대표)
function paletteMSE(data, pal) {
  let e = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    let bd = Infinity;
    for (const c of pal) { const dd = (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2; if (dd < bd) bd = dd; }
    e += bd; n++;
  }
  return e / n / 3;
}

/* ---------- 전체 통계: 밝기·대비·채도·따뜻함·색 풍부함 ---------- */
function stats(data) {
  const hist = new Uint32Array(256); let n = 0, sS = 0, sRG = 0, sYB = 0, sRG2 = 0, sYB2 = 0, warm = 0, sL = 0, sL2 = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b; hist[l | 0]++; sL += l; sL2 += l * l;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); sS += mx ? (mx - mn) / mx : 0;
    const rg = r - g, yb = 0.5 * (r + g) - b; sRG += rg; sYB += yb; sRG2 += rg * rg; sYB2 += yb * yb;
    warm += (r - b) / 255; n++;
  }
  if (!n) return null;
  const mean = sL / n, sd = Math.sqrt(Math.max(0, sL2 / n - mean * mean));
  const pct = q => { let a = 0; for (let v = 0; v < 256; v++) { a += hist[v]; if (a >= q * n) return v; } return 255; };
  const mrg = sRG / n, myb = sYB / n;
  const colorfulness = Math.sqrt(Math.max(0, sRG2 / n - mrg * mrg) + Math.max(0, sYB2 / n - myb * myb)) + 0.3 * Math.hypot(mrg, myb);
  return { brightness: mean / 255, contrast: sd / 255, p5: pct(.05) / 255, p95: pct(.95) / 255, saturation: sS / n, warmth: warm / n, colorfulness };
}

/* ---------- 가장자리 밀도(소벨) ---------- */
function edges(img) {
  const { data, w, h } = img, L = new Float32Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) L[p] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  let strong = 0, sum = 0, cnt = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x;
    const gx = -L[p - w - 1] - 2 * L[p - 1] - L[p + w - 1] + L[p - w + 1] + 2 * L[p + 1] + L[p + w + 1];
    const gy = -L[p - w - 1] - 2 * L[p - w] - L[p - w + 1] + L[p + w - 1] + 2 * L[p + w] + L[p + w + 1];
    const m = Math.hypot(gx, gy); sum += m; if (m > 80) strong++; cnt++;
  }
  return cnt ? { edgeDensity: strong / cnt, edgeMean: sum / cnt / 1020 } : { edgeDensity: 0, edgeMean: 0 };
}

/* ---------- 구도: 3×3 칸 평균, 세로줄 16개 스캔, 눈에 띄는 곳(전체 평균색과의 차이) ---------- */
function layout(img, cols = 16) {
  const { data, w, h } = img;
  const grid = Array.from({ length: 9 }, () => [0, 0, 0, 0]), col = Array.from({ length: cols }, () => [0, 0, 0, 0, 0]);
  let mr = 0, mg = 0, mb = 0;
  for (let i = 0; i < data.length; i += 4) { mr += data[i]; mg += data[i + 1]; mb += data[i + 2]; }
  const n = w * h; mr /= n; mg /= n; mb /= n;
  let sx = 0, sy = 0, sw = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    const gcell = grid[Math.min(2, (y * 3 / h) | 0) * 3 + Math.min(2, (x * 3 / w) | 0)]; gcell[0] += r; gcell[1] += g; gcell[2] += b; gcell[3]++;
    const c = col[Math.min(cols - 1, (x * cols / w) | 0)], l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    c[0] += r; c[1] += g; c[2] += b; c[3]++; c[4] += l * (1 - y / h); // c[4]: 밝은 부분이 얼마나 위쪽에 있는지
    const sal = Math.hypot(r - mr, g - mg, b - mb); sx += sal * x; sy += sal * y; sw += sal;
  }
  return {
    grid: grid.map(c => c[3] ? [c[0] / c[3], c[1] / c[3], c[2] / c[3]].map(Math.round) : [0, 0, 0]),
    columns: col.map(c => c[3] ? [c[0] / c[3], c[1] / c[3], c[2] / c[3]].map(Math.round) : [0, 0, 0]),
    focus: sw ? { x: sx / sw / w, y: sy / sw / h } : { x: .5, y: .5 },
  };
}

/* ---------- 측정 ---------- */
function time(fn, reps) { fn(); const t0 = process.hrtime.bigint(); for (let i = 0; i < reps; i++) fn(); return Number(process.hrtime.bigint() - t0) / 1e6 / reps; }
const f = v => v.toFixed(2).padStart(8);
console.log('node', process.version, '| 한 번 실행 평균 시간(ms)\n');
console.log('크기      | 칸묶기  중앙값분할 k평균(8회) | 통계     소벨     구도   | 합계(칸묶기 기준)');
for (const size of [64, 96, 128, 192, 256]) {
  const img = makeImage(size, size, 'scene'), reps = size <= 128 ? 60 : 15;
  const a = time(() => paletteBins(img.data, 5), reps), b = time(() => paletteMedianCut(img.data, 5), reps), c = time(() => paletteKMeans(img.data, 5), reps);
  const s = time(() => stats(img.data), reps), e = time(() => edges(img), reps), l = time(() => layout(img), reps);
  console.log(`${String(size).padStart(3)}×${String(size).padEnd(3)}   |${f(a)}${f(b)}  ${f(c)}     |${f(s)}${f(e)}${f(l)}   |${f(a + s + e + l)}`);
}
console.log('\n팔레트 품질(평균 제곱 오차, 낮을수록 좋음) — 128×128, 5색');
for (const kind of ['scene', 'sunset', 'noise', 'flat']) {
  const img = makeImage(128, 128, kind);
  const row = [paletteBins, paletteMedianCut, paletteKMeans].map(fn => { const p = fn(img.data, 5); return `${paletteMSE(img.data, p).toFixed(0).padStart(6)}(${p.length}색)`; });
  console.log(kind.padEnd(7), '칸묶기', row[0], ' 중앙값분할', row[1], ' k평균', row[2]);
}
console.log('\n축소 크기에 따른 결과 흔들림 — 같은 그림을 64/128/256 으로 만들었을 때 통계값');
for (const size of [64, 128, 256]) { const img = makeImage(size, size, 'scene'); const s = stats(img.data), e = edges(img); console.log(String(size).padStart(3), Object.entries({ ...s, ...e }).map(([k, v]) => `${k}=${v.toFixed(3)}`).join(' ')); }
console.log('\n극단 입력');
for (const [w, h, kind] of [[1, 1, 'flat'], [2, 2, 'flat'], [128, 128, 'flat'], [128, 2, 'scene']]) {
  const img = makeImage(w, h, kind);
  console.log(`${w}×${h} ${kind}:`, 'pal', paletteBins(img.data, 5).length, paletteMedianCut(img.data, 5).length, paletteKMeans(img.data, 5).length, 'stats', JSON.stringify(stats(img.data)).slice(0, 60), 'edges', JSON.stringify(edges(img)));
}
