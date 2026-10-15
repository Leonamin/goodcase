import { useState } from "react";
import { Button } from "../components/basic";
import { Select } from "../components/overlays";
import {
  ToastProvider,
  ToastPreview,
  useToast,
  type ToastMessage,
} from "../components/overlays/toast";
import type { CatalogEntry } from "./types";
function ToastDemoContent({
  layout,
  stackSize,
  direction,
  onLayoutChange,
  onStackSizeChange,
  onDirectionChange,
}: {
  layout: "list" | "stack";
  stackSize: number;
  direction: "up" | "down";
  onLayoutChange: (value: "list" | "stack") => void;
  onStackSizeChange: (value: number) => void;
  onDirectionChange: (value: "up" | "down") => void;
}) {
  const { notify } = useToast();
  const [timer, setTimer] = useState<"bar" | "circle" | "none">("bar");
  const [appearance, setAppearance] = useState<"surface" | "tinted" | "solid">(
    "surface",
  );
  const [durationMs, setDurationMs] = useState(5000);
  const common = { timer, appearance, durationMs };
  const previewCommon = { timer, appearance };
  return (
    <div className="gc-toast-demo">
      <div className="gc-toast-demo-controls">
        <Select
          label="알림 배치"
          value={layout}
          onValueChange={(next) => onLayoutChange(next as "list" | "stack")}
          options={[
            { value: "list", label: "목록" },
            { value: "stack", label: "겹침 스택" },
          ]}
        />
        <Select
          label="스택 표시 개수"
          value={String(stackSize)}
          onValueChange={(next) => onStackSizeChange(Number(next))}
          options={[2, 3, 5].map((value) => ({
            value: String(value),
            label: `${value}개`,
          }))}
        />
        <Select
          label="진입 방향"
          value={direction}
          onValueChange={(next) => onDirectionChange(next as "up" | "down")}
          options={[
            { value: "up", label: "아래에서 위 · 화면 하단" },
            { value: "down", label: "위에서 아래 · 화면 상단" },
          ]}
        />
        <Select
          label="타이머 표현"
          value={timer}
          onValueChange={(next) => setTimer(next as typeof timer)}
          options={[
            { value: "bar", label: "하단 바" },
            { value: "circle", label: "닫기 버튼 원형" },
            { value: "none", label: "표현 없음" },
          ]}
        />
        <Select
          label="알림 배경"
          value={appearance}
          onValueChange={(next) => setAppearance(next as typeof appearance)}
          options={[
            { value: "surface", label: "테마 표면 · 기본" },
            { value: "tinted", label: "옅은 상태색" },
            { value: "solid", label: "진한 상태색" },
          ]}
        />
        <Select
          label="자동 닫힘 시간"
          value={String(durationMs)}
          onValueChange={(next) => setDurationMs(Number(next))}
          options={[
            { value: "5000", label: "5초 · 기본" },
            { value: "1500", label: "1.5초 · 빠른 확인" },
            { value: "10000", label: "10초" },
          ]}
        />
      </div>
      <div className="gc-actions">
        <Button
          variant="secondary"
          onClick={() => {
            for (let index = 1; index <= stackSize + 2; index++)
              notify({
                ...common,
                title: `묶음 알림 ${index}`,
                description:
                  index % 2
                    ? "서로 다른 높이의 알림을 확인합니다."
                    : "이 알림은 설명이 더 길고 여러 줄로 이어집니다. 각각의 타이머가 독립적으로 작동하며 포인터를 올린 카드만 일시정지합니다. 화면 너비가 좁아도 내용이 잘리지 않습니다.",
              });
          }}
        >
          여러 알림 띄우기
        </Button>
        <Button
          onClick={() =>
            notify({
              ...common,
              tone: "success",
              title: "저장했습니다",
              description: "입력한 변경사항을 저장했습니다.",
            })
          }
        >
          성공 알림
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            notify({
              ...common,
              tone: "info",
              title: "새 업데이트가 있습니다",
              description:
                "해당 카드의 호버·포커스 또는 탭 숨김 시 남은 시간이 멈춥니다.",
            })
          }
        >
          정보 알림
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            notify({
              ...common,
              tone: "warning",
              title: "저장 공간을 확인해주세요",
              description: "남은 용량이 줄어들고 있습니다.",
            })
          }
        >
          경고 알림
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            notify({
              timer,
              appearance,
              tone: "error",
              title: "저장하지 못했습니다",
              description: "오류 알림은 직접 닫을 때까지 유지됩니다.",
            })
          }
        >
          오류 알림
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            notify({
              timer,
              appearance,
              tone: "info",
              title: "항목을 보관했습니다",
              description: "행동이 필요한 알림은 자동으로 닫히지 않습니다.",
              action: {
                label: "실행 취소",
                onClick: () =>
                  notify({
                    ...common,
                    tone: "success",
                    title: "보관을 취소했습니다",
                  }),
              },
            })
          }
        >
          액션 알림
        </Button>
      </div>
      <p className="gc-muted">
        아래는 정적 디자인 예시이며 닫기 버튼은 비활성화되어 있습니다. 위
        버튼으로 실제 알림을 띄워 확인하세요. 원형 타이머는 호버·포커스하면 닫기
        아이콘이 나타납니다. F8로 알림 목록에 이동하고 Escape로 닫을 수
        있습니다.
      </p>
      <div className="gc-toast-specimens">
        {(["info", "success", "warning", "error"] as const).map((tone) => (
          <ToastPreview
            key={tone}
            message={{
              ...previewCommon,
              tone,
              title:
                tone === "error"
                  ? "작업을 완료하지 못했습니다"
                  : tone === "success"
                    ? "변경사항을 저장했습니다"
                    : tone === "warning"
                      ? "한 번 더 확인해주세요"
                      : "긴 제목이 여러 줄로 이어져도 아이콘과 닫기 버튼은 첫 줄에 맞춰 정렬됩니다",
              description:
                "제목 아래에 설명과 액션을 정렬합니다. 테마 표면은 밝은 모드와 어두운 모드를 따릅니다.",
            }}
          />
        ))}
      </div>
    </div>
  );
}
function ToastDemo() {
  const [layout, setLayout] = useState<"list" | "stack">("list");
  const [stackSize, setStackSize] = useState(3);
  const [direction, setDirection] = useState<"up" | "down">("up");
  return (
    <ToastProvider layout={layout} stackSize={stackSize} direction={direction}>
      <ToastDemoContent
        layout={layout}
        stackSize={stackSize}
        direction={direction}
        onLayoutChange={setLayout}
        onStackSizeChange={setStackSize}
        onDirectionChange={setDirection}
      />
    </ToastProvider>
  );
}
export const toastEntry: CatalogEntry = {
  id: "toast",
  name: "Toast",
  category: "basic",
  summary: "테마 표면을 따르는 알림과 하나의 시계로 동기화된 자동 닫힘 타이머",
  Demo: ToastDemo,
  contracts: [
    "기본 배경은 --gc-surface이며 밝은/어두운 테마에 따라 변경됩니다. tinted와 solid는 선택적 표현입니다.",
    "아이콘·제목 첫 줄·닫기 버튼은 동일한 24px 행으로 정렬합니다. 설명·액션은 제목 아래에 배치합니다.",
    "timer는 bar/circle/none을 지원합니다. none은 시각적 표현만 숨기며 자동 닫힘은 동일합니다.",
    "info/success/warning은 기본 5초 후 닫힙니다. error 또는 action이 있으면 기본은 수동 닫기이며 가짜 타이머를 표시하지 않습니다.",
    "durationMs를 양수로 지정하면 오류·액션도 명시적으로 자동 닫힘을 선택합니다. 0·음수·Infinity는 지속 알림입니다.",
    "performance.now 기반 단일 시계와 자동 닫힘 setTimeout이 남은 시간을 관리합니다. WAAPI 애니메이션을 같은 시계의 currentTime에 맞춰 동기화하며 프레임마다 React를 갱신하지 않습니다. 접근성 남은 시간은 DOM에서 1초마다 갱신합니다. 모션 감소 설정에서는 같은 간격으로 시각적 남은 시간도 갱신합니다.",
    "개별 카드의 호버·내부 포커스만 그 카드의 시간을 일시정지합니다. document.hidden은 모든 카드에 적용합니다. 목록 전체 호버는 다른 카드의 시간을 멈추지 않습니다.",
    "stack은 목록 호버 또는 키보드 포커스로 펼쳐집니다. 접힌 뒤쪽 카드는 inert/aria-hidden이며 읽기 전 시간도 일시정지합니다. 펼치기 자체는 다른 카드의 타이머를 멈추지 않습니다. up은 화면 하단에서 아래→위 진입, down은 화면 상단에서 위→아래 진입입니다. 닫기는 오른쪽으로 이동하며 기본 180ms인 --gc-toast-exit-duration으로 속도를 지정합니다. JavaScript의 별도 지연 시간 없이 실제 CSS 퇴장 애니메이션이 끝난 뒤 제거하며 animation:none도 지원합니다. 모션 감소 설정은 즉시 닫습니다. 알림 생성은 포커스를 가져가지 않습니다. 닫기 버튼은 항상 접근 가능하며 원형은 호버·포커스 때 X를 보여줍니다. 터치에서는 X를 유지합니다.",
    "여러 알림은 안정적인 UUID로 관리합니다. list는 전체 목록, stack은 먼저 도착한 N개만 표시하고 나머지는 FIFO 대기열로 보존하며 대기 개수 안내는 표시하지 않습니다. 카드 제거 후 남은 카드는 현재 화면 위치에서 220ms 동안 빈자리로 이동합니다. 모션 감소 설정에서는 즉시 재배치합니다.",
  ],
  states: [
    "info",
    "success",
    "warning",
    "error",
    "surface",
    "tinted",
    "solid",
    "bar",
    "circle",
    "none",
    "일시정지",
    "지속 알림",
    "긴 제목",
    "액션",
    "모바일",
  ],
  keyboard: [
    "F8로 알림 목록에 포커스",
    "Tab으로 닫기·액션 이동",
    "Escape로 포커스한 알림 닫기",
    "포커스 중 타이머 일시정지",
  ],
  files: [
    "src/components/overlays/toast.tsx",
    "src/styles/toast.css",
    "src/styles/tokens.css",
  ],
  dependencies: [
    "React 19",
    "radix-ui Toast",
    "lucide-react",
    "basic/Button·IconButton compact",
    "--gc-* 토큰",
  ],
  migration: [
    "toast.tsx와 toast.css를 가져오고 basic/Button·IconButton import 경로를 맞춥니다.",
    "앱 루트에 ToastProvider를 한 번 배치하고 layout·stackSize·direction을 설정하고 호출부에서 useToast().notify를 사용합니다.",
    "--gc-surface/text/border와 상태별 토큰을 프로젝트의 밝은/어두운 테마 토큰에 연결합니다.",
    "--gc-toast-control-size와 --gc-toast-title-line-height는 둘 다 24px로 유지합니다.",
    "기존 notify({title,description,tone,action}) 호출은 그대로 작동합니다. timer·appearance·durationMs는 선택적 확장입니다.",
    "갤러리의 정적 ToastPreview와 실제 notify 예제를 구분합니다. 업무 API는 알림 내부에 연결하지 않습니다.",
  ],
  usage:
    'import { useToast } from "./components/overlays/toast";\n\n// ToastProvider 내부 컴포넌트에서 사용\nconst { notify } = useToast();\nnotify({ title: "저장했습니다", tone: "success", timer: "circle", appearance: "surface" });\nnotify({ title: "저장 실패", tone: "error", action: { label: "재시도", onClick: retry } });',
};
