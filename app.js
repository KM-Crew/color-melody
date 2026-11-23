/* 색의 노래 — 카메라로 모은 색을 음으로 바꿔 연주
   색상(Hue) → 고른 음계(5음계·장조·단조)의 음높이, 명도 → 옥타브, 채도 → 세기·길이.
   같은 색 조합·같은 음계면 언제나 같은 노래가 나옵니다. */
'use strict';

const MAX = 8;
const SCALES = [
  { id: 'penta', name: '5음계', desc: '어떤 색이든 잘 어울려요', steps: [0, 2, 4, 7, 9] },
  { id: 'major', name: '장조', desc: '밝고 경쾌하게', steps: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: '단조', desc: '조금 아련하게', steps: [0, 2, 3, 5, 7, 8, 10] }
];
const scaleOf = id => SCALES.find(x => x.id === id) || SCALES[0];
const INSTRUMENTS = [
  { id: 'piano', name: '피아노' },
  { id: 'box', name: '오르골' },
  { id: 'synth', name: '신스' }
];
let colors = store.sget('cmel-colors', []);
const saveColors = () => store.sset('cmel-colors', colors);
let scalePref = scaleOf(store.get('cmel-scale', 'penta')).id;

function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh *= 60;
  }
  return [hh, s, l];
}
function colorToNote(hex, scaleId = 'penta') {
  const [hh, s, l] = rgbToHsl(...hexToRgb(hex));
  const steps = scaleOf(scaleId).steps, n = steps.length * 2;   // 두 옥타브
  const idx = scaleId === 'penta' ? Math.floor(hh / 36) % 10 : Math.floor(hh * n / 360) % n;
  const octave = l < .3 ? -1 : l > .72 ? 1 : 0;
  const semis = steps[idx % steps.length] + 12 * Math.floor(idx / steps.length) + 12 * octave;
  const freq = 261.63 * Math.pow(2, semis / 12);       // C4 기준
  return { freq, vel: .35 + s * .6, len: .55 + (1 - s) * .9, gray: s < .12 };
}
const NOTE_NAMES = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
function noteName(freq) { const n = Math.round(12 * Math.log2(freq / 261.63)); return NOTE_NAMES[((n % 12) + 12) % 12]; }

/* 사진 대표색 뽑기: 축소한 픽셀을 4비트 색 칸으로 묶고, 많이 나온(+선명한) 칸부터
   서로 충분히 다른 색만 고릅니다. 같은 사진이면 언제나 같은 결과. */
function extractPalette(data, k = 5) {
  const bins = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
    let o = bins.get(key);
    if (!o) { o = { n: 0, r: 0, g: 0, b: 0 }; bins.set(key, o); }
    o.n++; o.r += r; o.g += g; o.b += b;
  }
  const cand = [...bins.values()].map(o => {
    const c = [o.r / o.n, o.g / o.n, o.b / o.n];
    const [, s, l] = rgbToHsl(...c);
    const tone = l < .08 || l > .95 ? .25 : 1;          // 거의 검정·흰색은 덜 뽑음
    return { c, score: o.n * (.35 + s) * tone };
  }).sort((a, b) => b.score - a.score);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (const gap of [70, 48, 30, 12]) {
    const out = [];
    for (const x of cand) {
      if (out.every(y => dist(x.c, y) > gap)) out.push(x.c);
      if (out.length >= k) break;
    }
    if (out.length >= Math.min(k, 3) || gap === 12) return out.map(c => rgbToHex(...c));
  }
  return [];
}

/* ---------- 소리 ---------- */
// 모든 음은 master → analyser → 스피커로 흐름. 시각화는 analyser를, 녹음은 master를 엿들음.
let ctx = null, master = null, analyser = null;
function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .9;
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
    master.connect(analyser); analyser.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function playNote(ac, dest, inst, freq, t, vel, len) {
  const g = ac.createGain();
  g.connect(dest);
  const peak = vel * .5;
  const oscs = [];
  if (inst === 'box') {
    [1, 4.01].forEach((m, k) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq * 2 * m; const og = ac.createGain(); og.gain.value = k ? .18 : 1; o.connect(og); og.connect(g); oscs.push(o); });
    len *= .7;
  } else if (inst === 'synth') {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400 + vel * 2400, t); f.connect(g);
    [-6, 6].forEach(dt => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = dt; o.connect(f); oscs.push(o); });
  } else {
    [['triangle', 1, 1], ['sine', 2, .3]].forEach(([type, m, amp]) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = freq * m; const og = ac.createGain(); og.gain.value = amp; o.connect(og); og.connect(g); oscs.push(o); });
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + .015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  oscs.forEach(o => { o.start(t); o.stop(t + len + .05); });
}

