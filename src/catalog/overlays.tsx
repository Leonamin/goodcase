import { toastEntry } from "./toast";
import { tabsEntry } from "./tabs";
import { useState } from "react";
import { Info } from "lucide-react";
import {
  Button,
  Checkbox,
  IconButton,
  Switch,
  TextField,
} from "../components/basic";
import type { CatalogEntry } from "./types";
import {
  Select,
  Combobox,
  Menu,
  Popover,
  Tooltip,
  Dialog,
  DialogClose,
  Drawer,
  Accordion,
} from "../components/overlays";
const options = [
  { value: "seoul", label: "서울" },
  { value: "busan", label: "부산" },
  { value: "jeju", label: "제주 — 긴 옵션 이름도 자연스럽게 표시합니다" },
  { value: "later", label: "준비 중인 지역", isDisabled: true },
];
function SelectDemo() {
  const [value, setValue] = useState("seoul");
  return (
    <div className="gc-overlay-demo-column">
      <Select
        label="방문 지역"
        options={options}
        value={value}
        onValueChange={setValue}
      />
      <Select
        label="비활성 선택"
        options={options}
        value="busan"
        onValueChange={() => {}}
        isDisabled
      />
      <p className="gc-overlay-result">
        확정한 값: {value}. 목록에서 방향키로 이동한 뒤 Escape를 눌러
        취소해보세요.
      </p>
    </div>
  );
}
function ComboboxDemo() {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="gc-overlay-demo-column">
      <Combobox
        label="지역 검색"
        value={value}
        onValueChange={setValue}
        options={options}
        isLoading={isLoading}
      />
      <Checkbox
        label="로딩 상태 보기 (로컬 예제)"
        isChecked={isLoading}
        onCheckedChange={(isChecked) => setIsLoading(isChecked)}
      />
      <p className="gc-overlay-result">
        선택값: {value || "없음"}. 검색어는 선택값에 저장되지 않습니다.
      </p>
    </div>
  );
}
function MenuDemo() {
  const [result, setResult] = useState("명령을 선택하세요.");
  return (
    <div className="gc-overlay-demo-column">
      <div>
        <Menu
          trigger={<Button>문서 작업 ···</Button>}
          items={[
            {
              label: "수정",
              onSelect: () => setResult("수정 명령을 실행했습니다."),
            },
            {
              label: "복제",
              onSelect: () => setResult("복제 명령을 실행했습니다."),
            },
            { label: "내보내기 준비 중", isDisabled: true, onSelect: () => {} },
            {
              label: "삭제",
              isDangerous: true,
              onSelect: () =>
                setResult("삭제 요청 예제입니다. 실제 데이터는 없습니다."),
            },
          ]}
        />
      </div>
      <p className="gc-overlay-result" role="status">
        {result}
      </p>
    </div>
  );
}
function PopoverDemo() {
  const [isCompact, setIsCompact] = useState(false);
  return (
    <Popover label="표시 설정" trigger={<Button>표시 설정</Button>}>
      <strong>표시 설정</strong>
      <p className="gc-overlay-note">작은 패널 안에서 설정을 바꿉니다.</p>
      <Checkbox
        label="조밀하게 표시"
        isChecked={isCompact}
        onCheckedChange={(isChecked) => setIsCompact(isChecked)}
      />
    </Popover>
  );
}
function TooltipDemo() {
  return (
    <div className="gc-overlay-demo">
      <Tooltip content="활동한 구성원만 포함한 수치입니다.">
        <IconButton label="활성 구성원 안내">
          <Info size={20} aria-hidden="true" />
        </IconButton>
      </Tooltip>
      <p className="gc-overlay-note">
        마우스를 올리거나 Tab으로 포커스를 주세요. 보조 설명만 들어갑니다.
      </p>
    </div>
  );
}
function DialogDemo() {
  const [name, setName] = useState("좋은 예제");
  const [region, setRegion] = useState("seoul");
  return (
    <Dialog
      trigger={<Button>프로필 편집</Button>}
      title="프로필 편집"
      description="이 예제의 입력값은 서버로 저장되지 않습니다."
      footer={
        <DialogClose>
          <Button>완료</Button>
        </DialogClose>
      }
    >
      <div className="gc-dialog-example">
        <TextField
          label="표시 이름"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Combobox
          label="방문 지역 검색"
          value={region}
          onValueChange={setRegion}
          options={options}
        />
        <div className="gc-row">
          <Button variant="secondary" onClick={() => setName("좋은 예제")}>
            이름 초기화
          </Button>
          <Button variant="secondary" disabled>
            비활성 액션
          </Button>
        </div>
        <p className="gc-overlay-note">
          Tab으로 포커스 링과 요소 사이 여백을 확인하세요. Escape 또는 배경을
          눌러 닫을 수 있습니다.
        </p>
      </div>
    </Dialog>
  );
}
function DrawerDemo() {
  return (
    <Drawer
      trigger={<Button>상세 정보 보기</Button>}
      title="프로젝트 상세"
      description="데스크톱에서는 오른쪽, 모바일에서는 아래에서 열립니다."
      footer={
        <DialogClose>
          <Button>확인</Button>
        </DialogClose>
      }
    >
      <div className="gc-overlay-demo-column">
        {Array.from({ length: 8 }, (_, index) => (
          <p key={index} className="gc-overlay-note">
            상세 항목 {index + 1} · 본문이 길어져도 내용만 스크롤되고 주요
            액션은 아래에 남습니다.
          </p>
        ))}
      </div>
    </Drawer>
  );
}
function AccordionDemo() {
  const [hasAnimation, setHasAnimation] = useState(true);
  return (
    <div className="gc-overlay-demo-column">
      <Switch
        label="애니메이션 사용"
        isChecked={hasAnimation}
        onCheckedChange={setHasAnimation}
      />
      <Accordion
        hasAnimation={hasAnimation}
        items={[
          {
            value: "one",
            title: "여러 항목을 동시에 열 수 있나요?",
            content: "네. 첫 버전은 여러 항목을 동시에 열고 닫을 수 있습니다.",
          },
          {
            value: "two",
            title: "내용에 링크나 버튼을 넣을 수 있나요?",
            content: (
              <>
                <p>접힌 항목의 내부 버튼은 Tab으로 접근되지 않습니다.</p>
                <Button>내부 액션 예제</Button>
              </>
            ),
          },
          {
            value: "three",
            title: "비활성 항목",
            isDisabled: true,
            content: "열 수 없습니다.",
          },
        ]}
      />
    </div>
  );
}
type Spec = Pick<
  CatalogEntry,
  | "id"
  | "name"
  | "summary"
  | "contracts"
  | "states"
  | "keyboard"
  | "usage"
  | "Demo"
