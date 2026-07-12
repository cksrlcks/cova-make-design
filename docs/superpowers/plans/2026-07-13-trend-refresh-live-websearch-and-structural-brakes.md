# 최신 트렌드 반영 + 라이브 WebSearch + 구조 브레이크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cova-make-design·cova-make-guide의 트렌드 레퍼런스를 최신화하고, 생성 시 라이브 WebSearch를 붙이며, 마키 과다·레이아웃 반복을 검증 가능한 구조 브레이크로 차단한다.

**Architecture:** `design-trends.md`(두 copy 동일)는 큐레이션 뼈대로 두고 ① 리서치로 내용 갱신 + 신흥 방향 추가 ② 생성 스킬에 바운드된 WebSearch 단계 신설(이중 용도: 채택+회피) ③ design-plan 주석/self-test에 섹션맵·마키 브레이크를 심는다. 코드가 아니라 규칙 마크다운 편집이므로, 각 태스크의 "테스트"는 grep/diff 정합성 확인이다.

**Tech Stack:** Markdown 규칙 파일, bash `grep`/`diff`, 에이전트 WebSearch(또는 deep-research 스킬).

## Global Constraints

- 모든 기법은 **CSS-only**(뷰어 CSP가 스크립트 차단). 폰트는 design-trends.md '타이포 팔레트'의 검증 CDN만.
- 두 `design-trends.md`(make-design·make-guide)는 **바이트 단위로 동일**하게 유지한다(`diff` == 0).
- 라이브 스캔은 **user·소비자형 제품** 유형에서만. admin·도구형은 saas-admin.md가 지배 → 생략/경량.
- 라이브 검색 **최대 2~3회**. 웹 미가용/빈약 시 문서 기준 폴백 + 메타에 `미조회` 표기.
- 검색에서 본 **수치·브랜드명·후기를 화면 카피에 사실처럼 넣지 않는다**(design-rules.md §7).
- 방향 카탈로그는 **12 → 13~15종**만(과확장 금지). 신규 방향은 기존과 동일 레시피 형식.
- 하드캡 "좌텍우이미지 최대 2회"는 **상한이지 금지가 아니다**. D12 등 중앙정렬 관례 방향 예외 유지.
- 마키(무브 14)는 **D5·D6·D9 홈 방향에서만**, 페이지당 1개.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: 트렌드 리서치 노트

**Files:**
- Create: `docs/superpowers/research/2026-07-13-web-design-trends-research.md`

**Interfaces:**
- Produces: 리서치 노트. Task 3이 이 노트의 세 섹션(부상/저무는 신호 · 새 클리셰 · 신흥 방향 후보)을
  그대로 design-trends.md로 옮긴다. 노트의 "신흥 방향 후보"는 각 항목마다 **무드/팔레트(이름+hex 4~6)/
  타이포(검증 CDN 폰트)/레이아웃/질감/무브 세트/업종/주의** 8필드를 갖춘다.

- [ ] **Step 1: 리서치 수행**

에이전트 WebSearch(또는 `deep-research` 스킬)로 아래를 조사한다. 소스 균형(국내·해외):
Awwwards, Godly, Land-book, Muzli 트렌드 리포트, GDWEB, 웹어워드코리아, DBCUT, "2026 web design trend" 리포트류.
질의 예: `web design trends 2026`, `awwwards 2026 sites of the year`, `한국 웹디자인 트렌드 2026`,
`emerging web design direction 2026`.

- [ ] **Step 2: 노트 작성**

아래 정확한 구조로 파일을 만든다(헤딩 문자열을 그대로 사용 — Task 3·검증이 grep한다):

