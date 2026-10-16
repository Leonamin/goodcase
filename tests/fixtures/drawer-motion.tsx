import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../src/components/basic";
import { Drawer } from "../../src/components/overlays";
import "../../src/styles/tokens.css";
import "../../src/styles/global.css";
import "../../src/styles/basic.css";
import "../../src/styles/overlays.css";

function Fixture() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <main style={{ minHeight: "200vh" }}>
      <Button onClick={() => setIsOpen(true)}>외부 열기</Button>
      <Drawer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={<Button>Drawer 열기</Button>}
        title="애니메이션 검증"
        description="긴 본문과 고정 액션의 전환 검증"
        footer={<Button onClick={() => setIsOpen(false)}>완료</Button>}
      >
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index}>상세 항목 {index + 1} · 긴 본문 스크롤 검증</p>
        ))}
      </Drawer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