function makePlayer(opts) {
  let timer = null, step = 0, next = 0;
  const api = {
    playing: false,
    start() {
      const ac = audio();
      api.playing = true; step = 0; next = ac.currentTime + .08;
      const tick = () => {
        const beat = 60 / opts.tempo();
        while (next < ac.currentTime + .15) {
          const list = opts.colors();
          if (!list.length) break;
          const sc = opts.scale();
          const c = list[step % list.length];
          const n = colorToNote(c, sc);
          if (!n.gray) playNote(ac, master, opts.inst(), n.freq, next, n.vel, n.len * beat * 2);
          if (opts.harmony() && step % 2 === 0) playNote(ac, master, 'piano', colorToNote(list[0], sc).freq / 4, next, .4, beat * 2);
          const idx = step % list.length;
          const delay = Math.max(0, (next - ac.currentTime) * 1000);
          setTimeout(() => { if (api.playing) opts.onStep(idx, n); }, delay);
          next += beat;
          step++;
        }
        timer = setTimeout(tick, 40);
      };
      tick();
    },
    stop() { api.playing = false; clearTimeout(timer); opts.onStep(-1); },
    async record(seconds) {
      const ac = audio();
      if (!window.MediaRecorder || !ac.createMediaStreamDestination) { toast('이 브라우저는 녹음을 지원하지 않아요'); return; }
      const recDest = ac.createMediaStreamDestination();
      master.connect(recDest);
      const rec = new MediaRecorder(recDest.stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      rec.start();
      if (!api.playing) api.start();
      await new Promise(r => setTimeout(r, seconds * 1000));
      rec.stop(); await done;
      try { master.disconnect(recDest); } catch (e) { /* 이미 끊김 */ }
      const type = rec.mimeType || 'audio/webm';
      download(new Blob(chunks, { type }), 'my-color-song.' + (type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm'));
    }
  };
  return api;
}

/* ---------- 재생 시각화: 소리 물결 + 음마다 퍼지는 색 고리 ---------- */
function makeViz(canvas, tileX) {
  const g = canvas.getContext('2d');
  let raf = 0, rings = [], color = '#7c3aed', alive = false;
  const buf = new Uint8Array(1024);
  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    return dpr;
  }
  function draw() {
    const dpr = size(), W = canvas.width, H = canvas.height, now = performance.now();
    g.clearRect(0, 0, W, H);
    rings = rings.filter(o => now - o.t < 1400);
    rings.forEach(o => {
      const p = (now - o.t) / 1400;
      g.beginPath(); g.arc(o.x * dpr, H * .42, (14 + p * 120 * o.v) * dpr, 0, Math.PI * 2);
      g.strokeStyle = o.c; g.globalAlpha = (1 - p) * .8; g.lineWidth = (6 - p * 4) * dpr; g.stroke();
    });
    g.globalAlpha = 1;
    if (analyser && alive) analyser.getByteTimeDomainData(buf); else buf.fill(128);
    g.beginPath();
    for (let i = 0; i < buf.length; i += 4) {
      const x = i / (buf.length - 1) * W, y = H * .42 + (buf[i] - 128) / 128 * H * .35;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = color; g.globalAlpha = alive ? .7 : .25; g.lineWidth = 3 * dpr; g.stroke(); g.globalAlpha = 1;
    if (alive || rings.length) raf = requestAnimationFrame(draw); else raf = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
  draw();
  return {
    note(k, c, v) {
      color = c; alive = true;
      if (!Motion.reduced) rings.push({ x: tileX(k), c, v: .6 + v * .6, t: performance.now() });
      kick();
    },
    stop() { alive = false; kick(); },
    destroy() { cancelAnimationFrame(raf); raf = 0; alive = false; rings = []; }
  };
}

/* ---------- 랜딩 ---------- */
Router.on('/', root => {
  const wrap = h('<div class="split center"></div>');
  root.append(wrap);
  wrap.append(h(`
    <section class="hero">
      <div class="drops">${['#ff5d73', '#ffb020', '#3ccf91', '#3b82f6', '#a855f7'].map((c, i) => `<i style="background:${c};animation-delay:${i * .18}s"></i>`).join('')}</div>
      <h1>세상의 색을 모아<br>나만의 노래를</h1>
      <p class="muted">하늘의 파랑, 커피의 갈색, 친구 옷의 빨강. 카메라로 색을 모으면 그 색들이 음이 되어 연주돼요.</p>
      <div class="badges"><span>🎼 음계 3종</span><span>📷 사진 대표색 자동</span><span>🌊 재생 시각화</span><span>🔗 노래 링크</span></div>
      <a class="btn primary big block" href="#/collect">색 모으러 가기</a>
      ${colors.length >= 3 ? '<a class="btn block" href="#/compose" style="margin-top:8px">모아 둔 색으로 연주하기</a>' : ''}
    </section>
    `));
  wrap.append(h(`<section class="card how"><b>이렇게 바뀌어요</b><ul><li>색깔(빨강→보라) = 음높이</li><li>밝기 = 옥타브</li><li>선명함 = 소리 크기와 길이</li></ul><p class="muted small">기본은 어떤 색을 골라도 듣기 좋은 5음계(펜타토닉). 연주 화면에서 장조·단조로 바꿀 수 있어요.</p></section>`));
});

/* ---------- 색 모으기 ---------- */
Router.on('/collect', root => {
  root.append(h(`
    <section class="split s37">
      <div class="cam">
        <video id="v" playsinline muted></video>
        <canvas id="pic" class="hidden"></canvas>
        <div class="aim"></div>
        <div class="camwait" id="wait">카메라를 켜는 중…</div>
      </div>
      <div class="stack">
      <div class="row now"><span class="nowc" id="nowc"></span><span id="nowt" class="grow muted">조준점에 색을 맞춰 보세요</span></div>
      <button class="btn primary big block" id="grab">이 색 담기</button>
      <div class="chips" id="chips"></div>
      <div class="card auto hidden" id="auto"><div class="row"><b class="grow">📷 사진 대표색</b><button class="btn small" id="addall">모두 담기</button></div><div class="autochips" id="autochips"></div><p class="muted small">눌러서 하나씩 담거나, 사진을 직접 눌러 원하는 곳의 색을 고르세요.</p></div>
      <div class="row"><label class="btn grow">📷 사진에서 고르기<input type="file" accept="image/*" id="file" hidden></label><label class="btn grow">🎨 직접 고르기<input type="color" id="pickc" class="hidden-color"></label></div>
      <a class="btn block" id="go" href="#/compose">이 색들로 노래 만들기</a>
      </div>
    </section>`));
  const v = $('#v'), pic = $('#pic');
  const sample = document.createElement('canvas'); sample.width = sample.height = 24;
  const sctx = sample.getContext('2d', { willReadFrequently: true });
  let stream = null, raf = 0, current = null, picMode = false;

  function renderChips() {
    $('#chips').innerHTML = Array.from({ length: MAX }, (_, k) => colors[k]
      ? `<button class="cchip" style="background:${colors[k]}" data-k="${k}" aria-label="${colors[k]} 지우기"><span>${noteName(colorToNote(colors[k], scalePref).freq)}</span></button>`
      : '<span class="cchip empty"></span>').join('');
    $$('.cchip[data-k]').forEach(b => b.onclick = () => { colors.splice(Number(b.dataset.k), 1); saveColors(); renderChips(); });
    $('#go').classList.toggle('disabled', colors.length < 3);
    $('#go').textContent = colors.length < 3 ? `색을 ${3 - colors.length}개 더 모아 주세요` : `${colors.length}가지 색으로 노래 만들기 →`;
  }
  function setCurrent(hex) {
    current = hex;
    $('#nowc').style.background = hex;
    $('#nowt').textContent = `${hex.toUpperCase()} · "${noteName(colorToNote(hex, scalePref).freq)}" 음`;
  }
  function add(hex, quiet) {
    if (colors.length >= MAX) { if (!quiet) toast(`최대 ${MAX}가지 색까지 담을 수 있어요`); return false; }
    colors.push(hex); saveColors(); renderChips(); vibrate(15); Sfx.play('pop');
    const n = colorToNote(hex, scalePref); const ac = audio();
    playNote(ac, master, 'piano', n.freq, ac.currentTime + .01, n.vel, .8);
    return true;
  }
  function showAuto(list) {
    const box = $('#auto');
    box.classList.toggle('hidden', !list.length);
    if (list.length && box.scrollIntoView) setTimeout(() => box.scrollIntoView({ block: 'nearest', behavior: Motion.reduced ? 'auto' : 'smooth' }), 50);
    $('#autochips').innerHTML = list.map(c => `<button class="achip" style="background:${c}" data-c="${c}" aria-label="${c} 담기"><span>${noteName(colorToNote(c, scalePref).freq)}</span></button>`).join('');
    $$('#autochips .achip').forEach(b => b.onclick = () => { setCurrent(b.dataset.c); add(b.dataset.c); });
    $('#addall').onclick = () => {
      let n = 0;
      for (const c of list) { if (colors.length >= MAX) break; if (!colors.includes(c) && add(c, true)) n++; }
      toast(n ? `대표색 ${n}개를 담았어요` : colors.length >= MAX ? `최대 ${MAX}가지 색까지 담을 수 있어요` : '이미 담은 색이에요');
    };
  }
  function loop() {
    if (!picMode && v.readyState >= 2) {
      const s = Math.min(v.videoWidth, v.videoHeight) * .08;
      sctx.drawImage(v, v.videoWidth / 2 - s / 2, v.videoHeight / 2 - s / 2, s, s, 0, 0, 24, 24);
      const d = sctx.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
      const n = d.length / 4;
      setCurrent(rgbToHex(r / n, g / n, b / n));
    }
    raf = requestAnimationFrame(loop);
  }
  async function startCam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      v.srcObject = stream; await v.play();
      $('#wait').classList.add('hidden');
    } catch (e) {
      $('#wait').innerHTML = '카메라를 쓸 수 없어요.<br>사진이나 직접 고르기로 해 보세요.';
    }
  }
  $('#grab').onclick = () => { if (current) add(current); else toast('먼저 색을 골라 주세요'); };
  $('#pickc').oninput = e => { setCurrent(e.target.value); };
  $('#pickc').onchange = e => add(e.target.value);
  $('#file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      picMode = true;
      const w = Math.min(900, img.width), hh = img.height * (w / img.width);
      pic.width = w; pic.height = hh;
      pic.getContext('2d').drawImage(img, 0, 0, w, hh);
      const t = document.createElement('canvas'); t.width = t.height = 64;
      const tc = t.getContext('2d', { willReadFrequently: true }); tc.drawImage(img, 0, 0, 64, 64);
      const pal = extractPalette(tc.getImageData(0, 0, 64, 64).data, 5);
      showAuto(pal); if (pal[0]) setCurrent(pal[0]);
      pic.classList.remove('hidden'); v.classList.add('hidden'); $('#wait').classList.add('hidden'); $('.aim').classList.add('hidden');
      if (!pal.length) $('#nowt').textContent = '사진에서 원하는 곳을 눌러 보세요';
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { toast('사진을 열 수 없어요. 다른 사진으로 해 보세요'); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
  };
  pic.onclick = e => {
    const rect = pic.getBoundingClientRect();
    const x = (e.clientX - rect.left) * pic.width / rect.width, y = (e.clientY - rect.top) * pic.height / rect.height;
    const d = pic.getContext('2d').getImageData(Math.max(0, x - 4), Math.max(0, y - 4), 8, 8).data;
    let r = 0, g = 0, b = 0; for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
    const n = d.length / 4; setCurrent(rgbToHex(r / n, g / n, b / n));
  };
  $('#go').onclick = e => { if (colors.length < 3) { e.preventDefault(); toast('색을 3개 이상 모아 주세요'); } };
  renderChips();
  startCam();
  loop();
  return () => { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); };
});

/* ---------- 연주 ---------- */
function songLink(list, o) {
  return location.href.split('#')[0] + '#/play?c=' + list.map(c => c.slice(1)).join('-') + '&t=' + o.tempo + '&i=' + o.inst + '&s=' + o.scale;
}
function composeView(root, list, shared) {
  let tempo = 108, inst = 'piano', harmony = true, scale = scalePref;
  root.append(h(`
    <section class="stack">
      ${shared ? `<div class="card gift" id="gift"><span class="gift-ico" aria-hidden="true">🎁</span><div class="grow"><b>친구가 색으로 만든 노래를 보냈어요</b><div class="muted small" id="giftinfo"></div></div></div>` : ''}
      <h1>${shared ? '누군가 보낸 색의 노래' : '나의 색의 노래'}</h1>
      <div class="score" id="score"><canvas class="viz" id="viz" aria-hidden="true"></canvas>${list.map((c, k) => `<div class="tile" data-k="${k}" style="background:${c}"><span></span></div>`).join('')}</div>
      <div class="nowplay muted small" id="nowplay" aria-live="off">▶를 누르면 색이 차례로 노래해요</div>
      <div class="split"><div class="stack">
      <button class="btn primary big block" id="play" title="Space">▶ 연주하기</button>
      <div class="card stack">
        <div><label class="field">음계</label><div class="row" id="scale">${SCALES.map(x => `<button class="chip ${x.id === scale ? 'on' : ''}" data-s="${x.id}" aria-pressed="${x.id === scale}">${x.name}</button>`).join('')}</div><p class="muted small" id="scdesc"></p></div>
        <div><label class="field">빠르기 <b id="tv">${tempo}</b> BPM</label><input type="range" id="tempo" min="60" max="180" value="${tempo}" aria-label="빠르기"></div>
        <div><label class="field">악기</label><div class="row" id="inst">${INSTRUMENTS.map(x => `<button class="chip ${x.id === inst ? 'on' : ''}" data-i="${x.id}" aria-pressed="${x.id === inst}">${x.name}</button>`).join('')}</div></div>
        <label class="row small"><input type="checkbox" id="harm" checked> 베이스 화음 넣기</label>
      </div>
      </div><div class="stack">
      <div class="card stack sharebox">
        <b>공유 미리보기</b>
        <div class="songcard" id="songcard">
          <div class="sc-strip">${list.map(c => `<i style="background:${c}"></i>`).join('')}</div>
          <div class="sc-body">
            <div class="sc-title">🎨 색의 노래 · ${list.length}가지 색</div>
            <div class="sc-notes" id="scnotes"></div>
            <div class="sc-meta" id="scmeta"></div>
            <div class="sc-url">km-crew.github.io/color-melody</div>
          </div>
        </div>
        <p class="muted small">링크를 받은 사람은 같은 색·음계·빠르기로 똑같은 노래를 들어요.</p>
        <div class="row"><button class="btn primary grow" id="share">🔗 노래 링크 공유</button><button class="btn grow" id="copy">📋 링크 복사</button></div>
        <div class="row"><button class="btn grow" id="img">🖼 카드 이미지 저장</button><button class="btn grow" id="rec">⏺ 8초 녹음</button></div>
      </div>
      <a class="btn ghost block" href="#/collect">${shared ? '나도 색 모으기' : '← 색 다시 고르기'}</a>
      </div></div>
    </section>`));
  const tiles = $$('.tile', root);
  const viz = makeViz($('#viz'), k => {
    const t = tiles[k], s = $('#score').getBoundingClientRect();
    if (!t) return s.width / 2;
    const r = t.getBoundingClientRect(); return r.left - s.left + r.width / 2;
  });
  function refresh() {
    const notes = list.map(c => noteName(colorToNote(c, scale).freq));
    tiles.forEach((t, k) => { $('span', t).textContent = notes[k]; });
    $('#scnotes').textContent = notes.join(' · ');
    const sc = scaleOf(scale), ins = INSTRUMENTS.find(x => x.id === inst);
    $('#scmeta').textContent = `${sc.name} · ${tempo} BPM · ${ins.name}`;
    $('#scdesc').textContent = sc.desc;
    if ($('#giftinfo')) $('#giftinfo').textContent = `${list.length}가지 색 · ${sc.name} · ${tempo} BPM · ${ins.name} — ▶를 눌러 들어 보세요`;
  }
  const player = makePlayer({
    colors: () => list, tempo: () => tempo, inst: () => inst, harmony: () => harmony, scale: () => scale,
    onStep: (k, n) => {
      tiles.forEach((t, j) => t.classList.toggle('on', j === k));
      if (k < 0) { viz.stop(); return; }
      viz.note(k, list[k], n ? n.vel : .6);
      $('#nowplay').textContent = n && n.gray ? `♪ ${k + 1}번째 색은 회색이라 쉬어 가요` : `♪ ${k + 1}번째 색 ${list[k].toUpperCase()} → "${noteName(colorToNote(list[k], scale).freq)}"`;
    }
  });
  const setPlay = on => { $('#play').textContent = on ? '■ 멈추기' : '▶ 연주하기'; };
  $('#play').onclick = () => {
    if (player.playing) { player.stop(); setPlay(false); }
    else { player.start(); setPlay(true); }
  };
  $('#tempo').oninput = e => { tempo = Number(e.target.value); $('#tv').textContent = tempo; refresh(); };
  const pickChip = (sel, attr, val) => $$(sel + ' .chip').forEach(x => { const on = x.dataset[attr] === val; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  $$('#inst .chip').forEach(b => b.onclick = () => { inst = b.dataset.i; pickChip('#inst', 'i', inst); refresh(); });
  $$('#scale .chip').forEach(b => b.onclick = () => {
    scale = b.dataset.s; pickChip('#scale', 's', scale); refresh();
    if (!shared) { scalePref = scale; store.set('cmel-scale', scale); }
    if (!player.playing) { const ac = audio(); list.slice(0, 3).forEach((c, k) => { const n = colorToNote(c, scale); if (!n.gray) playNote(ac, master, inst, n.freq, ac.currentTime + .02 + k * .12, n.vel, .5); }); }
  });
  $('#harm').onchange = e => { harmony = e.target.checked; };
  const link = () => songLink(list, { tempo, inst, scale });
  $('#share').onclick = () => shareText('색의 노래', `내가 모은 ${list.length}가지 색으로 만든 노래 들어 볼래? (${scaleOf(scale).name})`, link());
  $('#copy').onclick = () => copyText(link());
  $('#rec').onclick = async () => {
    $('#rec').disabled = true; $('#rec').textContent = '녹음 중…';
    setPlay(true);
    await player.record(8);
    $('#rec').disabled = false; $('#rec').textContent = '⏺ 8초 녹음';
  };
  $('#img').onclick = () => saveImage($('#songcard'), 'my-color-song.png');
  const onKey = e => {
    if (e.key !== ' ' || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
    e.preventDefault(); $('#play').click();                    // 플레이어와 같이 Space로 재생/정지
  };
  addEventListener('keydown', onKey);
  refresh();
  return {
    player, off: () => { removeEventListener('keydown', onKey); viz.destroy(); },
    set(t, i, s) {
      if (t) { tempo = t; $('#tempo').value = t; $('#tv').textContent = t; }
      if (i) { inst = i; pickChip('#inst', 'i', i); }
      if (s) { scale = s; pickChip('#scale', 's', s); }
      refresh();
    }
  };
}
Router.on('/compose', root => {
  if (colors.length < 3) { Router.go('/collect'); return; }
  const v = composeView(root, colors.slice(), false);
  return () => { v.player.stop(); v.off(); };
});
Router.on('/play', (root, params) => {
  const list = (params.get('c') || '').split('-').filter(x => /^[0-9a-f]{6}$/i.test(x)).slice(0, MAX).map(x => '#' + x.toLowerCase());
  if (list.length < 1) { toast('노래 링크가 깨졌어요. 직접 색을 모아 보세요'); Router.go('/'); return; }
  const v = composeView(root, list, true);
  const inst = params.get('i'), sc = params.get('s');
  v.set(clamp(Number(params.get('t')) || 108, 60, 180), INSTRUMENTS.some(x => x.id === inst) ? inst : null, SCALES.some(x => x.id === sc) ? sc : 'penta');
  return () => { v.player.stop(); v.off(); };
});

Router.start($('#app'));
