# 레이아웃 실측 벤치마크 + 해외 디자인 스킬 비교 (2026-09-30)

목적: `design-trends.md`의 레이아웃 무브가 트렌드 아티클에서 왔고(2026-07 리서치), 실사용 빈도와 무관하게
빅 풋터·편측 흘림·zigzag가 반복 생성되는 문제를 **실사이트 관찰**로 교정한다. 동시에 쇼케이스(에이전시급)·앱 모드를
위한 레퍼런스를 Mobbin에서 수집하고, 해외 디자인 스킬과 방향을 대조한다.

## 1. GDWEB 수상작 (국내 벤치마크의 유일한 기준)

- **등급 데이터:** `/vote/result/?gcode=210710001`(2025 시상), `210610001`(2024 시상). 분야별 목록은
  `POST /vote/result/index_proc.asp` (`RetrieveFlag=LOAD1&str_bcode=<분야코드>&Txt_gbn=0`), 등급은
  `icon_awards_grand|gold|silver|bronze.png`. 선정작(게시) = WINNER, 연말 분야별 최우수 = GRAND/GOLD/SILVER.
  2026 시상은 2027-01 발표 예정 → 2024·2025만 사용. **BRONZE·일반 선정작은 제외.**
- **방법:** 라이브 사이트를 Playwright로 1440×900 휠 스크롤 캡처(15장 안팎) + 390 모바일 1장, 섹션별 빈도 집계.
  스크린샷은 현재 라이브 버전이라 수상 당시와 다를 수 있다.
- **기업·B2B·공공·의료·교육·금융 25곳:** HD현대중공업·현대제철·HD한국조선해양·두산로보틱스·한화로보틱스·태광그룹·
  JB금융지주·KB라이프·한국전력공사·참포도나무병원·오상헬스케어·GC녹십자·삼익제약·로보토리에듀·삼성전자 사회공헌·
  카카오·CJ그룹·효성티앤씨·삼성SDS·SK네트웍스·두산지오솔루션·셀트리온·한미약품·LH주거복지정보·한화자산운용 PLUS ETF.
- **브랜드·커머스·뷰티·F&B·호텔·레저·분양·문화·에이전시 26곳:** 쏘카 브랜드·LX하우시스 트렌드십·PLAN A-Z·팀에버플·
  레이레이랩·STCO·메트로시티·더하우스콘서트·부산국제영화제·뉴소스매거진·힐로웨이브·어나드범어·쌍용 더플래티넘·
  진로 글로벌·공차 코리아·롯데호텔앤리조트·타임빌라스·현대면세점·위메이드·메이크온·소이정·한컴 청리움·퓨리토 서울·
  해피어트·코오롱몰·트리븐.

| 관찰 | 빈도 |
|---|---|
| 대형 워드마크 푸터 | **1/48** (표준 정보형 44/48) |
| 지그재그 3행+ | **0/51** |
| 정적 섹션 편측 흘림 | **0** (화면 밖 잘림 14건은 전부 캐러셀) |
| 한글 히어로 헤드라인 | **28~56px**, 80px+ 1/51 — 초대형은 영문 키워드 전용 |
| pill 배지 eyebrow | 2/51 (작은 텍스트 라벨은 약 24/51) |
| 아이콘 3열 특징 카드 | 1/51 |
| 스티키 장면·고정 스토리 | 18/51 |
| 진행바 캐러셀 | 16/51 |
| 인셋 프레임 확대·마스크 확장 | 9/51 |
| 뷰포트 가득 히어로 | 21/25 (기업) |
| 클로징 CTA 밴드 | 11/51 |

## 2. Mobbin

- **일반 업종 웹 섹션 약 340개:** 대형 워드마크 푸터는 전체 38%지만 식품·잡화 DTC 편중(≈50%), 병원·서비스·호텔 0~10%.
  편측 흘림 <5%, zigzag ≈5%, 진짜 벤토 ≈3%, 8vw 히어로 ≈10%(피트니스·아동·패션), 가로 헤어라인 30%+, 진행바 캐러셀 ≈12%.
  코퍼스가 투자받은 DTC·헬스 스타트업 쪽으로 치우쳐 있어 동네 치과·로펌은 드물다.
- **에이전시·스튜디오 약 40곳 / 패션·뷰티·F&B·자동차·호텔 브랜드 약 30곳** → `showcase-web.md` S1~S10.
- **iOS 앱 약 70개**(커머스·라이프스타일·미디어·피트니스·핀테크·명상·교육·AI) → `app-design.md` A1~A13.

