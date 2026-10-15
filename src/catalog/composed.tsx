import { useRef, useState } from "react";
import { Button, Checkbox, Input, TextField } from "../components/basic";
import {
  FormField,
  FormActions,
  ConfirmDialog,
  SearchFilterBar,
  DataTable,
  FileUploader,
  ImageViewer,
  ImageGallery,
  AsyncContent,
  CopyField,
  type ViewerImage,
  type FilterValues,
  type DataRow,
  type UploadAdapter,
} from "../components/composed";
import type { CatalogEntry } from "./types";
const pause = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));
function Simulation({
  isFailing,
  onChange,
}: {
  isFailing: boolean;
  onChange: (isFailing: boolean) => void;
}) {
  return (
    <div className="gc-simulation">
      <span>로컬 비동기 시뮬레이션 · 외부 서버 연결 없음</span>
      <Checkbox
        label="요청 실패시키기"
        isChecked={isFailing}
        onCheckedChange={(isChecked) => onChange(isChecked)}
      />
    </div>
  );
}
function FieldDemo() {
  const [value, setValue] = useState("");
  return (
    <FormField
      label="프로젝트 이름"
      description="긴 한국어 이름도 사용할 수 있습니다."
      error={value.length > 30 ? "30자 이하로 입력해주세요." : undefined}
      isRequired
    >
      {(props) => (
        <Input
          {...props}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="새 프로젝트"
        />
      )}
    </FormField>
  );
}
function ActionsDemo() {
  const [name, setName] = useState("서울 여행 기록");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isSubmittingRef = useRef(false);
  return (
    <div className="gc-composed-demo">
      <Simulation isFailing={isFailing} onChange={setIsFailing} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmittingRef.current) return;
          isSubmittingRef.current = true;
          setIsSubmitting(true);
          setError("");
          setMessage("");
          await pause();
          if (isFailing)
            setError("저장하지 못했습니다. 입력을 유지했으니 다시 시도하세요.");
          else setMessage(`“${name}” 저장 완료 · 입력 유지`);
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }}
      >
        <TextField
          label="프로젝트 이름"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <FormActions
          isSubmitting={isSubmitting}
          error={error}
          onCancel={() => {
            setName("서울 여행 기록");
            setError("");
            setMessage("입력을 원래 값으로 되돌렸습니다.");
          }}
        />
      </form>
      <p role="status" className="gc-demo-status">
        {message}
      </p>
    </div>
  );
}
function ConfirmDemo() {
  const [isFailing, setIsFailing] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="gc-composed-demo">
      <Simulation isFailing={isFailing} onChange={setIsFailing} />
      <ConfirmDialog
        trigger={<Button variant="danger">프로젝트 삭제</Button>}
        title="프로젝트를 삭제할까요?"
        description="이 예제는 실제 데이터를 삭제하지 않습니다. 취소 버튼에서 시작하고 바깥 클릭으로 닫히지 않습니다."
        onConfirm={async () => {
          await pause();
          if (isFailing)
            throw new Error("삭제 요청에 실패했습니다. 다시 시도하세요.");
          setMessage("로컬 삭제 시뮬레이션 완료");
        }}
      />
      <p role="status" className="gc-demo-status">
        {message}
      </p>
    </div>
  );
}
function FilterDemo() {
  const [value, setValue] = useState<FilterValues>({
    query: "",
    status: "all",
  });
  return <SearchFilterBar value={value} onApply={setValue} />;
}
const sampleRows: DataRow[] = [
  "서울 여행",
  "이미지 라이브러리",
  "기록 보관함",
  "작은 상점",
  "디자인 시스템",
  "사용자 인터뷰",
  "콘텐츠 도구",
].map((name, index) => ({
  id: `project-${index}`,
  name,
  status: index % 2 ? "초안" : "활성",
}));
function TableDemo() {
  const [rows, setRows] = useState(sampleRows);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [error, setError] = useState("");
  const isPendingRef = useRef(false);
  async function load(shouldClear = false) {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setError("");
    if (shouldClear || !rows.length) {
      setRows([]);
      setIsLoading(true);
    } else setIsRefreshing(true);
    await pause();
    if (isFailing) setError("목록을 불러오지 못했습니다.");
    else setRows(sampleRows);
    setIsLoading(false);
    setIsRefreshing(false);
    isPendingRef.current = false;
  }
  return (
    <div className="gc-composed-demo">
      <Simulation isFailing={isFailing} onChange={setIsFailing} />
      <div className="gc-actions">
        <Button onClick={() => load(true)} disabled={isLoading || isRefreshing}>
          처음 로딩
        </Button>
        <Button onClick={() => load()} disabled={isLoading || isRefreshing}>
          새로고침
        </Button>
        <Button
          onClick={() => {
            setRows([]);
            setError("");
          }}
          disabled={isLoading || isRefreshing}
        >
          빈 목록
        </Button>
      </div>
      <DataTable
        rows={rows}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRetry={() => load()}
      />
    </div>
  );
}
function UploadDemo() {
  const [isFailing, setIsFailing] = useState(false);
  const upload: UploadAdapter = async (_file, { signal, onProgress }) => {
    for (let step = 1; step <= 4; step++) {
      await pause(220);
      if (signal.aborted) throw new DOMException("취소", "AbortError");
      onProgress(step * 25);
    }
    if (isFailing) throw new Error("로컬 업로드 실패 · 재시도할 수 있습니다.");
  };
  return (
    <div className="gc-composed-demo">
      <Simulation isFailing={isFailing} onChange={setIsFailing} />
      <FileUploader onUpload={upload} />
    </div>
  );
}
function illustration(title: string, color: string, detail: string) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="${color}"/><circle cx="760" cy="180" r="130" fill="#ffffff" opacity=".3"/><path d="M0 540 270 290 480 470 730 260 1000 520V700H0Z" fill="#ffffff" opacity=".5"/><text x="70" y="110" font-size="52" font-family="sans-serif" fill="#20242c">${title}</text><text x="70" y="160" font-size="24" font-family="sans-serif" fill="#20242c">${detail}</text></svg>`)}`;
}
const images: ViewerImage[] = [
  {
    id: "a",
    src: illustration("Morning archive", "#cdded1", "Local SVG · 1000 × 700"),
    alt: "연두색 산 풍경 일러스트",
  },
  {
    id: "b",
    src: illustration("Quiet afternoon", "#e8d5bf", "Local SVG · 1000 × 700"),
    alt: "모래색 오후 풍경 일러스트",
  },
  {
    id: "c",
    src: illustration("Blue hour", "#c4d5e8", "Local SVG · 1000 × 700"),
    alt: "파란색 저녁 풍경 일러스트",
  },
];
function ViewerDemo() {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const [hasSameSource, setHasSameSource] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);
  const activeImages = isEmpty
    ? []
    : hasBrokenImage
      ? [
          {
            id: "broken",
            src: "/__goodcase_missing_image__.png",
            alt: "실패 상태 확인용 이미지",
          },
        ]
      : hasSameSource
        ? [
            images[0],
            {
              ...images[0],
              id: "same-source-second",
              alt: "같은 원본의 두 번째 이미지",
            },
          ]
        : images;
  return (
    <div className="gc-composed-demo">
      <Checkbox
        label="이미지 로딩 실패 예제"
        isChecked={hasBrokenImage}
        onCheckedChange={(isChecked) => {
          setHasBrokenImage(isChecked);
          setIndex(0);
        }}
      />
      <Checkbox
        label="같은 원본의 연속 이미지"
        isChecked={hasSameSource}
        onCheckedChange={(isChecked) => {
          setHasSameSource(isChecked);
          setIndex(0);
        }}
      />
      <Checkbox
        label="빈 이미지 목록"
        isChecked={isEmpty}
        onCheckedChange={(isChecked) => {
          setIsEmpty(isChecked);
          setIndex(0);
        }}
      />
      <Checkbox
        label="스와이프 놓기 보정"
        isChecked={isAnimated}
        onCheckedChange={(isChecked) => setIsAnimated(isChecked)}
      />
      <ImageViewer
        isAnimated={isAnimated}
        images={activeImages}
        index={index}
        onIndexChange={setIndex}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={<Button>이미지 뷰어 열기</Button>}
      />
    </div>
  );
}
function GalleryDemo() {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  return (
    <div className="gc-composed-demo">
      <Checkbox
        label="첫 썸네일 실패시키기 · 해제하면 같은 ID로 복구"
        isChecked={hasBrokenImage}
        onCheckedChange={(isChecked) => setHasBrokenImage(isChecked)}
      />
      <ImageGallery
        images={images.map((image, index) =>
          index === 0 && hasBrokenImage
            ? { ...image, src: "/__goodcase_missing_thumbnail__.png" }
            : image,
        )}
      />
    </div>
  );
}
function AsyncDemo() {
  const [hasContent, setHasContent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [error, setError] = useState("");
  const isPendingRef = useRef(false);
  async function load(shouldClear = false) {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setError("");
    if (shouldClear || !hasContent) {
      setHasContent(false);
      setIsLoading(true);
    } else setIsRefreshing(true);
    await pause();
    if (isFailing) setError("요청에 실패했습니다.");
    else setHasContent(true);
    setIsLoading(false);
    setIsRefreshing(false);
    isPendingRef.current = false;
  }
  return (
    <div className="gc-composed-demo">
      <Simulation isFailing={isFailing} onChange={setIsFailing} />
      <div className="gc-actions">
        <Button onClick={() => load(true)} disabled={isLoading || isRefreshing}>
          최초 로딩
        </Button>
        <Button onClick={() => load()} disabled={isLoading || isRefreshing}>
          콘텐츠 유지 새로고침
        </Button>
        <Button
          onClick={() => {
            setHasContent(false);
            setError("");
          }}
          disabled={isLoading || isRefreshing}
        >
          빈 상태
        </Button>
      </div>
      <AsyncContent
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        isEmpty={!hasContent}
        onRetry={() => load()}
      >
        <div className="gc-async">
          <strong>기존 콘텐츠</strong>
          <p>새로고침 중에도 이 카드가 유지됩니다.</p>
        </div>
      </AsyncContent>
    </div>
  );
}
function CopyDemo() {
  return (
    <CopyField
      label="프로젝트 식별자"
      value="goodcase-project-2026-한국어-전체원본값"
    />
  );
}
type Spec = Pick<
  CatalogEntry,
  | "id"
  | "name"
  | "summary"
  | "Demo"
  | "contracts"
  | "states"
  | "keyboard"
  | "usage"
  | "dependencies"
>;

function entry(spec: Spec): CatalogEntry {
  const implementationFile = `src/components/composed/${spec.id}.tsx`;
  return {
    ...spec,
    category: "composed",
    files: [
      implementationFile,
      "src/styles/composed.css",
      "src/styles/tokens.css",
    ],
    dependencies: spec.dependencies,
    migration: [
      `${implementationFile}와 상대 import로 연결된 공용 컴포넌트·타입을 함께 가져옵니다.`,
      "필요한 외부 패키지는 포함 파일의 import와 의존성 목록을 확인해 설치합니다.",
      "src/styles/composed.css의 대상 클래스와 공통 스타일을 가져오고 --gc-*를 프로젝트 토큰에 연결합니다.",
      "데모 코드는 옮기지 않고 실제 데이터·API·파일 저장 동작을 콜백에 연결합니다.",
      "키보드, 실패, 긴 한국어 콘텐츠, 좁은 화면 상태를 프로젝트에서 다시 확인합니다.",
    ],
  };
}
export const composedEntries: CatalogEntry[] = [
  entry({
    id: "form-field",
    name: "FormField",
    summary: "입력의 이름, 설명, 필수 여부와 오류를 연결하는 공통 필드",
    Demo: FieldDemo,
    contracts: [
      "고유 id로 label과 입력을 연결합니다.",
      "설명 또는 오류를 aria-describedby로 연결하고 오류가 설명보다 우선합니다.",
      "오류가 있으면 aria-invalid를 전달합니다. 실제 검증은 호출부가 담당합니다.",
    ],
    states: ["기본", "필수", "설명", "30자 초과 오류"],
    keyboard: ["Tab으로 입력에 접근", "label 클릭으로 입력 포커스"],
    usage:
      'import { FormField } from "./components/composed/form-field";\nimport { Input } from "./components/basic/input";\n\n<FormField label="이름" error={error} isRequired>{props => <Input {...props} />}</FormField>',
    dependencies: ["react", "--gc-* 토큰"],
  }),
  entry({
    id: "form-actions",
    name: "FormActions",
    summary: "중복 제출을 차단하고 실패 후 입력을 유지하는 폼 액션",
    Demo: ActionsDemo,
    contracts: [
      "submit 버튼은 폼 제출을 실행합니다. 저장 중 취소와 제출을 비활성화합니다.",
      "실패 메시지는 role=alert로 표시합니다. 입력 상태는 호출부가 소유합니다.",
      "중복 실행은 제출 핸들러에서도 ref 또는 요청 잠금으로 차단해야 합니다.",
      "취소 시 초기화 범위와 성공 후 이동은 호출부가 결정합니다.",
    ],
    states: ["대기", "처리 중", "성공", "실패 후 입력 유지"],
    keyboard: ["Enter로 폼 제출", "Tab으로 취소·제출 이동"],
    usage:
      'import { FormActions } from "./components/composed/form-actions";\n\n<FormActions isSubmitting={isSubmitting} error={error} onCancel={reset} />',
    dependencies: ["react", "src/components/basic/button.tsx", "--gc-* 토큰"],
  }),
  entry({
    id: "confirm-dialog",
    name: "ConfirmDialog",
    summary: "취소에서 시작하며 실패 시 열린 상태를 유지하는 확인 창",
    Demo: ConfirmDemo,
    contracts: [
      "초기 포커스는 취소 버튼입니다.",
      "바깥 클릭으로 닫히지 않습니다. 처리 중 닫기 요청도 무시합니다.",
      "onConfirm Promise 성공 시 닫고 실패 시 내부 오류를 표시합니다.",
      "동기 ref로 중복 실행을 차단합니다. 실제 삭제는 외부 콜백에만 있습니다.",
    ],
    states: ["닫힘", "확인", "처리 중", "오류", "완료"],
    keyboard: [
      "Tab 포커스 순환",
      "Escape로 닫기 (처리 중 제외)",
      "닫은 뒤 호출 버튼 포커스 복귀",
    ],
    usage:
      'import { ConfirmDialog } from "./components/composed/confirm-dialog";\nimport { Button } from "./components/basic/button";\n\n<ConfirmDialog trigger={<Button>삭제</Button>} title="삭제할까요?" description="설명" onConfirm={deleteItem} />',
    dependencies: [
      "react",
      "src/components/overlays/dialog.tsx",
      "src/components/basic/button.tsx",
      "react-dom",
      "radix-ui",
      "lucide-react",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "search-filter-bar",
    name: "SearchFilterBar",
    summary: "작성 중 조건과 실제 적용된 조건을 구분하는 검색 패널",
    Demo: FilterDemo,
    contracts: [
      "입력 중 조건은 draft이며 Enter 또는 적용 버튼으로만 반영합니다.",
      "적용된 조건은 별도 요약으로 보여줍니다.",
      "초기화는 검색어와 상태 전체를 초기화하고 즉시 적용합니다.",
      "value 변경 시 draft를 동기화합니다. 프로젝트 필터 모델은 필요에 따라 확장합니다.",
    ],
    states: ["미적용 입력", "적용", "조건 초기화", "외부 값 변경"],
    keyboard: [
      "Enter로 적용",
      "Tab으로 필터·버튼 이동",
      "Select 방향키 탐색·Enter 확정·Escape 취소",
    ],
    usage:
      'import { SearchFilterBar } from "./components/composed/search-filter-bar";\n\n<SearchFilterBar value={filters} onApply={setFilters} statusOptions={[{value:"all",label:"전체"}]} />',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/basic/text-field.tsx",
      "src/components/overlays/select.tsx",
      "react-dom",
      "radix-ui",
      "lucide-react",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "data-table",
    name: "DataTable",
    summary: "정렬, 현재 페이지 선택, 상태 처리를 갖춘 데이터 목록",
    Demo: TableDemo,
    contracts: [
      "안정적인 row.id로 선택 상태를 관리합니다.",
      "이름 정렬 변경 시 첫 페이지로 이동하고 선택을 해제합니다.",
      "전체 선택은 현재 페이지에만 적용되며 일부 선택 상태를 표시합니다.",
      "행·전체 선택은 공용 Checkbox를 사용하며 숨긴 라벨과 일부 선택 상태를 동일하게 지원합니다.",
      "페이지 이동 또는 rows 변경 시 선택을 해제합니다. pageSize 변경 시 첫 페이지로 돌아가고 선택을 해제합니다.",
      "최초 로딩·빈 결과·오류·재시도·기존 내용 유지 새로고침을 지원합니다.",
      "columns의 render/compare와 getRowId로 다른 데이터 모델에 이식합니다. isSortable/isSelectable 기본 true로 기능을 끌 수 있습니다.",
      "기본 DataRow(id/name/status) 모델은 columns/getRowId를 생략할 수 있습니다. 다른 행 모델은 columns와 getRowId를 함께 제공해야 하며 타입으로 확인합니다. 클라이언트 정렬·페이지네이션이며 서버형은 별도 확장이 필요합니다.",
    ],
    states: [
      "로딩",
      "기본",
      "일부/전체 선택",
      "정렬",
      "페이지 경계",
      "빈 결과",
      "오류/재시도",
      "재조회",
    ],
    keyboard: ["Tab으로 정렬·선택·페이지 버튼 이동", "Space로 체크박스 선택"],
    usage:
      'import { DataTable } from "./components/composed/data-table";\n\n<DataTable rows={rows} isLoading={isLoading} error={error} onRetry={reload} />',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/basic/checkbox.tsx",
      "src/components/basic/pagination.tsx",
      "src/components/composed/async-content.tsx",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "file-uploader",
    name: "FileUploader",
    summary: "파일 선택과 실제 업로드를 분리하고 파일별 실패를 복구",
    Demo: UploadDemo,
    contracts: [
      "기본 PNG/JPEG/SVG, 최대 3개·파일당 2MB를 선택 전에 검증합니다.",
      "선택·드롭은 업로드하지 않습니다. 명시적 업로드 버튼으로 시작합니다.",
      "보이는 파일 선택 액션은 공용 Button이며 숨긴 native file 입력이 운영체제 파일 선택기를 엽니다.",
      "파일별 진행률, 성공, 실패, 재시도, 제거를 지원합니다.",
      "제거·unmount 시 AbortSignal로 요청 취소를 전달합니다.",
      "onUpload 외부 어댑터가 실제 저장을 수행하며 서버에서도 파일 검증이 필요합니다.",
    ],
    states: [
      "선택 전",
      "선택됨",
      "검증 오류",
      "업로드 중",
      "성공",
      "실패/재시도",
      "취소",
    ],
    keyboard: [
      "Tab으로 파일 선택·업로드·제거 접근",
      "네이티브 파일 선택창 사용",
    ],
    usage:
      'import { FileUploader } from "./components/composed/file-uploader";\n\n<FileUploader onUpload={async (file, {signal,onProgress}) => upload(file, signal, onProgress)} />',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/basic/progress.tsx",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "image-viewer",
    name: "ImageViewer",
    summary: "어두운 전체 화면과 썸네일 탐색을 갖춘 이미지 뷰어",
    Demo: ViewerDemo,
    contracts: [
      "열기·이미지 변경 시 100% 화면 맞춤과 이동 초기화입니다.",
      "이미지를 두 번 탭하면 기본 배율에서 탭한 이미지 지점을 기준으로 200% 확대합니다. 확대 상태의 두 번 탭은 100% 화면 맞춤으로 초기화합니다. 이동 경계에서 초점을 제한합니다.",
      "터치·펜에서 250ms 이하의 탭 두 번을 300ms·32px 이내로 인식합니다. 이미지 탭만 포함하며 드래그·스와이프·핀치·긴 누름·컨트롤 입력은 탭 기록에서 제외합니다.",
      "확대는 100~400%, 버튼과 두 손가락 핀치로 조작합니다. 손가락 중심의 이미지 지점을 유지하며 이동 경계에서 제한합니다.",
      "두 번째 손가락이 추가되면 페이지 이동을 취소하고 핀치로 전환합니다. 한 손가락을 떼면 남은 손가락으로 끊김 없이 이동합니다.",
      "핀치 중과 같은 터치 세션의 마지막 손가락을 뗄 때는 페이지 변경·빈 공간 닫기를 하지 않습니다. 모든 손가락을 뗀 뒤 기본 배율의 새 제스처부터 스와이프를 허용합니다.",
      "확대 후 pointer 드래그로 이동하고 이미지·뷰포트 크기에 맞춰 경계를 제한합니다.",
      "첫·마지막에서 이전·다음 이동을 멈춥니다.",
      "로딩·오류·재시도·이미지 없음 상태를 표시합니다. 같은 src의 연속 이미지와 캐시 완료도 처리합니다. 이미지 배열과 활성 index는 호출부가 소유합니다.",
      "전체 화면의 어두운 표면, 상단 도구, 좌우 탐색, 캡션과 하단 썸네일을 제공합니다.",
      "이미지와 컨트롤을 제외한 빈 공간 클릭·터치로 닫습니다. 이미지 클릭과 드래그 이동은 닫기로 처리하지 않습니다.",
      "기본 크기에서 터치·펜으로 중앙 이미지 영역 또는 빈 공간을 좌우 스와이프하면 손가락을 따라 현재 페이지와 인접 페이지가 함께 움직입니다. 충분한 거리 또는 빠른 플릭은 이동을 확정하며 짧거나 취소된 제스처는 제자리로 돌아옵니다.",
      "버튼·썸네일·키보드 이동은 즉시 전환합니다. isAnimated는 스와이프 놓기 보정만 조절하며 false 또는 모션 감소 설정에서는 보정도 즉시 처리합니다.",
      "확대 상태에서는 이동만 처리하고 스와이프 페이지 전환은 하지 않습니다.",
      "닫기는 실제 빈 공간에서 시작하고 끝난 탭만 처리합니다. 컨트롤에서 시작한 입력과 짧은 드래그는 닫기에서 제외합니다.",
      "모달 포커스 관리와 닫기 후 호출 요소 복귀를 유지합니다.",
    ],
    states: [
      "닫힘",
      "로딩",
      "표시",
      "확대/이동",
      "이미지 두 번 탭 확대·초기화",
      "두 손가락 핀치·한 손가락 이동 전환",
      "순서 경계",
      "오류/재시도",
      "이미지 없음",
      "같은 src 연속 이미지",
      "전체 화면·모바일",
      "썸네일 선택",
      "스와이프·짧은 제스처 복귀",
      "스와이프 놓기 보정 켜기·끄기",
    ],
    keyboard: [
      "좌우 키로 이미지 이동",
      "확대 후 Shift+방향키로 이미지 이동",
      "Escape 닫기",
      "Tab으로 확대·초기화 접근",
    ],
    usage:
      'import { ImageViewer } from "./components/composed/image-viewer";\nimport { Button } from "./components/basic/button";\n\n<ImageViewer images={images} index={index} onIndexChange={setIndex} isOpen={isOpen} onOpenChange={setIsOpen} isAnimated={true} trigger={<Button>보기</Button>} />',
    dependencies: [
      "react",
      "src/components/overlays/dialog.tsx",
      "src/components/basic/button.tsx",
      "src/components/composed/gallery-image.tsx",
      "src/components/composed/use-viewer-gesture.ts",
      "src/components/composed/viewer-image.ts",
      "react-dom",
      "radix-ui",
      "lucide-react",
      "ResizeObserver",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "image-gallery",
    name: "ImageGallery",
    summary: "썸네일에서 선택한 이미지로 뷰어를 여는 갤러리",
    Demo: GalleryDemo,
    contracts: [
      "썸네일 선택 시 해당 index부터 ImageViewer를 엽니다.",
      "4:3 썸네일과 반응형 그리드를 유지합니다.",
      "썸네일 로딩 실패는 개별 fallback으로 처리합니다.",
      "닫기 후 실제 선택한 썸네일로 포커스를 돌립니다.",
      "이미지 대체 텍스트는 데이터에서 전달합니다.",
    ],
    states: [
      "그리드",
      "모바일 2열",
      "이미지 실패",
      "동일 ID 새 src 복구",
      "뷰어 열림",
    ],
    keyboard: ["Tab으로 썸네일 탐색", "Enter/Space로 열기", "Escape 닫기"],
    usage:
      'import { ImageGallery } from "./components/composed/image-gallery";\n\n<ImageGallery images={[{id:"1", src:"/image.jpg", alt:"이미지 설명"}]} />',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/composed/image-viewer.tsx",
      "src/components/composed/gallery-image.tsx",
      "react-dom",
      "radix-ui",
      "lucide-react",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "async-content",
    name: "AsyncContent",
    summary: "최초 로딩과 기존 콘텐츠 재조회를 구분하는 상태 경계",
    Demo: AsyncDemo,
    contracts: [
      "최초 isLoading이면 스켈레톤과 상태 안내를 표시합니다.",
      "isRefreshing은 기존 children을 유지하며 aria-busy를 전달합니다.",
      "빈 결과와 데이터 없는 오류를 구분하고 오류에는 재시도를 제공합니다.",
      "기존 콘텐츠가 있으면 재조회 오류도 콘텐츠 위에 표시합니다.",
      "조회·취소·경쟁 요청 처리는 외부 데이터 계층에서 담당합니다.",
    ],
    states: [
      "최초 로딩",
      "콘텐츠",
      "빈 상태",
      "오류",
      "재조회",
      "콘텐츠 유지 오류",
    ],
    keyboard: ["Tab으로 재시도 접근"],
    usage:
      'import { AsyncContent } from "./components/composed/async-content";\n\n<AsyncContent isLoading={isLoading} isRefreshing={isRefreshing} isEmpty={!data.length} error={error} onRetry={reload}>{content}</AsyncContent>',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/basic/skeleton.tsx",
      "--gc-* 토큰",
    ],
  }),
  entry({
    id: "copy-field",
    name: "CopyField",
    summary: "표시된 전체 원본값을 실제 클립보드에 복사",
    Demo: CopyDemo,
    contracts: [
      "navigator.clipboard.writeText가 성공한 뒤에만 성공을 표시합니다.",
      "실패 시 직접 선택·복사할 수 있는 안내를 제공합니다.",
      "읽기 전용 input으로 전체 원본값을 선택할 수 있습니다.",
      "처리 중 중복 복사를 차단하고 이후 반복 복사를 허용합니다.",
    ],
    states: ["기본", "긴 값", "복사 중", "성공", "권한 실패"],
    keyboard: ["Tab으로 값·복사 버튼 접근", "입력에서 전체 선택하여 수동 복사"],
    usage:
      'import { CopyField } from "./components/composed/copy-field";\n\n<CopyField label="식별자" value={id} />',
    dependencies: [
      "react",
      "src/components/basic/button.tsx",
      "src/components/basic/text-field.tsx",
      "Clipboard API (HTTPS 또는 localhost)",
      "--gc-* 토큰",
    ],
  }),
];
