// layout-preview.mjs — 섹션별 레이아웃 후보를 와이어프레임 HTML로 그린다(의존성 없음).
// 사용: node layout-preview.mjs <spec.json> [out.html]
// spec.json 예:
// { "title": "온새미내과 메인", "sections": [
//   { "name": "히어로", "options": ["HC3", "HC1", "HC4"], "recommended": "HC3", "note": "진료시간표를 무대로" },
//   { "name": "진료 안내", "options": ["L8", "L9", "L20"] },
//   { "name": "푸터", "options": ["F1", "F2"] } ] }
// 산출: out.html(브라우저로 열어 보여준다) + out.ascii.json(카드 preview용 텍스트, 미리보기를 지원하는 환경에서만 보인다)
import { readFileSync, writeFileSync, existsSync } from 'fs';

const [, , specPath, outArg] = process.argv;
if (!specPath || !existsSync(specPath)) { console.error('사용: node layout-preview.mjs <spec.json> [out.html]'); process.exit(2); }
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const out = outArg || 'layout-options.html';

// 상자 DSL: [x, y, w, h, 종류, 라벨?] — 퍼센트 좌표. 종류: img(사진) dark(어두운 사진) h(헤드라인) t(본문 줄) big(거대 타이포)
// btn(버튼) pill(입력 pill) line(헤어라인) card(카드 면) acc(브랜드 색 면) dot(원형) ink(진한 면)
const R = {
  HC0: ['스플릿 (좌 텍스트·우 이미지)', '관행 — 기각 후보 ①. 이유가 있을 때만', [[6,34,36,7,'h'],[6,44,30,3,'t'],[6,49,26,3,'t'],[6,58,12,5,'btn'],[52,10,44,80,'img']]],
  HC1: ['풀블리드 + 좌하단 헤드라인 + 정보 레일', '어둡게 가라앉힌 공간·건물 사진, 우하단 3칸 정보', [[0,0,100,100,'dark'],[6,60,42,8,'h'],[6,71,32,3,'t'],[6,76,26,3,'t'],[6,84,12,5,'btn'],[60,82,10,8,'t'],[72,82,10,8,'t'],[84,82,10,8,'t']]],
  HC2: ['풀블리드 + 하단 거대 타이포', '역동 사진 위 화면을 가로지르는 키워드', [[0,0,100,100,'dark'],[2,54,70,13,'big'],[2,69,58,13,'big'],[2,84,80,13,'big'],[74,68,22,3,'t'],[74,74,14,5,'btn']]],
  HC3: ['풀블리드 + 중앙 2줄 + 하단 입력', '인물 뒷모습·공간 사진, 하단 중앙 예약·이메일 pill', [[0,0,100,100,'dark'],[40,4,20,5,'pill'],[24,38,52,8,'h'],[30,49,40,8,'h'],[36,61,28,3,'t'],[34,82,32,7,'pill']]],
  HC4: ['중앙 타이포 → 아래 인셋 미디어', '헤드라인 아래 넓은 라운드 사진·영상', [[22,8,56,8,'h'],[32,19,36,3,'t'],[44,25,12,5,'btn'],[4,36,92,60,'img']]],
  HC5: ['인셋 라운드 풀블리드 + 중앙 헤드라인', '가장자리 살짝 띄운 거대 사진 카드', [[2,2,96,96,'dark'],[24,42,52,9,'h'],[44,56,12,5,'btn']]],
  HC6: ['중앙 오브젝트 + 떠 있는 사진 조각', '로고·한 문장 주변에 작은 사진 흩뿌림', [[46,36,8,12,'dot'],[28,54,44,6,'h'],[34,63,32,3,'t'],[8,10,12,16,'img'],[74,8,14,18,'img'],[4,60,12,16,'img'],[82,56,12,18,'img'],[30,80,12,14,'img'],[60,78,12,16,'img']]],
  HC7: ['컬러 필드 + 네 모서리 정보', '사진 없이 단색 필드와 실제 영업 정보', [[0,0,100,100,'acc'],[30,40,40,16,'big'],[4,6,16,3,'t'],[80,6,16,3,'t'],[4,90,20,3,'t'],[76,90,20,3,'t']]],
  HC8: ['타이틀 스택·리스트 × 배경 비주얼', '이름 4~6개, 활성 1개만 진하게', [[0,0,100,100,'img'],[5,24,46,8,'h'],[5,36,40,8,'t'],[5,48,44,8,'t'],[5,60,36,8,'t'],[5,72,42,8,'t']]],
  HC9: ['커머스 멀티카드 + 칩 레일', '4:5 배너 3장 + 원형 카테고리', [[2,6,31,64,'img'],[35,6,31,64,'img'],[68,6,31,64,'img'],[4,78,9,14,'dot'],[16,78,9,14,'dot'],[28,78,9,14,'dot'],[40,78,9,14,'dot'],[52,78,9,14,'dot']]],
  L3: ['스티키 장면(1화면씩)', '사업부·챕터마다 화면 한 장 + 좌측 텍스트', [[0,0,100,100,'dark'],[6,30,30,4,'t'],[6,38,36,8,'h'],[6,50,30,3,'t'],[6,56,12,5,'btn'],[90,40,2,6,'ink'],[90,50,2,6,'t'],[90,60,2,6,'t']]],
  L4: ['인셋 프레임 확대', '작은 사진이 스크롤하며 풀블리드로', [[30,22,40,56,'img'],[22,10,56,6,'h'],[14,40,6,2,'line'],[80,40,6,2,'line']]],
  L5: ['진행바 캐러셀', '다음 카드가 잘려 보이는 가로 레일', [[4,10,40,6,'h'],[4,22,30,56,'img'],[36,22,30,56,'img'],[68,22,34,56,'img'],[4,86,60,1,'line'],[4,86,18,1,'ink']]],
  L6: ['센터모드 대표 캐러셀', '가운데 카드 확대, 양옆 흐리게', [[4,22,22,52,'card'],[30,8,40,76,'img'],[74,22,22,52,'card'],[34,88,32,3,'t']]],
  L7: ['제목 리스트 × 큰 비주얼', '좌 목록, 활성 항목에 따라 이미지 전환', [[4,16,34,7,'h'],[4,30,28,5,'t'],[4,40,30,5,'t'],[4,50,26,5,'t'],[4,60,28,5,'t'],[44,8,52,84,'img']]],
  L8: ['라벨 좌 1/3 · 본문 우 2/3', '헤어라인으로 구분하는 행', [[4,10,92,1,'line'],[4,16,14,3,'t'],[38,16,40,7,'h'],[38,27,50,3,'t'],[38,32,44,3,'t'],[4,48,92,1,'line'],[4,54,14,3,'t'],[38,54,40,7,'h'],[38,65,50,3,'t']]],
  L9: ['이미지 타일 3×2', '사업영역·카테고리 진입', [[4,6,30,42,'img'],[35,6,30,42,'img'],[66,6,30,42,'img'],[4,52,30,42,'img'],[35,52,30,42,'img'],[66,52,30,42,'img']]],
  L10: ['데이터 대시보드 카드', '좌 헤드라인 + 우 수치·보고서 카드', [[4,20,34,9,'h'],[4,34,28,3,'t'],[44,8,26,40,'card'],[72,8,24,40,'card'],[44,52,52,40,'card']]],
  L11: ['뉴스룸 4열', '썸네일 + 날짜·카테고리, 우측 전체보기', [[4,8,24,6,'h'],[80,10,16,3,'t'],[4,22,22,40,'img'],[28,22,22,40,'img'],[52,22,22,40,'img'],[76,22,22,40,'img'],[4,66,20,3,'t'],[28,66,20,3,'t'],[52,66,20,3,'t'],[76,66,20,3,'t']]],
  L12: ['매장 정보 칼럼 + 사진', '좌 주소·시간 / 우 사진 2/3', [[4,10,26,7,'h'],[4,24,24,3,'t'],[4,30,22,3,'t'],[4,36,24,3,'t'],[4,46,14,5,'btn'],[36,8,60,84,'img']]],
  L13: ['클로징 CTA 밴드', '푸터 직전 진한 띠', [[0,24,100,52,'ink'],[6,40,40,8,'h'],[76,44,16,7,'pill']]],
  L15: ['거대 영문 키워드', '단어 하나에 사진을 겹침', [[2,30,96,30,'big'],[56,20,26,50,'img'],[4,10,14,3,'t']]],
  L16: ['스택 카드', '스크롤하면 카드가 겹쳐 쌓임', [[10,8,80,30,'card'],[10,22,80,32,'acc'],[10,40,80,52,'card']]],
  L17: ['레터형 대표 인사', '큰 문단 + 서명 + 치우친 세로 사진', [[6,14,58,6,'h'],[6,24,56,6,'h'],[6,34,50,6,'h'],[6,48,16,3,'t'],[70,40,24,52,'img']]],
  L18: ['텍스트 메뉴판 3열', '품목 · 가격, 사진 없음', [[4,8,20,5,'h'],[4,20,26,3,'t'],[4,28,26,3,'t'],[4,36,26,3,'t'],[37,8,20,5,'h'],[37,20,26,3,'t'],[37,28,26,3,'t'],[70,8,20,5,'h'],[70,20,26,3,'t'],[70,28,26,3,'t']]],
  L19: ['단일 가격 분할 카드', '좌 가격·버튼 | 우 체크리스트', [[16,10,68,80,'card'],[22,22,22,10,'h'],[22,40,16,5,'btn'],[50,14,1,72,'line'],[54,20,26,3,'t'],[54,28,24,3,'t'],[54,36,26,3,'t'],[54,44,22,3,'t']]],
  L20: ['고민 진입 카드 캐러셀', '세로 사진 카드 + 질문형 2줄', [[4,8,26,84,'dark'],[33,8,26,84,'dark'],[62,8,26,84,'dark'],[91,8,12,84,'dark'],[7,70,18,4,'h'],[36,70,18,4,'h'],[65,70,18,4,'h']]],
  T1: ['의료진·팀 4열', '정사각 사진 + 이름·자격 2줄', [[4,10,22,50,'img'],[28,10,22,50,'img'],[52,10,22,50,'img'],[76,10,22,50,'img'],[4,64,14,4,'h'],[28,64,14,4,'h'],[52,64,14,4,'h'],[76,64,14,4,'h']]],
  Q1: ['FAQ 헤어라인 아코디언', '좌 제목 / 우 질문 행', [[4,10,28,8,'h'],[40,12,56,1,'line'],[40,18,46,3,'t'],[40,30,56,1,'line'],[40,36,42,3,'t'],[40,48,56,1,'line'],[40,54,48,3,'t'],[40,66,56,1,'line']]],
  P1: ['절차 가로 4단계', '번호 + 제목 + 2줄', [[4,14,40,7,'h'],[4,40,20,3,'t'],[28,40,20,3,'t'],[52,40,20,3,'t'],[76,40,20,3,'t'],[4,48,20,5,'h'],[28,48,20,5,'h'],[52,48,20,5,'h'],[76,48,20,5,'h']]],
  F1: ['슬림 정보형 푸터', '로고 + 법정 정보 + 카피라이트', [[0,0,100,100,'ink'],[6,20,14,8,'h'],[6,42,50,3,'t'],[6,50,40,3,'t'],[6,80,20,3,'t']]],
  F2: ['다단 사이트맵 푸터', '링크 3~5열 + 법정 정보', [[6,14,14,8,'h'],[34,14,12,3,'t'],[34,22,10,3,'t'],[52,14,12,3,'t'],[52,22,10,3,'t'],[70,14,12,3,'t'],[70,22,10,3,'t'],[6,70,88,1,'line'],[6,78,50,3,'t']]],
  F3: ['3열 영업정보 프리푸터', '연락처 | 영업시간 | 오시는 길', [[0,0,100,100,'acc'],[10,30,20,5,'h'],[40,30,20,5,'h'],[70,30,20,5,'h'],[10,42,20,3,'t'],[40,42,20,3,'t'],[70,42,20,3,'t']]],
  F4: ['헤어라인 4열 푸터', '열마다 상단 1px 룰', [[4,20,21,1,'line'],[28,20,21,1,'line'],[52,20,21,1,'line'],[76,20,21,1,'line'],[4,28,16,3,'t'],[28,28,16,3,'t'],[52,28,16,3,'t'],[76,28,16,3,'t']]],
  F5: ['대형 워드마크 푸터', '조건부 — DTC·사진 주도 쇼케이스만', [[4,10,40,3,'t'],[0,40,100,56,'big']]],
};
const alias = { L1: 'HC1', L2: 'HC4', L14: 'HC9' };
const get = (id) => R[alias[id] || id] || null;

