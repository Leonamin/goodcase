import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../src/components/basic/button";
import {
  DataTable,
  type DataRow,
} from "../../src/components/composed/data-table";
import "../../src/styles/tokens.css";
import "../../src/styles/global.css";
import "../../src/styles/basic.css";
import "../../src/styles/composed.css";

const rows: DataRow[] = Array.from({ length: 7 }, (_, index) => ({
  id: String(index),
  name: `행 ${index}`,
  status: "활성",
}));
const customRows = [
  { key: "a", title: "A" },
  { key: "b", title: "B" },
];

function Fixture() {
  const [pageSize, setPageSize] = useState(3);
  return (
    <main>
      <section aria-label="기본 모델">
        <Button onClick={() => setPageSize(4)}>4개씩 보기</Button>
        <DataTable
          rows={rows}
          caption="기본 표"
          isLoading={false}
          onRetry={() => {}}
          pageSize={pageSize}
        />
      </section>
      <section aria-label="사용자 모델">
        <DataTable
          rows={customRows}
          columns={[{ id: "title", label: "제목", render: (row) => row.title }]}
          getRowId={(row) => row.key}
          caption="사용자 표"
          isLoading={false}
          onRetry={() => {}}
        />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
