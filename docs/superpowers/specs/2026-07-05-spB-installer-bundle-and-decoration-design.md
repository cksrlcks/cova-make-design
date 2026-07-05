# SP-B: 설치기 두 스킬 번들 + 꾸민 설치 화면 — 설계

날짜: 2026-07-05
상태: 승인됨 (블록 레터 배너 / 왼쪽 거터 프레임 / ANSI만, 비TTY 평문)

## 배경

`cova-make-design` npm 패키지는 이제 `skills/` 아래 스킬을 **두 개**(`cova-make-design`,
`cova-analyze-designs`) 담고 있다. 그런데 설치기 `bin/install.mjs`는 `skills/cova-make-design`
단일 경로를 하드코딩해 한 개만 설치한다 → `cova-analyze-designs`가 tarball엔 포함되나 설치되지 않는다.
아울러 설치 화면을 라이브러리다운 ASCII 배너로 꾸민다.

## 요구사항

### B1. 두 스킬 설치 (일반화)

- `bin/install.mjs`의 하드코딩 `src`/`dest`(단일 `cova-make-design`)를 제거하고, `skills/` 하위
  **디렉터리를 순회**해 각 스킬을 `destRoot/<name>`에 설치한다.
- 각 대상은 재설치 잔재 제거를 위해 `rmSync`(존재 시) 후 `cpSync`.
- 스킬 목록은 `readdirSync(skillsRoot, { withFileTypes: true })`로 디렉터리만 추림(각 스킬 폴더).
- `--help` 문구를 "두 스킬 설치"로 갱신(단일 경로 표기 제거).

### B2. 꾸민 설치 화면 (ANSI만, 의존성 0)

- **배너:** "COVA" 블록 레터(`██`) + 서브타이틀 `make-design · claude skills`.
  색은 시안(`\x1b[36m`), 서브타이틀 dim(`\x1b[2m`).
- **완료 프레임:** 왼쪽 거터 방식(오른쪽 테두리 없음 — 한글 2칸 폭 정렬 회피):
  ```
   ╭─ 설치 완료 ──────────────────
   │  ✔ cova-make-design
   │      "AI 시안 만들기"
   │  ✔ cova-analyze-designs
   │      "시안 분석 / 미분석 전체 분석"
   ╰──────────────────────────────
     → <설치 경로>
  ```
  `✔`는 초록(`\x1b[32m`). 프레임 상/하단 규칙과 거터는 dim.
- **트리거 힌트:** 스킬 dir 이름 → 안내 문구 소형 맵.
  `cova-make-design` → `"AI 시안 만들기"`, `cova-analyze-designs` → `"시안 분석 / 미분석 전체 분석"`.
  맵에 없는 스킬은 이름만 표시(힌트 줄 생략).
- **색 처리:** `color(code, str)` 헬퍼가 `process.stdout.isTTY`일 때만 ANSI로 감싼다 →
  **비TTY는 색 코드 없이 평문**(블록 문자 자체는 출력, CI 로그 안전).

### B3. 유지 (변경 없음)

- 방향키 설치 위치 선택(`selectTarget`), 비TTY 폴백(전역 + 안내), `--global`/`--project`/`--help` 플래그.
- 인터랙티브 선택기의 커서 이스케이프는 TTY에서만 실행되므로 비TTY 영향 없음.

## 구성 (한 파일: `bin/install.mjs`)

- `SKILL_HINTS`: `{ [dirName]: triggerPhrase }` 상수.
- `color(code, str)`: isTTY일 때만 `\x1b[<code>m...\x1b[0m`, 아니면 `str` 그대로.
- `printBanner()`: 배너 출력.
- `printCompletion(destRoot, names)`: 완료 프레임 출력(설치된 스킬명 배열 소비).
- 설치 루프: `skillsRoot` 순회 → 각 스킬 rm+cp → 설치된 이름 수집 → `printCompletion`.

## 테스트

- pty 설치(`script`로 TTY): 두 스킬 디렉터리(`cova-make-design`, `cova-analyze-designs`)가 대상에
  모두 생성 + 배너/프레임이 렌더된다.
- 비TTY(`echo | node bin/install.mjs`): 두 스킬 설치 + 출력에 ANSI 색 이스케이프(`\x1b[`)가 없다.
- `--project`/`--global`/비TTY 폴백/`--help` 회귀.
- `node --check bin/install.mjs` 통과.

## 비범위 (YAGNI)

- 트리거 힌트를 SKILL.md frontmatter에서 파싱하는 동적 추출 — 스킬 2개라 소형 맵으로 충분.
- 설치 진행률 애니메이션/스피너 — 복사 즉시 완료라 불필요.
- Windows cmd 색 처리 특수 케이스 — Node 18+ 기본 ANSI로 충분(대상은 macOS/Unix 터미널).

## 상위 작업과의 관계

- 앞선 작업으로 `skills/`에 `cova-analyze-designs`가 이미 존재(설치만 안 됨) → 이 작업이 설치를 완성.
- 이후 npm 재배포 시 두 스킬이 함께 설치된다(버전 범프는 배포 시점 결정).
