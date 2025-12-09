export interface Resume {
  _id?: string;
  filename: string;
  text?: string;
  analysis?: any; // store structured object or raw string
  score?: number;
  createdAt?: string;
}

export type ResumeType = 'builder' | 'ats' | 'jd';

export interface BuilderResume {
  _id: string;
  updatedAt: string;
  isDraft: boolean;
  completionPercentage: number;
  personal?: { headline?: string };
}

export interface AtsResume {
  _id: string;
  filename: string;
  score: number;
  analysis: any;
  updatedAt: string;
}

export interface JdResume {
  _id: string;
  filename: string;
  score: number;
  jobDescription?: { title?: string };
  analysis: any;
  updatedAt: string;
}

export interface ResumeListResponse<T> {
  resumes?: T[];
  data?: T[];
  resume?: T[];
}
