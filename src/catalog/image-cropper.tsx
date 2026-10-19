import { useEffect, useState } from "react";
import {
  ImageCropper,
  type CropResult,
} from "../components/composed/image-cropper";
import { Input } from "../components/basic/input";
import { Link } from "../components/basic/link";
import { Button } from "../components/basic/button";
import type { CatalogEntry } from "./types";

const sample = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="#bed9ed"/><stop offset="1" stop-color="#f6e9d5"/></linearGradient></defs><rect width="800" height="600" fill="url(#s)"/><circle cx="600" cy="145" r="65" fill="#ffe5a6"/><path d="M0 440 240 130 510 470 650 270 800 430V600H0" fill="#779b96"/><path d="m130 270 110-140 105 132-100-48z" fill="#f6f4eb"/><path d="M0 490Q230 380 450 510T800 480V600H0" fill="#325b5b"/></svg>')}`;
function CropperDemo() {
  const [fileUrl, setFileUrl] = useState("");
  const [result, setResult] = useState<(CropResult & { url: string }) | null>(
    null,
  );
  const [isFailing, setIsFailing] = useState(false);
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl],
  );
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );
  return (
    <div className="gc-cropper-demo">
      <label className="gc-field">
        사진 선택
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setFileUrl(URL.createObjectURL(file));
              setResult(null);
            }
          }}
        />
      </label>
      <p className="gc-help">
        샘플 일러스트 또는 내 사진으로 테스트하세요. 파일은 브라우저 안에서
        처리되며 서버에 업로드되지 않습니다.
      </p>
      <Button
        variant="secondary"
        aria-pressed={isFailing}
        onClick={() => setIsFailing(!isFailing)}
      >
        저장 실패 테스트 {isFailing ? "켜짐" : "꺼짐"} · 로컬 시뮬레이션
      </Button>
      <ImageCropper
        src={fileUrl || sample}
        onCrop={(crop) => {
          if (isFailing) throw new Error("Local demo failure");
          setResult({ ...crop, url: URL.createObjectURL(crop.blob) });
        }}
      />
      {result && (
        <div className="gc-cropper-demo-result">
          <div>
            <strong>
              크롭 결과 · {result.width} × {result.height}
            </strong>
            <p className="gc-help">체크무늬는 투명도 확인용 배경입니다.</p>
            <Link href={result.url} download="goodcase-crop.png">
              PNG 다운로드
            </Link>
          </div>
          <img src={result.url} alt="크롭 결과" />
        </div>
      )}
    </div>
  );
}
export const imageCropperEntry: CatalogEntry = {
  id: "image-cropper",
  name: "ImageCropper",
  category: "composed",
  summary:
    "움직이는 크롭 마스크와 사진 확대·회전, 투명 여백을 지원하는 사진 편집기",
  contracts: [
    "직사각형·라운드 사각형·원형 마스크를 선택합니다. 원형은 항상 정원을 유지합니다.",
    "사진 이동과 마스크 조절 모드를 구분합니다. 마스크는 편집 영역 안에서 이동·크기 조절하며, 사진은 영역 밖으로 자유롭게 이동합니다.",
    "편집 영역 위에서 마우스 휠을 위로 굴려 확대하고 아래로 굴려 축소합니다. 커서 위치를 기준으로 확대하며 페이지는 함께 스크롤되지 않습니다.",
    "두 손가락의 중심을 기준으로 사진을 이동·확대·회전합니다. 10–800% 확대와 -180–180° 회전을 지원합니다.",
    "사진 밖의 공간과 원형·라운드 모서리는 알파값 0의 투명 PNG로 내보냅니다. 원본의 알파값도 보존합니다.",
    "onCrop은 실제 PNG Blob과 픽셀 크기를 전달합니다. 업로드와 다운로드는 호출부에서 처리합니다. outputWidth 기본값은 1024이며 가로·세로 최대 4096px입니다.",
    "이미지 로딩 중·저장 중 조작과 중복 저장을 막습니다. 저장 실패 시 편집값을 보존하고 재시도할 수 있습니다.",
    "원격 이미지는 CORS 접근 허용이 필요합니다. src 변경 시 사진과 마스크를 초기화합니다.",
  ],
  states: [
    "이미지 로딩·로드 실패",
    "사진 이동·마스크 이동·크기 조절",
    "마우스 드래그·휠 확대·단일 터치·두 손가락 확대와 회전",
    "PNG 생성·callback 처리 중·실패 후 재시도",
  ],
  keyboard: [
    "Tab으로 모양·모드·편집 영역·슬라이더·저장 버튼에 접근합니다.",
    "편집 영역에서 방향키로 선택한 사진 또는 마스크 이동, Shift로 10배 이동합니다.",
    "마스크 손잡이는 방향키로 크기를 조절합니다. 확대·회전 슬라이더는 방향키와 Home/End를 지원합니다.",
  ],
  files: ["src/components/composed/image-cropper.tsx"],
  dependencies: ["React 19+", "TypeScript"],
  migration: [
    "ImageCropper와 직접 의존 컴포넌트, tokens/global/basic/composed 스타일을 가져옵니다.",
    "src에 이미지 URL 또는 object URL을 전달하고 onCrop으로 PNG Blob을 받아 저장·업로드합니다. object URL의 해제는 호출부가 담당합니다.",
    "필요하면 Dialog 또는 Drawer 안에 배치하고 onCancel을 닫기 동작에 연결합니다. 저장 중에는 호스트에서도 닫기와 src 교체를 막으세요.",
    "iOS·Android 실기기에서 두 손가락 조작과 사진 파일의 방향·용량을 확인하세요.",
  ],
  usage:
    'import { ImageCropper } from "./components/composed/image-cropper";\n\n<ImageCropper src={imageUrl} initialShape="rounded" outputWidth={1024}\n  onCrop={async ({ blob, width, height }) => { await saveImage(blob); }}\n  onCancel={closeEditor} />',
  Demo: CropperDemo,
};
