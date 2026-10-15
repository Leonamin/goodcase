import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../src/components/basic/button";
import { Combobox } from "../../src/components/overlays/combobox";
import "../../src/styles/tokens.css";
import "../../src/styles/global.css";
import "../../src/styles/basic.css";
import "../../src/styles/overlays.css";

const initialOptions = [
  { value: "one", label: "첫 항목" },
  { value: "two", label: "둘째 항목" },
  { value: "three", label: "셋째 항목" },
];
function Fixture() {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState("");
  return (
    <main>
      <Combobox
        label="동적 항목"
        options={options}
        value={value}
        onValueChange={setValue}
      />
      <p role="status">선택값: {value || "없음"}</p>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOptions(initialOptions.slice(0, 1))}
      >
        결과 축소
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOptions([...initialOptions].reverse())}
      >
        결과 재정렬
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          setOptions(
            initialOptions.map((option) => ({
              ...option,
              value: `new-${option.value}`,
            })),
          )
        }
      >
        결과 교체
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOptions([])}
      >
        결과 비우기
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          setOptions(
            initialOptions.map((option) => ({ ...option, isDisabled: true })),
          )
        }
      >
        결과 비활성
      </Button>
      <Button
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOptions(initialOptions)}
      >
        결과 복원
      </Button>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
