# cova-make-design

COVA 실서비스의 디자인 패턴 API를 참고해 **홈페이지 HTML 시안 한 장**을 생성하는
[Claude Code](https://claude.com/claude-code) 스킬입니다.

## 설치

```bash
npx cova-make-design@latest
```

→ `~/.claude/skills/cova-make-design`에 설치됩니다. 프로젝트 전용으로 설치하려면:

```bash
npx cova-make-design@latest --project   # ./.claude/skills 에 설치
```

## 사용

Claude Code에서 이렇게 요청하면 스킬이 동작합니다:

> AI 시안 만들기 / 홈페이지 시안 만들어줘 / HTML 시안 생성

스킬이 요구사항을 인터뷰하고 → COVA의 분석 패턴을 검색해 → HTML 시안을 생성한 뒤 →
Playwright로 자체 점검하고 → (원하면) COVA에 업로드합니다.

## 설정

| 환경변수 | 필수 | 설명 |
|---|---|---|
| `COVA_API_URL` | 아니오 | 기본값 `https://uxis-cova.vercel.app`. 다른 배포를 쓸 때만 교체 |
| `COVA_DESIGN_TOKEN` | 업로드 시 | COVA studio → "API 토큰"에서 발급한 개인 토큰 |

## 구성

```
skills/cova-make-design/
  SKILL.md                    # 워크플로(인터뷰 → 태그 → 패턴 검색 → 생성 → 자체 테스트 → 업로드)
  references/
    interview.md              # 요구사항 인터뷰 질문(필수 질문 포함)
    design-rules.md           # 레이아웃·타이포·이미지·카피 규칙
    self-test.md              # Playwright 자체 테스트 체크리스트
```

## License

MIT
