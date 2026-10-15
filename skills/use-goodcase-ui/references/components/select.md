# Select

정해진 목록에서 한 값을 확정합니다.

## 동작 계약

- value와 onValueChange로 선택값을 외부에서 관리
- 방향키 탐색은 선택 확정과 분리, Enter·클릭으로 확정
- Escape는 탐색을 취소하고 호출 요소로 포커스 복귀
- 비활성 옵션은 선택하지 않음
- Trigger 주변과 overflow 컨테이너 안쪽에 --gc-focus-clearance(기본 6px) 이상의 포커스 안전 여백을 확보합니다.

## 상태

- 기본
- 선택
- placeholder
- 비활성
- 비활성 옵션
- 긴 옵션

## 키보드

- Space/Enter: 열기·확정
- 방향키: 옵션 탐색
- 문자: 옵션 탐색
- Escape: 취소

## 직접 관련 파일

- assets/src/components/overlays/index.tsx
- assets/src/styles/overlays.css
- assets/src/styles/tokens.css

## 포함 코드와 공유 스타일

- assets/src/components/basic/index.tsx
- assets/src/components/overlays/index.tsx
- assets/src/components/overlays/tabs.tsx
- assets/src/components/overlays/toast.tsx
- assets/src/styles/basic.css
- assets/src/styles/composed.css
- assets/src/styles/global.css
- assets/src/styles/overlays.css
- assets/src/styles/tabs.css
- assets/src/styles/toast.css
- assets/src/styles/tokens.css

상대 import와 공유 모듈의 다른 export 때문에 직접 사용하는 컴포넌트보다 범위가 넓을 수 있습니다.

## 외부 패키지

lucide-react, radix-ui, react, react-dom

참조 버전은 배포본 루트 manifest.json의 packageVersions를 확인합니다.

## 카탈로그 의존성 설명

- react
- react-dom
- radix-ui
- lucide-react

## 코드 위치

- Option: assets/src/components/overlays/index.tsx:20-20
- Select: assets/src/components/overlays/index.tsx:21-80
- Combobox: assets/src/components/overlays/index.tsx:81-256
- MenuItem: assets/src/components/overlays/index.tsx:257-262
- Menu: assets/src/components/overlays/index.tsx:263-289
- Popover: assets/src/components/overlays/index.tsx:290-316
- Tooltip: assets/src/components/overlays/index.tsx:317-337
- DialogProps: assets/src/components/overlays/index.tsx:338-350
- Dialog: assets/src/components/overlays/index.tsx:440-442
- Drawer: assets/src/components/overlays/index.tsx:443-445
- DialogClose: assets/src/components/overlays/index.tsx:446-448
- Accordion: assets/src/components/overlays/index.tsx:451-487

## 이식

1. assets/src/components/overlays/index.tsx와 assets/src/styles/overlays.css를 함께 복사합니다. 필요한 export만 남기면 묶음에서 분리할 수 있습니다.
2. react, react-dom, radix-ui, lucide-react를 설치하고 애플리케이션 진입점에서 CSS를 가져옵니다.
3. assets/src/styles/tokens.css의 --gc-* 의미 토큰을 프로젝트 토큰에 연결합니다. 브랜드별 색상·폰트·밀도를 교체합니다.
4. 상태와 이벤트를 프로젝트 데이터에 연결하고, 갤러리의 키보드·닫기·실패 계약을 이식 뒤 확인합니다.

## 사용 예제

```tsx
<Select label="지역" value={region} onValueChange={setRegion} options={options} />
```

예제의 import, 데이터, 상태, callback은 대상 프로젝트에서 제공합니다. 갤러리 데모는 배포본에 포함되지 않습니다.
