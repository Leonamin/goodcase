# Stepper

줄이기·직접 입력·늘리기로 수량과 숫자를 조절합니다.

## 동작 계약

- value/onValueChange 제어형. min은 기본 0, step은 기본 1이며 max로 상한을 지정합니다.
- 기존 IconButton과 숫자 입력을 한 컨트롤로 조합. 최소·최대값에서는 해당 증감 버튼만 비활성화합니다.
- 직접 입력은 Enter 또는 포커스 이동 시 확정하며 min 기준 step에 맞춘 뒤 범위 안으로 제한합니다. 빈 입력은 이전 값으로 복원합니다.
- 소수 step의 부동소수점 오차를 정리합니다. step은 양수, value/min/max는 유효한 숫자로 전달합니다.
- label과 입력·설명을 연결하며 error는 aria-invalid로 안내. isReadOnly는 값 확인·선택 가능, isDisabled는 모든 조작 차단.
- 입력의 기본 증감 화살표를 숨기고 양옆 버튼에 읽을 수 있는 이름을 제공합니다. 브랜드·밀도·다크 모드는 --gc-* 토큰을 따릅니다.
- 외부 포커스 링이 잘리거나 인접 요소를 가리지 않도록 부모 배치에 --gc-focus-clearance(기본 6px) 이상의 안전 여백·간격을 확보합니다.

## 상태

- 기본
- 최소·최대
- 직접 입력
- 소수 단위
- 읽기 전용
- 비활성
- 오류

## 키보드

- Tab: 줄이기·숫자 입력·늘리기 이동
- 버튼 Enter/Space: 증감
- 입력 ArrowUp/ArrowDown: 증감
- Home/End: 최소·최대값(상한이 있을 때)
- Enter: 입력 확정

## 직접 관련 파일

- assets/src/components/basic/index.tsx
- assets/src/styles/basic.css
- assets/src/styles/tokens.css

## 포함 코드와 공유 스타일

- assets/src/components/basic/index.tsx
- assets/src/styles/basic.css
- assets/src/styles/composed.css
- assets/src/styles/global.css
- assets/src/styles/overlays.css
- assets/src/styles/tabs.css
- assets/src/styles/toast.css
- assets/src/styles/tokens.css

상대 import와 공유 모듈의 다른 export 때문에 직접 사용하는 컴포넌트보다 범위가 넓을 수 있습니다.

## 외부 패키지

lucide-react, react, react-dom

참조 버전은 배포본 루트 manifest.json의 packageVersions를 확인합니다.

## 카탈로그 의존성 설명

- react (hooks, DOM rendering)
- lucide-react (Stepper 증감·Alert 닫기 아이콘; 해당 컴포넌트를 제외하면 제거 가능)

## 코드 위치

- Button: assets/src/components/basic/index.tsx:15-45
- IconButton: assets/src/components/basic/index.tsx:46-66
- Link: assets/src/components/basic/index.tsx:67-82
- FieldProps: assets/src/components/basic/index.tsx:83-87
- Input: assets/src/components/basic/index.tsx:88-93
- TextField: assets/src/components/basic/index.tsx:94-121
- StepperProps: assets/src/components/basic/index.tsx:122-132
- Stepper: assets/src/components/basic/index.tsx:139-251
- SliderProps: assets/src/components/basic/index.tsx:253-261
- Slider: assets/src/components/basic/index.tsx:262-309
- TextArea: assets/src/components/basic/index.tsx:311-363
- Checkbox: assets/src/components/basic/index.tsx:364-398
- RadioGroup: assets/src/components/basic/index.tsx:399-431
- Switch: assets/src/components/basic/index.tsx:432-456
- Badge: assets/src/components/basic/index.tsx:457-465
- Alert: assets/src/components/basic/index.tsx:466-501
- SpinnerProps: assets/src/components/basic/index.tsx:502-508
- Spinner: assets/src/components/basic/index.tsx:510-554
- Skeleton: assets/src/components/basic/index.tsx:556-570
- Progress: assets/src/components/basic/index.tsx:571-702
- Image: assets/src/components/basic/index.tsx:703-746
- Avatar: assets/src/components/basic/index.tsx:747-769
- Card: assets/src/components/basic/index.tsx:770-786
- Table: assets/src/components/basic/index.tsx:787-826
- Pagination: assets/src/components/basic/index.tsx:827-874
- Typography: assets/src/components/basic/index.tsx:875-889
- Stack: assets/src/components/basic/index.tsx:890-904
- Grid: assets/src/components/basic/index.tsx:905-922
- Divider: assets/src/components/basic/index.tsx:923-925

## 이식

1. assets/src/components/basic/index.tsx에서 필요한 export와 해당 타입을 복사하거나 전체 기본 컴포넌트 모듈을 가져옵니다.
2. assets/src/styles/basic.css의 해당 .gc-* 규칙과 tokens.css를 가져와 프로젝트 의미 토큰에 연결합니다.
3. 아래 사용 예제의 이벤트를 프로젝트 상태·서비스에 연결합니다. 데모 코드는 이식하지 않습니다.
4. 키보드, 긴 한국어, 비활성·오류 상태와 모바일 너비에서 동작 계약을 재확인합니다.

## 사용 예제

```tsx
<Stepper label="수량" value={quantity} onValueChange={setQuantity} min={0} max={10} />
<Stepper label="간격" value={amount} onValueChange={setAmount} step={0.1} max={2} />
```

예제의 import, 데이터, 상태, callback은 대상 프로젝트에서 제공합니다. 갤러리 데모는 배포본에 포함되지 않습니다.
