export interface PersonalInfo {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
}

export interface Education {
  id?: string;
  school: string;
  degree?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

export interface Experience {
  id?: string;
  title: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  bullets: string[];
}

export interface Project {
  id?: string;
  title: string;
  description?: string;
  tech?: string[];
  link?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | string;
}

export interface ResumeBuilderState {
  personal: PersonalInfo;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  theme?: 'modern' | 'minimal';
  colorScheme?: 'light' | 'dark';
}

export const EMPTY_RESUME_STATE: ResumeBuilderState = {
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