```markdown
# 2026 웹디자인 트렌드 리서치 노트 (2026-07-13)

## 부상/저무는 신호
- (부상) …  — 출처
- (저묾) …  — 출처
(2~5개)

## 새로 포화된 클리셰 (회피 목록 편입 대상)
- 마키(흐르는 띠), 보라-인디고 그라데이션, 벤토 그리드 … + 리서치가 찾은 신규 클리셰
(3개 이상)

## 신흥 방향 후보 (design-trends.md 카탈로그 추가용, 1~3종)
### 후보 A — <방향명>
- 무드: …
- 팔레트: <이름 #hex> ×4~6
- 타이포: <디스플레이 폰트(검증 CDN)> × Pretendard
- 레이아웃: …
- 질감: …
- 무브 세트: <카탈로그 번호들>
- 업종: …
- 주의: …
(기존 12종과 실제로 구별될 때만 채택. 겹치면 "기존 Dn의 주의문으로 흡수" 로 표기)
```

- [ ] **Step 3: 검증 (필수 섹션·최소 개수 확인)**

Run:
```bash
grep -c "^## " docs/superpowers/research/2026-07-13-web-design-trends-research.md
grep -c "^### 후보" docs/superpowers/research/2026-07-13-web-design-trends-research.md
```
Expected: 첫 명령 `3` 이상, 둘째 명령 `1` 이상(신흥 방향 후보 최소 1종).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/research/2026-07-13-web-design-trends-research.md
git commit -m "docs: 2026 웹디자인 트렌드 리서치 노트

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: design-trends.md 구조 편집 (마키·모션 대안·라이브 접합 절)

**Files:**
- Modify: `skills/cova-make-design/references/design-trends.md`

**Interfaces:**
- Produces: 무브 14 마키 제약 문구, "라이브 트렌드 접합" 절(제목 `## 라이브 트렌드 접합 …`).
  self-test(Task 5)·SKILL(Task 6·7)이 이 문구를 참조한다.

- [ ] **Step 1: 무브 14(마키) 재작성**

찾을 텍스트:
```
**14. 마키** — 트랙 안에 내용 2벌 + `@keyframes marquee { to { transform: translateX(-50%) } }`.
페이지당 1개, 읽어야 하는 정보 금지.
```
바꿀 텍스트:
```
**14. 마키** — 트랙 안에 내용 2벌 + `@keyframes marquee { to { transform: translateX(-50%) } }`.
**D5·D6·D9 홈 방향에서만 쓴다 — 다른 방향에 차용 금지**(신뢰·정보 톤에서 즉시 AI 클리셰가 된다).
페이지당 1개, 읽어야 하는 정보 금지. 모션 할당량을 채우려 습관적으로 넣지 말 것(무브 19·20·21·28 우선).
```

- [ ] **Step 2: 볼륨 규칙에 모션 대안 우선순위 추가**

찾을 텍스트:
```
   - **과감** — 방향을 최대 볼륨으로: 실험적 레이아웃 + 선택 무브 5개+ + 모션 연출 2~3개.
```
바꿀 텍스트:
```
   - **과감** — 방향을 최대 볼륨으로: 실험적 레이아웃 + 선택 무브 5개+ + 모션 연출 2~3개.
   - **모션 할당량 채우기**: 뷰어가 JS를 차단하므로 CSS-only 모션만. **스크롤 리빌(19)·오로라(20)·
     그라데이션 슬라이드(21, 페이지당 1)·호버 스포트라이트(28)를 우선** 고르고, 마키(14)는 D5·D6·D9
     홈 방향에서만. 같은 모션을 반복해 개수만 채우지 않는다.
```

- [ ] **Step 3: "라이브 트렌드 접합" 절 신설**

