import {
  DataTable,
  type DataColumn,
  type DataRow,
} from "../../src/components/composed";

const rows: DataRow[] = [{ id: "one", name: "이름", status: "활성" }];
const customRows = [{ key: "a", title: "제목" }];
const columns: DataColumn<(typeof customRows)[number]>[] = [
  { id: "title", label: "제목", render: (row) => row.title },
];

export const defaultModel = (
  <DataTable rows={rows} isLoading={false} onRetry={() => {}} />
);
export const adaptedDefaultModel = (
  <DataTable
    rows={rows}
    columns={[{ id: "name", label: "이름", render: (row) => row.name }]}
    isLoading={false}
    onRetry={() => {}}
  />
);
export const customModel = (
  <DataTable
    rows={customRows}
    columns={columns}
    getRowId={(row) => row.key}
    isLoading={false}
    onRetry={() => {}}
  />
);

// @ts-expect-error A custom model must supply both adapters.
// prettier-ignore
export const missingAdapters = <DataTable rows={customRows} isLoading={false} onRetry={() => {}} />;
// @ts-expect-error Custom column rendering does not imply a stable row identifier.
// prettier-ignore
export const missingRowId = <DataTable rows={customRows} columns={columns} isLoading={false} onRetry={() => {}} />;
// @ts-expect-error A row identifier does not supply the default name/status columns.
// prettier-ignore
export const missingColumns = <DataTable rows={customRows} getRowId={(row) => row.key} isLoading={false} onRetry={() => {}} />;
// @ts-expect-error Row identifiers must be strings.
// prettier-ignore
export const invalidRowId = <DataTable rows={customRows} columns={columns} getRowId={() => 1} isLoading={false} onRetry={() => {}} />;
