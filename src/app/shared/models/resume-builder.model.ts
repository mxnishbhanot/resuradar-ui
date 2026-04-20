export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolioUrl?: string;
  summary?: string;  // Already present, kept for clarity
}

export interface EducationEntry {  // CHANGED: Renamed from Education and expanded to match component
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  gpa?: string;
  bullets: string[];
}

export interface Experience {
  id?: string;  // CHANGED: Made optional but generated in component
  title: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  bullets: string[];
  role?: string;
  link?: string;
}

export interface Project {  // CHANGED: Expanded to match component (separate from skills)
  id: string;
  title: string;
  role: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  techStack: string[];
  bullets: string[];
}

export interface SkillCategory {  // CHANGED: New interface for skills (categories with sub-skills)
  id: string;
  name: string;
  skills: string[];
}

export type BuilderTemplateId = 'modern' | 'corporate' | 'executive' | 'faang' | 'luxury';

export type TemplateSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills';

/** Default section order for all builder templates (single-column flow). */
export const DEFAULT_SECTION_ORDER: TemplateSectionKey[] = [
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
];

export interface TemplateLayout {
  layoutVersion: 1;
  globalScale: number;
  sectionGap: number;
  lineHeight: number;
}

export interface TemplateAppearance {
  appearanceVersion: 1;
  colorMode: 'light' | 'dark';
  headingWeight: 600 | 700 | 800;
  underlineLinks: boolean;
  /** Optional override for body text (hex #rgb or #rrggbb). */
  bodyColor: string | null;
  /** Optional override for headings / section titles. */
  headingColor: string | null;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex3(h: string): string {
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h.toLowerCase();
}

function sanitizeHex(c: unknown): string | null {
  if (typeof c !== 'string') return null;
  const t = c.trim();
  if (!HEX_RE.test(t)) return null;
  return expandHex3(t);
}

export function normalizeAppearance(
  raw?: Partial<TemplateAppearance> | null
): TemplateAppearance {
  const colorMode = raw?.colorMode === 'dark' ? 'dark' : 'light';
  let headingWeight = Number(raw?.headingWeight);
  if (![600, 700, 800].includes(headingWeight)) headingWeight = 700;
  return {
    appearanceVersion: 1,
    colorMode,
    headingWeight: headingWeight as TemplateAppearance['headingWeight'],
    underlineLinks: raw?.underlineLinks === true,
    bodyColor: sanitizeHex(raw?.bodyColor),
    headingColor: sanitizeHex(raw?.headingColor),
  };
}

export interface TemplateSettings {
  sectionOrder?: TemplateSectionKey[];
  layout?: Partial<TemplateLayout>;
  appearance?: Partial<TemplateAppearance>;
}

export function defaultSectionOrderForTemplate(_t: BuilderTemplateId): TemplateSectionKey[] {
  return [...DEFAULT_SECTION_ORDER];
}

const SECTION_KEY_SET = new Set<TemplateSectionKey>([
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
]);

function isValidSectionOrder(arr: unknown): arr is TemplateSectionKey[] {
  return (
    Array.isArray(arr) &&
    arr.length === 5 &&
    new Set(arr).size === 5 &&
    arr.every((k) => SECTION_KEY_SET.has(k as TemplateSectionKey))
  );
}

export function normalizeTemplateSettings(
  t: BuilderTemplateId,
  raw?: TemplateSettings | null
): TemplateSettings {
  const sectionOrder = isValidSectionOrder(raw?.sectionOrder)
    ? [...raw.sectionOrder]
    : defaultSectionOrderForTemplate(t);
  const L = raw?.layout || {};
  const globalScale =
    typeof L.globalScale === 'number' && L.globalScale > 0 ? L.globalScale : 1;
  const sectionGap =
    typeof L.sectionGap === 'number' && L.sectionGap > 0 ? L.sectionGap : 1;
  const lineHeight =
    typeof L.lineHeight === 'number' && L.lineHeight > 0 ? L.lineHeight : 1;
  return {
    sectionOrder,
    layout: {
      layoutVersion: 1,
      globalScale: Math.min(1.25, Math.max(0.65, globalScale)),
      sectionGap: Math.min(1.5, Math.max(0.7, sectionGap)),
      lineHeight: Math.min(1.35, Math.max(0.95, lineHeight)),
    },
    appearance: normalizeAppearance(raw?.appearance),
  };
}

export interface ResumeBuilderState {
  _id: string | null;
  personal: PersonalInfo;
  educations: EducationEntry[];  // CHANGED: Use EducationEntry[]
  experiences: Experience[];
  projects: Project[];  // CHANGED: Use detailed Project[]
  skills: SkillCategory[];  // CHANGED: Use SkillCategory[] (separate from projects)
  theme?: BuilderTemplateId;
  colorScheme?: 'light' | 'dark';
  templateSettings?: TemplateSettings;
}

export const EMPTY_RESUME_STATE: ResumeBuilderState = {  // CHANGED: Updated arrays/objects to match new shapes
  _id: null,
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    headline: '',
    location: '',
    linkedin: '',
    github: '',
    portfolioUrl: '',
    summary: '',
  },
  educations: [],
  experiences: [],
  projects: [],
  skills: [],
  theme: 'modern',
  colorScheme: 'light',
  templateSettings: normalizeTemplateSettings('modern', {}),
};