찾을 텍스트:
```
## 2026 감각 잡기 (연도별 흐름)
```
바꿀 텍스트:
```
## 라이브 트렌드 접합 (WebSearch 결과를 플랜에 녹이는 법)

생성 스킬은 플랜 직전 업종·방향 후보로 web search 1~2회를 돌린다(SKILL의 3.5단계). 트렌드
아티클은 클리셰의 진원지이므로 **이중 용도**로만 쓴다:
- **채택 신호(2~3개)**: 지금 부상 중이거나 저무는 흐름 → 방향 후보·시그니처·무브 선택의 근거.
- **회피 신호**: 지금 포화·클리셰가 된 것 → 그대로 회피 목록에 넣는다(마키·보라 그라데이션·벤토가
  "부상"으로 잡히면 오히려 회피 쪽으로 읽는다).
채택/회피를 플랜 메타에 기록한다(시안=design-plan 주석 `라이브:`, 가이드=DESIGN.md frontmatter
`trend_signals`). 검색에서 본 수치·브랜드명·후기를 화면 카피에 사실처럼 넣지 않는다 — 방향·연출
결정에만 쓴다. 웹 도구가 없거나 결과가 빈약하면 이 절을 건너뛰고 문서 기준으로 진행하며 메타에
"미조회"로 표기한다.

## 2026 감각 잡기 (연도별 흐름)
```

- [ ] **Step 4: 검증**

Run:
```bash
grep -n "D5·D6·D9 홈 방향에서만 쓴다" skills/cova-make-design/references/design-trends.md
grep -n "## 라이브 트렌드 접합" skills/cova-make-design/references/design-trends.md
grep -n "무브 19·20·21·28 우선" skills/cova-make-design/references/design-trends.md
```
Expected: 세 grep 모두 정확히 1행씩 매칭.

- [ ] **Step 5: Commit**

```bash
git add skills/cova-make-design/references/design-trends.md
git commit -m "feat: 마키 홈 방향 한정·모션 대안 우선·라이브 트렌드 접합 절

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: design-trends.md 트렌드 갱신 + 신흥 방향 추가 (→ make-guide 미러)

**Files:**
- Modify: `skills/cova-make-design/references/design-trends.md`
- Modify: `skills/cova-make-guide/references/design-trends.md` (전체 복사)

**Interfaces:**
- Consumes: Task 1 노트의 세 섹션.
- Produces: 갱신된 연도흐름·클리셰 목록·카탈로그(13~15종). 두 파일 동일.

- [ ] **Step 1: 연도 흐름 갱신**

`## 2026 감각 잡기 (연도별 흐름)` 절의 **2026 항목**을 Task 1 노트 "부상/저무는 신호"로 보강한다.
2026 하반기(오늘 2026-07-13) 관점의 신호 1~2줄을 기존 `**2026** — …` 항목 뒤에 덧붙인다.
지어낸 사실 없이 노트에 근거가 있는 문장만 쓴다.

- [ ] **Step 2: 클리셰 회피 목록 갱신**

`국내 문법` 절의 "버려도 되는 관행" 줄에, Task 1 노트 "새로 포화된 클리셰" 중 신규 항목을 덧붙인다.
찾을 텍스트:
```
- 버려도 되는 관행: 진입 팝업 여러 장, 자동 롤링 배너 5~10장, 고정폭 PC 레이아웃,
  텍스트를 이미지로 굽기, 게시판 UI 노출, 스플래시 인트로. (관공서 등이 요구하면 협의 항목.)
```
바꿀 텍스트(노트의 신규 클리셰를 `<노트 신규 클리셰>` 자리에 실제 항목으로 채운다 — 최소 1개):
```
- 버려도 되는 관행: 진입 팝업 여러 장, 자동 롤링 배너 5~10장, 고정폭 PC 레이아웃,
  텍스트를 이미지로 굽기, 게시판 UI 노출, 스플래시 인트로, <노트 신규 클리셰>. (관공서 등이 요구하면 협의 항목.)
```

- [ ] **Step 3: 저문 방향 톤다운**

Task 1 노트에서 "저묾"으로 지목된 흐름과 겹치는 기존 방향(D1~D12)의 `주의` 문장을 한 줄 보강한다
(방향을 삭제하지 않는다 — 주의만 강화). 노트에 저문 방향이 없으면 이 스텝은 건너뛴다.

- [ ] **Step 4: 신흥 방향 추가**

