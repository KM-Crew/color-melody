# P4 모바일·PC 호환성 — 어디서 무엇이 되고, 안 되면 어떻게 하는가 (2026-11-24)

## 3줄 요약

1. **사진 넣기 → 분석 → 소리 재생 → 링크 공유**라는 핵심 흐름은 대상 브라우저 전부에서 표준 기능만으로 된다(캔버스, Web Audio, 파일 선택 모두 2021년 이전 버전부터 지원 — 1절 표). 걸리는 곳은 세 군데뿐이다: **① 아이폰 무음 스위치 ② 인앱 브라우저의 파일 저장 ③ 영상 녹화 형식.**
2. **인앱 브라우저(카카오톡·인스타그램)에서는 파일 저장·파일 공유를 기대하지 않는다.** 카카오 공식 안내상 인앱 브라우저에는 기본적으로 파일 다운로드 기능이 없다. 그래서 **공유의 기본은 "링크"**(곡 설정값을 담은 주소)로 하고, 저장·영상은 "다른 브라우저로 열기" 안내 뒤에 제공한다.
3. **"같은 사진 = 같은 노래"는 음표 목록 단계에서 보장하고, 구운 소리 파일의 바이트까지 같다고 약속하지 않는다.** 직접 재 보니 같은 브라우저에서 같은 곡을 두 번 구워도 표본 값이 맨 끝자리(최대 1.5×10⁻⁷)에서 달랐다(4절). 들리는 차이는 아니지만 테스트를 "바이트 일치"로 짜면 깨진다.

## 제작에 주는 결론

- **지원 기준선:** iOS/iPadOS Safari 15 이상, Chrome·Edge 90 이상, 삼성 인터넷 15 이상, Firefox 100 이상. 이 선에서 핵심 흐름에 쓰는 기능(파일 선택·캔버스·Web Audio·굽기·링크 복사)이 전부 접두어 없이 된다(1절 표). 더 옛 버전은 막지 않고, 기능이 없으면 해당 버튼만 숨긴다(기능 감지).
- **소리 시작은 반드시 사용자가 누른 버튼 안에서.** `AudioContext` 는 "▶ 듣기"를 누를 때 만들거나 `resume()` 한다. 사진을 고른 직후 자동 재생을 시도하되 `ctx.state !== 'running'` 이면 큰 재생 버튼을 보여 준다.
- **아이폰 무음 스위치:** 첫 재생 때 `navigator.audioSession.type = 'playback'` 을 넣는다(있을 때만, Safari 16.4+). 그래도 실기기 확인 전까지는 화면에 "소리가 안 들리면 무음 모드를 꺼 주세요" 한 줄을 아이폰에서만 보여 준다.
- **화면을 벗어나면 재생을 멈춘다**(`visibilitychange` 에서 정지). 돌아왔을 때 자동으로 이어 틀지 않고 재생 버튼을 다시 누르게 한다. iOS에서 백그라운드 복귀 뒤 `resume()` 이 안 되는 보고가 여러 건이라, 이어 틀기를 약속하지 않는 편이 안전하다.
- **내보내기 우선순위:** ① 링크 공유(모든 환경) ② 그림 카드 PNG ③ WAV 저장 ④ 영상(선택 기능). ②~④는 `navigator.canShare({files})` 가 되면 공유 시트로, 아니면 `<a download>` 로, 인앱 브라우저면 "다른 브라우저로 열기" 안내로 바꾼다.
- **영상은 MVP 필수에서 뺀다.** 형식이 브라우저마다 다르고(mp4/webm) 곡 길이만큼 실시간으로 녹화해야 한다. 넣는다면 `MediaRecorder.isTypeSupported` 로 `video/mp4` → `video/webm` 순서로 고르고, 둘 다 안 되면 버튼을 숨긴다.
- **HEIC 변환 라이브러리는 넣지 않는다.** 아이폰은 사진을 고를 때 JPEG로 바꿔 주고(보고 기준), 그 밖에서 HEIC를 못 열면 "이 사진 형식은 열 수 없어요. 화면을 캡처해서 넣어 보세요"로 안내한다.
- **실기기 확인이 꼭 필요한 것 8가지**는 6절 점검표에 넣었다. 점검용 페이지 `lab/bench/p4-probe.html` 을 만들었다(누르면 결과 표가 나오고 복사 가능).

## 0. 조사 방법과 한계 (먼저 읽을 것)

- 확인 날짜: **2026-11-24 (KST)**.
- **문서 사이트 직접 접속은 이번에도 막혀 있다**(developer.mozilla.org, caniuse.com 접속 실패). 대신 두 사이트가 쓰는 **원본 데이터 묶음을 npm 레지스트리에서 직접 받아 조회**했다. 그래서 1~3절의 버전 숫자는 검색 요약이 아니라 **데이터를 직접 읽은 값**이다.
  - `@mdn/browser-compat-data` **8.1.10** (2026-11-19 생성, 라이선스 CC0) — MDN 호환성 표의 원본. 표에서 "MDN 데이터"로 적는다.
  - `caniuse-lite` **1.0.30001827** (라이선스 CC-BY-4.0) — caniuse.com 의 원본. 표에서 "caniuse 데이터"로 적는다.
  - 이 데이터 기준 최신 버전: Chrome 158(2026-11-17), Edge 157, Firefox 160, Safari·iOS Safari 27.2(2026-10-26), 삼성 인터넷 31.0(2026-09-23).
  - 다시 조회하려면: 임시 폴더에서 `npm install @mdn/browser-compat-data caniuse-lite` 후 `require('@mdn/browser-compat-data').api.Navigator.share.__compat.support` 처럼 읽는다. 두 묶음은 저장소에 넣지 않았다.
