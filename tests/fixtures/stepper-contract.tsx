import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../src/components/basic/button";
import { Stepper } from "../../src/components/basic/stepper";
import "../../src/styles/tokens.css";
import "../../src/styles/global.css";
import "../../src/styles/basic.css";

function Fixture() {
  const [requests, setRequests] = useState<number[]>([]);
  const [accepted, setAccepted] = useState(1);
  const [pending, setPending] = useState(1);
  const [quantity, setQuantity] = useState(9);
  const [decimal, setDecimal] = useState(-0.25);
  const [tiny, setTiny] = useState(0);
  const [tenth, setTenth] = useState(0);
  return (
    <main>
      <Stepper
        label="변경 거절"
        value={1}
        onValueChange={(value) => setRequests((current) => [...current, value])}
      />
      <output data-testid="requests">{JSON.stringify(requests)}</output>
      <Stepper label="승인 대기" value={accepted} onValueChange={setPending} />
      <output data-testid="pending">{pending}</output>
      <Button onClick={() => setAccepted(pending)}>요청 승인</Button>
      <Stepper
        label="유효 상한"
        value={quantity}
        onValueChange={setQuantity}
        min={0}
        max={10}
        step={3}
      />
      <Stepper
        label="음수 시작 소수"
        value={decimal}
        onValueChange={setDecimal}
        min={-0.25}
        max={0.2}
        step={0.1}
      />
      <Stepper
        label="작은 간격"
        value={tiny}
        onValueChange={setTiny}
        step={1e-13}
        max={3e-13}
      />
      <Stepper
        label="십진수 간격"
        value={tenth}
        onValueChange={setTenth}
        step={0.1}
        max={0.3}
      />
      <Button>입력 종료</Button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
