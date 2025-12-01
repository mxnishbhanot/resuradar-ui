export interface PersonalInfo {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  linkedin?: string;
  github?: string;
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
}

export interface Project {  // CHANGED: Expanded to match component (separate from skills)
  id: string;
  title: string;
  role: string;
  link?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  techStack: string[];
  bullets: string[];
}

export interface SkillCategory {  // CHANGED: New interface for skills (categories with sub-skills)
  id: string;
  name: string;
  skills: string[];
}

export interface ResumeBuilderState {
  personal: PersonalInfo;
  educations: EducationEntry[];  // CHANGED: Use EducationEntry[]
  experiences: Experience[];
  projects: Project[];  // CHANGED: Use detailed Project[]
  skills: SkillCategory[];  // CHANGED: Use SkillCategory[] (separate from projects)
  theme?: 'modern' | 'minimal';
  colorScheme?: 'light' | 'dark';
}

export const EMPTY_RESUME_STATE: ResumeBuilderState = {  // CHANGED: Updated arrays/objects to match new shapes
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    headline: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
  },
  educations: [],
  experiences: [],
  projects: [],
  skills: [],
  theme: 'modern',
  colorScheme: 'light',
};
