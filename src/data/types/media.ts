import type { WordPressRow } from "./common";

export type MediaRow = WordPressRow & {
  storage_path: string;
  original_filename: string;
  alt_text: string | null;
};
