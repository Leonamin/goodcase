import type { Meta, StoryObj } from "@storybook/react-vite";
import { entries } from "../index";
const meta: Meta = { title: "기반" };
export default meta;
function renderExample(id: string) {
  const entry = entries.find((entry) => entry.id === id)!;
  return (
    <main style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      <h1>{entry.name}</h1>
      <p>{entry.summary}</p>
      <section aria-label={entry.name + " 실습"}>
        <entry.Demo />
      </section>
    </main>
  );
}
export const DesignTokens: StoryObj = {
  render: () => renderExample("design-tokens"),
};
export const Typography: StoryObj = {
  render: () => renderExample("typography"),
};
export const Stack: StoryObj = { render: () => renderExample("stack") };
export const Grid: StoryObj = { render: () => renderExample("grid") };
export const Divider: StoryObj = { render: () => renderExample("divider") };
