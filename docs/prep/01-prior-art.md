# P1 사례 조사 — 사진·색·그림을 소리로 바꾸는 서비스 (2026-11-24)

## 3줄 요약

1. 사진→소리는 새 아이디어가 아니다. 조사한 22개는 **① 색 한 점→음 ② 그림을 악보처럼 스캔 ③ 스펙트로그램 ④ AI 생성** 네 갈래로 나뉜다.
2. 규칙 기반(①~③)은 "신기하지만 음악처럼 들리지 않는다"는 평이 반복되고, AI 생성(④)은 듣기 좋지만 **로그인·크레딧·서버 업로드**가 필요하고 "왜 이 소리인지" 설명이 없다.
3. 비어 있는 자리는 **"설치·로그인 없이 웹에서, 사진 한 장 → 항상 듣기 좋은 15~30초 곡 → 왜 이런 소리인지 보여 주고 → 바로 공유"** 이다. 가장 가까운 선행 사례는 iOS 앱 Melodist(사진의 색조·채도·명도 → 선법·화음·멜로디)다.

## 제작에 주는 결론

- **음계·화음 안에 가둔다.** 스캔·스펙트로그램 방식(PIXELSYNTH, Photosounder, The vOICe)은 사진과의 연결은 뚜렷하지만 소음처럼 들린다는 평이 많다. 우리 결과물은 리뷰·별점 대상이므로 "듣기 좋음"이 먼저다. → P3에서 방식 비교 시 반영.
- **스캔의 장점은 가져온다.** "왼쪽→오른쪽으로 읽는다, 위쪽일수록 높은 음"은 한 문장으로 설명되고 재생 막대로 보여 줄 수 있다(The vOICe, NASA 소니피케이션, PIXELSYNTH 공통).
- **설명을 결과 화면에 넣는다.** 조사한 사례 중 "이 사진의 무엇이 어떤 소리가 됐는지"를 결과마다 풀어 주는 것은 찾지 못했다. 차별점 1순위.
- **사진을 서버로 보내지 않는다는 점을 문구로 쓴다.** AI 서비스들과 가장 쉽게 구별되는 지점이고 계획서 1절 4항과 같다.
- **이름:** "색의 노래"와 같은 이름의 서비스·앱은 검색에서 나오지 않았다(상표 DB는 확인 못 함). 그대로 써도 될 가능성이 높지만 KIPRIS 확인은 사람이 해야 한다(6절).

## 0. 조사 방법과 한계 (먼저 읽을 것)

- 확인 날짜: **2026-11-24 (KST)**. 방법: 웹 검색 결과(검색 엔진이 돌려준 요약·제목·주소).
- **이 실행 환경에서는 외부 사이트에 직접 접속할 수 없었다**(네트워크 허용 목록 밖. hypevibe.co.kr, ojack.xyz, apps.apple.com 등 시도한 모든 주소가 실패). 그래서:
  - 표의 "지금 접속"은 전부 **직접 확인 못 함**이다. 검색 결과에 주소가 나온다는 것만 확인했다.
  - 내용은 대부분 2차 자료(기사·스토어 목록의 검색 요약) 기준이다. 출처끼리 다른 부분은 "출처마다 다름"이라고 적었다.
  - **하입바이브 등록작 확인은 못 했다**(2절).
- 가격은 검색 결과에 나온 시점의 값이고 지금 값과 다를 수 있다.

## 1. 사례 표 (22개)

"접속"란: 모두 직접 확인 못 함(0절). 괄호 안은 검색 결과에서 알 수 있었던 상태.

### 1-1. 색 한 점(또는 대표색) → 음