`디자인 방향 카탈로그` 절 끝(마지막 방향 `**D12. 소프트 프로덕트** …` 블록의 마지막 줄) 뒤, 그리고
`**로테이션 규율(중요):**` 앞에, Task 1 노트 "신흥 방향 후보"를 **D13~(최대 D15)** 로 추가한다.
각 방향은 기존 형식(무드 / 팔레트 / 타이포 / 레이아웃 / 질감 / 무브 / 업종 / 주의)을 그대로 따른다.
찾을 앵커:
```
**로테이션 규율(중요):**
```
이 앵커 **앞에** 신규 방향 블록(들)을 삽입한다. 예(노트 후보 A 기준으로 실제 값 채움):
```
**D13. <방향명>** — <한 줄 콘셉트>.
- 팔레트: <이름 #hex> ×4~6.
- 타이포: <디스플레이 폰트(검증 CDN)> × Pretendard.
- 레이아웃: …
- 질감: …
- 무브: <카탈로그 번호>.
- 업종: … / 주의: ….

```
카탈로그 헤더 "(12종 — 여기서 커밋한다)"도 실제 종수에 맞게 갱신한다.
찾을 텍스트: `## 디자인 방향 카탈로그 (12종 — 여기서 커밋한다)`
바꿀 텍스트: `## 디자인 방향 카탈로그 (<신규 총 종수>종 — 여기서 커밋한다)`

- [ ] **Step 5: make-guide로 미러**

Run:
```bash
cp skills/cova-make-design/references/design-trends.md skills/cova-make-guide/references/design-trends.md
diff skills/cova-make-design/references/design-trends.md skills/cova-make-guide/references/design-trends.md && echo "IDENTICAL"
```
Expected: `IDENTICAL`(diff 출력 없음).

- [ ] **Step 6: 검증**

Run:
```bash
grep -c "^\*\*D1[0-9]\." skills/cova-make-design/references/design-trends.md
grep -n "종 — 여기서 커밋한다" skills/cova-make-design/references/design-trends.md
```
Expected: 첫 명령이 신규 방향 수만큼 증가(≥13개 D1x 매칭 중 D13+ 존재), 헤더 종수 문자열 갱신 확인.

- [ ] **Step 7: Commit**

```bash
git add skills/cova-make-design/references/design-trends.md skills/cova-make-guide/references/design-trends.md
git commit -m "feat: 트렌드 연도흐름·클리셰 갱신 + 신흥 방향 추가(두 copy 동기화)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: design-rules.md — 섹션맵 필드·하드캡·마키 클리셰

**Files:**
- Modify: `skills/cova-make-design/references/design-rules.md`

**Interfaces:**
- Produces: design-plan 주석 스키마에 `섹션맵:`·`라이브:` 필드, §2 하드캡, §9 마키 클리셰 스캔.
  self-test(Task 5)가 이 필드·규칙을 대조한다.

- [ ] **Step 1: 주석 스키마에 섹션맵·라이브 필드 추가**

찾을 텍스트:
```
     | 타이포: Paperlogy 800 × Pretendard | 시그니처: … | 볼륨: 균형(무브 2·6·19) | 비튼 축(D2·D4만): … -->
```
바꿀 텍스트:
```
     | 타이포: Paperlogy 800 × Pretendard | 시그니처: … | 볼륨: 균형(무브 2·6·19) | 비튼 축(D2·D4만): …
     | 섹션맵: hero / 좌텍우이미지 / 풀블리드미디어 / 리스트단계 / 괘선표 / 하단CTA
     | 라이브: 채택[…] 회피[보라 그라데이션·마키] (웹 미가용 시 "미조회(문서 기준)") -->
