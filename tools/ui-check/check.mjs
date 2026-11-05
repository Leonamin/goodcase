#!/usr/bin/env node
// ui-check: 키보드로 페이지를 순회하며 포커스 표시 불변식을 측정한다. 컴포넌트·파일 이름은 모른다.
// 사용: node check.mjs <url> [url...] [--crawl <css>] [--scope <css>] [--inject-css <css>] [--max 150]
//   --crawl <css>: 첫 url에서 selector에 맞는 a[href]를 모아 같은 출처의 페이지로 모두 검사
//   --scope <css>: 이 영역 안에서만 Tab 순회(사이드바 등 제외)
//   --inject-css : 로드 후 마지막에 CSS 추가(로드 순서가 바뀐 상황 재현용)
// 불변식: focus-clipped(링이 overflow 조상에 잘림), focus-invisible(링도 대체 표시도 없음)
// ponytail: 좌표 기반 근사(transform·clip-path 무시). 거짓 양성이 나오면 그 불변식만 고친다.
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args.splice(i, 2)[1];
};
const crawl = opt("--crawl");
const inject = opt("--inject-css");
const scope = opt("--scope");
const max = Number(opt("--max", 150));
let urls = args;
if (!urls.length) {
  console.error("usage: check.mjs <url...> [--crawl css] [--inject-css css] [--max n]");
  process.exit(2);
}

const HINTS = {
  "focus-clipped":
    "링이 overflow 컨테이너 경계를 넘는다. 컨테이너에 링 크기 이상 padding을 주거나, 해당 요소에 outline-offset:-2px(안쪽)를 쓰거나, 링 대신 배경·테두리 표시를 쓴다.",
  "focus-invisible":
    "포커스 시 링도 스타일 변화도 없다. :focus-visible 링 또는 배경·테두리 변화를 추가한다. outline:none이 있다면 전역 :focus-visible과의 특이도·로드 순서를 확인한다.",
};

// 페이지 안에서 실행: 현재 포커스 요소를 검사해 문제 목록을 돌려준다.
async function inspectFocus(scopeSel) {
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const describe = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const cls = [...el.classList].slice(0, 2).join(".");
    if (cls) s += `.${cls}`;
    const role = el.getAttribute("role");
    return role ? `${s}[role=${role}]` : s;
  };
  const active = document.activeElement;
  if (!active || active === document.body) return { done: true };
  if (scopeSel && !document.querySelector(scopeSel)?.contains(active)) return { done: true };
  const ring = (el) => {
    const c = getComputedStyle(el);
    const w = parseFloat(c.outlineWidth);
    if (c.outlineStyle === "none" || !w) return null;
    const off = parseFloat(c.outlineOffset) || 0;
    return { ext: off + w };
  };
  const problems = [];
  const label = describe(active);
  const r = active.getBoundingClientRect();
  const isTiny = r.width < 3 && r.height < 3; // sr-only 입력 등
  const ownRing = ring(active);

  // focus-clipped: 링 바깥 가장자리가 overflow 조상의 안쪽 영역을 넘는지
  if (ownRing && !isTiny) {
    const e = ownRing.ext;
    const box = { l: r.left - e, t: r.top - e, r: r.right + e, b: r.bottom + e };
    const pos = getComputedStyle(active).position;
    let waiting = pos === "absolute"; // 절대 위치는 containing block 아래 조상만 자른다
    for (let p = active.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      if (pos === "fixed") break;
      if (waiting) {
        if (p === active.offsetParent) waiting = false;
        else continue;
      }
      const c = getComputedStyle(p);
      const clipX = c.overflowX !== "visible";
      const clipY = c.overflowY !== "visible";
      if (!clipX && !clipY) continue;
      const pr = p.getBoundingClientRect();
      const cl = pr.left + p.clientLeft, ct = pr.top + p.clientTop;
      const cr = cl + p.clientWidth, cb = ct + p.clientHeight;
      const over = [];
      if (clipX && box.l < cl - 0.5) over.push(`왼쪽 ${(cl - box.l).toFixed(1)}px`);
      if (clipX && box.r > cr + 0.5) over.push(`오른쪽 ${(box.r - cr).toFixed(1)}px`);
      if (clipY && box.t < ct - 0.5) over.push(`위 ${(ct - box.t).toFixed(1)}px`);
      if (clipY && box.b > cb + 0.5) over.push(`아래 ${(box.b - cb).toFixed(1)}px`);
      if (over.length)
        problems.push({ rule: "focus-clipped", el: label, detail: `${describe(p)} 경계 초과: ${over.join(", ")}` });
    }
  }

  // focus-invisible: 자신·:focus-within 조상의 링, 또는 포커스 해제 대비 스타일 변화
  if (!isTiny) {
    const chain = [active];
    for (let p = active.parentElement, n = 0; p && n < 3; p = p.parentElement, n++)
      if (p.matches(":focus-within")) chain.push(p);
    const hasRing = chain.some((el) => ring(el));
    const isDescendantMode = active.hasAttribute("aria-activedescendant");
    if (!hasRing && !isDescendantMode) {
      const props = ["backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "boxShadow", "textDecorationLine", "color"];
      const snap = () => {
        const out = [];
        for (const el of [active, ...active.querySelectorAll("*"), ...[active.parentElement, active.nextElementSibling, active.previousElementSibling].filter(Boolean)]) {
          const c = getComputedStyle(el);
          out.push(props.map((k) => c[k]).join("|"));
        }
        return out.join("\n");
      };
      const before = snap();
      active.blur();
      await frame(); // React 상태 반영 대기
      const after = snap();
      active.focus({ preventScroll: true });
      await frame();
      if (before === after)
        problems.push({ rule: "focus-invisible", el: label, detail: "outline 없음, 스타일 변화 없음" });
    }
  }
  return { problems, key: label + r.x.toFixed(0) + r.y.toFixed(0), hasPopup: (active.getAttribute("aria-haspopup") || "false") !== "false" || active.getAttribute("role") === "combobox", isCombobox: active.getAttribute("role") === "combobox" };
}