## 3. 해외 디자인 스킬 비교

읽은 것: anthropics/skills `frontend-design`, leonxlnx/taste-skill, pbakaus/impeccable, nextlevelbuilder/ui-ux-pro-max-skill,
Nutlope/hallmark, alchaincyf/huashu-design, vercel-labs/web-interface-guidelines, google-labs-code/design.md, superdesign.

- **이미 정렬:** 2-패스 플랜, 시그니처 1개, AI 디폴트 룩 회피, 섹션맵·레이아웃 패밀리 상한, 지어낸 수치 금지, 안전 열화.
- **앞선 점:** 한국어 폰트·관행, 실데이터 패턴 API, 트렌드 검색의 회피 신호 활용, CSS-only 모션 함정 문서화.
- **도입(이번 개정):** 금지 팔레트 hex 패밀리(taste), 구체 앵커 규칙(impeccable·design.md "a specific reference
  describes a point"), 색 전략 축(impeccable), 런 간 이력 `~/.cova/history.json`(hallmark·taste), 6축 점수형 크리틱 +
  콘셉트 부결(hallmark·huashu), 새 컨텍스트 리뷰어 최대 2라운드(impeccable), 기계 검사 스크립트(impeccable 탐지기·
  hallmark 게이트), 히어로 맞춤·CTA 규율·카피 감사(taste·hallmark), 품질 바닥(impeccable craft-floor·Vercel),
  에이전시 텔 할당제(taste 9.F), 모션 타이밍 표(impeccable animate).
- **도입 안 함:** JS 의존 기법(GSAP·Motion·IntersectionObserver), picsum 랜덤 이미지, 서양 폰트 금지 목록의 국문 적용,
  ui-ux-pro-max 스타일 추천 DB(관행 강화), 단계마다 승인받기(superdesign), hallmark의 "가짜 폰 프레임 금지"(앱 모드와 충돌).
- **보류(P3):** 3안 미리보기(huashu 병렬 렌더 — 비용 3배, 옵트인 후보), 안티 클리셰 목록 원격 fetch, design-plan 주석의
  payload 메타 이동.

## 4. 검증

- M3 핀 가로 스크롤·M9 프리로더·L4 인셋 확대·L5 진행바를 Chromium(playwright)에서 실측: 동작·reduced-motion 폴백 확인.
- **발견한 버그:** `clip-path: inset()` ↔ `none`은 보간되지 않고 50%에서 끊긴다 → M5·M9·L4 키프레임 양 끝 명시로 수정.
- `scripts/cova-check.mjs`를 의도적 결함 샘플로 검증(숨은 텍스트·깨진 이미지·CTA 줄바꿈·줄 길이·행간·eyebrow·대비 검출).

## 5. 사용자 확정 규칙 (2026-09-30 ~ 10-03 테스트 피드백)

- **히어로가 좌 텍스트·우 이미지로 수렴** → 히어로 구도 카탈로그 HC0~HC9 신설, HC0(스플릿)은 항상 기각 후보 ①,
  이력으로 최근 2건과 다른 구도. cova-check가 스플릿 히어로를 감지한다. (사용자 제시 레퍼런스: Performance Lab ·
  Lassie · Biograph — 모두 풀블리드 사진이 화면을 책임지는 구도.)
- **국문은 고딕 계열만** — 명조·바탕·붓·궁서 느낌·손글씨 국문 폰트는 사용자가 명시 요청할 때만. 세리프·손맛은 라틴 폰트로
  영문 단어에만. D11은 "모던 한국 타이포(고딕)"로 전환. cova-check가 국문 세리프·손글씨를 FAIL로 잡는다.
- **국문 웨이트는 SemiBold(600) 상한** — Bold 이상은 정말 필요한 1곳만. 단일 헤비 국문 폰트(Black Han Sans·Gasoek One·
  Bagel Fat One·Do Hyeon·Jua)는 요청 시만. 위계는 크기·색·자간·여백으로. cova-check가 국문 700+를 WARN.
- **Mobbin은 스킬 제작용 리서치 도구** — 스킬 사용자 환경에는 없다. 실행 단계의 Mobbin 조회 지시를 모두 제거하고,
  문서 속 mobbin.com 링크는 출처 표기일 뿐 열지 않는다고 명시. 레이아웃 근거는 문서에 옮겨 둔 실측.