```

- [ ] **Step 2: 1차 패스 항목에 섹션맵·라이브 설명 추가**

찾을 텍스트:
```
- **섹션 구성**: 브리프에서 도출한 순서 (고정 스켈레톤 금지 — 아래 §2).
```
바꿀 텍스트:
```
- **섹션 구성**: 브리프에서 도출한 순서 (고정 스켈레톤 금지 — 아래 §2).
- **섹션맵**: 각 섹션의 레이아웃 패밀리를 코드 전에 선언한다(hero / 좌텍우이미지 / 우텍좌이미지 /
  풀블리드미디어 / 넓은이미지+짧은설명 / 리스트·단계 / 가로스크롤 / 괘선표 / 하단CTA …).
  **좌우만 반전한 것은 같은 패밀리로 본다.** §2의 다양성·상한을 이 선언으로 강제한다.
- **라이브 신호(3.5단계)**: WebSearch 채택/회피 신호를 주석 `라이브:`에 기록(웹 미가용 시 "미조회").
```

- [ ] **Step 3: §2에 하드캡 추가**

찾을 텍스트:
```
- 8개 섹션이면 레이아웃 패밀리 4종 이상: 텍스트 중심 / 좌텍스트·우이미지 / 넓은 이미지+짧은 설명 /
  리스트·단계 / 가로 스크롤 / 괘선 표 / 하단 CTA … zigzag(텍스트-이미지 교대)는 최대 2연속.
```
바꿀 텍스트:
```
- 8개 섹션이면 레이아웃 패밀리 4종 이상: 텍스트 중심 / 좌텍스트·우이미지 / 넓은 이미지+짧은 설명 /
  리스트·단계 / 가로 스크롤 / 괘선 표 / 하단 CTA … zigzag(텍스트-이미지 교대)는 최대 2연속.
  **좌텍스트·우이미지(좌우 반전 편측 흘림 포함)는 페이지당 최대 2회 — 상한이지 금지가 아니다.**
  §0에서 선언한 섹션맵이 이 규칙을 만족해야 하며, 못 하면 섹션맵을 다시 짠다(중앙정렬 관례인 D12는 예외).
```

- [ ] **Step 4: §9 클리셰 스캔에 마키 추가**

찾을 텍스트:
```
- AI 클리셰 스캔: 보라 그라데이션 / 아이콘 3열 카드 / 카드 좌측 컬러바 / 이모지 아이콘 /
  pill eyebrow + 중앙 히어로 / 고정 스켈레톤 — 하나라도 있으면 수정.
```
바꿀 텍스트:
```
- AI 클리셰 스캔: 보라 그라데이션 / 아이콘 3열 카드 / 카드 좌측 컬러바 / 이모지 아이콘 /
  pill eyebrow + 중앙 히어로 / 고정 스켈레톤 / **홈 방향(D5·6·9) 밖 마키·마키 2개+** — 하나라도 있으면 수정.
```

- [ ] **Step 5: 검증**

Run:
```bash
grep -n "섹션맵:" skills/cova-make-design/references/design-rules.md
grep -n "페이지당 최대 2회 — 상한이지 금지가 아니다" skills/cova-make-design/references/design-rules.md
grep -n "홈 방향(D5·6·9) 밖 마키" skills/cova-make-design/references/design-rules.md
```
Expected: 세 grep 모두 매칭(섹션맵은 주석+항목 2행 이상).

- [ ] **Step 6: Commit**

```bash
git add skills/cova-make-design/references/design-rules.md
git commit -m "feat: design-plan 섹션맵·라이브 필드 + 좌텍우이미지 하드캡 + 마키 클리셰

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: self-test.md — 필드 존재·마키 스캔·섹션맵 대조

**Files:**
- Modify: `skills/cova-make-design/references/self-test.md`

**Interfaces:**
- Consumes: design-plan 주석 `섹션맵:`·`라이브:`(Task 4), 마키 제약(Task 2).

- [ ] **Step 1: 필드 존재 확인 항목 추가**

