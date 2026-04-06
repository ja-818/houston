import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { tauriOrgs } from "../lib/tauri";
import type { Organization } from "../lib/types";

interface OrganizationState {
  organizations: Organization[];
  current: Organization | null;
  loading: boolean;
  loadOrganizations: () => Promise<void>;
  setCurrent: (org: Organization) => void;
  create: (name: string) => Promise<Organization>;
  delete: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  current: null,
  loading: false,

  loadOrganizations: async () => {
    set({ loading: true });
    try {
      const organizations = await tauriOrgs.list();
      const current =
        organizations.find((o) => o.isDefault) ?? organizations[0] ?? null;
      set({ organizations, current, loading: false });
    } catch (e) {
      console.error("[organizations] Failed to load:", e);
      set({ loading: false });
    }
  },

  setCurrent: (org) => {
    set({ current: org });
    invoke("set_preference", {
      key: "last_org_id",
      value: org.id,
    }).catch((e) =>
      console.error("[organizations] Failed to save preference:", e),
    );
  },

  create: async (name) => {
    const org = await tauriOrgs.create(name);
    set((s) => ({
      organizations: [...s.organizations, org],
    }));
    return org;
  },

  delete: async (id) => {
    await tauriOrgs.delete(id);
    set((s) => {
      const organizations = s.organizations.filter((o) => o.id !== id);
      const current =
        s.current?.id === id
          ? organizations.find((o) => o.isDefault) ?? organizations[0] ?? null
          : s.current;
      return { organizations, current };
    });
  },

  rename: async (id, newName) => {
    await tauriOrgs.rename(id, newName);
    set((s) => ({
      organizations: s.organizations.map((o) =>
        o.id === id ? { ...o, name: newName } : o,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
