# ui-check

실행 중인 페이지를 키보드로 순회하며 포커스 표시 불변식을 측정한다. 컴포넌트·파일 이름은 코드에 없다.

| 불변식 | 실패 조건 |
|---|---|
| focus-clipped | 포커스 링이 overflow(hidden/auto/scroll) 조상 경계를 넘는다 |
| focus-invisible | 링도 없고 포커스 해제 대비 스타일 변화도 없다 |

```bash
# Goodcase 갤러리 전체 (pnpm dev 실행 중)
pnpm ui-check
# 다른 프로젝트: @playwright/test가 설치되어 있으면 된다
node tools/ui-check/check.mjs http://localhost:3000/page --max 150
```

옵션: `--crawl <css>` 링크 수집 · `--scope <css>` 순회 영역 제한 · `--inject-css <css>` CSS 로드 순서 재현.
종료 코드: 문제 있으면 1. 출력의 힌트대로 고친 뒤 다시 실행한다.

새 문제 유형이 나오면 사례를 적지 말고 `check.mjs`의 `inspectFocus`에 불변식을 추가한다.