const css = `*{box-sizing:border-box}body{margin:0;font-family:"Pretendard",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:#f3f4f2;color:#17191b}
header{padding:32px 40px 8px}h1{margin:0 0 6px;font-size:22px;font-weight:600}header p{margin:0;color:#5a5d60;font-size:14px;line-height:1.6}
section{padding:24px 40px 8px}h2{font-size:17px;font-weight:600;margin:0 0 4px}.note{margin:0 0 14px;color:#5a5d60;font-size:13px}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.opt{background:#fff;border:1px solid #d9dbd7;border-radius:10px;padding:12px;position:relative}.opt.rec{border-color:#17191b;box-shadow:0 0 0 1px #17191b}
.badge{position:absolute;z-index:2;top:18px;right:18px;background:#17191b;color:#fff;font-size:11px;padding:3px 7px;border-radius:99px}
.wf{position:relative;aspect-ratio:16/10;background:#fafaf8;border-radius:6px;overflow:hidden;border:1px solid #e3e4e1}
.b{position:absolute}.img{background:repeating-linear-gradient(135deg,#cfd2cd 0 6px,#dadcd8 6px 12px)}.dark{background:repeating-linear-gradient(135deg,#55595c 0 6px,#606467 6px 12px)}
.h{background:#2a2d30;border-radius:2px}.on-dark .h,.h.on{background:#f2f2f0}.t.on{background:#8e9295}.t{background:#b7bab6;border-radius:2px}.big{background:#17191b;border-radius:3px}
.btn{background:#17191b;border-radius:99px}.pill{background:#fff;border:1px solid #9a9d99;border-radius:99px}.line{background:#9a9d99}
.card{background:#e9eae7;border-radius:6px}.acc{background:#8c9b8a}.ink{background:#24272a}.dot{background:#c9ccc7;border-radius:50%}
.lab{margin:10px 0 2px;font-size:15px;font-weight:600}.lab b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#17191b;color:#fff;font-size:12px;margin-right:6px;line-height:1}
.desc{margin:0;color:#5a5d60;font-size:13px;line-height:1.5}.id{color:#9a9d99;font:12px ui-monospace,monospace;margin-left:4px}`;