찾을 텍스트:
```
- **HTML 최상단에 design-plan 주석이 존재하는가**(design-rules.md §0) — 없으면 1차 패스를
  건너뛴 것이므로 실패.
```
바꿀 텍스트:
```
- **HTML 최상단에 design-plan 주석이 존재하는가**(design-rules.md §0) — 없으면 1차 패스를
  건너뛴 것이므로 실패.
- **주석에 `섹션맵`·`라이브` 필드가 있는가** — 없으면 섹션 설계/3.5 라이브 스캔을 건너뛴 것(실패).
```

- [ ] **Step 2: 마키 남용 스캔 추가**

찾을 텍스트:
```
- **시그니처 요소가 실제로 존재하는가** — 스크린샷에서 "이 시안만의 한 방"이 보이는가.
```
바꿀 텍스트:
```
- **시그니처 요소가 실제로 존재하는가** — 스크린샷에서 "이 시안만의 한 방"이 보이는가.
- **마키 남용이 없는가** — `@keyframes marquee`/`translateX(-50%)` 애니메이션이 **페이지당 최대 1개**,
  그리고 커밋 방향이 **D5·D6·D9일 때만** 존재하는가. 그 외 방향에 있거나 2개 이상이면 실패
  (`grep -c "translateX(-50%)"`로 카운트).
```

- [ ] **Step 3: 섹션맵 대조로 4종 검사 승격**

찾을 텍스트:
```
- 섹션 레이아웃이 4종 이상으로 변주되는가(같은 카드 그리드 반복 아님).
```
바꿀 텍스트:
```
- 섹션 레이아웃이 **주석의 섹션맵대로** 4종 이상 변주되는가 — 섹션맵 선언과 실제 DOM을 대조한다.
  **좌우만 반전한 같은 패밀리는 1종으로 카운트.** 4종 미만이거나 좌텍우이미지가 3회 이상이면 실패.
```

- [ ] **Step 4: 검증**

Run:
```bash
grep -n "마키 남용이 없는가" skills/cova-make-design/references/self-test.md
grep -n "주석의 섹션맵대로" skills/cova-make-design/references/self-test.md
grep -n "섹션맵.*라이브. 필드가 있는가" skills/cova-make-design/references/self-test.md
```
Expected: 세 grep 모두 1행씩 매칭.

- [ ] **Step 5: Commit**

```bash
git add skills/cova-make-design/references/self-test.md
git commit -m "feat: self-test 마키 스캔·섹션맵 대조·라이브 필드 확인

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: make-design/SKILL.md — 3.5 라이브 트렌드 스캔 단계

**Files:**
- Modify: `skills/cova-make-design/SKILL.md`

**Interfaces:**
- Consumes: design-trends.md '라이브 트렌드 접합' 절(Task 2), design-plan `라이브:` 필드(Task 4).

- [ ] **Step 1: 3.5 단계 신설**

찾을 텍스트:
```
### 4. HTML 생성
```
바꿀 텍스트:
```
### 3.5 라이브 트렌드 스캔 (user·서브·소비자형 제품에서 수행)

플랜 전에, 인터뷰로 확정된 **업종·방향 후보**로 web search를 1~2회 돌려 현재 흐름을 확인한다
(관리자·도구형 제품은 saas-admin.md가 지배하므로 생략하거나 "admin dashboard 2026"으로 가볍게만).

- 질의 예: `<업종> 웹디자인 2026`, `<방향 후보> web design award 2026`.
- 결과에서 **채택 신호 2~3개 + 회피 신호(포화·클리셰가 된 것)를 따로** 뽑는다(design-trends.md
  '라이브 트렌드 접합' 절 — 트렌드 검색은 클리셰의 진원지라 이중 용도로만 쓴다).
- 이 신호를 4단계 생성 게이트의 "방향 후보 3개 나열·기각"과 시그니처·무브 선택 근거로 쓰고,
  design-plan 주석 `라이브: 채택[…] / 회피[…]`에 기록한다.
- **폴백**: web search 도구가 없거나 결과가 빈약하면 문서 기준으로 진행하고 주석에
  `라이브: 미조회(문서 기준)`로 남긴다. 검색은 최대 2~3회. 검색 수치·브랜드명을 카피에
  사실처럼 넣지 않는다(design-rules.md §7).

