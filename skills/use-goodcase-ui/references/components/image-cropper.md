# ImageCropper

움직이는 크롭 마스크와 사진 확대·회전, 투명 여백을 지원하는 사진 편집기

## 동작 계약

- 직사각형·라운드 사각형·원형 마스크를 선택합니다. 원형은 항상 정원을 유지합니다.
- 사진 이동과 마스크 조절 모드를 구분합니다. 마스크는 편집 영역 안에서 이동·크기 조절하며, 사진은 영역 밖으로 자유롭게 이동합니다.
- 편집 영역 위에서 마우스 휠을 위로 굴려 확대하고 아래로 굴려 축소합니다. 커서 위치를 기준으로 확대하며 페이지는 함께 스크롤되지 않습니다.
- 두 손가락의 중심을 기준으로 사진을 이동·확대·회전합니다. 10–800% 확대와 -180–180° 회전을 지원합니다.
- 사진 밖의 공간과 원형·라운드 모서리는 알파값 0의 투명 PNG로 내보냅니다. 원본의 알파값도 보존합니다.
- onCrop은 실제 PNG Blob과 픽셀 크기를 전달합니다. 업로드와 다운로드는 호출부에서 처리합니다. outputWidth 기본값은 1024이며 가로·세로 최대 4096px입니다.
- 이미지 로딩 중·저장 중 조작과 중복 저장을 막습니다. 저장 실패 시 편집값을 보존하고 재시도할 수 있습니다.
- 원격 이미지는 CORS 접근 허용이 필요합니다. src 변경 시 사진과 마스크를 초기화합니다.

## 상태

- 이미지 로딩·로드 실패
- 사진 이동·마스크 이동·크기 조절
- 마우스 드래그·휠 확대·단일 터치·두 손가락 확대와 회전
- PNG 생성·callback 처리 중·실패 후 재시도

## 키보드

- Tab으로 모양·모드·편집 영역·슬라이더·저장 버튼에 접근합니다.
- 편집 영역에서 방향키로 선택한 사진 또는 마스크 이동, Shift로 10배 이동합니다.
- 마스크 손잡이는 방향키로 크기를 조절합니다. 확대·회전 슬라이더는 방향키와 Home/End를 지원합니다.

## 직접 관련 파일

- assets/src/components/composed/image-cropper.tsx

## 포함 코드와 공유 스타일

- assets/src/components/basic/button.tsx
- assets/src/components/basic/field.ts
- assets/src/components/basic/slider.tsx
- assets/src/components/composed/image-cropper.tsx
- assets/src/styles/basic.css
- assets/src/styles/composed.css
- assets/src/styles/global.css
- assets/src/styles/tokens.css

상대 import와 공유 모듈의 다른 export 때문에 직접 사용하는 컴포넌트보다 범위가 넓을 수 있습니다.

## 외부 패키지

react, react-dom

참조 버전은 배포본 루트 manifest.json의 packageVersions를 확인합니다.

## 카탈로그 의존성 설명

- React 19+
- TypeScript

## 코드 위치

- CropShape: assets/src/components/composed/image-cropper.tsx:5-5
- CropResult: assets/src/components/composed/image-cropper.tsx:6-6
- ImageCropperProps: assets/src/components/composed/image-cropper.tsx:7-14
- ImageCropper: assets/src/components/composed/image-cropper.tsx:72-535

## 이식

1. ImageCropper와 직접 의존 컴포넌트, tokens/global/basic/composed 스타일을 가져옵니다.
2. src에 이미지 URL 또는 object URL을 전달하고 onCrop으로 PNG Blob을 받아 저장·업로드합니다. object URL의 해제는 호출부가 담당합니다.
3. 필요하면 Dialog 또는 Drawer 안에 배치하고 onCancel을 닫기 동작에 연결합니다. 저장 중에는 호스트에서도 닫기와 src 교체를 막으세요.
4. iOS·Android 실기기에서 두 손가락 조작과 사진 파일의 방향·용량을 확인하세요.

## 사용 예제

```tsx
import { ImageCropper } from "./components/composed/image-cropper";

<ImageCropper src={imageUrl} initialShape="rounded" outputWidth={1024}
  onCrop={async ({ blob, width, height }) => { await saveImage(blob); }}
  onCancel={closeEditor} />
```

예제의 import, 데이터, 상태, callback은 대상 프로젝트에서 제공합니다. 갤러리 데모는 배포본에 포함되지 않습니다.
