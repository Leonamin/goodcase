# Alert

문맥에 유지되는 안내와 오류

## 동작 계약

- 제목과 설명을 함께 표시하며 자동으로 사라지지 않습니다.
- onDismiss를 제공한 경우만 muted X ghost 아이콘 버튼이 생깁니다. 호버·포커스에서 표면을 표시합니다.
- 위험은 alert, 다른 상태는 status로 전달합니다.

## 상태

- 안내
- 성공
- 주의
- 오류
- 닫기 가능

## 키보드

- 내부 액션·닫기 버튼은 Tab·Enter·Space

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
<Alert title="저장 실패" tone="danger">입력 내용은 유지했어요.</Alert>
```

예제의 import, 데이터, 상태, callback은 대상 프로젝트에서 제공합니다. 갤러리 데모는 배포본에 포함되지 않습니다.
