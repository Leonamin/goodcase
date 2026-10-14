import { useState } from "react";
import { Activity, Bell, BookOpen, Home, Settings, User } from "lucide-react";
import { Tabs, type TabsItem } from "../components/overlays/tabs";
import type { CatalogEntry } from "./types";
function TabsDemo() {
  const [adaptiveValue, setAdaptiveValue] = useState("home");
  const adaptive: TabsItem[] = [
    {
      value: "home",
      label: "홈",
      icon: <Home />,
      content: <p>홈 화면입니다. 활성 탭만 아이콘 옆에 이름을 표시합니다.</p>,
    },
    {
      value: "activity",
      label: "활동 알림",
      icon: <Bell />,
      badge: 12,
      content: <p>활동 알림 12개. 확정한 선택값: {adaptiveValue}</p>,
    },
    {
      value: "reading",
      label: "한국어로 길게 작성한 읽기 목록",
      icon: <BookOpen />,
      content: (
        <p>
          실제 글자 너비에 맞춰 확장됩니다. 좁은 화면에서는 탭 줄만 가로
          스크롤합니다.
        </p>
      ),
    },
    {
      value: "settings",
      label: "설정 준비 중",
      icon: <Settings />,
      isDisabled: true,
      content: null,
    },
  ];
  return (
    <div className="gc-tabs-demo">
      <section className="gc-tabs-demo-section">
        <h2 className="gc-tabs-demo-heading">Underline · 기본</h2>
        <p className="gc-tabs-demo-note">
          방향키로 포커스를 옮기고 Enter로 전환합니다.
        </p>
        <Tabs
          label="기본 탭 예제"
          items={[
            {
              value: "summary",
              label: "개요",
              content: (
                <p>
                  개요 콘텐츠입니다. 기본 API와 수동 전환 동작을 유지합니다.
                </p>
              ),
            },
            {
              value: "activity",
              label: "활동 기록",
              badge: 3,
              content: <p>활동 기록 콘텐츠입니다.</p>,
            },
            {
              value: "settings",
              label: "설정 준비 중",
              isDisabled: true,
              content: null,
            },
          ]}
        />
      </section>
      <section className="gc-tabs-demo-section">
        <h2 className="gc-tabs-demo-heading">Adaptive · 활성 이름 확장</h2>
        <p className="gc-tabs-demo-note">
          아이콘은 항상 표시하고 선택한 탭의 이름만 펼칩니다. 이 예제는
          value/onValueChange를 연결한 제어형입니다.
        </p>
        <Tabs
          variant="adaptive"
          label="확장형 탭 예제"
          items={adaptive}
          value={adaptiveValue}
          onValueChange={setAdaptiveValue}
        />
      </section>
      <section className="gc-tabs-demo-section">
        <h2 className="gc-tabs-demo-heading">Segmented · 라벨과 아이콘</h2>
        <p className="gc-tabs-demo-note">
          모든 이름을 유지하는 분할형 탭입니다.
        </p>
        <Tabs
          variant="segmented"
          label="분할형 탭 예제"
          items={[
            {
              value: "profile",
              label: "내 프로필",
              icon: <User />,
              content: <p>프로필 콘텐츠입니다.</p>,
            },
            {
              value: "notice",
              label: "받은 알림",
              icon: <Bell />,
              badge: 8,
              content: <p>받은 알림 콘텐츠입니다.</p>,
            },
            {
              value: "options",
              label: "환경 설정",
              icon: <Settings />,
              content: <p>환경 설정 콘텐츠입니다.</p>,
            },
            {
              value: "disabled",
              label: "분할형 준비 중",
              icon: <Activity />,
              isDisabled: true,
              content: null,
            },
          ]}
        />
      </section>
      <section className="gc-tabs-demo-section">
        <h2 className="gc-tabs-demo-heading">Bottom · 큰 아이콘과 아래 이름</h2>
        <p className="gc-tabs-demo-note">
          모바일 탐색 막대 형태입니다. 여기서는 같은 페이지의 패널 전환이며,
          실제 페이지 이동은 Link 기반 navigation을 사용하세요.
        </p>
        <Tabs
          variant="bottom"
          label="하단형 탭 예제"
          items={[
            {
              value: "home",
              label: "시작 화면",
              icon: <Home />,
              content: <p>시작 화면 콘텐츠입니다.</p>,
            },
            {
              value: "messages",
              label: "소식 모음",
              icon: <Bell />,
              badge: 4,
              content: <p>소식 모음 콘텐츠입니다.</p>,
            },
            {
              value: "account",
              label: "나의 계정",
              icon: <User />,
              content: <p>계정 콘텐츠입니다.</p>,
            },
            {
              value: "disabled",
              label: "하단형 준비 중",
              icon: <Settings />,
              isDisabled: true,
              content: null,
            },
          ]}
        />
      </section>
    </div>
  );
}
export const tabsEntry: CatalogEntry = {
  id: "tabs",
  name: "Tabs",
  category: "basic",
  summary: "밑줄·확장형·분할형·하단형으로 같은 콘텐츠 전환 계약을 제공합니다.",
  contracts: [
    "underline(기본), adaptive, segmented, bottom 네 가지 시각 변형 제공",
    "방향키 이동과 선택 확정을 분리하는 수동 활성화: Enter·Space로 확정",
    "value/onValueChange 제어형과 defaultValue 비제어형 모두 지원",
    "adaptive는 아이콘을 유지하고 활성 탭의 실제 라벨 너비를 측정해 180ms로 확장. 아이콘이 없는 항목은 이름을 항상 표시",
    "숫자 배지는 접근 가능한 이름에 개수를 포함하며, 비활성 항목은 탐색·선택에서 제외",
    "좁은 화면·긴 한국어는 탭 줄만 가로 스크롤. 화면보다 긴 활성 이름은 말줄임 처리하며 접근 가능한 전체 이름 유지. 포커스 여백 확보, 키보드 탐색한 탭을 시야 안으로 이동",
    "모션 감소 설정에서는 너비 애니메이션 제거",
    "bottom도 탭 패널 전환. 별도 페이지 탐색은 Link 기반 navigation으로 구현",
  ],
  states: [
    "네 가지 변형",
    "활성·비활성·키보드 포커스",
    "아이콘·개수 배지",
    "긴 한국어",
    "320px 좁은 화면",
    "모션 감소",
    "제어형·비제어형",
  ],
  keyboard: [
    "좌우 방향키/Home/End: 사용 가능한 탭으로 포커스 이동",
    "Enter/Space: 포커스한 탭 활성화",
    "Tab: 활성 패널로 이동",
    "활성화 전에는 현재 패널 유지",
  ],
  files: [
    "src/components/overlays/tabs.tsx",
    "src/styles/tabs.css",
    "src/styles/tokens.css",
  ],
  dependencies: ["react", "react-dom", "radix-ui"],
  migration: [
    "src/components/overlays/tabs.tsx와 src/styles/tabs.css를 복사하고 React·Radix UI를 설치합니다.",
    "진입점에서 tabs.css를 가져오고 --gc-* 토큰을 프로젝트 디자인 토큰에 연결합니다. --gc-focus-clearance는 최소 6px을 권장합니다.",
    "items의 value는 안정적인 식별자, label은 읽을 수 있는 이름으로 지정합니다. icon은 프로젝트 아이콘을 ReactNode로 전달하며 특정 아이콘 패키지 의존성은 없습니다.",
    "variant를 선택합니다. adaptive 아이콘 항목만 활성 이름이 확장되고, 아이콘 없는 항목은 전체 이름을 유지합니다.",
    "외부 상태가 필요하면 value와 onValueChange를 함께 연결합니다. 기존 defaultValue·items 호출은 그대로 사용 가능합니다.",
    "긴 한국어·disabled·320px·키보드 포커스·prefers-reduced-motion을 원본 데모와 비교합니다.",
  ],
  usage:
    '<Tabs items={items} defaultValue="overview" />\n<Tabs variant="adaptive" label="작업 탭" items={items} value={tab} onValueChange={setTab} />\n// item: { value, label, content, icon?, badge?, isDisabled? }',
  Demo: TabsDemo,
};
