# 미리보기 사이트의 공용 UI 사용 기준

2026-10-15 점검 범위: 갤러리 전체, 모든 카탈로그 예제, 조합형 컴포넌트의 보이는 조작부.

| 용도                                | 공용 구현           |
| ----------------------------------- | ------------------- |
| 일반·아이콘 액션, 파일 선택         | Button / IconButton |
| 페이지·문서·목록 이동               | Link                |
| 테마·색상·밀도·소스 파일·Toast 옵션 | Select              |
| 예제 상태 변경, 표의 전체·행 선택   | Checkbox / Switch   |
| 라벨과 설명을 포함한 입력           | TextField           |
| FormField의 내부 입력               | Input               |
| 수량 증감 / 범위 조절               | Stepper / Slider    |
| 로딩 자리 표시                      | Skeleton            |

Blue와 Forest는 강조색을 다르게 표현하며 동일한 모서리 토큰을 사용한다. 밀도 변경은 컨트롤 높이와 간격을 조절한다. 테마는 Portal 콘텐츠까지 일관되게 적용한다.

## 구현상 유지하는 native 요소

- `App.tsx`의 모바일 사이드바 backdrop: 화면을 덮는 닫기 표면. 일반 Button의 패딩·누름 효과를 적용하지 않으며, 닫기 버튼과 Escape를 함께 제공한다.
- `FileUploader`의 숨긴 `input[type=file]`: 운영체제 파일 선택기 연결. 사용자가 보는 조작부는 Button이다.
- `src/components/basic`의 기본 HTML 요소와 Radix 기반 overlays: 공용 primitive 자체의 구현이다.
- FormField·표·레이아웃의 의미 있는 HTML, Combobox의 option·active-descendant 처리, 이미지 뷰어의 드래그·핀치·빈 영역 닫기: 해당 컴포넌트가 소유하는 의미 구조와 제스처다. 일반 버튼으로 치환하지 않는다.

`pnpm test:ui-policy`는 갤러리·카탈로그·조합형 컴포넌트의 native 조작부 재도입을 검사하며 위 두 파일별 예외만 허용한다. 키보드·포커스·테마·반응형 검사는 Playwright로 별도 확인한다.
