// cova-check.mjs — 시안 기계 검사.
// 사용: node cova-check.mjs <design-slug.html> [--mode=web|app|admin]   (mode 생략 시 .phone 있으면 app, 아니면 web)
// playwright가 설치된 폴더에서 실행하고 HTML은 절대/상대 경로로 넘긴다.
// 산출: 폭별 뷰포트 단위 캡처 <slug>.check-<폭>-<n>.jpg (눈 검사용 — 풀페이지 한 장은 축소돼 판독이 안 된다)
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const file = process.argv[2];
if (!file || !/\.html?$/i.test(file) || !existsSync(file)) {
  console.error('사용: node cova-check.mjs <design-slug.html> [--mode=web|app|admin]');
  process.exit(2);
}
const src = readFileSync(file, 'utf8');
let mode = (process.argv.find((a) => a.startsWith('--mode=')) || '').slice(7);
if (!mode) mode = /class=["'][^"']*\bphone\b/.test(src) ? 'app' : 'web';
const url = pathToFileURL(resolve(file)).href;
const out = { file, mode, fail: [], warn: [] };
const F = (m) => out.fail.push(m), W = (m) => out.warn.push(m);

// ── 소스 정적 검사
const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const keyframes = css.match(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
const marquee = keyframes.filter((k) => /translateX?\(\s*-50%|translate:\s*-50%/.test(k)).length;
if (marquee > 1) F(`마키 키프레임 ${marquee}개 (페이지당 최대 1)`);
const plan = (src.match(/<!--\s*design-plan:([\s\S]*?)-->/) || [])[1];
if (!plan) F('design-plan 주석 없음');
else {
  const need = mode === 'app' ? ['아키타입', '크리틱'] : mode === 'admin' ? ['크리틱'] : ['섹션맵', '라이브', '히어로', '크리틱', '이력'];
  for (const k of need) if (!new RegExp(`${k}\\s*:`).test(plan)) (k === '섹션맵' || k === '라이브' ? F : W)(`design-plan에 '${k}:' 필드 없음`);
}
const planHC0 = plan && /히어로\s*:\s*HC0/.test(plan);
if (/transition:\s*(all\b|[\d.]+m?s\b)/.test(css)) W('transition: all(또는 속성 없는 transition 단축) 사용 — 속성을 명시');
const clipText = (css.match(/(?<!-webkit-)background-clip:\s*text/g) || []).length;
if (clipText > 1) W(`그라데이션 텍스트 ${clipText}곳 (페이지당 1곳)`);
if (/\p{Emoji_Presentation}/u.test(src.replace(/<!--[\s\S]*?-->/g, ''))) F('이모지 사용 (✦ ✓ ★ 같은 텍스트 기호는 허용)');

const SYS = /^(-apple-system|system-ui|blinkmacsystemfont|sans-serif|serif|monospace|apple sd gothic neo|malgun gothic|ui-sans-serif|ui-monospace|inherit)$/i;
const widths = mode === 'admin' ? [[1440, 900], [1280, 800], [1024, 768]] : mode === 'app' ? [[1440, 900], [390, 844]] : [[1440, 900], [1280, 800], [390, 844]];
const shots = [];

const b = await chromium.launch();
for (const [w, h] of widths) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => p.goto(url, { waitUntil: 'load' }));
  await p.waitForTimeout(1500);

  // 1) 눈 검사용 캡처 — 측정(스크롤을 건드림) 전에, 뷰포트 단위로 최대 8장
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const n = Math.min(8, Math.ceil(H / h));
  for (let i = 0; i < n; i++) {
    await p.evaluate((y) => scrollTo(0, y), Math.round((i * (H - h)) / Math.max(1, n - 1)));
    await p.waitForTimeout(250);
    const path = file.replace(/\.html?$/i, `.check-${w}-${i}.jpg`);
    await p.screenshot({ path, type: 'jpeg', quality: 70 });
    shots.push(path);
  }
  await p.evaluate(() => scrollTo(0, 0));

  // 2) 측정
  const r = await p.evaluate(({ mode }) => {
    const cs = (el) => getComputedStyle(el);
    const px = (v) => parseFloat(v) || 0;
    const vis = (el) => { const s = cs(el), rc = el.getBoundingClientRect(); return rc.width > 0 && rc.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    // 줄 수 = 글자 크기의 60% 이상 떨어진 텍스트 박스 top 군집 수(인라인 장식·첨자로 과대 계산하지 않게)
    const lines = (el) => {
      const fs = px(cs(el).fontSize); const rg = document.createRange(); rg.selectNodeContents(el);
      const tops = [...rg.getClientRects()].filter((x) => x.width > 1 && x.height > fs * 0.5).map((x) => x.top).sort((a, b) => a - b);
      let n = 0, last = -1e9; for (const t of tops) if (t - last > fs * 0.6) { n++; last = t; } return n;
    };
    const res = {};
    scrollTo(99999, 0); res.hscroll = scrollX; scrollTo(0, 0);
    const EXEMPT = '[aria-hidden="true"], .preview, [class*="preview"], .skip-link, .sr-only, details:not([open])';
    res.hiddenAtRest = [...document.querySelectorAll('h1,h2,h3,p,li')].filter((e) => e.textContent.trim() && vis(e) && !e.closest(EXEMPT) && cs(e).opacity === '0').length;
    res.brokenImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(0, 90));
    const btnSel = 'a.button,.button,.btn,button,a[class*="cta"]';
    res.wrappedCta = [...document.querySelectorAll(btnSel)].filter((e) => vis(e) && e.textContent.trim() && lines(e) > 1).map((e) => e.textContent.trim().slice(0, 20));
    // 국문은 고딕만 — 한글 텍스트에 명조·바탕·손글씨 계열이 첫 폰트로 걸렸는가
    const KR_SERIF = /maruburi|noto serif kr|nanum ?myeongjo|gowun batang|hahmlet|song myung|nanum pen|gaegu|batang|gungsuh|myeongjo|serif kr|^serif$/i;
    res.krSerif = [...new Set([...document.body.querySelectorAll('*')]
      .filter((e) => vis(e) && [...e.childNodes].some((nd) => nd.nodeType === 3 && /[가-힣]/.test(nd.textContent)))
      .map((e) => cs(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()).filter((f) => KR_SERIF.test(f)))];
    // 국문 웨이트 600 상한 — 700 이상인 한글 텍스트 요소
    res.krBold = [...document.body.querySelectorAll('*')]
      .filter((e) => vis(e) && +cs(e).fontWeight > 600 && [...e.childNodes].some((nd) => nd.nodeType === 3 && /[가-힣]/.test(nd.textContent)))
      .map((e) => `${e.textContent.trim().slice(0, 12)}(${cs(e).fontWeight})`);
    const fams = [...new Set([...document.querySelectorAll('h1,h2,h3,p')].filter(vis).map((e) => cs(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()))];
    res.fonts = fams.map((f) => [f, [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded')]);

    if (mode === 'app') {
      // 폰 프레임 밖으로 넘치는 요소(가로 스크롤 레일 안은 제외), 한 단어가 줄바꿈으로 쪼개진 짧은 라벨
      res.phoneOverflow = [];
      for (const ph of document.querySelectorAll('.phone')) {
        const pr = ph.getBoundingClientRect();
        for (const e of ph.querySelectorAll('*')) {
          if (!vis(e) || e.closest('[style*="overflow-x"], .rail, [class*="carousel"], [class*="scroll"]')) continue;
          if ([...e.childNodes].some((nd) => nd.nodeType === 3 && nd.textContent.trim())) {
            const rc = e.getBoundingClientRect();
            if (rc.right > pr.right + 1 || rc.left < pr.left - 1) res.phoneOverflow.push(e.textContent.trim().slice(0, 16));
          }
        }
      }
      res.brokenLabels = [...document.querySelectorAll('.phone span, .phone b, .phone strong, .phone small, .phone button, .phone a')]
        .filter((e) => vis(e) && e.children.length === 0 && e.textContent.trim().length <= 8 && lines(e) > 1).map((e) => e.textContent.trim());
      return res;
    }

    const h1 = document.querySelector('h1');
    if (h1) {
      const rc = h1.getBoundingClientRect();
      res.h1Bottom = Math.round(rc.bottom); res.h1Lines = lines(h1);
      const sec = h1.closest('section,header,main > div') || document.body;
      const cta = sec.querySelector(btnSel); if (cta) res.ctaBottom = Math.round(cta.getBoundingClientRect().bottom);
      // 스플릿 히어로 감지: h1 옆(좌우)에 폭 25~70%의 큰 미디어·패널이 세로로 겹쳐 있으면 HC0
      const vw = innerWidth, vh = innerHeight;
      res.splitHero = [...sec.querySelectorAll('img,video,picture,svg,canvas,div,figure,aside')].some((m) => {
        if (m.contains(h1) || h1.contains(m) || !vis(m)) return false;
        const mr = m.getBoundingClientRect();
        if (mr.width < vw * 0.25 || mr.width > vw * 0.7 || mr.height < vh * 0.3) return false;
        const s = cs(m); const isMedia = /^(IMG|VIDEO|PICTURE|SVG|CANVAS)$/i.test(m.tagName) || s.backgroundImage !== 'none' || (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== cs(sec).backgroundColor);
        if (!isMedia) return false;
        const vOverlap = Math.min(mr.bottom, rc.bottom) - Math.max(mr.top, rc.top) > 0;
        return vOverlap && (mr.left >= rc.right - 10 || mr.right <= rc.left + 10);
      });
    }
    const ps = [...document.querySelectorAll('p')].filter((e) => vis(e) && e.textContent.trim().length > 40);
    const bodyFs = ps.length ? ps.map((e) => px(cs(e).fontSize)).sort((a, b) => a - b)[Math.floor(ps.length / 2)] : 16;
    const h2f = [...document.querySelectorAll('h2')].filter(vis).map((e) => px(cs(e).fontSize)).sort((a, b) => a - b);
    res.h2Ratio = h2f.length ? h2f[Math.floor(h2f.length / 2)] / bodyFs : null;
    res.longLines = ps.filter((e) => { const fs = px(cs(e).fontSize); return e.getBoundingClientRect().width / fs > (/[가-힣]/.test(e.textContent) ? 46 : 40); }).length;
    res.tightLH = ps.filter((e) => px(cs(e).lineHeight) / px(cs(e).fontSize) < 1.3).length;
    const heads = [...document.querySelectorAll('h2,h3')].filter(vis);
    res.eyebrows = heads.filter((hh) => { const e = hh.previousElementSibling; if (!e || !vis(e) || e.textContent.trim().length > 30) return false; const s = cs(e); return px(s.fontSize) <= 13 && (px(s.letterSpacing) >= px(s.fontSize) * 0.05 || s.textTransform === 'uppercase'); }).length;
    res.sections = Math.max(1, document.querySelectorAll('section').length);
    // 대비 — 텍스트 중심점 아래에 이미지·영상이 있으면(오버레이 텍스트) 건너뛴다
    const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const s = cs(n); if (s.backgroundImage !== 'none') return null; const c = rgb(s.backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.9) return c; } return [255, 255, 255]; };
    const overMedia = (el) => { const rc = el.getBoundingClientRect(); const x = rc.left + rc.width / 2, y = rc.top + rc.height / 2; if (y < 0 || y > innerHeight) return false; return document.elementsFromPoint(x, y).some((n) => /^(IMG|VIDEO|CANVAS|PICTURE|svg)$/i.test(n.tagName)); };
    res.lowContrast = [];
    for (const e of document.querySelectorAll('p,li,a,h1,h2,h3,span,small')) {
      if (!vis(e) || ![...e.childNodes].some((nd) => nd.nodeType === 3 && nd.textContent.trim())) continue;
      e.scrollIntoView({ block: 'center', inline: 'nearest' });
      if (overMedia(e)) continue;
      const bg = bgOf(e); if (!bg) continue; const fg = rgb(cs(e).color); if ((fg[3] ?? 1) < 0.5) continue;
      const [a, c] = [lum(fg), lum(bg)]; const ratio = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
      const big = px(cs(e).fontSize) >= 24 || (px(cs(e).fontSize) >= 18.66 && +cs(e).fontWeight >= 700);
      if (ratio < (big ? 3 : 4.5)) res.lowContrast.push(e.textContent.trim().slice(0, 24));
      if (res.lowContrast.length >= 8) break;
    }
    return res;
  }, { mode });

  const tag = `${w}px`;
  if (r.hscroll > 0) (mode === 'admin' && w <= 1024 ? W : F)(`${tag} 가로 스크롤 ${r.hscroll}px (html, body 둘 다 overflow-x: clip 필요)`);
  if (r.hiddenAtRest) F(`${tag} reduced-motion에서 opacity:0 텍스트 ${r.hiddenAtRest}개`);
  if (w === widths[0][0]) {
    if (r.brokenImg.length) F(`깨진 이미지 ${r.brokenImg.length}: ${r.brokenImg[0]}`);
    const bad = r.fonts.filter(([f, ok]) => !ok && !SYS.test(f)).map(([f]) => f);
    if (bad.length) F(`폰트 미적용(폴백): ${bad.join(', ')}`);
    if (r.krBold?.length > 1) W(`국문 텍스트 웨이트 700+ ${r.krBold.length}곳 (600 상한, 정말 필요한 1곳만): ${r.krBold.slice(0, 5).join(', ')}`);
    if (r.krSerif?.length) F(`국문 텍스트에 세리프·손글씨 폰트: ${r.krSerif.join(', ')} — 국문은 고딕만(사용자가 명시 요청한 경우만 예외)`);
  }
  if (r.wrappedCta.length) W(`${tag} CTA 줄바꿈: ${r.wrappedCta.join(', ')}`);
  if (mode === 'app') {
    if (r.phoneOverflow?.length) F(`${tag} 폰 프레임 밖으로 넘친 텍스트: ${[...new Set(r.phoneOverflow)].slice(0, 5).join(' | ')}`);
    if (r.brokenLabels?.length) W(`${tag} 짧은 라벨이 줄바꿈으로 쪼개짐(keep-all·nowrap): ${[...new Set(r.brokenLabels)].slice(0, 5).join(', ')}`);
  }
  if (mode === 'web' && w === 1440 && r.splitHero && !planHC0) W('히어로가 좌 텍스트·우 이미지 스플릿(HC0)으로 보임 — 기각 후보 ①. 다른 구도(HC1~HC9)로 바꾸거나 plan에 `히어로: HC0(이유)`');
  if (mode === 'web' && w === 1280) {
    if (r.h1Bottom > h) F(`1280×800 히어로 헤드라인이 첫 화면 밖 (bottom ${r.h1Bottom})`);
    if (r.ctaBottom > h) W(`1280×800 히어로 CTA가 첫 화면 밖 (bottom ${r.ctaBottom})`);
    if (r.h1Lines > 3) W(`h1 ${r.h1Lines}줄 (데스크톱 2~3줄)`);
    if (r.h2Ratio && r.h2Ratio < 1.25) W(`h2(중앙값)/본문 배율 ${r.h2Ratio.toFixed(2)} (<1.25, 위계 평평)`);
    if (r.longLines) W(`본문 줄 길이 초과 문단 ${r.longLines}개`);
    if (r.tightLH) W(`본문 행간 1.3 미만 문단 ${r.tightLH}개`);
    if (r.eyebrows > Math.ceil(r.sections / 3)) W(`eyebrow ${r.eyebrows}개 / 섹션 ${r.sections} (상한 ${Math.ceil(r.sections / 3)})`);
    if (r.lowContrast.length) W(`대비 부족(단색 배경 위): ${r.lowContrast.join(' | ')}`);
  }
  await p.close();
}
await b.close();
out.fail = [...new Set(out.fail)]; out.warn = [...new Set(out.warn)];
console.log(JSON.stringify({ mode, fail: out.fail, warn: out.warn, screenshots: shots.length }, null, 2));
console.log(`캡처: ${file.replace(/\.html?$/i, '.check-<폭>-<n>.jpg')} (${shots.length}장 — Read로 한 장씩 본다)`);
console.log(out.fail.length ? `FAIL ${out.fail.length}` : `PASS (warn ${out.warn.length})`);
process.exit(out.fail.length ? 1 : 0);