const browser = await chromium.launch();
const found = new Map(); // rule|el|detail -> url
let visited = 0;

async function walk(page, label) {
  const seen = new Set();
  const record = (res) => {
    for (const p of res.problems ?? []) {
      const k = `${p.rule}|${p.el}|${p.detail}`;
      if (!found.has(k)) found.set(k, label);
    }
  };
  if (scope)
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.setAttribute("tabindex", "-1");
      el.focus();
    }, scope);
  await page.keyboard.press("Tab");
  for (let i = 0; i < max; i++) {
    const res = await page.evaluate(inspectFocus, scope);
    if (res.done || seen.has(res.key)) break;
    seen.add(res.key);
    visited++;
    record(res);
    if (res.hasPopup) {
      // 팝업 항목도 방향키로 순회한다
      await page.keyboard.press(res.isCombobox ? "ArrowDown" : "Enter");
      await page.waitForTimeout(150);
      const inner = new Set();
      for (let j = 0; j < 30; j++) {
        const sub = await page.evaluate(inspectFocus);
        if (sub.done || inner.has(sub.key) || seen.has(sub.key)) break;
        inner.add(sub.key);
        visited++;
        record(sub);
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(30);
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    }
    await page.keyboard.press("Tab");
  }
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
if (crawl) {
  await page.goto(urls[0]);
  const hrefs = await page.$$eval(crawl, (as) => as.map((a) => a.href));
  urls = [...new Set(hrefs)];
}
for (const url of urls) {
  await page.goto(url);
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
  if (inject) await page.addStyleTag({ content: inject });
  await walk(page, url);
}
await browser.close();

for (const [k, url] of found) {
  const [rule, el, detail] = k.split("|");
  console.log(`FAIL ${rule}  ${el}\n  ${detail}\n  ${url}\n  힌트: ${HINTS[rule]}\n`);
}
console.log(`${visited}개 포커스 지점 검사, 문제 ${found.size}건`);
process.exit(found.size ? 1 : 0);
