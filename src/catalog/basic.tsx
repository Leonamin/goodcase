import { Menu, Settings, Star } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import * as B from "../components/basic";
import type { CatalogEntry } from "./types";
const landscape = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect fill="#e6eee8" width="800" height="500"/><circle fill="#edc985" cx="615" cy="115" r="45"/><path fill="#7c9c88" d="M0 430 230 130 470 430Z"/><path fill="#476953" d="M250 500 590 180 800 430 800 500Z"/></svg>')}`;
function ButtonDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="gc-basic-demo">
      <div className="gc-demo-row">
        <B.Button
          isLoading={isLoading}
          onClick={() => {
            setIsLoading(true);
            timer.current = setTimeout(() => {
              setCount(count + 1);
              setIsLoading(false);
            }, 900);
          }}
        >
          저장하기
        </B.Button>
        <B.Button variant="secondary">취소</B.Button>
        <B.Button variant="danger">삭제</B.Button>
        <B.Button disabled>권한 없음</B.Button>
      </div>
      <B.Typography variant="caption">
        아이콘 버튼 · 기본 ghost / 표면이 있는 filled / 비활성
      </B.Typography>
      <div className="gc-demo-row">
        <B.IconButton label="즐겨찾기" onClick={() => setCount(count + 1)}>
          <Star size={20} aria-hidden="true" />
        </B.IconButton>
        <B.IconButton
          label="메뉴 열기"
          appearance="filled"
          variant="secondary"
          onClick={() => setCount(count + 1)}
        >
          <Menu size={20} aria-hidden="true" />
        </B.IconButton>
        <B.IconButton
          label="설정 열기"
          appearance="filled"
          onClick={() => setCount(count + 1)}
        >
          <Settings size={20} aria-hidden="true" />
        </B.IconButton>
        <B.IconButton label="비활성 설정" disabled>
          <Settings size={20} aria-hidden="true" />
        </B.IconButton>
      </div>
      <B.Typography variant="caption">
        조밀한 보조 액션 · compact 24px / 아이콘 16px
      </B.Typography>
      <div className="gc-demo-row">
        <B.IconButton
          label="작은 즐겨찾기"
          size="compact"
          onClick={() => setCount(count + 1)}
        >
          <Star size={16} aria-hidden="true" />
        </B.IconButton>
        <B.IconButton
          label="작은 설정"
          size="compact"
          appearance="filled"
          variant="secondary"
          onClick={() => setCount(count + 1)}
        >
          <Settings size={16} aria-hidden="true" />
        </B.IconButton>
      </div>
      <B.Typography variant="caption">
        로컬 저장 시뮬레이션 · 실행 {count}회
      </B.Typography>
    </div>
  );
}
function LinkDemo() {
  return (
    <div className="gc-demo-row">
      <B.Link href="#link-demo-target">아래 설명으로 이동</B.Link>
      <B.Link href="#link-demo-target" shouldLookLikeButton>
        버튼형 링크
      </B.Link>
      <B.Link
        href="https://www.w3.org/WAI/"
        target="_blank"
        rel="noopener noreferrer"
      >
        접근성 문서 새 탭
      </B.Link>
      <p id="link-demo-target">이 위치는 같은 화면 안의 이동 목적지입니다.</p>
    </div>
  );
}
function TextFieldDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="gc-basic-demo">
      <B.TextField
        label="프로젝트 이름"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        description="최소 2자 이상 입력해주세요."
        error={value.length === 1 ? "이름을 2자 이상 입력해주세요." : undefined}
      />
      <B.TextField label="읽기 전용" value="goodcase-reference" readOnly />
      <B.TextField label="비활성 입력" defaultValue="변경 권한 없음" disabled />
      <B.TextField
        label="숫자 입력"
        type="number"
        min={0}
        defaultValue={12}
        description="기본 증감 화살표 없이 숫자를 입력합니다."
      />
    </div>
  );
}
function StepperDemo() {
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(0.5);
  return (
    <div className="gc-basic-demo">
      <B.Stepper
        label="수량"
        value={quantity}
        onValueChange={setQuantity}
        min={0}
        max={10}
        description="0~10개 · 버튼 또는 직접 입력으로 조절합니다."
      />
      <B.Stepper
        label="소수 단위"
        value={amount}
        onValueChange={setAmount}
        min={0}
        max={2}
        step={0.1}
        description="0.1 단위 · 입력 후 Enter 또는 포커스 이동으로 확정합니다."
      />
      <div className="gc-demo-row">
        <B.Stepper
          label="읽기 전용 수량"
          value={4}
          onValueChange={() => {}}
          isReadOnly
        />
        <B.Stepper
          label="비활성 수량"
          value={2}
          onValueChange={() => {}}
          isDisabled
        />
      </div>
      <B.Typography variant="caption">
        선택한 수량 {quantity}개 · 소수 값 {amount}
      </B.Typography>
    </div>
  );
}

