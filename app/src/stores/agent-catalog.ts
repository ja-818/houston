import { create } from "zustand";
import { loadAllExperiences } from "../experiences/loader";
import type { Experience } from "../lib/types";

interface ExperienceState {
  experiences: Experience[];
  loading: boolean;
  loadExperiences: () => Promise<void>;
  getById: (id: string) => Experience | undefined;
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  experiences: [],
  loading: false,

  loadExperiences: async () => {
    set({ loading: true });
    try {
      const experiences = await loadAllExperiences();
      set({ experiences, loading: false });
    } catch (e) {
      console.error("[experiences] Failed to load:", e);
      set({ loading: false });
    }
  },

  getById: (id) => get().experiences.find((e) => e.manifest.id === id),
}));
