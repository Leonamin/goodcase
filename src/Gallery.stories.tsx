import type { Meta, StoryObj } from "@storybook/react-vite";
import { App } from "./App";
import { entries } from "./catalog";
const meta = {
  title: "Gallery/실제 갤러리",
  component: App,
  render: (args = {}) => (
    <App
      key={(args.initialId ?? "button") + "-" + (args.initialTab ?? "preview")}
      {...args}
    />
  ),
  argTypes: {
    initialId: { control: "select", options: entries.map((entry) => entry.id) },
    initialTab: {
      control: "select",
      options: ["preview", "contract", "source", "migration"],
    },
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {
  args: { initialId: "button", initialTab: "preview" },
};
export const Contract: Story = {
  args: { initialId: "dialog", initialTab: "contract" },
};
export const Migration: Story = {
  args: { initialId: "image-viewer", initialTab: "migration" },
};
export const ImageViewer: Story = {
  args: { initialId: "image-viewer", initialTab: "preview" },
};
export const DataTable: Story = {
  args: { initialId: "data-table", initialTab: "preview" },
};