const dark = (boxes) => boxes.some(([, , w, h, k]) => (k === 'dark' || k === 'ink' || k === 'acc') && w >= 90 && h >= 90);
const wf = (boxes) => {
  const d = dark(boxes);
  const inDark = (bx) => boxes.some(([x2, y2, w2, h2, k2]) => (k2 === 'dark' || k2 === 'ink') && bx[0] >= x2 && bx[1] >= y2 && bx[0] + bx[2] <= x2 + w2 && bx[1] + bx[3] <= y2 + h2);
  return `<div class="wf${d ? ' on-dark' : ''}">${boxes.map(([x, y, w, h, k]) => `<div class="b ${k}${(k === 'h' || k === 't') && inDark([x, y, w, h]) ? ' on' : ''}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></div>`).join('')}</div>`;
};
// 카드 preview용 아스키(28×9)
const ascii = (boxes) => {
  const W = 28, H = 9, g = Array.from({ length: H }, () => Array(W).fill(' '));
  const ch = { img: '░', dark: '▓', h: '█', big: '█', t: '─', btn: '▣', pill: '▭', line: '·', card: '▒', acc: '▒', ink: '▓', dot: '●' };
  for (const [x, y, w, h, k] of boxes) for (let r = Math.floor(y / 100 * H); r < Math.min(H, Math.ceil((y + h) / 100 * H)); r++)
    for (let c = Math.floor(x / 100 * W); c < Math.min(W, Math.ceil((x + w) / 100 * W)); c++) g[r][c] = ch[k] || '?';
  return ['┌' + '─'.repeat(W) + '┐', ...g.map((r) => '│' + r.join('') + '│'), '└' + '─'.repeat(W) + '┘'].join('\n');
};

