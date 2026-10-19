import { imageCropperEntry } from "./image-cropper";
import { basicEntries } from "./basic";
import { overlayEntries } from "./overlays";
import { composedEntries } from "./composed";
import { foundationEntries } from "./foundation";
export const entries = [
  ...basicEntries,
  ...overlayEntries,
  ...composedEntries,
  imageCropperEntry,
  ...foundationEntries,
];