>;

function entry(spec: Spec): CatalogEntry {
  const implementationName = spec.id === "drawer" ? "dialog" : spec.id;
  const implementationFile = `src/components/overlays/${implementationName}.tsx`;
  return {
    ...spec,
    category: "basic",
    contracts: ["select", "combobox", "menu", "popover", "tooltip"].includes(
      spec.id,
    )
      ? [
          ...spec.contracts,
          "Trigger 주변과 overflow 컨테이너 안쪽에 --gc-focus-clearance(기본 6px) 이상의 포커스 안전 여백을 확보합니다.",
        ]
      : spec.contracts,
    files: [
      implementationFile,
      "src/styles/overlays.css",
      "src/styles/tokens.css",
    ],
    dependencies: [
      "react",
      "react-dom",
      "radix-ui",
      ...(["menu", "tooltip"].includes(spec.id) ? [] : ["lucide-react"]),
    ],
    migration: [
      `${implementationFile}와 상대 import로 연결된 공용 컴포넌트·타입을 함께 복사합니다.`,
      "필요한 외부 패키지는 포함 파일의 import와 의존성 목록을 확인해 설치합니다.",
      "src/styles/overlays.css와 tokens.css를 가져오고 --gc-* 토큰을 프로젝트 토큰에 연결합니다.",
      "상태와 이벤트를 프로젝트 데이터에 연결하고, 키보드·닫기·실패 계약을 이식 뒤 확인합니다.",
    ],
  };
}
export const overlayEntries: CatalogEntry[] = [
  entry({
    id: "select",
    name: "Select",
    summary: "정해진 목록에서 한 값을 확정합니다.",
    contracts: [
      "value와 onValueChange로 선택값을 외부에서 관리",
      "방향키 탐색은 선택 확정과 분리, Enter·클릭으로 확정",
      "Escape는 탐색을 취소하고 호출 요소로 포커스 복귀",
      "비활성 옵션은 선택하지 않음",
    ],
    states: ["기본", "선택", "placeholder", "비활성", "비활성 옵션", "긴 옵션"],
    keyboard: [
      "Space/Enter: 열기·확정",
      "방향키: 옵션 탐색",
      "문자: 옵션 탐색",
      "Escape: 취소",
    ],
    usage:
      'import { Select } from "./components/overlays/select";\n\n<Select label="지역" value={region} onValueChange={setRegion} options={options} />',
    Demo: SelectDemo,
  }),
  entry({
    id: "combobox",
    name: "Combobox",
    summary: "검색어와 확정한 선택값을 분리합니다.",
    contracts: [
      "자유 입력을 값으로 저장하지 않음",
      "선택값과 검색어를 별도 관리, 취소하면 기존 선택 표시",
      "한글 IME 조합 중 Enter를 선택으로 처리하지 않음",
      "로딩 중 확정 차단, 결과 없음과 비활성 옵션 지원",
      "options가 교체되거나 검색 결과가 바뀌면 현재 활성 옵션을 유효한 결과에 맞춥니다. 결과가 없으면 aria-activedescendant를 생략합니다.",
    ],
    states: ["미선택", "검색", "선택", "로딩", "결과 없음", "비활성 옵션"],
    keyboard: [
      "방향키: 결과 탐색",
      "Enter: 결과 확정",
      "Escape: 취소",
      "Tab: 다음 요소",
    ],
    usage:
      'import { Combobox } from "./components/overlays/combobox";\n\n<Combobox label="지역" value={region} onValueChange={setRegion} options={options} isLoading={isLoading} />',
    Demo: ComboboxDemo,
  }),
  entry({
    id: "menu",
    name: "Menu",
    summary: "선택값을 유지하지 않는 명령 목록입니다.",
    contracts: [
      "명령 실행 후 닫기",
      "닫으면 호출 버튼으로 포커스 복귀",
      "비활성·위험한 명령 구분",
      "trigger는 실제 버튼 요소 사용",
    ],
    states: ["기본", "강조", "비활성", "위험 명령"],
    keyboard: ["Enter/Space: 열기·실행", "방향키: 항목 이동", "Escape: 닫기"],
    usage:
      'import { Menu } from "./components/overlays/menu";\nimport { Button } from "./components/basic/button";\n\n<Menu trigger={<Button>작업</Button>} items={[{label:"수정",onSelect:edit}]} />',
    Demo: MenuDemo,
  }),
  entry({
    id: "popover",
    name: "Popover",
    summary: "버튼에 연결된 작은 설정·정보 패널입니다.",
    contracts: [
      "버튼 클릭으로 열고 닫기",
      "바깥 클릭·Escape 닫기",
      "화면 가장자리에 맞춰 위치 조정",
      "닫으면 호출 요소로 포커스 복귀",
    ],
    states: ["닫힘", "열림", "설정 변경"],
    keyboard: ["Enter/Space: 열기", "Tab: 패널 요소 탐색", "Escape: 닫기"],
    usage:
      'import { Popover } from "./components/overlays/popover";\nimport { Button } from "./components/basic/button";\n\n<Popover label="설정" trigger={<Button>설정</Button>}>{content}</Popover>',
    Demo: PopoverDemo,
  }),
  entry({
    id: "tooltip",
    name: "Tooltip",
    summary: "짧은 보조 설명을 호버와 포커스로 제공합니다.",
    contracts: [
      "content는 문자열만 지원하여 내부 액션 금지",
      "필수 설명은 Tooltip에만 숨기지 않음",
      "포커스를 이동시키지 않음",
      "Trigger는 자식 요소를 재사용합니다. 아이콘 안내 예제는 실제 button인 ghost IconButton을 사용합니다.",
    ],
    states: ["호버", "키보드 포커스", "닫힘"],
    keyboard: ["Tab: 설명 표시", "Escape: 닫기"],
    usage:
      'import { Tooltip } from "./components/overlays/tooltip";\nimport { IconButton } from "./components/basic/button";\n\n<Tooltip content="추가 설명"><IconButton label="도움말"><Info size={20} aria-hidden="true" /></IconButton></Tooltip>',
    Demo: TooltipDemo,
  }),
  entry({
    id: "dialog",
    name: "Dialog",
    summary: "배경을 차단하고 하나의 작업에 집중합니다.",
    contracts: [
      "제목과 접근 가능한 닫기 버튼 제공",
      "포커스는 내부에 유지, 닫으면 호출 요소로 복귀",
      "내부 검색 선택창을 닫는 동안에도 Tab/Shift+Tab은 처음·마지막 요소 사이에서 즉시 순환. 비활성·숨김·inert 요소는 제외하고 포털로 열린 하위 패널은 자체 키보드 탐색 유지",
      "본문은 포커스 링용 안전 여백을 갖고 자식 사이 간격을 제공합니다. 내부 폼 그룹에도 --gc-focus-clearance 이상의 패딩과 간격을 두며 overflow로 링을 자르지 않습니다.",
      "기본은 Escape·바깥 클릭 닫기",
      "shouldCloseOnOutsideClick, shouldCloseOnEscape로 닫기 규칙 지정",
      "initialFocusRef로 처음 포커스를 지정, isOpen/onOpenChange로 제어",
    ],
    states: ["닫힘", "열림", "긴 본문", "폼 입력"],
    keyboard: ["Tab/Shift+Tab: 모달 내부 이동", "Escape: 닫기"],
    usage:
      'import { Dialog } from "./components/overlays/dialog";\nimport { Button } from "./components/basic/button";\n\n<Dialog trigger={<Button>열기</Button>} title="제목" description="설명" footer={actions}>{content}</Dialog>',
    Demo: DialogDemo,
  }),
  entry({
    id: "drawer",
    name: "Drawer / Sheet",
    summary: "긴 상세·보조 작업을 화면 가장자리에 표시합니다.",
    contracts: [
      "Dialog와 같은 모달 포커스 계약",
      "데스크톱 측면·모바일 하단 배치",
      "본문만 스크롤, footer 액션 유지",
    ],
    states: ["닫힘", "열림", "긴 본문", "모바일 하단"],
    keyboard: ["Tab: 내부 이동", "Escape: 닫기"],
    usage:
      'import { Drawer } from "./components/overlays/dialog";\nimport { Button } from "./components/basic/button";\n\n<Drawer trigger={<Button>상세</Button>} title="상세" footer={actions}>{content}</Drawer>',
    Demo: DrawerDemo,
  }),
  tabsEntry,
  entry({
    id: "accordion",
    name: "Accordion",
    summary: "여러 설명 영역을 독립적으로 열고 닫습니다.",
    contracts: [
      "기본은 여러 항목 동시 열기",
      "제목은 실제 버튼",
      "접힌 내부 요소는 탐색에서 제외",
      "비활성 항목 지원",
      "hasAnimation은 기본 true. 높이와 투명도를 240ms로 전환하고 false는 즉시 열고 닫기. prefers-reduced-motion에서는 애니메이션 제거",
    ],
    states: [
      "열림",
      "닫힘",
      "여러 항목 열림",
      "비활성",
      "애니메이션 켜기·끄기",
      "모션 감소",
    ],
    keyboard: ["Enter/Space: 열고 닫기", "방향키/Home/End: 제목 이동"],
    usage:
      'import { Accordion } from "./components/overlays/accordion";\n\n<Accordion items={[{value:"faq",title:"질문",content:"답변"}]} hasAnimation />\n<Accordion items={items} hasAnimation={false} />',
    Demo: AccordionDemo,
  }),
  toastEntry,
];