function SliderDemo() {
  const [value, setValue] = useState(35);
  return (
    <div className="gc-basic-demo">
      <B.Slider
        label="볼륨"
        value={value}
        onValueChange={setValue}
        valueText={`${value}%`}
        description="방향키 또는 트랙을 눌러 조절합니다."
      />
      <B.Slider
        label="비활성 범위"
        value={60}
        onValueChange={() => {}}
        isDisabled
      />
    </div>
  );
}

function TextAreaDemo() {
  const [value, setValue] = useState("");
  return (
    <B.TextArea
      label="프로젝트 설명"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      maxLength={300}
      shouldAutoSize
      description="Enter로 줄바꿈합니다. 입력에 따라 최대 높이까지 늘어납니다."
    />
  );
}
function CheckboxDemo() {
  const [selected, setSelected] = useState([true, false]);
  return (
    <div className="gc-basic-demo">
      <B.Checkbox
        label="전체 알림 선택"
        isChecked={selected.every(Boolean)}
        isMixed={selected.some(Boolean) && !selected.every(Boolean)}
        onCheckedChange={(isChecked) => setSelected([isChecked, isChecked])}
      />
      {["작업 완료 알림", "새 댓글 알림"].map((label, index) => (
        <B.Checkbox
          key={label}
          label={label}
          isChecked={selected[index]}
          onCheckedChange={(isChecked) =>
            setSelected(
              selected.map((isSelected, i) =>
                i === index ? isChecked : isSelected,
              ),
            )
          }
        />
      ))}
      <B.Checkbox
        label="비활성 선택"
        isChecked={false}
        isDisabled
        onCheckedChange={() => {}}
      />
    </div>
  );
}
function RadioDemo() {
  const [value, setValue] = useState("weekly");
  return (
    <B.RadioGroup
      label="알림 주기"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "daily", label: "매일 받기" },
        { value: "weekly", label: "일주일에 한 번 받기" },
        { value: "none", label: "받지 않기" },
      ]}
    />
  );
}
function SwitchDemo() {
  const [isChecked, setIsChecked] = useState(true);
  return (
    <div className="gc-basic-demo">
      <B.Switch
        label="이메일 알림"
        isChecked={isChecked}
        onCheckedChange={setIsChecked}
      />
      <B.Typography variant="caption">
        현재 설정: {isChecked ? "켜짐" : "꺼짐"}
      </B.Typography>
      <B.Switch
        label="관리자가 제한한 설정"
        isChecked={false}
        isDisabled
        onCheckedChange={() => {}}
      />
    </div>
  );
}
function BadgeDemo() {
  return (
    <div className="gc-demo-row">
      <B.Badge>초안</B.Badge>
      <B.Badge tone="success">완료</B.Badge>
      <B.Badge tone="warning">검토 필요</B.Badge>
      <B.Badge tone="danger">오류</B.Badge>
    </div>
  );
}
function AlertDemo() {
  const [isVisible, setIsVisible] = useState(true);
  return (
    <div className="gc-basic-demo">
      {isVisible ? (
        <B.Alert
          title="변경사항을 저장했어요"
          tone="success"
          onDismiss={() => setIsVisible(false)}
        >
          다른 팀원도 새 내용을 확인할 수 있어요.
        </B.Alert>
      ) : (
        <B.Button variant="secondary" onClick={() => setIsVisible(true)}>
          알림 다시 표시
        </B.Button>
      )}
      <B.Alert title="연결을 확인해주세요" tone="danger">
        네트워크 연결이 끊어졌어요. 입력한 내용은 유지되어 있어요.
      </B.Alert>
    </div>
  );
}
function SkeletonDemo() {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="gc-basic-demo">
      <B.Button variant="secondary" onClick={() => setIsLoading(!isLoading)}>
        {isLoading ? "콘텐츠 표시" : "로딩 상태 표시"}
      </B.Button>
      <B.Card title="프로젝트 개요">
        {isLoading ? (
          <B.Stack>
            <B.Skeleton height={24} width="60%" />
            <B.Skeleton />
            <B.Skeleton width="80%" />
          </B.Stack>
        ) : (
          <B.Stack>
            <B.Typography variant="heading">새 프로젝트 준비</B.Typography>
            <B.Typography>
              기본 동작과 디자인이 준비된 컴포넌트를 확인하고 가져가세요.
            </B.Typography>
          </B.Stack>
        )}
      </B.Card>
    </div>
  );
}
function ProgressDemo() {
  const [value, setValue] = useState(35);
  return (
    <div className="gc-basic-demo">
      <B.Slider
        label="진행률 조절"
        value={value}
        onValueChange={setValue}
        valueText={`${value}%`}
      />
      <B.Progress label="얇게 · 8px" value={value} size="thin" />
      <B.Progress label="기본 · 14px" value={value} />
      <B.Progress
        label="두껍게 · 32px · 내부 숫자"
        value={value}
        size="thick"
      />
      <B.Divider />
      <B.Progress label="시작 전" value={0} size="thick" />
      <B.Progress label="낮은 진행률" value={5} size="thick" />
      <B.Progress label="완료" value={100} size="thick" />
      <B.Progress label="완료 시간을 계산하는 중" />
    </div>
  );
}
function ImageDemo() {
  const [hasError, setHasError] = useState(false);
  return (
    <div className="gc-basic-demo">
      <B.Image
        src={hasError ? "data:image/png;base64,invalid" : landscape}
        alt="녹색 산과 따뜻한 햇빛 일러스트"
      />
      <B.Button variant="secondary" onClick={() => setHasError(!hasError)}>
        {hasError ? "정상 이미지 표시" : "로드 실패 확인"}
      </B.Button>
    </div>
  );
}
function AvatarDemo() {
  return (
    <div className="gc-demo-row">
      <B.Avatar src={landscape} name="이민수" />
      <B.Avatar name="김수진" />
      <B.Avatar src="data:image/png;base64,invalid" name="박지훈" />
      <B.Avatar name="최서연" size={64} />
    </div>
  );
}
function CardDemo() {
  const [count, setCount] = useState(0);
  return (
    <B.Card
      title={<B.Link href="#card-details">공유 컴포넌트 정리</B.Link>}
      footer={
        <div className="gc-demo-row">
          <B.Button variant="secondary" onClick={() => setCount(count + 1)}>
            즐겨찾기 {count}
          </B.Button>
          <B.Badge>진행 중</B.Badge>
        </div>
      }
    >
      <p id="card-details">
        제목 링크와 즐겨찾기 버튼은 각각 독립적으로 동작합니다. 긴 한국어
        제목이나 설명도 카드 안에서 자연스럽게 줄바꿈됩니다.
      </p>
    </B.Card>
  );
}
function TableDemo() {
  return (
    <B.Table
      caption="프로젝트 목록"
      headers={["프로젝트", "담당자", "상태"]}
      rows={[
        [
          <B.Link href="#table-details">
            여러 프로젝트에서 함께 사용할 디자인 시스템
          </B.Link>,
          "김수진",
          <B.Badge tone="success">완료</B.Badge>,
        ],
        ["이미지 뷰어 개선", "이민수", <B.Badge>초안</B.Badge>],
      ]}
    />
  );
}
function PaginationDemo() {
  const [page, setPage] = useState(1);
  return (
    <div className="gc-basic-demo">
      <B.Table
        caption={`목록 ${page}페이지`}
        headers={["번호", "제목"]}
        rows={Array.from({ length: 3 }, (_, i) => [
          (page - 1) * 3 + i + 1,
          `컴포넌트 예제 ${(page - 1) * 3 + i + 1}`,
        ])}
      />
      <B.Pagination page={page} totalPages={5} onPageChange={setPage} />
    </div>
  );
}
function TypographyDemo() {
  return (
    <B.Stack>
      <B.Typography variant="title">좋은 기본값에서 시작하세요</B.Typography>
      <B.Typography variant="heading">
        동작은 유지하고 프로젝트 스타일에 맞추기
      </B.Typography>
      <B.Typography>
        글자 크기와 행간, 색상을 의미 기반 토큰으로 연결합니다. 긴 한국어
        문장에서도 읽기 편한 간격을 유지합니다.
      </B.Typography>
      <B.Typography variant="caption">보조 설명 · 2026년 10월</B.Typography>
    </B.Stack>
  );
}
function StackDemo() {
  const [isRow, setIsRow] = useState(false);
  return (
    <div className="gc-basic-demo">
      <B.Switch
        label="가로 배치"
        isChecked={isRow}
        onCheckedChange={setIsRow}
      />
      <B.Stack direction={isRow ? "row" : "column"}>
        {["첫 번째", "두 번째", "세 번째"].map((text) => (
          <div className="gc-demo-tile" key={text}>
            {text}
          </div>
        ))}
      </B.Stack>
    </div>
  );
}
function GridDemo() {
  const [width, setWidth] = useState(180);
  return (
    <div className="gc-basic-demo">
      <B.Slider
        label="최소 셀 너비"
        value={width}
        onValueChange={setWidth}
        min={120}
        max={300}
        valueText={`${width}px`}
      />
      <B.Grid minWidth={width}>
        {["버튼", "이미지 뷰어", "검색 필터", "파일 업로더"].map((text) => (
          <div className="gc-demo-tile" key={text}>
            {text}
          </div>
        ))}
      </B.Grid>
    </div>
  );
}
function DividerDemo() {
  return (
    <div>
      <B.Typography variant="heading">기본 정보</B.Typography>
      <B.Divider />
      <B.Typography>구분선은 문맥상 다른 내용 묶음을 나눕니다.</B.Typography>
    </div>
  );
}
type Spec = {
  id: string;
  name: string;
  summary: string;
  contracts: string[];
  states: string[];
  keyboard: string[];
  usage: string;
  Demo: ComponentType;
  category?: CatalogEntry["category"];
};
function entry(spec: Spec): CatalogEntry {
  return {
    ...spec,
    contracts: [
      "button",
      "link",
      "text-field",
      "stepper",
      "slider",
      "text-area",
      "checkbox",
      "radio-group",
      "switch",
      "pagination",
      "table",
    ].includes(spec.id)
      ? [
          ...spec.contracts,
          "외부 포커스 링이 잘리거나 인접 요소를 가리지 않도록 부모 배치에 --gc-focus-clearance(기본 6px) 이상의 안전 여백·간격을 확보합니다.",
        ]
      : spec.contracts,
    category: spec.category ?? "basic",
    files: [
      "src/components/basic/index.tsx",
      "src/styles/basic.css",
      "src/styles/tokens.css",
    ],
    dependencies: [
      "react (hooks, DOM rendering)",
      "lucide-react (Alert 닫기 아이콘; 다른 컴포넌트만 복사할 때 제거 가능)",
    ],
    migration: [
      "src/components/basic/index.tsx에서 필요한 export와 해당 타입을 복사하거나 전체 기본 컴포넌트 모듈을 가져옵니다.",
      "src/styles/basic.css의 해당 .gc-* 규칙과 tokens.css를 가져와 프로젝트 의미 토큰에 연결합니다.",
      "아래 사용 예제의 이벤트를 프로젝트 상태·서비스에 연결합니다. 데모 코드는 이식하지 않습니다.",
      "키보드, 긴 한국어, 비활성·오류 상태와 모바일 너비에서 동작 계약을 재확인합니다.",
    ],
  };
}
export const basicEntries: CatalogEntry[] = [
  entry({
    id: "button",
    name: "Button / IconButton",
    summary: "명확한 액션과 중복 실행을 막는 처리 상태",
    contracts: [
      '기본 type은 button이며 폼 제출은 type="submit"으로 지정합니다.',
      "isLoading은 버튼 비활성화·aria-busy·공간 유지를 함께 적용합니다.",
      "활성 Button·IconButton을 누르면 중심을 유지한 채 기본 96% 크기로 80ms ease-out 축소하고 놓으면 원래 크기로 돌아옵니다. 독립 scale 속성으로 배치용 transform을 유지하며 press 토큰으로 조정할 수 있습니다. 모션 감소 설정에서는 축소와 전환을 제거합니다.",
      "IconButton은 label로 접근 가능한 이름을 필수 제공하며 이벤트의 업무 처리는 호출부 책임입니다.",
      "size=default는 control-height(기본 40px·조밀한 밀도 34px)를 유지하고 일반·주요 터치 액션에 사용합니다. size=compact는 24px 정사각형에 16px 아이콘을 배치하며 토스트·조밀한 보조 액션에 사용합니다. 두 크기 모두 키보드 포커스와 ghost 동작을 유지합니다.",
      "IconButton은 control-height와 같은 정사각형입니다. appearance=ghost가 기본이며 호버·포커스에서만 표면을 표시합니다. filled는 Button variant의 기본·보조·위험 외형을 사용합니다.",
    ],
    states: [
      "기본",
      "보조",
      "위험",
      "ghost 아이콘",
      "filled 아이콘",
      "compact 24px 아이콘",
      "호버·포커스",
      "비활성",
      "처리 중",
    ],
    keyboard: ["Tab으로 포커스", "Enter·Space로 실행"],
    usage:
      '<Button isLoading={isSaving} onClick={save}>저장</Button>\n<IconButton label="즐겨찾기" onClick={toggleFavorite}><Star size={20} aria-hidden="true" /></IconButton>\n<IconButton label="닫기" size="compact" onClick={close}><X size={16} aria-hidden="true" /></IconButton>',
    Demo: ButtonDemo,
  }),
  entry({
    id: "link",
    name: "Link",
    summary: "브라우저의 기본 이동 동작을 유지하는 링크",
    contracts: [
      "실제 href 목적지를 제공합니다.",
      "새 탭·주소 복사·보조 클릭의 기본 브라우저 동작을 유지합니다.",
      "새 탭 링크는 호출부에서 target과 rel을 지정합니다.",
      "shouldLookLikeButton은 링크 의미와 브라우저 동작을 유지하면서 버튼 외형을 제공합니다.",
    ],
    states: ["기본", "호버", "포커스"],
    keyboard: ["Tab으로 포커스", "Enter로 이동"],
    usage: '<Link href="/projects">프로젝트 목록</Link>',
    Demo: LinkDemo,
  }),
  entry({
    id: "text-field",
    name: "TextField",
    summary: "레이블과 오류 설명이 연결된 한 줄 입력",
    contracts: [
      "label은 입력 id와 연결하며 placeholder를 레이블로 대체하지 않습니다.",
      "error가 있으면 aria-invalid와 오류 설명 연결을 적용합니다.",
      "readOnly는 선택·포커스 가능하고 disabled는 입력·포커스 불가입니다.",
      'type="number"는 브라우저 기본 증감 화살표를 숨기며 숫자 입력·키보드 ArrowUp/ArrowDown 동작은 유지합니다.',
      "Input은 같은 입력 스타일을 제공하는 하위 primitive입니다. FormField 등 외부에서 label·설명을 공급할 때 사용합니다.",
    ],
    states: [
      "기본",
      "입력",
      "숫자·기본 화살표 없음",
      "필수",
      "오류",
      "읽기 전용",
      "비활성",
    ],
    keyboard: ["Tab으로 입력 이동", "표준 텍스트 편집 단축키"],
    usage:
      '<TextField label="이름" value={name} onChange={e => setName(e.target.value)} error={nameError} />\n// FormField의 render prop 안에서는 <Input {...props} /> 사용',
    Demo: TextFieldDemo,
  }),
  entry({
    id: "stepper",
    name: "Stepper",
    summary: "줄이기·직접 입력·늘리기로 수량과 숫자를 조절합니다.",
    contracts: [
      "value/onValueChange 제어형. min은 기본 0, step은 기본 1이며 max로 상한을 지정합니다.",
      "기존 IconButton과 숫자 입력을 한 컨트롤로 조합. 최소·최대값에서는 해당 증감 버튼만 비활성화합니다.",
      "직접 입력은 Enter 또는 포커스 이동 시 확정하며 min 기준 step에 맞춘 뒤 범위 안으로 제한합니다. 빈 입력은 이전 값으로 복원합니다.",
      "소수 step의 부동소수점 오차를 정리합니다. step은 양수, value/min/max는 유효한 숫자로 전달합니다.",
      "label과 입력·설명을 연결하며 error는 aria-invalid로 안내. isReadOnly는 값 확인·선택 가능, isDisabled는 모든 조작 차단.",
      "입력의 기본 증감 화살표를 숨기고 양옆 버튼에 읽을 수 있는 이름을 제공합니다. 브랜드·밀도·다크 모드는 --gc-* 토큰을 따릅니다.",
    ],
    states: [
      "기본",
      "최소·최대",
      "직접 입력",
      "소수 단위",
      "읽기 전용",
      "비활성",
      "오류",
    ],
    keyboard: [
      "Tab: 줄이기·숫자 입력·늘리기 이동",
      "버튼 Enter/Space: 증감",
      "입력 ArrowUp/ArrowDown: 증감",
      "Home/End: 최소·최대값(상한이 있을 때)",
      "Enter: 입력 확정",
    ],
    usage:
      '<Stepper label="수량" value={quantity} onValueChange={setQuantity} min={0} max={10} />\n<Stepper label="간격" value={amount} onValueChange={setAmount} step={0.1} max={2} />',
    Demo: StepperDemo,
  }),
  entry({
    id: "slider",
    name: "Slider",
    summary: "범위 안의 숫자를 트랙과 키보드로 연속 조절합니다.",
    contracts: [
      "value/onValueChange 제어형. min=0, max=100, step=1이 기본이며 숫자 범위를 명시할 수 있습니다.",
      "label과 native range 입력을 연결하며 valueText를 보이는 현재 값과 aria-valuetext에 사용합니다.",
      "isDisabled는 포커스와 조작을 차단. description·error는 입력과 연결합니다.",
      "트랙·thumb·선택 구간은 --gc-* 토큰을 사용해 Blue·Forest·다크·밀도에 대응합니다.",
    ],
    states: [
      "기본",
      "최소·최대",
      "사용자 지정 범위·단위",
      "비활성",
      "키보드 포커스",
    ],
    keyboard: [
      "Tab: 포커스",
      "방향키: step 단위 증감",
      "Home/End: 최소·최대",
      "PageUp/PageDown: 브라우저 기본 범위 이동",
    ],
    usage:
      '<Slider label="볼륨" value={volume} onValueChange={setVolume} valueText={`${volume}%`} />',
    Demo: SliderDemo,
  }),
  entry({
    id: "text-area",
    name: "TextArea",
    summary: "높이 확장과 글자 수 표시를 지원하는 여러 줄 입력",
    contracts: [
      "Enter는 줄바꿈합니다.",
      "shouldAutoSize는 90~240px 범위에서 내용 높이에 따라 확장합니다.",
      "maxLength는 네이티브 입력 제한과 글자 수 표시를 제공합니다.",
    ],
    states: ["빈 입력", "여러 줄", "글자 수 제한", "오류", "비활성"],
    keyboard: ["Enter로 줄바꿈", "Tab으로 다음 입력"],
    usage:
      '<TextArea label="설명" value={description} onChange={e => setDescription(e.target.value)} shouldAutoSize maxLength={300} />',
    Demo: TextAreaDemo,
  }),
  entry({
    id: "checkbox",
    name: "Checkbox",
    summary: "독립 선택과 전체 선택의 혼합 상태",
    contracts: [
      "shouldHideLabel은 보이는 라벨만 숨기고 접근 가능한 이름을 유지합니다. 표의 선택 칸에도 같은 Checkbox를 사용합니다.",
      "label 클릭으로 값을 토글합니다.",
      "isMixed는 indeterminate로 전체 선택의 일부 선택 상태를 표현합니다. 20px 둥근 사각형에 체크 또는 혼합 마이너스를 표시합니다.",
      "네이티브 input 의미를 유지하며 고대비 환경에서는 브라우저 기본 외형으로 전환합니다.",
      "선택값은 호출부가 보유하며 onCheckedChange로 변경 요청을 전달합니다.",
    ],
    states: ["미선택", "선택", "혼합", "비활성"],
    keyboard: ["Tab으로 이동", "Space로 토글"],
    usage:
      '<Checkbox label="전체 선택" isChecked={isAllSelected} isMixed={hasPartialSelection} onCheckedChange={selectAll} />',
    Demo: CheckboxDemo,
  }),
  entry({
    id: "radio-group",
    name: "RadioGroup",
    summary: "한 그룹에서 하나를 고르는 단일 선택",
    contracts: [
      "fieldset·legend로 선택 그룹을 설명합니다.",
      "공유된 고유 name으로 하나만 선택합니다. 20px 원형·2px 테두리와 선택점으로 표시하며 네이티브 방향키 동작을 유지합니다.",
      "옵션과 값은 호출부에서 전달합니다.",
    ],
    states: ["미선택", "선택", "그룹 비활성"],
    keyboard: ["Tab으로 그룹 이동", "방향키로 선택 이동", "Space로 선택"],
    usage:
      '<RadioGroup label="주기" value={period} options={periodOptions} onValueChange={setPeriod} />',
    Demo: RadioDemo,
  }),
  entry({
    id: "switch",
    name: "Switch",
    summary: "레이블이 유지되는 설정 켜짐·꺼짐",
    contracts: [
      "상태가 바뀌어도 label은 유지합니다.",
      'role="switch"와 checked로 설정 상태를 전달합니다.',
      "저장·실패·처리 중 상태는 호출부에서 전달하며 즉시 저장을 추측하지 않습니다.",
    ],
    states: ["켜짐", "꺼짐", "비활성"],
    keyboard: ["Tab으로 이동", "Space로 토글"],
    usage:
      '<Switch label="이메일 알림" isChecked={isEnabled} onCheckedChange={setIsEnabled} />',
    Demo: SwitchDemo,
  }),
  entry({
    id: "badge",
    name: "Badge",
    summary: "색상과 텍스트로 전달하는 상태 표시",
    contracts: [
      "비인터랙션 요소이며 클릭 동작을 갖지 않습니다.",
      "색상만으로 의미를 전달하지 않고 상태 텍스트를 제공합니다.",
    ],
    states: ["중립", "성공", "위험", "주의"],
    keyboard: ["포커스 대상 아님"],
    usage: '<Badge tone="success">완료</Badge>',
    Demo: BadgeDemo,
  }),
  entry({
    id: "alert",
    name: "Alert",
    summary: "문맥에 유지되는 안내와 오류",
    contracts: [
      "제목과 설명을 함께 표시하며 자동으로 사라지지 않습니다.",
      "onDismiss를 제공한 경우만 muted X ghost 아이콘 버튼이 생깁니다. 호버·포커스에서 표면을 표시합니다.",
      "위험은 alert, 다른 상태는 status로 전달합니다.",
    ],
    states: ["안내", "성공", "주의", "오류", "닫기 가능"],
    keyboard: ["내부 액션·닫기 버튼은 Tab·Enter·Space"],
    usage:
      '<Alert title="저장 실패" tone="danger">입력 내용은 유지했어요.</Alert>',
    Demo: AlertDemo,
  }),
  entry({
    id: "skeleton",
    name: "Skeleton",
    summary: "최종 콘텐츠 영역을 유지하는 로딩 표현",
    contracts: [
      "width·height로 콘텐츠 공간을 예약합니다.",
      "장식적 로딩 표현은 보조 기술에서 제외합니다.",
      "모션 감소 설정에서는 애니메이션을 멈춥니다.",
    ],
    states: ["로딩", "콘텐츠 전환"],
    keyboard: ["포커스 대상 아님"],
    usage: '<Skeleton width="60%" height={24} />',
    Demo: SkeletonDemo,
  }),
  entry({
    id: "progress",
    name: "Progress",
    summary: "확정·불확정 진행 상태",
    contracts: [
      "유한한 value는 0~100으로 제한하여 role=progressbar와 aria-valuenow로 실제 진행률을 전달합니다.",
      "value 생략 또는 비유한 값은 불확정 진행이며 aria-valuenow를 생략하고 처리 중으로 안내합니다.",
      "size=thin은 8px, regular(기본)은 14px, thick은 32px입니다. track은 테두리 없는 토큰 기반 디자인입니다.",
      "thick 숫자는 실제 채움 영역 가운데에 표시합니다. 실제 글자 너비와 토큰 여백이 채움 안에 들어가지 않으면 채움 오른쪽에 표시하고, 오른쪽 공간도 부족하면 바 아래로 내려 읽을 수 있게 합니다. 고정 퍼센트 기준은 사용하지 않습니다. 다른 크기는 숫자를 label 옆에 표시합니다.",
      "크기·폰트·테마 변경 시 위치를 다시 측정하며 채움과 숫자는 즉시 함께 이동합니다. 모션 감소 설정에서는 불확정 애니메이션을 멈춥니다.",
      "label로 진행 작업의 이름을 제공합니다.",
    ],
    states: [
      "thin 8px",
      "regular 14px",
      "thick 32px",
      "0%",
      "5%",
      "35%",
      "100%",
      "불확정",
      "모션 감소",
    ],
    keyboard: ["포커스 대상 아님"],
    usage:
      '<Progress label="파일 처리" value={progress} size="thick" />\n<Progress label="처리 중" size="thin" />',
    Demo: ProgressDemo,
  }),
  entry({
    id: "image",
    name: "Image",
    summary: "이미지 비율 유지와 로딩 실패 처리",
    contracts: [
      "aspectRatio로 로딩 전후 영역을 유지합니다.",
      "실패 시 대체 메시지를 표시하고 src 변경 시 상태를 초기화합니다.",
      "용도에 맞는 alt를 필수 전달하며 장식 이미지에는 빈 문자열을 사용합니다.",
    ],
    states: ["로딩", "로드 완료", "로드 실패"],
    keyboard: ["포커스 대상 아님"],
    usage:
      '<Image src={photo.url} alt={photo.description} aspectRatio="4 / 3" />',
    Demo: ImageDemo,
  }),
  entry({
    id: "avatar",
    name: "Avatar",
    summary: "프로필 이미지와 이름 fallback",
    contracts: [
      "이미지 없음·실패 시 이름 앞 두 글자를 표시합니다.",
      "이름을 접근 가능한 대체 텍스트로 제공합니다.",
      "size 변경 시에도 원형 영역을 유지합니다.",
    ],
    states: ["사진", "사진 없음", "실패", "크기 변경"],
    keyboard: ["포커스 대상 아님"],
    usage: "<Avatar name={user.name} src={user.photoUrl} size={44} />",
    Demo: AvatarDemo,
  }),
  entry({
    id: "card",
    name: "Card",
    summary: "헤더·본문·푸터를 갖춘 콘텐츠 묶음",
    contracts: [
      "카드 자체를 클릭 가능한 요소로 만들지 않습니다.",
      "제목 링크와 내부 액션은 별도 포커스·이벤트 대상으로 구성합니다.",
      "긴 콘텐츠는 영역 안에서 줄바꿈합니다.",
    ],
    states: ["본문", "헤더·푸터 포함", "내부 액션"],
    keyboard: ["내부 링크·버튼의 기본 조작"],
    usage:
      '<Card title="프로젝트" footer={<Button onClick={save}>저장</Button>}>설명</Card>',
    Demo: CardDemo,
  }),
  entry({
    id: "table",
    name: "Table",
    summary: "의미 구조와 좁은 화면 스크롤을 갖춘 표",
    contracts: [
      'caption·thead·scope="col"을 제공합니다.',
      "정렬·선택·조회는 추측하지 않으며 전달된 헤더·행만 표시합니다.",
      "좁은 화면에서는 가로 스크롤하며 스크롤 영역에 이름과 키보드 포커스를 제공합니다.",
    ],
    states: ["표 데이터", "긴 셀", "가로 스크롤"],
    keyboard: [
      "Tab으로 스크롤 영역 이동",
      "방향키로 스크롤",
      "내부 링크·버튼 조작",
    ],
    usage:
      '<Table caption="프로젝트" headers={["이름", "상태"]} rows={projectRows} />',
    Demo: TableDemo,
  }),
  entry({
    id: "pagination",
    name: "Pagination",
    summary: "경계와 처리 상태를 지키는 페이지 탐색",
    contracts: [
      "처음·이전·다음·마지막을 제공하며 경계를 넘는 이동을 차단합니다.",
      "페이지 상태는 외부 소유이며 onPageChange는 요청만 전달합니다.",
      "isLoading 중 탐색을 차단하며 조회 성공 전 페이지 확정은 호출부 책임입니다.",
    ],
    states: ["처음", "중간", "마지막", "처리 중"],
    keyboard: ["Tab으로 버튼 이동", "Enter·Space로 페이지 요청"],
    usage:
      "<Pagination page={page} totalPages={totalPages} onPageChange={loadPage} isLoading={isLoading} />",
    Demo: PaginationDemo,
  }),
  entry({
    id: "typography",
    name: "Typography",
    category: "foundation",
    summary: "일관된 제목·본문·보조 설명 계층",
    contracts: [
      "title은 h2, heading은 h3, body·caption은 p로 표시합니다.",
      "의미 토큰으로 글자 크기·행간·색상을 연결합니다.",
      "프로젝트 문서 구조에 맞는 제목 단계가 필요하면 마크업을 조정합니다.",
    ],
    states: ["제목", "소제목", "본문", "보조"],
    keyboard: ["정적 텍스트"],
    usage: '<Typography variant="heading">프로젝트 개요</Typography>',
    Demo: TypographyDemo,
  }),
  entry({
    id: "stack",
    name: "Stack",
    category: "foundation",
    summary: "간격과 방향을 명시하는 흐름 배치",
    contracts: [
      '기본은 세로 배치이며 direction="row"는 가로 배치입니다.',
      "가로 배치에서 공간이 부족하면 줄바꿈합니다.",
      "gap은 이식 시 프로젝트 간격 토큰에 맞춰 전달합니다.",
    ],
    states: ["세로", "가로", "줄바꿈"],
    keyboard: ["내부 요소의 DOM 순서를 유지"],
    usage: '<Stack direction="row" gap={16}>{actions}</Stack>',
    Demo: StackDemo,
  }),
  entry({
    id: "grid",
    name: "Grid",
    category: "foundation",
    summary: "최소 셀 너비에 따라 자동 조정되는 그리드",
    contracts: [
      "minWidth 기준으로 가능한 열 수를 자동 계산합니다.",
      "화면이 더 좁으면 셀은 컨테이너 폭에 맞춰 줄어듭니다.",
      "내부 요소 순서를 바꾸지 않습니다.",
    ],
    states: ["다중 열", "단일 열"],
    keyboard: ["내부 요소의 DOM 순서를 유지"],
    usage: "<Grid minWidth={180}>{cards}</Grid>",
    Demo: GridDemo,
  }),
  entry({
    id: "divider",
    name: "Divider",
    category: "foundation",
    summary: "내용 묶음 사이의 의미 있는 구분선",
    contracts: [
      "hr 의미를 유지하며 문맥상 섹션 구분에 사용합니다.",
      "border·여백은 프로젝트 토큰으로 연결합니다.",
    ],
    states: ["기본"],
    keyboard: ["포커스 대상 아님"],
    usage: "<Divider />",
    Demo: DividerDemo,
  }),
];