- **직접 실행해 확인한 것:** `lab/bench/p4-probe.html` 을 헤드리스 Chromium 157(리눅스)에서 PC 1280px·모바일 390px 로 열어 오류·가로 넘침 없음, 굽기 시간, 녹화 형식, 큰 그림 축소 시간을 쟀다(4절).
- **검색 결과(요약·제목·주소) 기준인 것:** 무음 스위치, 백그라운드 동작, 인앱 브라우저, HEIC 자동 변환, 캔버스 한도, 녹화 형식의 버전별 이력. 해당 칸에 "검색 기준"이라고 적었다.
- **확인 못 한 것(전부 6절 실기기 점검표로 넘김):** 실제 휴대폰에서의 모든 동작, 카카오톡·인스타그램 인앱 브라우저 안에서의 실제 동작, 삼성 인터넷 고유 동작, Firefox 캔버스의 EXIF 회전.
- **인앱 브라우저 칸을 읽는 법:** 카카오 공식 안내에 따르면 카카오톡 인앱 브라우저는 OS가 제공하는 웹뷰로 만들어져 있다([카카오 데브톡 146696](https://devtalk.kakao.com/t/topic/146696), 검색 기준). 그래서 표에서는 MDN 데이터의 **"Android WebView"·"iOS WebView" 칸을 근사값**으로 썼다. 앱이 기능을 따로 막거나 여는 것까지는 이 데이터로 알 수 없다. 인스타그램은 공식 문서를 찾지 못했다.

## 1. 지원 표

표기: 숫자 = 그 버전부터 지원 / ✕ = 지원 안 함 / 출처는 따로 적지 않으면 MDN 데이터 8.1.10. "WebView"는 인앱 브라우저의 근사값(0절).

### 1-1. 사진 넣기

| 기능 | Chrome·Edge(PC) | Firefox | Safari(Mac) | iOS Safari | Chrome(안드) | 삼성 인터넷 | Android WebView | iOS WebView | 안 될 때 |
|---|---|---|---|---|---|---|---|---|---|
| 파일 선택 `<input type=file>` | 1 · 12 | 1 | 1 | 1 | 18 | 1.0 | 4.4 | 1 | 없음(핵심 경로). 인앱에서 실제로 열리는지는 확인 못 함 |
| 바로 촬영 `capture` 속성 | ✕ | ✕ | ✕ | 10 | 25 | 1.5 | 4.4 | 10 | PC에서는 무시됨. **쓰지 않는 것을 추천** — `accept="image/*"` 만 두면 휴대폰이 "사진 보관함/촬영" 선택지를 띄운다(선택지 구성은 확인 못 함). `capture` 를 넣으면 보관함을 못 고른다 |
| 끌어다 놓기 `drop` + `DataTransfer.files` | 1 · 12 | 9 | 3.1 | 2 | 18 | 1.0 | 4.4 | 2 | PC 전용 편의 기능. 터치 기기에서는 안내 문구를 숨긴다(`(pointer: coarse)`) |
| 붙여넣기 `paste` + `clipboardData.files` | 41 · 12 | 22 | 10.1 | 10.3 | 41 | 4.0 | 41 | 10.3 | PC 전용 편의 기능. `navigator.clipboard.read()` (권한 창이 뜸)는 쓰지 않고 `paste` 이벤트만 쓴다 |
| EXIF 방향 `image-orientation: from-image` (기본값) | 81 | 26 | 13.1 | 13.4 | 81 | 13.0 | 81 | 13.4 | 캔버스 `drawImage` 에도 적용되는지: Chrome 81·Safari 13.1 은 됨([W3C 메일 2020-04](https://lists.w3.org/Archives/Public/public-css-archive/2020Apr/0170.html), 검색 기준), **Firefox·삼성 인터넷은 확인 못 함** → 실기기 점검 |
| `willReadFrequently` 옵션 | 99 | 28 | 18 | 18 | 99 | 18.0 | 99 | 18 | 모르는 옵션은 무시되므로 그냥 넣어도 된다 |
| `HTMLImageElement.decode()` | 64 · 79 | 68 | 11.1 | 11.3 | 64 | 9.0 | 64 | 11.3 | `onload` 로 대체(지금 방식) |
| `createImageBitmap` 회전 옵션 | 52 · 79 | 93 | 15 | 15 | 52 | 6.0 | 52 | 15 | **쓰지 않는다**(P2 결정 유지. `<img>` 경로 하나로 통일) |

**HEIC 사진** (caniuse 데이터 `heif`): `<img>` 로 열 수 있는 곳은 **Safari 17.0+ (Mac·iOS)뿐**이고 Chrome·Edge·Firefox·삼성 인터넷은 최신 버전까지 전부 ✕.

| 상황 | 일어나는 일 | 확인 상태 |
|---|---|---|
| 아이폰에서 `accept="image/*"` 로 사진 고르기 | iOS가 HEIC를 **JPEG로 바꿔서** 넘겨 준다 | 검색 기준(WebKit 버그 보고 여러 건: [212482](https://bugs.webkit.org/show_bug.cgi?id=212482), [303803](https://bugs.webkit.org/show_bug.cgi?id=303803)). `accept` 에 `image/heic` 를 따로 적으면 반대로 HEIC로 바뀌어 온다는 보고가 있다([애플 개발자 포럼 743049](https://developer.apple.com/forums/thread/743049)) → **`accept="image/*"` 만 쓴다** |
| 안드로이드·PC에서 HEIC 파일 고르기 | `<img>` 디코드 실패 → `onerror` | caniuse 데이터. 안드로이드 사진 고르기 창이 자동 변환하는지는 확인 못 함 |
| 대처 | `onerror` 에서 "이 사진 형식은 열 수 없어요. 화면을 캡처해서 넣어 보세요" 안내. 변환 라이브러리는 넣지 않음 | 후보였던 `heic2any` 는 MIT지만 풀었을 때 2.7MB, 마지막 수정 2023-03(npm 레지스트리 직접 확인) — 용량 대비 얻는 것이 적다 |

**큰 사진 메모리 한도**

| 항목 | 내용 | 확인 상태 |
|---|---|---|
| iOS 캔버스 넓이 한도 | 오랫동안 16,777,216픽셀(4096×4096). iOS 18 무렵 8192×8192로 올랐다는 실험 글이 있다 | 검색 기준([pqina](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/), [WebKit 271002](https://bugs.webkit.org/show_bug.cgi?id=271002), [개인 블로그 2025-05](https://lionpuro-com.pages.dev/posts/canvas-is-finally-usable-on-safari)). 적용 버전·현재 전체 메모리 한도는 **확인 못 함** |
| 우리 영향 | 없음에 가깝다. 분석용 128, 표시용 1280 이하 캔버스만 만들므로 낮은 쪽 한도(4096×4096)의 1/10 미만 | P2 규칙 유지: 원본 크기 캔버스를 만들지 않는다 |
| 4000×3000 디코드+128 축소 시간 | **82~87ms** (헤드리스 Chromium 157, 서버 CPU) | 직접 측정(4절). 휴대폰 값은 실기기 점검 |

### 1-2. 소리

| 기능 | Chrome·Edge(PC) | Firefox | Safari(Mac) | iOS Safari | Chrome(안드) | 삼성 인터넷 | Android WebView | iOS WebView | 메모 |
|---|---|---|---|---|---|---|---|---|---|
| `AudioContext` (접두어 없음) | 35 · 12 | 25 | 14.1 | 14.5 | 35 | 3.0 | 37 | 14.5 | 그 전 Safari(6~)는 `webkitAudioContext`. 지금 `app.js` 처럼 둘 다 받는다 |
| `resume()`·`state`·`statechange` | 41 · 14 | 40 | 9 | 9 | 41 | 4.0 | 41 | 9 | |
| `OfflineAudioContext` (접두어 없음) | 35 · 12 | 25 | 14.1 | 14.5 | 35 | 3.0 | 37 | 14.5 | 그 전 Safari(7~)는 `webkitOfflineAudioContext` |
| `startRendering()` 이 Promise 반환 | 42 · ≤18 | 37 | 14.1 | 14.5 | 42 | 4.0 | 42 | 14.5 | `oncomplete` 이벤트와 Promise **둘 다** 받게 짠다(점검 페이지가 그렇게 함) |
| `DynamicsCompressorNode` | 14 · 12 | 25 | 6 | 6 | 18 | 1.0 | 4.4 | 6 | |
| `ConvolverNode` | 14 · 12 | 25 | 6 | 6 | 18 | 1.0 | 4.4.3 | 6 | |
| `createPeriodicWave` | 30 · 12 | 25 | 8 | 8 | 30 | 2.0 | 4.4 | 8 | |
| `DelayNode` | 24 · 12 | 25 | 7 | 7 | 25 | 1.5 | 4.4 | 7 | |
| `StereoPannerNode` | 41 · 12 | 37 | 14.1 | 14.5 | 41 | 4.0 | 41 | 14.5 | |
| `AudioParam.cancelAndHoldAtTime` | 57 · 79 | **✕** | 14.1 | 14.5 | 57 | 7.0 | 57 | 14.5 | **Firefox에 없다 → 쓰지 않는다.** 정지할 때는 `cancelScheduledValues` + `setTargetAtTime` |
| `AudioWorklet` | 66 · 79 | 76 | 14.1 | 14.5 | 66 | 9.0 | 66 | 14.5 | 필요 없음(기본 노드만 씀) |
| `navigator.audioSession` | ✕ | ✕(미리보기판만) | 16.4 | 16.4 | ✕ | ✕ | ✕ | 16.4 | 무음 스위치 대책(아래). 없으면 건너뛴다 |

**첫 재생 잠금 해제**

| 환경 | 규칙 | 출처·확인 상태 |
|---|---|---|
| Chrome 계열(PC·안드로이드·삼성 인터넷·Android WebView) | Chrome 71부터 Web Audio에도 자동재생 정책 적용. 사용자 동작 전에 만든 `AudioContext` 는 `suspended`. 클릭 처리기 안에서 `resume()` 하거나 그 안에서 만든다 | 검색 기준([Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay), [Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay)) |
| iOS Safari·iOS WebView | 클릭·터치 같은 사용자 동작이 있어야 소리가 난다 | 검색 기준([애플 개발자 포럼 23499](https://developer.apple.com/forums/thread/23499)) |
| 파일을 고른 직후(`change` 이벤트)가 사용자 동작으로 인정되는지 | **확인 못 함** | 그래서 "사진 고르면 바로 재생"은 시도만 하고, `state` 가 `running` 이 아니면 재생 버튼을 보여 준다 |
| 헤드리스 Chromium 157 | 버튼 클릭 안에서 만든 컨텍스트는 `running` | 직접 확인(4절) |

**iOS 무음 스위치**

| 사실 | 출처·확인 상태 |
|---|---|
| iOS에서 Web Audio는 벨소리 무음일 때 소리가 나지 않는다(기본 오디오 세션이 `ambient` 취급) | 검색 기준([WebKit 237322](https://bugs.webkit.org/show_bug.cgi?id=237322)) |
| `navigator.audioSession.type = 'playback'` 으로 바꾸면 무음에서도 소리가 난다는 WebKit 쪽 안내와 사용자 보고가 있다. API는 Safari 16.4+ | 검색 기준(같은 버그 글타래, [W3C Audio Session 초안](https://www.w3.org/TR/2024/WD-audio-session-20241112/)) + MDN 데이터(버전). **실기기 확인 못 함** |
| 대체 방법으로 "소리 없는 `<audio>` 를 같이 틀기"가 알려져 있다 | 검색 기준([WebKit 261554](https://bugs.webkit.org/show_bug.cgi?id=261554) 등). 남의 라이브러리를 가져오지 않고, 필요하면 무음 WAV를 코드로 만들어 직접 구현 |
| **우리 처리** | ① `audioSession` 이 있으면 `playback` 으로 ② 아이폰에서만 "소리가 안 들리면 무음 모드를 꺼 주세요" 안내 ③ 재생 중 파형·건반 시각화가 움직이므로 소리가 안 나도 "재생 중"임은 보인다. ①이 실기기에서 통하면 ②를 뺀다 |

**백그라운드 전환(다른 앱·탭으로 갔다 올 때)**

| 사실 | 출처·확인 상태 |
|---|---|
| iOS Safari는 화면을 벗어나면 `AudioContext.state` 가 표준에 없는 `interrupted` 가 될 수 있다. MDN 데이터에도 `state.interrupted` 항목이 따로 있다 | MDN 데이터(항목 존재) + 검색 기준([WebKit 263627](https://bugs.webkit.org/show_bug.cgi?id=263627), [273511](https://bugs.webkit.org/show_bug.cgi?id=273511)) |
| 돌아온 뒤 `resume()` 이 안 먹거나 끝나지 않는다는 보고가 iOS 17~26에 걸쳐 있다 | 검색 기준(위 버그들, [283419](https://bugs.webkit.org/show_bug.cgi?id=283419), [291892](https://bugs.webkit.org/show_bug.cgi?id=291892)) |
| Safari는 페이지를 떠날 때 `visibilitychange` 가 안 올 수 있어 `pagehide` 도 같이 들어야 한다 | MDN 데이터 주석 |
| **우리 처리** | `visibilitychange`(숨김)·`pagehide` 에서 재생을 **정지**하고 재생 버튼을 처음 상태로 돌린다. 돌아와서 누르면 `state` 를 보고 `running` 이 아니면 `resume()`, 0.5초 안에 안 되면 컨텍스트를 새로 만든다. 15~30초짜리 곡이라 "이어 듣기"는 필요 없다 |

**OfflineAudioContext(파일로 굽기)** — P3가 넘긴 확인 항목

| 질문 | 답 | 확인 상태 |
|---|---|---|
| 굽기에서 컴프레서·컨볼버·주기파·지연을 쓸 수 있나 | 모든 대상 브라우저에 노드가 있다(위 표). 헤드리스 Chromium에서 오실레이터 12개 + 주기파 + 되먹임 지연 + 컴프레서 그래프를 굽기에 성공 | MDN 데이터 + 직접 실행 |
| 굽기 결과가 실시간 재생과 같은가 | **확인 못 함.** 컴프레서는 브라우저·OS마다 출력이 조금씩 다르다는 것이 알려져 있다(오디오 지문 채취가 이 차이를 쓴다) | 검색 기준([fingerprint.com](https://fingerprint.com/blog/audio-fingerprinting/)) |
| 굽기를 두 번 하면 같은가 | **비트 단위로는 같지 않았다**(4절). 차이는 최대 1.5×10⁻⁷ | 직접 측정 |
| 되먹임 고리의 제약 | 고리 안에는 `DelayNode` 가 반드시 하나 있어야 하고(없으면 고리의 노드가 무음), 고리 안 지연 시간은 최소 렌더 단위 1개(128표본 ≈ 2.9ms)로 올림된다 | 검색 기준([MDN DelayNode](https://developer.mozilla.org/docs/Web/API/DelayNode), [웹 플랫폼 테스트 delay-time-clamping](https://searchfox.org/firefox-main/source/testing/web-platform/tests/webaudio/the-audio-api/processing-model/delay-time-clamping.html)). 명세 원문은 확인 못 함. 우리 지연은 0.2초 안팎이라 영향 없음 |
| iOS에서 동시 발음 10개 안팎의 부하 | **확인 못 함** | 점검 페이지가 12개짜리 20초 굽기 시간을 잰다(서버에서 164~174ms). 실시간 재생의 끊김은 실기기 점검 |

### 1-3. 내보내기·공유

| 기능 | Chrome·Edge(PC) | Firefox | Safari(Mac) | iOS Safari | Chrome(안드) | 삼성 인터넷 | Android WebView | iOS WebView | 안 될 때 |
|---|---|---|---|---|---|---|---|---|---|
| 링크 공유 `navigator.share` | 128 (89~127은 윈도우·크롬OS만) · 93 | PC ✕(설정 뒤에만) / 안드 79 | 12.1 | 12.2 | 61 | 8.0 | **✕** | 12.2 | `clipboard.writeText` 로 "링크 복사"(지금 `core.js` 의 `shareText` 가 이미 이렇게 함) |
| 파일 공유 `share({files})` | 89 · 81 | **✕** | 14 | 14 | 76 | 11.0 | **✕** | 14 | `<a download>` 로 저장. 공유 가능한 파일 종류는 브라우저가 정하므로 **항상 `navigator.canShare({files})` 로 먼저 묻는다** |
| `navigator.canShare` | 128 · 93 | PC ✕ / 안드 96 | 14 | 14 | 75 | 11.0 | ✕ | 14 | 없으면 파일 공유 버튼 숨김 |
| 링크 복사 `clipboard.writeText` | 66 · 79 | 63 | 13.1 | 13.4 | 66 | 9.0 | 66 | 13.4 | 반드시 클릭 처리기 안에서. 실패하면 주소를 글자로 보여 주고 길게 눌러 복사 |
| 파일 저장 `<a download>` | 15 · 13 | 20 | 10.1 | 10.3 | 18 | 1.0 | 4.4 | 10.3 | 인앱 브라우저에서는 속성이 있어도 실제 저장이 안 될 수 있다(2절) |
| `canvas.toBlob` (그림 카드 PNG) | 50 · 79 | 18 | 11 | 11 | 50 | 5.0 | 50 | 11 | |
| `MediaRecorder` (영상 녹화) | 47 · 79 | 25 | 14.1 | 14 (caniuse 데이터는 14.5) | 47 | 5.0 | 47 | 14 | 없으면 영상 버튼 숨김 |
| `canvas.captureStream` | 51 · 79 | 43 | 11 | 11 | 51 | 5.0 | 51 | 11 | |
| `createMediaStreamDestination` (소리를 녹화에 넣기) | 25 · 79 | 25 | 11 | 11 | 25 | 1.5 | 4.4 | 11 | |
| WebCodecs `VideoEncoder` / `AudioEncoder` | 94 / 94 | 130 / 130 (안드 ✕) | 16.4 / **26** | 16.4 / **26** | 94 / 94 | 17.0 / 17.0 | 94 / 94 | 16.4 / 26 | 소리 인코더가 Safari 26부터라 "실시간보다 빨리 영상 굽기"는 이번에 쓰지 않는다 |

**WAV 저장**

- WAV는 브라우저 기능이 아니라 우리가 바이트를 직접 쓰는 형식이라(머리 44바이트 + 16비트 표본) 어디서나 만들 수 있다. 재생도 대상 브라우저 전부 지원(caniuse 데이터 `wav`: Chrome 8, Firefox 4, Safari 4, iOS 8).
- 크기(직접 측정): 20초·스테레오·44.1kHz·16비트 = **3,528,044바이트(약 3.5MB)**, 만드는 데 41~42ms. 메신저로 보내기엔 크므로 **모노 = 절반(약 1.8MB)** 을 기본으로 하는 것을 추천.
- mp3·m4a로 줄이려면 인코더가 필요하다. `MediaRecorder` 로 `audio/mp4`·`audio/webm` 을 만들 수는 있지만 실시간 녹음이고 형식이 갈린다 → MVP는 WAV만.

**영상 형식(화면+소리)**

| 브라우저 | 녹화 가능한 형식 | 확인 상태 |
|---|---|---|
| Chromium 157 (헤드리스, 리눅스) | `video/mp4`, `video/webm`(vp8·vp9+opus), `audio/mp4`, `audio/webm;codecs=opus` 지원. `audio/ogg`·`audio/wav` 는 ✕ | **직접 확인**(`MediaRecorder.isTypeSupported`, 4절) |
| Chrome의 mp4 녹화가 들어간 버전 | 2024년에 출시 의향이 올라왔고 2024년 중반부터 지원된다는 글이 있다. 정확한 버전은 **확인 못 함** | 검색 기준([blink-dev: MP4 container support for MediaRecorder](https://groups.google.com/a/chromium.org/g/blink-dev/c/p1OMVj1FrMI)) |
| Safari·iOS | 18.4(2025-03-31 출시) 전에는 mp4(H.264+AAC)만. 18.4부터 webm도 | 검색 기준([WebKit 290002](https://bugs.webkit.org/show_bug.cgi?id=290002) 등) + MDN 데이터(출시일) |
| Firefox | webm. mp4 녹화는 미지원 버그가 열려 있다 | 검색 기준([Mozilla 1631143](https://bugzilla.mozilla.org/show_bug.cgi?id=1631143)). 현재 상태 확인 못 함 |
| 재생 쪽 | mp4(H.264)는 전부 재생. webm은 iOS 17.4 전에는 부분 지원 | caniuse 데이터 `mpeg4`, `webm` |

→ **받는 사람이 어디서든 열 수 있는 것은 mp4**다. 고르는 순서는 `video/mp4` → `video/webm;codecs=vp9,opus` → `video/webm`. Firefox에서 만든 webm은 아이폰 메신저에서 안 열릴 수 있다는 안내를 붙인다.

**링크 공유 미리보기**

- 지금 `index.html` 에 `og:title`·`og:description`·`og:image`(1200×630 `og.png`) 가 있다(직접 확인). 정적 호스팅(GitHub Pages)이고 곡 정보가 주소의 `#` 뒤에 있으므로 **곡마다 다른 미리보기 그림은 만들 수 없다**(서버가 `#` 뒤를 받지 못한다). 미리보기는 서비스 공통 그림 한 장으로 간다.
- 카카오톡이 미리보기를 얼마나 오래 저장해 두는지, 이름·그림을 바꿨을 때 갱신 방법은 **확인 못 함** → P6에서 이름이 확정되면 `og.png` 를 한 번에 바꾸고 실기기로 확인.
- 곡마다 다른 그림을 보내고 싶으면 **그림 카드 PNG를 파일 공유**하는 길을 쓴다(위 표).

### 1-4. 화면

| 기능 | Chrome·Edge(PC) | Firefox | Safari(Mac) | iOS Safari | Chrome(안드) | 삼성 인터넷 | Android WebView | iOS WebView | 메모 |
|---|---|---|---|---|---|---|---|---|---|
| `dvh` 단위(주소창 높이 반영) | 108 | 101 | 15.4 | 15.4 | 108 | 21.0 | 108 | 15.4 | `height: 100vh; height: 100dvh;` 두 줄로 적어 옛 버전은 `vh` 로 |
| `env(safe-area-inset-*)` | 69 · 79 | 65 | 11 | 11 | 69 | 10.0 | 69 | 11 | 지금 `core.js` 가 `viewport-fit=cover` 를 넣는다 → 아래쪽 고정 버튼에 안전 영역 여백 필요 |
| `(hover)`·`(pointer)` 미디어 질의 | 38·41 | 64 | 9 | 9 | 50 | 5.0 | 50·41 | 9 | **일부 삼성 기기에서 `(hover: hover)` 가 잘못 맞는다**(MDN 데이터 주석) → 기능을 hover에만 걸지 않는다 |
| `PointerEvent` | 55 · 12 | 59 | 13 | 13 | 55 | 6.0 | 55 | 13 | 터치·마우스를 한 코드로 |
| `aspect-ratio` | 88 | 89 | 15 | 15 | 88 | 15.0 | 88 | 15 | |
| `:has()` | 105 | 121 | 15.4 | 15.4 | 105 | 20.0 | 105 | 15.4 | 꾸밈에만 쓴다 |
| `prefers-reduced-motion` | 74 · 79 | 63 | 10.1 | 10.3 | 74 | 11.0 | 74 | 10.3 | 지금 `core.js` 의 `Motion` 이 처리 |
| 화면 꺼짐 방지 `wakeLock` | 84 | 126 | 16.4 | 18.4 | 84 | 14.0 | 84 | 18.4 | 30초 이하 곡이라 필요 없음 |
| `navigator.vibrate` | 32 · 79 | ✕(129에서 제거) | ✕ | ✕ | 32 | 2.0 | 4.4.3 | ✕ | 아이폰에 없다 → 진동을 핵심 표현으로 쓰지 않는다 |

- **PC 2단·모바일 1단:** 지금 `core.js` 의 `View` 는 창 폭 900px 이상이면 `html.pc`, 아니면 `html.mobile` 을 붙이고 사용자가 머리글 버튼으로 바꿀 수 있다(직접 확인). 새 화면도 이 두 클래스만 보고 배치하면 된다: PC = 왼쪽 사진·시각화 / 오른쪽 설명·조작, 모바일 = 사진 → 재생 → 설명 → 공유 순서의 1단.
- **가로·세로 전환:** 휴대폰을 눕혀도 폭이 900px 미만(예: 844px)이라 `mobile` 그대로다. `resize` 때 `View.apply()` 가 다시 돈다. 시각화 캔버스는 `resize` 에서 크기를 다시 잡아야 한다. 재생 중 회전해도 소리가 끊기지 않는지는 실기기 점검.
- **터치·마우스·키보드:** 버튼은 진짜 `<button>`(키보드 Enter·Space 자동). 누르는 곳은 최소 44×44px. PC에서 Space = 재생/정지 단축키는 입력 칸에 초점이 없을 때만.
- 점검 페이지는 PC 1280px·모바일 390px 에서 가로 넘침 0px, 콘솔 오류 0건(직접 확인).

## 2. 인앱 브라우저 (카카오톡·인스타그램)

공모전 투표자가 메신저로 받은 링크를 누르면 여기서 열린다. **확인된 사실이 적은 영역**이라, 되는 것만 쓰고 나머지는 밖으로 안내하는 설계를 한다.

| 항목 | 카카오톡 | 인스타그램 | 확인 상태 |
|---|---|---|---|
| 알아보는 법 | `navigator.userAgent` 에 `KAKAOTALK` (예: `KAKAOTALK/11.1.2 (INAPP)`) | `Instagram` 포함으로 알려져 있음 | 카카오: 검색 기준([데브톡 148932](https://devtalk.kakao.com/t/user-agent/148932), [140637](https://devtalk.kakao.com/t/agent/140637)). 인스타그램: **확인 못 함**(공식 문서 없음) |
| 엔진 | OS 웹뷰(안드로이드 WebView / iOS WKWebView) | 안드로이드는 크로미움 계열 웹뷰, iOS는 WKWebView라는 제3자 글 | 카카오: 검색 기준(공식 데브톡). 인스타그램: 제3자 글만 |
| 파일 저장 | **기본적으로 다운로드 기능 없음.** `<a download>` 는 안드로이드만 되고 iOS는 주소로 이동. blob·data 주소는 안드로이드 웹뷰에서 안 된다는 답변. 카카오 권장은 서버의 `Content-Disposition` 헤더인데 우리는 서버가 없다 | 저장이 안 된다는 제3자 안내 글들 | 검색 기준([데브톡 146696](https://devtalk.kakao.com/t/topic/146696), [146168](https://devtalk.kakao.com/t/topic/146168), [WebKit 216918](https://bugs.webkit.org/show_bug.cgi?id=216918)) |
| `navigator.share` | 안드로이드: 없음(Android WebView ✕) / iOS: 있을 수 있음 | 같은 웹뷰 데이터 기준 | MDN 데이터의 웹뷰 칸. 앱 안 실제 동작은 확인 못 함 |
| 사진 고르기·소리 재생 | **확인 못 함** | **확인 못 함** | 실기기 점검 1순위 |
| 밖으로 여는 법 | 주소 `kakaotalk://web/openExternal?url=<인코딩한 주소>` 가 쓰인다. 사용자가 직접: 안드로이드 ⋮ → 다른 브라우저로 열기, 아이폰 공유 버튼 → 브라우저 선택 | 사용자가 직접: 메뉴 → 외부 브라우저로 열기 | 카카오 주소 방식은 공식 문서가 아니라 사용 사례 기준([데브톡 150815](https://devtalk.kakao.com/t/topic/150815), [사용 예](https://gist.github.com/hongggyelim/934a94c8c61f3e893347f8be12f259cd)). 수동 경로: [안내 글](https://extrememanual.net/60210). 인스타그램: 확인 못 함 |

**설계 규칙**

1. **인앱에서도 핵심(사진 → 소리 → 링크 공유)은 그대로 되게 한다.** 인앱이라는 이유로 막거나 강제로 내보내지 않는다(확인 안 된 주소 방식에 핵심 흐름을 걸지 않는다).
2. 저장·영상 버튼을 인앱에서 누르면 저장을 시도하지 않고 안내를 띄운다: "카카오톡 안에서는 파일 저장이 안 될 수 있어요. **다른 브라우저로 열기**를 누르면 같은 노래가 그대로 열려요." 버튼 두 개: [다른 브라우저로 열기](카카오톡만, `openExternal` 주소) / [링크 복사].
3. 이것이 가능한 이유: **공유 링크에 곡 설정값이 들어 있어서**(P3 결정) 밖에서 열어도 사진 없이 같은 곡이 나온다.
4. 사진을 고를 수 없는 상황(`change` 가 오지 않음)을 대비해, 사진 없이도 들을 수 있는 **예시 곡 버튼**(코드로 그린 시험 그림)을 첫 화면에 둔다. 체험이 0에서 막히지 않는다.

## 3. 대체 경로 한눈에

| 하려는 일 | 1순위 | 2순위 | 3순위 |
|---|---|---|---|
| 사진 넣기 | 파일 선택(전부) | PC: 끌어다 놓기·붙여넣기 | 예시 곡 버튼 |
| 열 수 없는 사진(HEIC 등) | — | "화면을 캡처해서 넣어 보세요" 안내 | 예시 곡 버튼 |
| 소리 내기 | 버튼 클릭 안에서 `resume()` | `state` 가 안 바뀌면 컨텍스트 새로 만들기 | 시각화만 움직이고 "소리가 안 들리면…" 안내 |
| 링크 보내기 | `navigator.share({url})` | `clipboard.writeText` | 주소를 글자로 보여 주기 |
| 그림 카드·WAV 보내기 | `canShare({files})` → 공유 시트 | `<a download>` | 인앱: "다른 브라우저로 열기" 안내 |
| 영상 | `MediaRecorder` mp4 → webm | 버튼 숨김 | — |
| 화면 높이 | `100dvh` | `100vh` | — |

## 4. 직접 실행한 측정 (헤드리스 Chromium 157.0.8103.78, 리눅스, 서버 CPU)

`lab/bench/p4-probe.html` 을 PC 1280×800·모바일 390×844(터치)로 열어 얻은 값. 휴대폰 값이 아니다.

| 항목 | PC 1280 | 모바일 390 |
|---|---|---|
| 콘솔 오류 / 가로 넘침 | 0건 / 0px | 0건 / 0px |
| 클릭 안에서 만든 `AudioContext` 상태 | `running`, 44100Hz | 같음 |
| 20초 곡 굽기(오실레이터 12 + 주기파 + 되먹임 지연 + 컴프레서) | 164ms | 174ms |
| WAV 만들기 | 42ms, 3,528,044바이트 | 41ms |
| 만든 WAV를 `<audio>` 로 읽은 길이 | 20초 | 20초 |
| 4000×3000 JPEG 디코드 + 128 축소 | 87ms | 82ms |
| 녹화 형식 | `video/mp4`, `video/webm`, `audio/mp4`, `audio/webm;codecs=opus` | 같음 |
| `navigator.share` | 없음(리눅스) | 없음 |

**굽기를 두 번 하면 같은가** (5초짜리 곡을 4번 굽고 첫 결과와 비교, 220,500표본×3회)

| 그래프 | 표본 최대 차이 | 16비트로 바꾼 뒤 다른 표본 수 |
|---|---|---|
| 오실레이터(세모파) 12개 + 게인만 | 4.5×10⁻⁸ | 30 / 661,500 |
| 사인파 12개 | 6.0×10⁻⁸ | 36 |
| + 주기파 | 6.0×10⁻⁸ | 29 |
| + 되먹임 지연 | 7.5×10⁻⁸ | 77 |
| + 컴프레서 | 1.2×10⁻⁷ | 46 |
| 전부 | 1.5×10⁻⁷ | 120 |

- **가장 단순한 그래프에서도 비트 단위로는 달랐다.** 컴프레서 탓이 아니다. 원인은 확인 못 함(같은 실행 안에서 4번 구운 결과끼리의 비교).
- 차이 크기는 약 −136dB로 들리지 않는다. 16비트로 바꾸면 66만 표본 중 수십 개가 1단계 다르다.
- **결론:** ① "같은 노래"의 기준은 **음표 목록(JSON)이 같다**로 한다. ② `lab/test` 에서 구운 소리를 비교할 때는 바이트 일치가 아니라 **최대 차이 < 10⁻⁴** 로 본다. ③ WAV 파일의 해시를 공유 링크나 중복 판정에 쓰지 않는다.

## 5. P2·P3가 넘긴 질문에 대한 답

| 넘어온 질문 | 답 |
|---|---|
| P2 ① 캔버스에서 EXIF 회전이 적용되는 브라우저·버전 | CSS 기본값 `from-image`: Chrome 81, Firefox 26, Safari 13.1, iOS 13.4, 삼성 13.0, Android WebView 81(MDN 데이터). 캔버스 `drawImage` 적용은 Chrome 81·Safari 13.1만 근거가 있고 **Firefox·삼성·인앱은 확인 못 함** → 점검표 2번 |
| P2 ② iOS 캔버스 한도의 현재 값 | **확인 못 함.** 4096×4096 → 8192×8192로 올랐다는 실험 글 1건. 우리는 1280 이하만 써서 영향 없음 |
| P2 ③ HEIC | Safari 17+만 열 수 있음. 아이폰 사진 고르기는 JPEG로 바꿔 줌(보고 기준). `accept="image/*"` 만 쓴다(1-1절) |
| P2 ④ 실기기 점검 항목 | 6절 2번·3번 |
| P3 ① 굽기에서 컴프레서·컨볼버 | 노드는 전부 있음. 실시간과 같은지는 확인 못 함. 비트 일치를 기대하지 말 것(4절) |
| P3 ② 주기파·지연 되먹임 제약 | 고리에 `DelayNode` 필수, 고리 안 최소 지연 128표본(검색 기준). 우리 설계에 영향 없음 |
| P3 ③ iOS 동시 발음 부하 | 확인 못 함 → 점검표 5번 |
| P3 ④ 실기기 점검 항목 | 6절 6번·7번 |

## 6. 실기기 점검표 (기기당 5분)

**준비:** 점검 페이지 `lab/bench/p4-probe.html` 은 main에 병합된 뒤(P6) `https://km-crew.github.io/color-melody/lab/bench/p4-probe.html` 에서 열린다. 그 전에는 PC에서 `python3 -m http.server` 로 띄우고 같은 와이파이의 휴대폰으로 접속할 수 있지만, `http://` 주소에서는 공유·복사 기능이 꺼지므로 소리·사진 항목만 본다. 본 앱이 나오면 같은 순서를 본 앱으로 한 번 더 한다.

**순서(모든 기기 공통)** — 각 줄 끝의 □에 ○/✕를 적는다.

| # | 할 일 | 볼 것 | 결과 |
|---|---|---|---|
| 1 | 점검 페이지를 연다 | 표가 바로 채워지는가. 가로로 밀리지 않는가 | □ |
| 2 | "② 사진 넣기 점검" → **세로로 찍은 사진** 고르기 | "고른 사진 디코드+축소"의 `small` 이 **세로로 긴 숫자**(예: 96x128)인가. 누워 있으면(128x96) 방향 처리 실패. `ms` 값 적기 | □ |
| 3 | "4000x3000 디코드+축소" 줄 | 오류 없이 `ms` 가 나오는가(값 적기) | □ |
| 4 | "① 소리·굽기 점검" 누르기 | **삑 소리가 들리는가.** `ctx.state(resume 뒤)` 가 `running` 인가 | □ |
| 5 | 같은 줄 아래 | "굽기 20초 걸린 시간"(값 적기, 3000ms 넘으면 표시), "WAV를 `<audio>`로 읽기"가 20인가 | □ |
| 6 | 다른 앱으로 갔다가 돌아오기 | "백그라운드 전환 뒤 state" 값 적기. 다시 ①을 누르면 소리가 나는가 | □ |
| 7 | "결과 복사" → 메모장·채팅에 붙여 넣어 전달 | 복사가 되는가 | □ |

**기기별 추가 확인**

| 기기·브라우저 | 추가로 할 일 | 결과 |
|---|---|---|
| **아이폰 Safari** | 옆면 스위치를 **무음**으로 하고 4번을 다시. 소리가 나는가(`audioSession=playback` 줄이 `ok` 인지 함께 적기). 사진 보관함의 HEIC 사진을 골랐을 때 "고른 파일"의 `type` 이 `image/jpeg` 인가 | □ |
| **안드로이드 Chrome** | 사진 고르기 창에 "카메라"가 보이는가. `canShareFiles` 줄에서 wav·png·mp4 가 true인가 | □ |
| **삼성 인터넷** | 2번(세로 사진 방향)을 꼭 확인. `hover/pointer` 줄이 `no-hover coarse` 인가 | □ |
| **카카오톡 인앱**(나에게 보내기로 링크 전송 → 눌러서 열기) | `inApp` 줄이 `kakaotalk` 인가. 2번(사진 고르기)·4번(소리)이 되는가. `share`·`a.download` 값 적기 | □ |
| **인스타그램 인앱**(프로필 링크 또는 DM의 링크) | `userAgent` 전체를 적기. 2번·4번이 되는가 | □ |
| **PC Chrome·Edge** | 그림 파일을 창에 **끌어다 놓기**, 그림을 복사한 뒤 **Ctrl+V** → "끌어다 놓기 파일"·"붙여넣기 파일" 줄이 생기는가. `recorderTypes` 적기 | □ |
| **PC Firefox** | 2번(세로 사진 방향), `recorderTypes`(mp4가 있는지) 적기 | □ |
| **Mac Safari** | 4번, `recorderTypes` 적기 | □ |

**본 앱이 나온 뒤 추가(P3가 넘긴 것)**

| # | 할 일 | 볼 것 |
|---|---|---|
| 8 | 자기 사진 10장을 차례로 넣기 | 서로 다른 곡으로 들리는가(비슷하게 들린 쌍을 적기) |
| 9 | 같은 사진을 두 기기에서 넣기 | 화면의 곡 설정값(조·빠르기·분위기)이 같은가. 다르면 두 값을 적기 |
| 10 | 공유 링크를 카카오톡으로 보내고 받은 쪽에서 열기 | 사진 없이 같은 곡이 나오는가. 미리보기 그림·제목이 보이는가 |
| 11 | 재생 중 휴대폰을 가로로 돌리기 | 소리가 끊기지 않고 시각화가 화면에 맞게 다시 그려지는가 |

## 7. 다음 단계에 넘길 점

- **P5(lab):**
  - `lab/render.js` 는 `window.AudioContext || window.webkitAudioContext`, `OfflineAudioContext || webkitOfflineAudioContext` 를 받고, `startRendering()` 은 `oncomplete` + Promise 둘 다 처리. `cancelAndHoldAtTime` 금지(Firefox 없음).
  - 테스트에서 구운 소리 비교는 **최대 차이 < 10⁻⁴**(4절). 결정성 테스트는 음표 목록으로.
  - `lab/index.html` 의 파일 입력은 `accept="image/*"` 만(`capture`·`image/heic` 넣지 않음). 끌어다 놓기·붙여넣기는 PC 편의 기능으로. 재생은 버튼 클릭 안에서 시작.
  - WAV는 모노 16비트를 기본으로(20초 ≈ 1.8MB).
  - `lab/bench/p4-probe.html` 의 `wavBytes`·`render`·`shrink` 는 직접 쓴 코드라 초안으로 써도 된다.
- **P6(설계서):**
  - 공유 설계는 "링크가 기본, 파일은 덤"(제작에 주는 결론). 영상은 선택 기능으로 분류하고 일정에서 맨 뒤.
  - 첫 화면에 **예시 곡 버튼**(사진 없이 체험) — 인앱에서 사진 고르기가 막혀도 체험이 된다.
  - 수용 기준의 "실기기로 확인할 것"에 6절 표를 그대로 옮긴다.
  - HANDOFF "사람이 정해야 할 것"에 추가: ① 6절 실기기 점검(특히 아이폰 무음 스위치, 카카오톡 인앱에서 사진 고르기·소리) ② 영상 내보내기를 넣을지(추천: 시간이 남으면) ③ 카카오톡 인앱에서 "다른 브라우저로 열기" 주소 방식을 쓸지(공식 문서 미확인, 추천: 실기기에서 되면 사용).

## 출처 (2026-11-24 확인)

**직접 읽은 데이터·직접 실행**

- `@mdn/browser-compat-data` 8.1.10 (npm, CC0) — 1절 표의 버전 숫자, 브라우저 출시일
- `caniuse-lite` 1.0.30001827 (npm, CC-BY-4.0) — `heif`, `wav`, `mpeg4`, `webm`, `mediarecorder`
- npm 레지스트리 `heic2any` 0.0.4 (라이선스·용량·수정일)
- `lab/bench/p4-probe.html` (이 저장소) — 4절 측정

**검색 결과 기준(직접 접속 못 함)**

- 자동재생: [Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay), [Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay), [애플 개발자 포럼 23499](https://developer.apple.com/forums/thread/23499)
- 무음 스위치: [WebKit 237322](https://bugs.webkit.org/show_bug.cgi?id=237322), [WebKit 261554](https://bugs.webkit.org/show_bug.cgi?id=261554), [W3C Audio Session 초안](https://www.w3.org/TR/2024/WD-audio-session-20241112/)
- 백그라운드: [WebKit 263627](https://bugs.webkit.org/show_bug.cgi?id=263627), [273511](https://bugs.webkit.org/show_bug.cgi?id=273511), [283419](https://bugs.webkit.org/show_bug.cgi?id=283419), [291892](https://bugs.webkit.org/show_bug.cgi?id=291892)
- HEIC: [WebKit 212482](https://bugs.webkit.org/show_bug.cgi?id=212482), [WebKit 303803](https://bugs.webkit.org/show_bug.cgi?id=303803), [애플 개발자 포럼 743049](https://developer.apple.com/forums/thread/743049)
- 캔버스 한도: [pqina](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/), [WebKit 271002](https://bugs.webkit.org/show_bug.cgi?id=271002), [개인 블로그 2025-05](https://lionpuro-com.pages.dev/posts/canvas-is-finally-usable-on-safari)
- EXIF: [W3C 메일 2020-04](https://lists.w3.org/Archives/Public/public-css-archive/2020Apr/0170.html)
- 녹화 형식: [blink-dev: MP4 container support for MediaRecorder](https://groups.google.com/a/chromium.org/g/blink-dev/c/p1OMVj1FrMI), [WebKit 290002](https://bugs.webkit.org/show_bug.cgi?id=290002), [Mozilla 1631143](https://bugzilla.mozilla.org/show_bug.cgi?id=1631143)
- 파일 공유: [web.dev: How to share files](https://web.dev/patterns/files/share-files), [W3C Web Share](https://www.w3.org/TR/web-share/)
- 굽기 차이: [fingerprint.com: audio fingerprinting](https://fingerprint.com/blog/audio-fingerprinting/)
- 지연 되먹임: [MDN DelayNode](https://developer.mozilla.org/docs/Web/API/DelayNode), [웹 플랫폼 테스트 delay-time-clamping](https://searchfox.org/firefox-main/source/testing/web-platform/tests/webaudio/the-audio-api/processing-model/delay-time-clamping.html)
- 카카오톡 인앱: [데브톡 146696](https://devtalk.kakao.com/t/topic/146696), [146168](https://devtalk.kakao.com/t/topic/146168), [148932](https://devtalk.kakao.com/t/user-agent/148932), [140637](https://devtalk.kakao.com/t/agent/140637), [150815](https://devtalk.kakao.com/t/topic/150815), [사용 예(gist)](https://gist.github.com/hongggyelim/934a94c8c61f3e893347f8be12f259cd), [수동으로 여는 법](https://extrememanual.net/60210)
- 인앱 저장 제한: [WebKit 216918](https://bugs.webkit.org/show_bug.cgi?id=216918)
