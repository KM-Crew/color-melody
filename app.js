/* 색의 노래 — 카메라로 모은 색을 음으로 바꿔 연주
   색상(Hue) → 펜타토닉 음높이, 명도 → 옥타브, 채도 → 세기·길이.
   같은 색 조합이면 언제나 같은 노래가 나옵니다. */
'use strict';

const MAX = 8;
const PENTA = [0, 2, 4, 7, 9];
const INSTRUMENTS = [
  { id: 'piano', name: '피아노' },
  { id: 'box', name: '오르골' },
  { id: 'synth', name: '신스' }
];
let colors = store.sget('cmel-colors', []);
const saveColors = () => store.sset('cmel-colors', colors);

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
function colorToNote(hex) {
  const [hh, s, l] = rgbToHsl(...hexToRgb(hex));
  const idx = Math.floor(hh / 36) % 10;               // 두 옥타브 펜타토닉 10칸
  const octave = l < .3 ? -1 : l > .72 ? 1 : 0;
  const semis = PENTA[idx % 5] + 12 * Math.floor(idx / 5) + 12 * octave;
  const freq = 261.63 * Math.pow(2, semis / 12);       // C4 기준
  return { freq, vel: .35 + s * .6, len: .55 + (1 - s) * .9, gray: s < .12 };
}
const NOTE_NAMES = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];
function noteName(freq) { const n = Math.round(12 * Math.log2(freq / 261.63)); return NOTE_NAMES[((n % 12) + 12) % 12]; }