| # | 이름 | 연도 | 종류 | 입력 | 변환 방식 | 출력 | 가격·로그인 | 접속 | 좋은 점 | 한계 | 출처 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Audible Color | 2012 | 작품(학생 워크숍, CIID) | 웹캠으로 본 물감 방울 | 빨강·파랑·초록 = A·D·F, 섞인 색(보라·청록·갈색) = C·E·G. 색 면적이 클수록 큰 소리 | 실시간 소리 | 공개 서비스 아님 | 확인 못 함 | 색을 섞으면 음도 섞인다는 규칙이 직관적 | 음 6개뿐, 설치 작품 | [Yanko Design](https://www.yankodesign.com/2012/07/20/musical-colors/amp/), [MATRIXSYNTH](https://www.matrixsynth.com/2012/07/audible-color.html) |
| 2 | ROY G BIV | 2014 | 앱(iOS·안드로이드) | 카메라로 색 채집 | 색상·채도·밝기 → 파형·떨림·어택/디케이(음색). 음높이는 사용자가 건반으로 연주 | 신시사이저 연주 | 약 0.99달러(출시 당시) | 확인 못 함 | 색이 "음색"이 된다는 발상, 귀여운 그림 | 리뷰: "귀엽지만 오래 쓰진 않는다"(Engadget). 건반 수는 출처마다 다름(8·12·1옥타브) | [Engadget](https://www.engadget.com/2014-07-15-roy-g-biv-turns-colors-into-music.html), [Dazed](https://www.dazeddigital.com/artsandculture/article/20867/1/this-synth-app-lets-you-turn-colour-into-sound), [Daily Dot](https://www.dailydot.com/debug/roy-g-biv-color-synthesizer/?amp) |
| 3 | Synesthesia – Color to Sound | 확인 못 함(최근 등록으로 보임) | 앱(iOS) | 카메라가 비춘 면의 대표색 | 대표색 → 소리(세부 규칙 확인 못 함). 자작곡 28개, 오늘의 색 채집 도전, 소리 카드 | 소리, 공유 카드 | 무료 + 구독(월 1.99달러, 연 11.99달러: 워터마크 제거 등) | 확인 못 함(스토어 목록 검색됨) | "서버로 데이터를 보내지 않음" 명시, 도전·배지·카드로 재방문 유도 | 앱 설치 필요, 핵심 기능 일부 유료 | [App Store](https://apps.apple.com/app/id6757758484) |
| 4 | oogieCam | 확인 못 함 | 앱(iPad) | 카메라 | RGB·휘도·색도 값에 자체 알고리즘 적용 → 음 | 실시간 소리 | 무료 | 확인 못 함 | 실시간 | 세부 확인 못 함 | [App Store](https://apps.apple.com/us/app/id686582874) |
| 5 | ListenToPhotos | 확인 못 함 | 앱(iOS) | 사진 + 터치 | 터치한 지점의 색 → 화음. 색이 바뀌면 화음도 바뀜 | 화음 | 확인 못 함 | 확인 못 함 | 사진을 "만져서" 듣는 조작 | 곡이 아니라 화음 한 개씩 | [App Store](https://apps.apple.com/si/app/listentophotos/id1540927369) |
| 6 | Specdrums | 2019(Sphero 판매) | 기기(반지) + 앱 | 반지 센서로 두드린 색 | 색마다 사용자가 정한 음·샘플 재생(12색 매트 기본) | 연주 | 반지 1개 65달러, 2개 100달러(2019) | 확인 못 함 | 사진·옷·잡지 등 아무 색이나 악기가 됨, 교육용 | 전용 기기 필요, 인식 색 12개 | [MacRumors](https://www.macrumors.com/2019/01/07/sphero-specdrums), [Tom's Hardware](https://www.tomshardware.com/news/sphero-specdrums-features-price,38379.html) |
| 7 | Eyeborg / 소노크로매틱 음계 (Neil Harbisson) | 2003~ | 작품·장치 | 머리에 단 색 센서 | 색상환 360도 → 한 옥타브 안 360개 미분음(로그형 2003). 빛의 주파수를 옥타브 내려 옮긴 비로그형(2005)도 있음. "빨강은 F와 F# 사이" | 골전도 소리 | 개인 장치 | — | 색→음 대응을 물리(주파수)에 근거 두려 한 대표 사례 | 미분음이라 음악적으로 조화롭지 않음. 내린 옥타브 수는 출처마다 다름(37·39) | [Wikipedia: Sonochromatism](https://en.wikipedia.org/wiki/Sonochromatism), [Eyeborg](https://en.wikipedia.org/wiki/Eyeborg) |
| 8 | Chromatone | 확인 못 함(v3대) | 웹(오픈소스, MIT) | 건반·색 도구 | 12음에 색상환 12색을 고정 대응한 색 악보·학습 도구 모음 | 웹 악기·이론 문서 | 무료 | 확인 못 함(chromatone.center 검색됨) | 색–음 대응을 일관된 체계로 문서화, MIT | 사진을 넣는 서비스는 아님(이론·악기) | [chromatone.center](https://chromatone.center/), [GitHub](https://github.com/chromatone) |
| 9 | Synestizer | 확인 못 함(저장소 2023년 갱신) | 웹(오픈소스, GPL-2.0) | 웹캠 영상 | 화면의 색 통계 → 신시사이저 매개변수(세부 확인 못 함). 취리히예술대 연구에 사용 | 실시간 소리 | 무료 | 확인 못 함 | 브라우저만으로 실시간, 오프라인 설치 | 활동 적음(별 11개), **GPL이라 코드 참고·복사 금지 대상** | [GitHub](https://github.com/synestize/synestizer), [ZHdK](https://www.zhdk.ch/en/researchproject/beyond-sonification-432559) |

### 1-2. 그림을 악보처럼 스캔

| # | 이름 | 연도 | 종류 | 입력 | 변환 방식 | 출력 | 가격·로그인 | 접속 | 좋은 점 | 한계 | 출처 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | PIXELSYNTH (Olivia Jack) | 2016 | 웹 | 사진 올리기·기본 그림 | 사진을 흑백으로 바꾸고 막대가 가로질러 지나가며 **밝은 픽셀을 만나면 음을 냄**(세로 위치=음높이). 반전·밝기·대비·회전·반복 조절 | 실시간 소리 | 무료, 로그인 없음 | 확인 못 함 | 로그인 없이 바로, 스캔 막대가 보여서 이해가 쉬움 | 평: "실험일 뿐, 좋은 음악을 기대하면 안 된다", "귀가 아프다"(TNW 제목). 색을 버림 | [Experiments with Google](https://experiments.withgoogle.com/pixelsynth), [MusicRadar](https://www.musicradar.com/news/tech/the-noise-of-art-pixelsynth-can-turn-your-images-into-music-for-free-638423), [TNW](https://thenextweb.com/news/seriously-my-ears-are-bleeding) |
| 11 | The vOICe (Peter Meijer) | 1990년대(시작 연도 출처마다 다름) | 연구·보조 기술 | 카메라 영상(흑백) | 1초에 한 번 **왼쪽→오른쪽** 스캔, **높이=음높이, 밝기=음량**, 좌우=스테레오 | 소리(시각 대체) | 확인 못 함 | 확인 못 함 | 훈련하면 물체 구별이 된다는 연구 결과 | 정보 전달용이라 음악이 아님 | [IEEE Spectrum](https://spectrum.ieee.org/sight-for-sore-ears), [Science Gallery](https://dublin.sciencegallery.com/seeing-1/the-voice-seeing-with-sound) |
| 12 | NASA 찬드라 소니피케이션 | 2020~ (2024년 25주년 공개분 확인) | 연구·홍보 | 천체 사진 | 대개 왼쪽→오른쪽 스캔, 위쪽=높은 음, 밝기=음량. 파장대(X선·적외선·가시광)마다 **다른 악기**. 사진에 따라 중심→바깥, 시계 방향 스캔도 사용 | 영상+음악 | 무료 감상 | 확인 못 함 | **사진마다 스캔 방향·악기를 골라** 음악적으로 다듬음. 영상으로 공유 | 사람이 한 장씩 편곡(자동 서비스 아님) | [Chandra 블로그](https://chandra.harvard.edu/blog/node/899), [NASA](https://www.nasa.gov/missions/chandra/new-nasa-sonifications-listen-to-the-universes-past) |
| 13 | Colour Chaser / Looks Like Music (Yuri Suzuki) | 2010경(2008이라는 출처도 있음) / 2013 | 작품 | 종이에 그린 검은 선 + 색 펜 | 작은 로봇이 검은 선을 따라가다 **색 선을 지날 때 소리**. 로봇마다 역할(드럼·베이스·화음·멜로디·아르페지오) | 합주 | 전시 | — | **역할이 다른 여러 성부**가 같은 그림을 읽어 합주가 됨, 누구나 그릴 수 있는 악보 | 실물 전시 | [yurisuzuki.com](https://yurisuzuki.com/archive/?p=432), [Dezeen](https://www.dezeen.com/?p=357457), [Ars Electronica](https://webarchive.ars.electronica.art/festival/2014/c/en/looks-like-music) |
| 14 | Chrome Music Lab – Kandinsky | 2016 | 웹 | 직접 그린 선·도형 | 그린 획을 소리로(위치=음높이). 도형에 따라 음색 | 반복 재생 | 무료, 로그인 없음 | 확인 못 함 | 교육 현장에서 널리 쓰임, 항상 듣기 좋게 음계에 맞춤 | 사진 입력 없음 | [Google 블로그](https://blog.google/products/chrome/introducing-chrome-music-lab/?m=1), [제작기](https://medium.com/@activetheory/chrome-music-lab-making-kandinsky-7de5ab04f4fe) |
| 15 | Paint with Music (Google Arts & Culture) | 2021 | 웹 | 직접 그린 획 | 획의 높이=음높이, 붓(악기)을 골라 그림. Magenta 기술 사용 | 음악 | 무료 | 확인 못 함 | 음악을 몰라도 그럴듯한 소리 | 사진 입력 없음 | [Magenta](https://magenta.tensorflow.org/paint-with-music), [Experiments](https://experiments.withgoogle.com/paint-with-music) |

### 1-3. 스펙트로그램(사진 = 주파수 그림)

| # | 이름 | 연도 | 종류 | 입력 | 변환 방식 | 출력 | 가격·로그인 | 접속 | 좋은 점 | 한계 | 출처 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 16 | ANS 신시사이저 (Evgeny Murzin) | 1937~1957 제작(시작 연도 출처마다 다름) | 악기 | 검게 칠한 유리판을 긁은 그림 | 유리판을 광전지 앞으로 밀어 넣으면 세로 위치마다 사인파(720음) → 그림이 곧 스펙트로그램 | 소리 | 박물관 소장 | — | 이 갈래의 원조. 이름은 스크리아빈(A. N. S.)에서 | — | [Wikipedia](https://en.wikipedia.org/wiki/ANS_synthesizer), [120years.net](https://120years.net/the-ans-synthesisereugeniy-murzinsoviet-union1958-2/) |
| 17 | Virtual ANS 3 (Alexander Zolotov) | 확인 못 함 | 앱(iOS 유료, 데스크톱은 과거 무료·기부) | 그림·사진·소리 | ANS 방식 소프트웨어 재현. 소리↔그림 양방향 | 소리 | iOS 5.99달러 | 확인 못 함 | 사진을 불러와 재생 가능 | 전문가용, 결과는 음향 효과에 가까움 | [App Store](https://apps.apple.com/us/app/virtual-ans-3/id1465860248), [Gearnews](https://gearnews.com/virtual-ans-generates-musical-wonders-from-images-sounds-and-sonograms) |
| 18 | Photosounder | 확인 못 함(2018년 이전부터 판매) | 데스크톱(윈도우·맥) | 사진·소리 | 사진을 스펙트로그램으로 보고 재생·편집(가로=시간, 세로=주파수) | 소리 | 약 100달러(판매처 기준, 할인 시 29~79달러) | 확인 못 함 | 음향 편집 도구로 완성도 높음 | 유료·설치, 사진은 소음에 가까운 소리 | [Plugin Boutique](https://www.pluginboutique.com/product/1-Instruments/4-Synth/1350-Photosounder), [Equipboard](https://equipboard.com/items/photosounder-photosounder) |
| 19 | Coagula | 확인 못 함(2000년대 프리웨어) | 데스크톱(윈도우) | 그림 | 그림의 한 줄 = 사인파 하나, 한 점 = 짧은 음. 색으로 좌우 배치(빨강=오른쪽, 한 리뷰 기준) | 소리 | 무료 | 확인 못 함 | 가산 합성의 단순한 규칙 | 윈도우 전용, 오래됨 | [제작자 페이지](https://www.abc.se/~re/Coagula/Coagula.html) |

### 1-4. AI·기계학습

| # | 이름 | 연도 | 종류 | 입력 | 변환 방식 | 출력 | 가격·로그인 | 접속 | 좋은 점 | 한계 | 출처 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | Imaginary Soundscape (Qosmo) | 2017, 2021·2022 개선 | 웹 | 사진 올리기·스트리트 뷰 | 사진과 어울리는 **녹음된 환경음**을 1.5만~6만 개 중에서 골라 줌(대조 학습 모델) | 환경음 | 무료로 알려짐 | 확인 못 함 | "사진 속 장소의 소리"라는 납득되는 연결. 누적 방문 약 50만(자체 발표) | 음악이 아니라 효과음, 서버·음원 DB 필요 | [Qosmo](https://qosmo.jp/en/art/imaginarysoundscape), [논문](https://nips2017creativity.github.io/doc/Imaginary_Soundscape.pdf) |
| 21 | Play a Kandinsky (Google Arts & Culture × 퐁피두) | 2021 | 웹 | 칸딘스키 〈노랑-빨강-파랑〉(고정) | 칸딘스키 글을 바탕으로 색·도형마다 소리 배정, 당시 음악으로 학습한 모델이 악보 생성. 그림을 눌러 연주 | 음악, 나만의 믹스 공유 | 무료 | 확인 못 함 | 색·도형 → 악기·감정 설명이 함께 나옴, 공유 | 그림 한 점 고정, AI의 "해석"일 뿐 | [Google 블로그](https://blog.google/company-news/outreach-and-initiatives/arts-culture/discover-artist-who-could-hear-colors/), [퐁피두](https://www.centrepompidou.fr/en/play-a-kandinsky) |
| 22 | AI 이미지→음악 생성기들: Mubert Image to Music, Hugging Face `fffiloni/image-to-music-v2`, Wondera, MusicCreator AI | 2022~ | 웹 | 사진 올리기 | 사진을 **글 설명으로 바꾼 뒤**(CLIP 등) 음악 생성 모델에 넣음. Mubert는 "색·대비·질감을 음색·빠르기·화음에 대응"이라고 소개 | 30초~전체 곡(보컬 포함도 있음) | Mubert: 무료 요금제 있음(로그인 필요 여부 확인 못 함). Wondera: 무료 3크레딧·월 약 20달러(리뷰 사이트 기준, 공식가 확인 못 함). MusicCreator: 무료로 소개 | 확인 못 함. Mubert 기능은 "종료됐다"는 제3자 글과 공식 소개가 엇갈림. HF 구버전 스페이스는 일시정지 표시 | 실제 음악처럼 들림 | 사진을 서버에 올림, 생성 대기, 로그인·크레딧, 같은 사진도 매번 다른 결과, 왜 이 음악인지 설명 없음 | [Mubert](https://mubert.com/render/image-to-music), [The Decoder](https://the-decoder.com/image-to-text-to-music-with-clip-interrogator-and-the-mubert-api/), [HF Space](https://huggingface.co/spaces/fffiloni/image-to-music-v2), [Wondera](https://wondera.ai/tools/en/use-case/image-to-song-ai-converter) |

### 1-5. 가장 가까운 사례 (따로 표시)

| 이름 | 내용 | 출처 |
|---|---|---|
| **Melodist – Let photos sing** (Sonar Multimedia, iOS) | 사진의 **색조·채도·명도 변화**를 분석해 **선법·음계·화음 진행·멜로디**를 자동 생성. 오디오·영상·MIDI로 내보내기. 연도·가격·지금 판매 여부는 확인 못 함 | [App Store](https://apps.apple.com/us/app/id1115047756?l=en-us) |

우리 방향(규칙 기반, 음악적으로 다듬은 결과)과 가장 비슷하다. 다만 iOS 앱이고 웹·한국어·설명 화면은 아니다. 제작 전에 사람이 한 번 써 보기를 권한다(직접 사용해 보지 못함).

## 2. 한국 서비스·하입바이브 등록작

| 확인 대상 | 결과 |
|---|---|
| 하입바이브 등록 서비스 목록(https://hypevibe.co.kr/services) | **확인 못 함.** 이 환경에서 사이트 접속이 막혀 있고, 검색 엔진에도 등록작 정보가 나오지 않았다. → 사람이 목록에서 "사진·색·소리·음악·멜로디"로 훑어봐야 한다(5분). |
| 한국어 검색("사진을 음악으로", "색을 소리로") | 한국에서 만든 규칙 기반 사진→소리 웹 서비스는 **검색에서 찾지 못함**. 나오는 것은 해외 AI 생성기의 한국어 페이지(Mubert, MusicCreator, Wondera 등)와 "사진에 음악을 붙여 영상 만들기" 편집기였다. 없다고 단정할 수는 없다. |
| 색 관련 국내 앱 | "컬러 힐링 알람"(색 성격 + 어울리는 글·음악 추천) — 사진→소리 변환은 아님. [App Store](https://apps.apple.com/us/app/%EC%BB%AC%EB%9F%AC-%ED%9E%90%EB%A7%81-%EC%95%8C%EB%9E%8C/id6744043670?l=ko) |

## 3. 변환 방식별 분류

| 방식 | 무엇을 무엇에 | 사례 | 듣기 좋음 | 사진과의 연결 | 설명하기 | 우리에게 |
|---|---|---|---|---|---|---|
| ① 색→음 대응 | 색상→음높이·음색, 밝기→옥타브·음량 | 1~9, 지금 우리 앱 | 음계에 맞추면 좋음 | 색만 반영, 구도는 버림 | 쉬움 | 기본 재료로 유지 |
| ② 스캔 악보 | 가로=시간, 세로=음높이, 밝기=음량 | 10~15 | 그대로 쓰면 소음, 음계·악기를 고르면 좋음(12, 14) | 강함(구도가 들림) | 쉬움(막대가 지나감) | 음계에 맞춘 형태로 채택 후보 |
| ③ 스펙트로그램 | 가로=시간, 세로=주파수, 밝기=세기 | 16~19 | 나쁨(음향 효과) | 물리적으로는 정확, 귀로는 모름 | 어려움 | 쓰지 않음 |
| ④ AI 생성·검색 | 사진→글 설명→음악 모델, 또는 음원 DB 검색 | 20~22 | 가장 좋음 | 분위기 수준 | 설명 불가 | 공모전 조건(키·서버 없음)과 안 맞음. 쓰지 않음 |
| ⑤ 역할 나눈 합주 | 같은 그림을 드럼·베이스·화음·멜로디가 각자 읽음 | 12, 13, Melodist | 좋음 | 중간~강함 | 중간 | **①+②를 묶는 틀로 유력** |

⑤는 계획서 P3의 후보 C(영역별 레이어)·D(분위기 프리셋)와 같은 방향이다.

## 4. 사용자 반응 (검색으로 확인한 범위)

| 좋았던 점 | 근거 |
|---|---|
| 로그인·설치 없이 바로 되는 웹 실험은 널리 퍼짐 | PIXELSYNTH는 2016년 다수 매체가 소개(MusicRadar, FACT, Boing Boing 등) |
| "내 얼굴·내 사진이 노래가 된다"는 소개 문구가 통함 | PIXELSYNTH 기사 제목들 |
| 일상 사물(피자, 화분)의 소리를 들어 보는 놀이 | ROY G BIV 기사들(Vice, Basic Thinking) |
| 그럴듯한 연결(장소→그 장소의 소리) | Imaginary Soundscape 누적 약 50만 방문(자체 발표) |
| 결과를 섞어서 공유 | Play a Kandinsky |

| 불만 | 근거 |
|---|---|
| 음악처럼 들리지 않음, 시끄러움 | PIXELSYNTH: "좋은 음악을 기대하면 안 된다", TNW 기사 제목 "귀가 아프다" |
| 한 번 해 보고 끝 | ROY G BIV: "귀엽지만 붙잡는 힘이 없다"(Engadget) |
| 무료 범위가 작음, 결제 불만 | Wondera(리뷰 사이트 요약, 공식 확인 못 함) |
| 결과가 평범함 | Wondera 초기 곡에 대한 평(리뷰 사이트 요약) |

앱 스토어 별점·리뷰 원문은 접속이 막혀 확인하지 못했다.

## 5. 우리 차별점 후보 5개

| # | 차별점 | 근거가 된 빈자리 | 제작 시 뜻하는 것 |
|---|---|---|---|
| 1 | **"왜 이런 소리가 났는지" 한눈에** — 사진 위에 어느 부분이 어떤 악기·음이 됐는지 표시 | 규칙 기반은 설명 없이 소리만, AI는 설명 불가 | 결과 화면에 설명 카드 3~4줄 + 재생 중 사진 위 강조 |
| 2 | **어떤 사진이든 듣기 좋은 15~30초 곡** | 스캔·스펙트로그램 사례의 반복된 불만 | 음계·화음·박자 안에 가두기, 도입–전개–마무리 |
| 3 | **같은 사진 = 같은 노래, 사진은 기기 밖으로 안 나감** | AI 생성기는 매번 다르고 서버 업로드 | 결정적 알고리즘, "사진을 보내지 않아요" 문구 |
| 4 | **설치·로그인 없이 휴대폰 웹에서 30초 안에** | 가까운 사례(Melodist, Synesthesia)는 iOS 앱, AI는 로그인·크레딧 | 첫 화면에서 바로 사진 넣기, 예시 사진 제공 |
| 5 | **공유할 거리** — 사진+소리 카드(영상 또는 링크), 친구 사진과 "누구 사진이 더 신나나" 비교 | ROY G BIV의 "한 번 해 보고 끝" | 결과 링크·이미지 카드·영상 저장, 한 줄 별명("잔잔한 새벽 왈츠" 같은 곡 제목 자동 생성) |

## 6. 이름 후보와 같은 이름 검색 결과

검색일 2026-11-24. **상표(KIPRIS)는 접속이 막혀 확인하지 못했다. 출품 전에 사람이 확인해야 한다.**

| 후보 | 느낌 | 같은 이름의 서비스·앱(웹 검색) | 메모 |
|---|---|---|---|
| **색의 노래** (지금 이름) | 차분, 뜻이 바로 통함 | 찾지 못함 | 저장소·OG 이미지가 이미 이 이름. 유지 추천 |
| 사진의 노래 | 기능이 더 정확히 드러남 | 찾지 못함. 비슷한 뜻의 영어 앱 "Melodist – Let photos sing" 있음 | 부제로 쓰기 좋음("사진이 노래가 돼요") |
| 찰칵 멜로디 | 가볍고 재미 | 찾지 못함 | 도파민상·뭔작귀상 쪽 분위기 |
| 빛깔소리 | 우리말, 짧음 | 찾지 못함 | 발음은 좋으나 기능이 덜 드러남 |
| 소리사진 | 직관적 | 찾지 못함 | "소리 나는 사진"으로 오해 가능 |

"찾지 못함"은 따옴표 검색 한 번에 같은 이름이 나오지 않았다는 뜻이고, 없다는 보증이 아니다. 영어 이름으로 "Synesthesia"는 같은 이름 앱이 여러 개라 피한다.

## 7. 다음 단계에 넘길 점

- P2: 가까운 사례들이 쓰는 특징은 색조·채도·명도(Melodist), 대표색(Synesthesia), 세로 위치·밝기(스캔 계열), 색·대비·질감(Mubert 소개문)이다. 계획서의 특징 후보와 겹친다.
- P3: 방식 비교 때 3절 표의 ⑤(역할 나눈 합주)를 후보로 넣고, NASA 사례처럼 "사진에 따라 읽는 방향·악기를 고르는" 변주를 검토한다. 뉴턴·스크리아빈·칸딘스키 사실관계는 P3에서 다룬다(ANS가 스크리아빈 이름을 땄다는 것까지만 여기서 확인).
- P6·사람: ① 하입바이브 등록작 훑어보기 ② KIPRIS에서 "색의 노래" 상표 검색 ③ Melodist·PIXELSYNTH 직접 써 보기 ④ 표의 "접속" 칸 채우기.
- 라이선스 주의: Synestizer는 GPL-2.0이므로 코드를 보지도 가져오지도 않는다. Chromatone은 MIT지만 계획서 1절 3항에 따라 코드를 가져오지 않는다.
