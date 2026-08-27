import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AIProvider, EmploymentEntry, Resume } from '@/types/resume';
import { DEFAULT_FONT } from '@/lib/fonts';

export const EMPTY_RESUME: Resume = {
  candidate_name: '',
  first_name: '',
  last_name: '',
  job_title: '',
  designation: '',
  email: '',
  phone: '',
  address: '',
  profile_summary: '',
  certifications: [],
  education: [],
  safety_tickets: [],
  skills: [],
  computer_skills: [],
  employment: [],
  font: DEFAULT_FONT,
};

interface ResumeBuilderState {
  resume: Resume;
  provider: AIProvider;
  dirty: boolean;
  setResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(key: K, value: Resume[K]) => void;
  setProvider: (provider: AIProvider) => void;
  addExperience: () => void;
  updateExperience: (id: string, entry: EmploymentEntry) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromId: string, toId: string) => void;
  reset: () => void;
  markSaved: () => void;
}

export const useResumeBuilderStore = create<ResumeBuilderState>()(
  persist(
    (set) => ({
      resume: EMPTY_RESUME,
      provider: 'anthropic',
      dirty: false,

      setResume: (resume) => set({ resume, dirty: false }),

      updateField: (key, value) =>
        set((state) => ({ resume: { ...state.resume, [key]: value }, dirty: true })),

      setProvider: (provider) => set({ provider }),

      addExperience: () => {
        const blank: EmploymentEntry = {
          id: uuidv4(),
          company: '',
          title: '',
          start_date: '',
          is_present: false,
          responsibilities: [''],
        };
        set((state) => ({
          resume: { ...state.resume, employment: [...state.resume.employment, blank] },
          dirty: true,
        }));
      },

      updateExperience: (id, entry) =>
        set((state) => ({
          resume: {
            ...state.resume,
            employment: state.resume.employment.map((e) => (e.id === id ? entry : e)),
          },
          dirty: true,
        })),

      removeExperience: (id) =>
        set((state) => ({
          resume: { ...state.resume, employment: state.resume.employment.filter((e) => e.id !== id) },
          dirty: true,
        })),

      reorderExperience: (fromId, toId) =>
        set((state) => {
          const list = [...state.resume.employment];
          const fromIdx = list.findIndex((e) => e.id === fromId);
          const toIdx = list.findIndex((e) => e.id === toId);
          if (fromIdx === -1 || toIdx === -1) return state;
          const [moved] = list.splice(fromIdx, 1);
          list.splice(toIdx, 0, moved);
          return { resume: { ...state.resume, employment: list }, dirty: true };
        }),

      reset: () => set({ resume: EMPTY_RESUME, dirty: false }),
      markSaved: () => set({ dirty: false }),
    }),
    { name: 'engrity-resume-draft' }
  )
);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  resumeId?: string;      // set when this message resulted in a saved candidate
  candidateName?: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, { id: uuidv4(), ...msg }] })),
      clear: () => set({ messages: [] }),
    }),
    { name: 'engrity-chat-history' }
  )
);
