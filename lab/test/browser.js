// lab/test/browser.js — 비교 페이지(lab/index.html)를 헤드리스 브라우저로 확인한다.
// 준비: workspace/qa 에서 `npm install && npm install puppeteer@22`, color-melody 폴더에서 `python3 -m http.server 8791 --bind 127.0.0.1`
// 실행: node lab/test/browser.js [캡처 폴더]      (QA_DIR=workspace/qa 경로, LAB_URL=페이지 주소, CHROME=브라우저 실행 파일로 바꿀 수 있음)
'use strict';
const path = require('path'), fs = require('fs');
const QA = process.env.QA_DIR || path.resolve(__dirname, '..', '..', '..', 'workspace', 'qa');
const URL0 = process.env.LAB_URL || 'http://127.0.0.1:8791/lab/index.html';
const SHOT = process.argv[2] || null;
let fail = 0;
const ok = (name, cond, extra = '') => { if (!cond) fail++; console.log(`${cond ? 'OK ' : 'NG '} ${name}${extra ? ' — ' + extra : ''}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await require(path.join(QA, 'launch.js'))();
  console.log('브라우저:', await browser.version());
  for (const vp of [{ name: 'PC 1280', width: 1280, height: 800 }, { name: '모바일 390', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
    const page = await browser.newPage(), errors = [], external = [];
    await page.setViewport(vp);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setRequestInterception(true);
    page.on('request', r => { const u = r.url(); if (u.startsWith('http://127.0.0.1:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); external.push(u); r.abort(); });
    await page.goto(URL0); await page.waitForFunction('window.Lab');
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const T = s => `[${vp.name}] ${s}`;
    ok(T('첫 화면: 가로 넘침 없음, 듣기 버튼은 사진 전에는 꺼짐'), await overflow() <= 0 && await page.$eval('#play', b => b.disabled));
    ok(T('시험 그림 버튼 14개, 방식 버튼 3개'), await page.$$eval('#samples button', b => b.length) === 14 && await page.$$eval('#methods button', b => b.length) === 3);
    if (SHOT) await page.screenshot({ path: `${SHOT}/lab-${vp.width}-empty.png` });

    // 시험 그림을 누르면 분석·설명이 나온다
    await page.evaluate(() => [...document.querySelectorAll('#samples button')].find(b => b.textContent === '노을').click());
    const info = await page.evaluate(() => ({ why: document.querySelectorAll('#why li').length, pal: document.querySelectorAll('#palette span').length, seed: JSON.parse(document.querySelector('#seed').textContent), status: document.querySelector('#status').textContent, strip: document.querySelectorAll('#strip div').length }));
    ok(T('노을: 설명 4~5줄·팔레트·설정값·세로줄 16칸 표시'), info.why >= 4 && info.why <= 5 && info.pal >= 1 && info.seed.melody.length === 16 && info.strip === 16, info.status);
    ok(T('링크용 글자열 표시 → 되돌리면 화면의 설정값과 같음'), await page.evaluate(() => JSON.stringify(LabSeedLink.decode(document.querySelector('#code').textContent)) === document.querySelector('#seed').textContent));
    // node 와 같은 결과인지(같은 픽셀 → 같은 설정값)
    const A = require('../analyze.js'), C = require('../compose.js'), S = require('../samples/make.js');
    ok(T('브라우저와 node 의 설정값이 같음(시험 그림 14장)'), JSON.stringify(await page.evaluate(() => LabSamples.KINDS.map(k => LabCompose.toSeed(LabAnalyze.analyze(LabSamples.makeImage(k)))))) === JSON.stringify(S.KINDS.map(k => C.toSeed(A.analyze(S.makeImage(k))))));

    // 재생: 버튼 클릭 → AudioContext running, 막대 표시, 방식 전환, 멈춤
    await page.click('#play'); await wait(900);
    const playing = await page.evaluate(() => ({ st: Lab.state.ctx && Lab.state.ctx.state, bar: getComputedStyle(document.querySelector('#bar')).display, now: document.querySelector('#now').textContent, voices: Lab.state.playing && Lab.state.playing.voices }));
    ok(T('▶ 듣기: 소리 장치 running, 재생 막대·지금 음 표시'), playing.st === 'running' && playing.bar === 'block' && /♪/.test(playing.now), `${playing.now} / 발음 노드 ${playing.voices}개`);
    for (const m of ['B', 'A', 'D']) { await page.evaluate(m => [...document.querySelectorAll('#methods button')].find(b => b.dataset.m === m).click(), m); await wait(250); }
    ok(T('재생 중 방식 전환(B→A→D)해도 계속 재생'), await page.evaluate(() => !!Lab.state.playing && Lab.state.song.method === 'D'));
    if (SHOT) await page.screenshot({ path: `${SHOT}/lab-${vp.width}-playing.png`, fullPage: true });
    await page.click('#stop');
    ok(T('■ 멈춤: 막대 사라짐'), await page.evaluate(() => !Lab.state.playing && getComputedStyle(document.querySelector('#bar')).display === 'none'));
    ok(T('흑백 그림 + A 방식: 빈 곡 안내, 오류 없음'), await page.evaluate(() => { Lab.loadSample('흑백'); Lab.setMethod('A'); Lab.play(); const t = document.querySelector('#status').textContent; Lab.setMethod('D'); Lab.stop(); return /음을 만들지 못했어요/.test(t); }));

    // 굽기: 3방식 × 그림 4장 — 무음 아님, 찢어지지 않음(최대 진폭 < 1), 길이, 끝이 조용함
    const baked = await page.evaluate(async () => {
      const out = [];
      for (const k of ['노을', '야경', '잡음', '파스텔']) for (const m of ['D', 'B', 'A']) {
        Lab.loadSample(k); Lab.setMethod(m); if (!Lab.state.song.events.length) { out.push({ k, m, empty: true }); continue; }
        const t0 = performance.now(), r = await Lab.renderWav(), q = LabRender.measure(r.samples, 10);
        out.push({ k, m, ms: Math.round(performance.now() - t0), sec: r.samples.length / r.sampleRate, want: Lab.state.song.seconds, peak: q.peak, rms: q.rms, first: q.parts[0], last: q.parts[9], bytes: r.bytes.length });
      }
      Lab.setMethod('D'); return out;
    });
    const real = baked.filter(b => !b.empty);
    ok(T('굽기 12곡: 무음 아님(RMS > 0.005) · 최대 진폭 < 1 · 길이 일치 · 첫 구간에 소리'), real.every(b => b.rms > 0.005 && b.peak < 1 && Math.abs(b.sec - b.want) < 0.01 && b.first > 0.003),
      `최대 진폭 ${Math.min(...real.map(b => b.peak)).toFixed(2)}~${Math.max(...real.map(b => b.peak)).toFixed(2)}, RMS ${Math.min(...real.map(b => b.rms)).toFixed(3)}~${Math.max(...real.map(b => b.rms)).toFixed(3)}, 굽는 시간 ${Math.min(...real.map(b => b.ms))}~${Math.max(...real.map(b => b.ms))}ms, WAV ${(Math.max(...real.map(b => b.bytes)) / 1048576).toFixed(1)}MB 이하, 빈 곡 ${baked.length - real.length}`);
    const twice = await page.evaluate(async () => { Lab.loadSample('노을'); Lab.setMethod('D'); const a = (await Lab.renderWav()).samples, b = (await Lab.renderWav()).samples; let d = 0; for (let i = 0; i < a.length; i++) d = Math.max(d, Math.abs(a[i] - b[i])); return d; });
    ok(T('같은 곡을 두 번 구우면 최대 차이 < 1e-4'), twice < 1e-4, twice.toExponential(1));

    // 파일 선택 경로(<img> 디코드 → 캔버스 축소)
    const input = await page.$('#file');
    await input.uploadFile(path.join(__dirname, '..', 'samples', '04-sunset.png')); await page.waitForFunction(() => /04-sunset/.test(Lab.state.name));
    const viaFile = await page.evaluate(() => ({ seed: Lab.state.seed, size: Lab.state.features.size, ms: Lab.state.analyzeMs }));
    const direct = C.toSeed(A.analyze(S.makeImage('노을')));
    ok(T('사진 고르기(PNG 384×288): 128×96 으로 분석, 조·장단조·빠르기가 생성기 직접 분석과 같음'), viaFile.size.w === 128 && viaFile.size.h === 96 && viaFile.seed.key === direct.key && viaFile.seed.mode === direct.mode && viaFile.seed.bpm === direct.bpm,
      `멜로디 칸 일치 ${viaFile.seed.melody.filter((v, i) => v === direct.melody[i]).length}/16, ${viaFile.ms}ms`);
    await input.uploadFile(path.join(__dirname, 'browser.js')); await wait(400);
    ok(T('그림이 아닌 파일: 안내 문구, 오류 없음'), /열 수 없어요/.test(await page.$eval('#status', e => e.textContent)));

    // 4000×3000 JPEG: 디코드+축소 시간, 1단계/2단계 축소 비교
    const big = await page.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 4000; c.height = 3000; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 4000, 3000); g.addColorStop(0, '#ff9a3c'); g.addColorStop(0.5, '#c2417a'); g.addColorStop(1, '#1b2a6b'); x.fillStyle = g; x.fillRect(0, 0, 4000, 3000);
      let s = 5; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 900; i++) { x.fillStyle = `hsl(${Math.floor(r() * 360)} 80% ${30 + Math.floor(r() * 50)}%)`; x.fillRect(r() * 4000, r() * 3000, 20 + r() * 260, 4 + r() * 60); }
      const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.9)), file = new File([blob], 'big.jpg', { type: 'image/jpeg' });
      const t0 = performance.now(); await Lab.loadFile(file); const ms = performance.now() - t0;
      const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode();
      const seedOf = two => LabCompose.toSeed(LabAnalyze.analyze(Lab.pixelsOf(img, 4000, 3000, two)));
      const featOf = two => LabAnalyze.analyze(Lab.pixelsOf(img, 4000, 3000, two));
      const one = seedOf(false), two = seedOf(true), f1 = featOf(false), f2 = featOf(true);
      return { ms: Math.round(ms), bytes: blob.size, size: Lab.state.features.size, sameNotes: JSON.stringify(LabCompose.compose(one, 'D').events) === JSON.stringify(LabCompose.compose(two, 'D').events),
        melodySame: one.melody.filter((v, i) => v === two.melody[i]).length, edge: [f1.texture.edgeDensity, f2.texture.edgeDensity], bright: [f1.tone.brightness, f2.tone.brightness], sat: [f1.tone.saturation, f2.tone.saturation], bpm: [one.bpm, two.bpm], view: [document.querySelector('#view').width, document.querySelector('#view').height] };
    });
    ok(T('4000×3000 JPEG: 오류 없이 128×96 으로 분석, 표시용 캔버스는 긴 변 1280 이하'), big.size.w === 128 && big.size.h === 96 && Math.max(...big.view) <= 1280, `고르기→곡 준비 ${big.ms}ms, JPEG ${(big.bytes / 1048576).toFixed(1)}MB`);
    console.log(`    (참고) 1단계/2단계 축소: 가장자리 밀도 ${big.edge.join(' / ')}, 밝기 ${big.bright.join(' / ')}, 채도 ${big.sat.join(' / ')}, 빠르기 ${big.bpm.join(' / ')}, 멜로디 칸 일치 ${big.melodySame}/16, D 음표 목록 ${big.sameNotes ? '같음' : '다름'}`);

    ok(T('끝까지: 콘솔 오류 0, 외부 요청 0, 가로 넘침 없음'), errors.length === 0 && external.length === 0 && await overflow() <= 0, errors.concat(external).slice(0, 3).join(' | '));
    const small = await page.evaluate(() => [...document.querySelectorAll('button, .btn')].filter(b => b.getBoundingClientRect().height < 36).length);
    ok(T('버튼 높이 36px 이상'), small === 0, small ? small + '개 미달' : '');
    if (SHOT) await page.screenshot({ path: `${SHOT}/lab-${vp.width}-result.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log(fail ? `\n실패 ${fail}건` : '\n전부 통과');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('실행 실패:', e.message); process.exit(2); });