### 4. HTML 생성
```

- [ ] **Step 2: 4단계에 주석 스키마 한 줄 반영**

찾을 텍스트:
```
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다. 메인·서브는 트렌드 파일의 **생성
```
바꿀 텍스트:
```
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다. design-plan 주석에는 §0 스키마대로
**섹션맵·라이브 필드까지** 채운다. 메인·서브는 트렌드 파일의 **생성
```

- [ ] **Step 3: 검증**

Run:
```bash
grep -n "### 3.5 라이브 트렌드 스캔" skills/cova-make-design/SKILL.md
grep -n "섹션맵·라이브 필드까지" skills/cova-make-design/SKILL.md
```
Expected: 두 grep 모두 1행씩 매칭.

- [ ] **Step 4: Commit**

```bash
git add skills/cova-make-design/SKILL.md
git commit -m "feat: make-design 3.5 라이브 트렌드 스캔 단계

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: make-guide/SKILL.md + guide-rules.md — 라이브 스캔·DESIGN.md 필드

**Files:**
- Modify: `skills/cova-make-guide/SKILL.md`
- Modify: `skills/cova-make-guide/references/guide-rules.md`

**Interfaces:**
- Consumes: design-trends.md '라이브 트렌드 접합' 절(Task 2·3 미러). DESIGN.md frontmatter 계약(§4).

- [ ] **Step 1: make-guide 3.5 단계 신설**

찾을 텍스트:
```
### 4. 디자인 시스템 확정 (스택 중립)
```
바꿀 텍스트:
```
### 3.5 라이브 트렌드 스캔 (user·소비자형 제품 스코프에서 수행)

토큰을 확정하기 전에, 인터뷰로 확정된 **업종·방향 후보**로 web search를 1~2회 돌려 현재 흐름을
확인한다(admin·도구형 제품은 saas-admin.md가 지배 → 생략하거나 "admin dashboard 2026"으로 경량).

- 질의 예: `<업종> 웹디자인 2026`, `<방향 후보> web design award 2026`.
- 결과에서 **채택 신호 2~3개 + 회피 신호(포화·클리셰가 된 것)를 따로** 뽑는다(design-trends.md
  '라이브 트렌드 접합' 절 — 이중 용도).
- 이 신호를 4단계 방향 커밋(후보 3개 나열·기각)과 토큰 결정의 근거로 쓰고, `DESIGN.md` frontmatter
  `trend_signals`에 채택/회피를 기록한다.
- **폴백**: web search 도구가 없거나 결과가 빈약하면 문서 기준으로 진행하고 `trend_signals: 미조회`로
  남긴다. 검색은 최대 2~3회.

### 4. 디자인 시스템 확정 (스택 중립)
```

- [ ] **Step 2: guide-rules.md DESIGN.md frontmatter에 trend_signals 추가**

찾을 텍스트:
```
generated: 2026-07-12
summary: <브랜드·톤 1~2문장 + 방향 선택 근거 한 줄>
```
바꿀 텍스트:
```
generated: 2026-07-12
trend_signals: 채택[…] / 회피[…]   # 3.5 라이브 스캔 결과, 없으면 "미조회"
summary: <브랜드·톤 1~2문장 + 방향 선택 근거 한 줄>
```

- [ ] **Step 3: 검증**

Run:
```bash
grep -n "### 3.5 라이브 트렌드 스캔" skills/cova-make-guide/SKILL.md
grep -n "trend_signals" skills/cova-make-guide/references/guide-rules.md
```
Expected: 두 grep 모두 매칭.

- [ ] **Step 4: Commit**

