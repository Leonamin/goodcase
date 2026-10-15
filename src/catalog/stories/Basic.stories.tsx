import type { Meta, StoryObj } from "@storybook/react-vite";
import { entries } from "../index";
const meta: Meta = { title: "기본 컴포넌트" };
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
export const Button: StoryObj = { render: () => renderExample("button") };
export const Link: StoryObj = { render: () => renderExample("link") };
export const TextField: StoryObj = {
  render: () => renderExample("text-field"),
};
export const TextArea: StoryObj = { render: () => renderExample("text-area") };
export const Stepper: StoryObj = { render: () => renderExample("stepper") };
export const Slider: StoryObj = { render: () => renderExample("slider") };
export const Checkbox: StoryObj = { render: () => renderExample("checkbox") };
export const RadioGroup: StoryObj = {
  render: () => renderExample("radio-group"),
};
export const Switch: StoryObj = { render: () => renderExample("switch") };
export const Badge: StoryObj = { render: () => renderExample("badge") };
export const Alert: StoryObj = { render: () => renderExample("alert") };
export const Skeleton: StoryObj = { render: () => renderExample("skeleton") };
export const Progress: StoryObj = { render: () => renderExample("progress") };
export const Image: StoryObj = { render: () => renderExample("image") };
export const Avatar: StoryObj = { render: () => renderExample("avatar") };
export const Card: StoryObj = { render: () => renderExample("card") };
export const Table: StoryObj = { render: () => renderExample("table") };
export const Pagination: StoryObj = {
  render: () => renderExample("pagination"),
};
export const Select: StoryObj = { render: () => renderExample("select") };
export const Combobox: StoryObj = { render: () => renderExample("combobox") };
export const Menu: StoryObj = { render: () => renderExample("menu") };
export const Popover: StoryObj = { render: () => renderExample("popover") };
export const Tooltip: StoryObj = { render: () => renderExample("tooltip") };
export const Dialog: StoryObj = { render: () => renderExample("dialog") };
export const Drawer: StoryObj = { render: () => renderExample("drawer") };
export const Tabs: StoryObj = { render: () => renderExample("tabs") };
export const Accordion: StoryObj = { render: () => renderExample("accordion") };
export const Toast: StoryObj = { render: () => renderExample("toast") };