const L = 'ABCDEFG';
const asciiOut = {};
let html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>레이아웃 선택 — ${spec.title || ''}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"><style>${css}</style></head><body>
<header><h1>섹션별 레이아웃 고르기 — ${spec.title || ''}</h1><p>구조만 비교하는 와이어프레임입니다(색·사진·글꼴은 시안에서 입혀집니다). 섹션마다 A·B·C 중 하나를 골라 주세요. 검은 테두리가 추천안입니다.</p></header>`;
spec.sections.forEach((s, i) => {
  asciiOut[s.name] = {};
  html += `<section><h2>${i + 1}. ${s.name}</h2>${s.note ? `<p class="note">${s.note}</p>` : ''}<div class="row">`;
  s.options.forEach((id, j) => {
    const r = get(id);
    if (!r) { console.error(`알 수 없는 레시피: ${id}`); process.exit(2); }
    const rec = s.recommended === id;
    html += `<div class="opt${rec ? ' rec' : ''}">${rec ? '<span class="badge">추천</span>' : ''}${wf(r[2])}<p class="lab"><b>${L[j]}</b>${r[0]}<span class="id">${id}</span></p><p class="desc">${r[1]}</p></div>`;
    asciiOut[s.name][`${L[j]} · ${r[0]}`] = { id, recommended: rec, preview: ascii(r[2]) };
  });
  html += '</div></section>';
});
html += '<div style="height:40px"></div></body></html>';
writeFileSync(out, html);
writeFileSync(out.replace(/\.html?$/i, '') + '.ascii.json', JSON.stringify(asciiOut, null, 2));
console.log(`OK ${out} (+ .ascii.json) — 섹션 ${spec.sections.length}개`);
console.log('열기: Windows `start "" "<경로>"` · macOS `open <경로>` · Linux `xdg-open <경로>`');
