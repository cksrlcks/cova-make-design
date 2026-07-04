# 자체 테스트 (생성 직후, 반드시)

만든 HTML을 실제로 열어 렌더링·정렬·폰트를 점검한다. Playwright MCP가 있으면 그걸로, 없으면
`npx playwright` 또는 로컬 정적 서버로 연 뒤 스크린샷/DOM을 확인한다:

```bash
# 예: 데스크톱 + 모바일 폭에서 스크린샷
npx --yes playwright screenshot --viewport-size=1440,2200 design-<slug>.html shot-desktop.png
npx --yes playwright screenshot --viewport-size=390,1600  design-<slug>.html shot-mobile.png
```

## 점검 항목 (문제가 있으면 고치고 다시 확인)

- 레이아웃이 깨지거나 요소가 겹치지 않는가. 콘텐츠가 브라우저 끝까지 퍼지지 않고 `.inner` 안에 있는가.
- 섹션들의 좌측 정렬 기준선이 어긋나지 않는가.
- **뱃지·버튼·칩의 텍스트가 세로 정중앙에 오는가** (design-rules.md의 flex 규칙 — 가장 흔한 결함).
- Pretendard 폰트가 실제로 적용됐는가(시스템 폰트로 폴백되지 않았는가).
- 사용한 외부 이미지가 실제로 로드되는가(깨진 이미지 없음).
- 모바일 폭(≈390px)에서 1열로 자연스럽게 정리되는가.

## 팁

- 스크린샷을 눈으로 확인할 수 없으면, DOM 검사로라도 대신한다:
  뱃지/버튼 요소의 `getBoundingClientRect()`와 내부 텍스트 노드의 rect를 비교해
  위/아래 여백 차가 2px 이내인지 확인하는 식.
- 이미지 로드는 `page.on('response')` 또는 각 `img`의 `naturalWidth > 0`으로 확인할 수 있다.
