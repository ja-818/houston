import { create } from "zustand";
import type { EventEntry } from "@deck-ui/events";

interface EventState {
  events: EventEntry[];
  pushEvent: (event: EventEntry) => void;
  updateEventStatus: (eventId: string, status: string) => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],

  pushEvent: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  updateEventStatus: (eventId, status) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id === eventId
          ? { ...e, status: status as EventEntry["status"], processedAt: new Date().toISOString() }
          : e
      ),
    })),

  clearEvents: () => set({ events: [] }),
}));
