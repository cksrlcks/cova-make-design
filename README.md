# cova-make-design

COVA 디자인 패턴 API를 참고해 **HTML 시안 생성·시안 사전 분석·디자인 시스템 가이드 생성/적용**을
돕는 [Claude Code](https://claude.com/claude-code) 스킬 모음입니다.

## 설치

```bash
npx @uxis-cova/make-design@latest
```

→ 설치 위치(전역 `~/.claude/skills` / 현재 프로젝트 `./.claude/skills`)를 터미널에서
물어봅니다. CI 등 비대화형 환경은 질문 없이 전역으로 설치되며, 플래그로 지정할 수도 있습니다:

```bash
npx @uxis-cova/make-design@latest --global    # 전역
npx @uxis-cova/make-design@latest --project   # 현재 프로젝트 전용
```

## 사용

Claude Code에서 이렇게 요청하면 스킬이 동작합니다:

> AI 시안 만들기 / 홈페이지 시안 만들어줘 / HTML 시안 생성

스킬이 요구사항을 인터뷰하고 → COVA의 분석 패턴을 검색해 → HTML 시안을 생성한 뒤 →
Playwright 기계 검사(`scripts/cova-check.mjs`)와 새 컨텍스트 리뷰로 자체 점검하고 → (원하면) COVA에 업로드합니다.

- **표현 모드** — 스탠다드(제안형, GDWEB 수상작 실측 레이아웃) / **쇼케이스**(에이전시·스튜디오·패션급 연출,
  CSS-only 스크롤 모션). 인터뷰에서 고릅니다.
- **섹션 레이아웃 직접 고르기** — 원하면 섹션마다 후보를 와이어프레임 HTML로 띄워 보고 고릅니다(`scripts/layout-preview.mjs`).
- **앱 시안** — 제품 유형에서 플랫폼을 모바일 앱으로 고르면 폰 프레임 3~5장(하나의 사용자 흐름)으로 만듭니다.

> 디자인 가이드 만들기 → (적용) 디자인 가이드 적용

## 설정

| 환경변수 | 필수 | 설명 |
|---|---|---|
| `COVA_API_URL` | 아니오 | 기본값 `https://uxis-cova.vercel.app`. 다른 배포를 쓸 때만 교체 |

## 구성

```
skills/
  cova-make-design/     # 홈페이지 HTML 시안 한 장 생성
  cova-analyze-designs/ # 시안 사전 분석(로컬 vision) 저장
  cova-make-guide/      # 스타일·컴포넌트 가이드 HTML + DESIGN.md 생성
  cova-apply-guide/     # DESIGN.md를 프로젝트 UI에 적용(기반+샘플1, 나머지 가이드)
```

## License

MIT
