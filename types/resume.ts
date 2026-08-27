export interface Certification {
  name: string;
  endorsements?: string[];
}

export interface EducationItem {
  credential: string;
  institution?: string;
}

export interface EmploymentEntry {
  id: string;            // stable id for drag-and-drop reordering
  company: string;
  location?: string;
  title: string;
  start_date: string;   // e.g. "April 2021"
  end_date?: string;    // undefined/empty if is_present
  is_present: boolean;
  responsibilities: string[];
}

/** e.g. "QC Inspector", "API Inspector", "Third Party Inspector" — managed in Settings */
export interface Designation {
  id: string;
  name: string;
}

/** Font applied to the resume body. Header always renders in Times New Roman regardless. */
export type FontId =
  | 'times-new-roman'
  | 'plus-jakarta-sans'
  | 'open-sans'
  | 'inter'
  | 'poppins'
  | 'calibri'
  | 'arial';

export interface Resume {
  id?: string;
  candidate_name: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  designation?: string;   // references a Designation.name
  email?: string;
  phone?: string;
  address?: string;

  profile_summary?: string;
  certifications: Certification[];
  education: EducationItem[];
  safety_tickets: string[];
  skills: string[];
  computer_skills: string[];
  employment: EmploymentEntry[];

  font?: FontId;
  status?: 'draft' | 'review' | 'final';
  updated_at?: string;
}

export type AIProvider = 'anthropic' | 'openai' | 'gemini';
