import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, TextField } from "../../src/components/basic";
import {
  Dialog,
  Drawer,
  DialogClose,
  Popover,
  Select,
} from "../../src/components/overlays";
import "../../src/styles/tokens.css";
import "../../src/styles/global.css";
import "../../src/styles/basic.css";
import "../../src/styles/overlays.css";

function Fixture() {
  const [value, setValue] = useState("one");
  return (
    <main>
      <Button>배경 액션</Button>
      {[Dialog, Drawer].map((Modal, index) => (
        <Modal
          key={index}
          title={index === 0 ? "중첩 Dialog" : "중첩 Drawer"}
          description="포털로 열린 하위 패널의 키보드 동작 검증"
          trigger={
            <Button>{index === 0 ? "Dialog 열기" : "Drawer 열기"}</Button>
          }
          footer={
            <DialogClose>
              <Button>완료</Button>
            </DialogClose>
          }
        >
          <Select
            label="항목 선택"
            value={value}
            onValueChange={setValue}
            options={[
              { value: "one", label: "첫 항목" },
              { value: "two", label: "다음 항목" },
            ]}
          />
          <Popover label="추가 설정" trigger={<Button>추가 설정</Button>}>
            <TextField label="메모" />
            <Button>설정 액션</Button>
          </Popover>
        </Modal>
      ))}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