```bash
git add skills/cova-make-guide/SKILL.md skills/cova-make-guide/references/guide-rules.md
git commit -m "feat: make-guide 3.5 라이브 트렌드 스캔 + DESIGN.md trend_signals

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 통합 검증 스모크

**Files:**
- (수정 없음 — 검증 전용)

- [ ] **Step 1: 규칙 정합성 grep**

Run:
```bash
# 마키 문구가 세 곳에서 홈 방향 한정으로 일관되는가
grep -rn "D5·D6·D9\|D5·6·9\|D5.*D6.*D9" skills/cova-make-design/references/design-trends.md skills/cova-make-design/references/design-rules.md skills/cova-make-design/references/self-test.md
# 두 트렌드 문서 동일
diff skills/cova-make-design/references/design-trends.md skills/cova-make-guide/references/design-trends.md && echo "TRENDS-IDENTICAL"
```
Expected: 세 파일 모두 홈 방향 문구 매칭, `TRENDS-IDENTICAL` 출력.

- [ ] **Step 2: 스모크 생성 (임의 브리프 1개)**

`cova-make-design` 흐름으로 임의 브리프(예: 신뢰 업종 = 치과, 유형 = 메인) 시안 1장을 생성한다.
확인:
- design-plan 주석에 `섹션맵:`·`라이브:` 필드가 실제로 존재.
- 커밋 방향이 D5/6/9가 **아니면** 마키가 0개(`grep -c "translateX(-50%)" design-*.html` == 0).
- self-test가 섹션맵 4종+·마키 위반을 실제로 잡는지(위반을 일부러 넣어 실패가 뜨는지 1회 확인).

- [ ] **Step 3: 폴백 확인**

web search가 불가한 상황을 가정하고(도구 호출 생략), 주석/프론트매터에 `미조회(문서 기준)`로 남는지
경로가 문서상 명확한지 재확인(Task 6·7 폴백 문구 존재 grep).

Run:
```bash
grep -rn "미조회" skills/cova-make-design/SKILL.md skills/cova-make-guide/SKILL.md skills/cova-make-design/references/design-rules.md
```
Expected: 세 파일에서 폴백 문구 매칭.

- [ ] **Step 4: 최종 커밋(스모크 산출물은 커밋하지 않음)**

스모크로 만든 `design-*.html`은 삭제한다(레포 오염 방지). 규칙 파일 변경은 Task 2~7에서 이미 커밋됨.
```bash
rm -f design-*.html shot-*.png
git status --short   # 규칙 파일 외 잔여물 없음 확인
```

---

## Self-Review

**Spec coverage:**
- 문서 갱신(연도흐름·클리셰·신흥 방향) → Task 1·3 ✓
- 라이브 WebSearch(두 스킬, 이중 용도, 폴백) → Task 2(접합 절)·6·7 ✓
- 마키 억제(무브14·모션대안·self-test·§9) → Task 2·4·5 ✓
- 레이아웃 다양성(섹션맵 선언·하드캡·self-test 대조) → Task 4·5 ✓
- 주석/frontmatter 스키마 연동 → Task 4·5·7 ✓
- 두 design-trends.md 동기화 → Task 3 Step5·Task 8 ✓
- guide-rules.md DESIGN.md 필드 → Task 7 ✓

**Placeholder scan:** 연구 의존 콘텐츠(신흥 방향 팔레트·연도흐름 문장)는 Task 1 노트가 실제 값을
확정하고 Task 3이 전사한다 — `<노트 신규 클리셰>`·`<방향명>` 등은 "채워 넣을 자리"가 아니라 노트에서
확정된 값의 전사 지시다(스키마 확정). 구조 브레이크(Task 2·4·5·6·7)는 모두 정확한 old→new 텍스트 포함.

**Type consistency:** 필드명 일관 — 시안=`섹션맵`·`라이브`(design-rules 주석 = self-test 대조 = SKILL),
가이드=`trend_signals`(guide SKILL = guide-rules frontmatter). 마키 표기 "D5·D6·D9"/"D5·6·9" 두 표기가
파일에 섞여 있으나 Task 8 Step1 grep이 둘 다 허용해 대조 — 의미 동일.
