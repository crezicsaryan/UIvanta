/* Shared domain types for the UIvanta analysis pipeline. */

export type Confidence = "observed" | "estimated" | "unknown";

export type TokenGroup =
  | "color"
  | "typography"
  | "spacing"
  | "radius"
  | "shadow"
  | "layout";

export type DesignToken = {
  group: TokenGroup;
  /** CSS custom property name, e.g. --color-primary */
  name: string;
  /** Human label used inside design.md */
  label: string;
  value: string;
  confidence: Confidence;
  /** Where the value came from — a selector, a count, or "not visible in reference". */
  evidence: string;
  occurrences: number;
};

export type ComponentSpec = {
  name: string;
  count: number;
  observed: boolean;
  description: string;
  properties: Array<{ label: string; value: string; confidence: Confidence }>;
};

export type SectionNode = {
  tag: string;
  heading: string | null;
  level: number | null;
  summary: string;
  hints: string[];
};

export type PaletteSwatch = {
  hex: string;
  role: string;
  occurrences: number;
  confidence: Confidence;
};

export type ReferenceCounts = {
  sections: number;
  headings: number;
  buttons: number;
  links: number;
  images: number;
  inputs: number;
  cards: number;
  forms: number;
  navLinks: number;
  footerLinks: number;
};

export type ReferenceInfo = {
  kind: "url" | "screenshot";
  url?: string;
  domain?: string;
  title?: string;
  description?: string;
  lang?: string;
  favicon?: string;
  viewport: Viewport;
  palette: PaletteSwatch[];
  sections: SectionNode[];
  counts: ReferenceCounts;
  fontFaces: string[];
  stylesheets: number;
  cssBytes: number;
  capturedAt: string;
  notes?: string;
  limitations: string[];
};

export type Viewport = "desktop" | "tablet" | "mobile";

export type AnalysisStats = {
  tokens: number;
  colors: number;
  components: number;
  sections: number;
  confidence: { observed: number; estimated: number; unknown: number };
  durationMs: number;
};

export type AnalysisResult = {
  reference: ReferenceInfo;
  tokens: DesignToken[];
  components: ComponentSpec[];
  markdown: string;
  stats: AnalysisStats;
};

export type AnalysisStage =
  | "validating"
  | "fetching"
  | "capturing"
  | "extracting"
  | "generating"
  | "completed"
  | "failed";

export type AnalysisStatus = "queued" | "processing" | "completed" | "failed";

export type AnalysisJob = {
  id: string;
  sourceType: "url" | "screenshot";
  sourceUrl?: string;
  status: AnalysisStatus;
  stage: AnalysisStage;
  stageLabel: string;
  /** 0-100, only ever advanced by real pipeline steps. */
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: { code: string; message: string; retryable: boolean; hint?: string };
  result?: AnalysisResult;
  /** User edits are kept separately so regeneration never silently overwrites them. */
  editedMarkdown?: string;
  edits: number;
  viewport: Viewport;
  notes?: string;
};

export type PublicJob = Omit<AnalysisJob, "result"> & {
  result?: AnalysisResult;
};

export type ApiError = {
  error: { code: string; message: string; retryable: boolean; hint?: string };
};
