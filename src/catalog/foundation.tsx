import { useState } from "react";
import type { CatalogEntry } from "./types";
import { Button, TextField, Typography } from "../components/basic";

function TokensDemo() {
  const [name, setName] = useState("새로운 프로젝트");
  const swatches = [
    { name: "강조", token: "--gc-accent" },
    { name: "본문", token: "--gc-text" },
    { name: "보조", token: "--gc-text-muted" },
    { name: "표면", token: "--gc-surface" },
    { name: "성공", token: "--gc-success" },
    { name: "오류", token: "--gc-danger" },
  ];
  return (
    <div className="gc-stack">
      <Typography variant="heading">
        색상과 간격을 바꾸어도 같은 동작
      </Typography>
      <p className="gc-muted">
        위에서 테마와 밀도를 바꿔보세요. 오버레이까지 같은 토큰을 읽습니다.
      </p>
      <div className="token-swatches">
        {swatches.map((swatch) => (
          <div key={swatch.token}>
            <span style={{ background: `var(${swatch.token})` }} />
            <strong>{swatch.name}</strong>
            <code>{swatch.token}</code>
          </div>
        ))}
      </div>
      <div className="token-spacing">
        {[1, 2, 3, 4, 6, 8].map((step) => (
          <div key={step}>
            <span style={{ width: `var(--gc-space-${step})` }} />
            <code>space-{step}</code>
          </div>
        ))}
      </div>
      <TextField
        label="프로젝트 이름"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="gc-row">
        <Button>기본 버튼</Button>
        <Button variant="secondary">보조 버튼</Button>
      </div>
    </div>
  );
}
export const foundationEntries: CatalogEntry[] = [
  {
    id: "design-tokens",
    name: "Design Tokens",
    category: "foundation",
    summary:
      "색상·타이포그래피·간격·밀도를 프로젝트에 맞게 연결하는 기준입니다.",
    contracts: [
      "src/styles/tokens.css가 실행 토큰의 원본입니다.",
      "--gc-* 의미 토큰을 프로젝트 변수에 연결해 외형을 변경합니다.",
      "Portal 콘텐츠도 같은 토큰을 읽도록 문서 범위 또는 Portal 컨테이너에 테마를 공급합니다.",
      "테마와 밀도는 동작을 바꾸지 않습니다.",
      "Blue·Forest는 강조색만 바꾸고 모서리 반경을 유지합니다. 모서리는 --gc-radius-*로 별도 조정합니다.",
    ],
    states: [
      "Blue 기본 테마",
      "Forest 변형",
      "라이트 모드",
      "다크 모드",
      "기본 밀도",
      "조밀한 밀도",
    ],
    keyboard: ["테마·밀도 선택은 네이티브 select로 조작합니다."],
    files: ["src/styles/tokens.css"],
    dependencies: ["CSS custom properties"],
    migration: [
      "tokens.css의 --gc-* 목록을 확인합니다.",
      "의미가 같은 프로젝트 토큰을 연결합니다. 없는 토큰은 프로젝트 디자인 기준으로 정의합니다.",
      "브랜드 색상·폰트·간격·모서리를 바꾼 뒤 텍스트 대비와 포커스 가시성을 확인합니다.",
      "모달·메뉴처럼 Portal로 렌더링되는 요소에도 변경이 적용되는지 확인합니다.",
    ],
    usage:
      ":root {\n  --gc-accent: var(--brand-primary);\n  --gc-font-sans: var(--font-body);\n  --gc-radius: var(--radius-control);\n}",
    Demo: TokensDemo,
  },
];
