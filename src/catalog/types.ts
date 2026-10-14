import type { ComponentType } from "react";
export type CatalogEntry = {
  id: string;
  name: string;
  category: "basic" | "composed" | "foundation";
  summary: string;
  contracts: string[];
  states: string[];
  keyboard: string[];
  files: string[];
  dependencies: string[];
  migration: string[];
  usage: string;
  Demo: ComponentType;
};