/* ---------- 소리 ---------- */
let ctx = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  let timer = null, step = 0, next = 0, recDest = null;
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
          const c = list[step % list.length];
          const n = colorToNote(c);
          const out = ac.destination;
          if (!n.gray) playNote(ac, out, opts.inst(), n.freq, next, n.vel, n.len * beat * 2);
          if (recDest && !n.gray) playNote(ac, recDest, opts.inst(), n.freq, next, n.vel, n.len * beat * 2);
          if (opts.harmony() && step % 2 === 0) {
            const bass = colorToNote(list[0]).freq / 4;
            playNote(ac, out, 'piano', bass, next, .4, beat * 2);
            if (recDest) playNote(ac, recDest, 'piano', bass, next, .4, beat * 2);
          }
          const idx = step % list.length;
          const delay = Math.max(0, (next - ac.currentTime) * 1000);
          setTimeout(() => opts.onStep(idx), delay);
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
      if (!window.MediaRecorder) { toast('이 브라우저는 녹음을 지원하지 않아요'); return; }
      recDest = ac.createMediaStreamDestination();
      const rec = new MediaRecorder(recDest.stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      rec.start();
      if (!api.playing) api.start();
      await new Promise(r => setTimeout(r, seconds * 1000));
      rec.stop(); await done;
      recDest = null;
      const type = rec.mimeType || 'audio/webm';
      download(new Blob(chunks, { type }), 'my-color-song.' + (type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm'));
    }
  };
  return api;
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
      <a class="btn primary big block" href="#/collect">색 모으러 가기</a>
      ${colors.length >= 3 ? '<a class="btn block" href="#/compose" style="margin-top:8px">모아 둔 색으로 연주하기</a>' : ''}
    </section>
    `));
  wrap.append(h(`<section class="card how"><b>이렇게 바뀌어요</b><ul><li>색깔(빨강→보라) = 음높이</li><li>밝기 = 옥타브</li><li>선명함 = 소리 크기와 길이</li></ul><p class="muted small">어떤 색을 골라도 듣기 좋은 5음계(펜타토닉)만 써요.</p></section>`));
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
      ? `<button class="cchip" style="background:${colors[k]}" data-k="${k}" aria-label="${colors[k]} 지우기"><span>${noteName(colorToNote(colors[k]).freq)}</span></button>`
      : '<span class="cchip empty"></span>').join('');
    $$('.cchip[data-k]').forEach(b => b.onclick = () => { colors.splice(Number(b.dataset.k), 1); saveColors(); renderChips(); });
    $('#go').classList.toggle('disabled', colors.length < 3);
    $('#go').textContent = colors.length < 3 ? `색을 ${3 - colors.length}개 더 모아 주세요` : `${colors.length}가지 색으로 노래 만들기 →`;
  }
  function setCurrent(hex) {
    current = hex;
    $('#nowc').style.background = hex;
    $('#nowt').textContent = `${hex.toUpperCase()} · "${noteName(colorToNote(hex).freq)}" 음`;
  }
  function add(hex) {
    if (colors.length >= MAX) { toast(`최대 ${MAX}가지 색까지 담을 수 있어요`); return; }
    colors.push(hex); saveColors(); renderChips(); vibrate(15); Sfx.play('pop');
    const n = colorToNote(hex); const ac = audio();
    playNote(ac, ac.destination, 'piano', n.freq, ac.currentTime + .01, n.vel, .8);
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
      pic.classList.remove('hidden'); v.classList.add('hidden'); $('#wait').classList.add('hidden'); $('.aim').classList.add('hidden');
      $('#nowt').textContent = '사진에서 원하는 곳을 눌러 보세요';
      URL.revokeObjectURL(img.src);
    };
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
function composeView(root, list, shared) {
  let tempo = 108, inst = 'piano', harmony = true;
  root.append(h(`
    <section class="stack">
      <h1>${shared ? '누군가 보낸 색의 노래' : '나의 색의 노래'}</h1>
      <div class="score" id="score">${list.map((c, k) => `<div class="tile" data-k="${k}" style="background:${c}"><span>${noteName(colorToNote(c).freq)}</span></div>`).join('')}</div>
      <div class="split"><div class="stack">
      <button class="btn primary big block" id="play" title="Space">▶ 연주하기</button>
      <div class="card stack">
        <div><label class="field">빠르기 <b id="tv">${tempo}</b> BPM</label><input type="range" id="tempo" min="60" max="180" value="${tempo}"></div>
        <div><label class="field">악기</label><div class="row" id="inst">${INSTRUMENTS.map(x => `<button class="chip ${x.id === inst ? 'on' : ''}" data-i="${x.id}">${x.name}</button>`).join('')}</div></div>
        <label class="row small"><input type="checkbox" id="harm" checked> 베이스 화음 넣기</label>
      </div>
      </div><div class="stack">
      <div class="row"><button class="btn grow" id="share">🔗 노래 링크 공유</button><button class="btn grow" id="rec">⏺ 8초 녹음</button></div>
      <button class="btn grow block" id="img">팔레트 이미지 저장</button>
      <a class="btn ghost block" href="#/collect">${shared ? '나도 색 모으기' : '← 색 다시 고르기'}</a>
      </div></div>
    </section>`));
  const player = makePlayer({
    colors: () => list, tempo: () => tempo, inst: () => inst, harmony: () => harmony,
    onStep: k => $$('.tile', root).forEach((t, j) => t.classList.toggle('on', j === k))
  });
  $('#play').onclick = () => {
    if (player.playing) { player.stop(); $('#play').textContent = '▶ 연주하기'; }
    else { player.start(); $('#play').textContent = '■ 멈추기'; }
  };
  $('#tempo').oninput = e => { tempo = Number(e.target.value); $('#tv').textContent = tempo; };
  $$('#inst .chip').forEach(b => b.onclick = () => { inst = b.dataset.i; $$('#inst .chip').forEach(x => x.classList.toggle('on', x === b)); });
  $('#harm').onchange = e => { harmony = e.target.checked; };
  const link = () => location.href.split('#')[0] + '#/play?c=' + list.map(c => c.slice(1)).join('-') + '&t=' + tempo + '&i=' + inst;
  $('#share').onclick = () => shareText('색의 노래', '내가 모은 색으로 만든 노래 들어 볼래?', link());
  $('#rec').onclick = async () => {
    $('#rec').disabled = true; $('#rec').textContent = '녹음 중…';
    $('#play').textContent = '■ 멈추기';
    await player.record(8);
    $('#rec').disabled = false; $('#rec').textContent = '⏺ 8초 녹음';
  };
  $('#img').onclick = () => saveImage($('#score'), 'my-color-song.png');
  const onKey = e => {
    if (e.key !== ' ' || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
    e.preventDefault(); $('#play').click();                    // 플레이어와 같이 Space로 재생/정지
  };
  addEventListener('keydown', onKey);
  return { player, off: () => removeEventListener('keydown', onKey), set(t, i) { if (t) { tempo = t; $('#tempo').value = t; $('#tv').textContent = t; } if (i) { inst = i; $$('#inst .chip').forEach(x => x.classList.toggle('on', x.dataset.i === i)); } } };
}
Router.on('/compose', root => {
  if (colors.length < 3) { Router.go('/collect'); return; }
  const v = composeView(root, colors.slice(), false);
  return () => { v.player.stop(); v.off(); };
});
Router.on('/play', (root, params) => {
  const list = (params.get('c') || '').split('-').filter(x => /^[0-9a-f]{6}$/i.test(x)).slice(0, MAX).map(x => '#' + x.toLowerCase());
  if (list.length < 1) { Router.go('/'); return; }
  const v = composeView(root, list, true);
  const inst = params.get('i');
  v.set(clamp(Number(params.get('t')) || 108, 60, 180), INSTRUMENTS.some(x => x.id === inst) ? inst : null);
  return () => { v.player.stop(); v.off(); };
});

Router.start($('#app'));
