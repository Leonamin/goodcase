import type { Meta, StoryObj } from "@storybook/react-vite";
import { entries } from "../index";
const meta: Meta = { title: "조합형 컴포넌트" };
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
export const FormField: StoryObj = {
  render: () => renderExample("form-field"),
};
export const FormActions: StoryObj = {
  render: () => renderExample("form-actions"),
};
export const ConfirmDialog: StoryObj = {
  render: () => renderExample("confirm-dialog"),
};
export const SearchFilterBar: StoryObj = {
  render: () => renderExample("search-filter-bar"),
};
export const DataTable: StoryObj = {
  render: () => renderExample("data-table"),
};
export const FileUploader: StoryObj = {
  render: () => renderExample("file-uploader"),
};
export const ImageViewer: StoryObj = {
  render: () => renderExample("image-viewer"),
};
export const ImageGallery: StoryObj = {
  render: () => renderExample("image-gallery"),
};
export const AsyncContent: StoryObj = {
  render: () => renderExample("async-content"),
};
export const CopyField: StoryObj = {
  render: () => renderExample("copy-field"),
};

export const ImageCropper: StoryObj = {
  render: () => renderExample("image-cropper"),
};
