import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tauriPreferences } from "../lib/tauri";
import {
  LOCALE_PREF_KEY,
  changeLocale,
  isSupported,
  type SupportedLocale,
} from "../lib/i18n";

const queryKey = ["locale-preference"] as const;

export interface LocalePreferenceState {
  /** Persisted locale the user explicitly chose, or null if they never picked. */
  locale: SupportedLocale | null;
  /** True while the initial preference fetch is in flight. */
  isLoading: boolean;
  /** Write the locale to engine prefs AND swap the live i18n language. */
  setLocale: (locale: SupportedLocale) => Promise<void>;
}

/**
 * Reads and writes the user's explicit UI-locale preference via the
 * engine's preferences KV. A null result means "never picked" — the
 * first-run language gate uses that to decide whether to show the
 * picker. Once set, the value survives across launches.
 */
export function useLocalePreference(): LocalePreferenceState {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SupportedLocale | null> => {
      const raw = await tauriPreferences.get(LOCALE_PREF_KEY);
      return isSupported(raw) ? raw : null;
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (locale: SupportedLocale) => {
      await tauriPreferences.set(LOCALE_PREF_KEY, locale);
      await changeLocale(locale);
      return locale;
    },
    onSuccess: (locale) => {
      qc.setQueryData<SupportedLocale | null>(queryKey, locale);
    },
  });

  const setLocale = useCallback(
    async (locale: SupportedLocale) => {
      await mutation.mutateAsync(locale);
    },
    [mutation],
  );

  return {
    locale: query.data ?? null,
    isLoading: query.isLoading,
    setLocale,
  };
}
