import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@houston-ai/core";
import { tauriPreferences } from "../../../lib/tauri";
import {
  changeLocale,
  isSupported,
  LOCALE_PREF_KEY,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../../lib/i18n";
import { useUIStore } from "../../../stores/ui";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export function LanguageSection() {
  const { t, i18n } = useTranslation("common");
  const addToast = useUIStore((s) => s.addToast);
  const currentLocale: SupportedLocale = isSupported(i18n.resolvedLanguage)
    ? (i18n.resolvedLanguage as SupportedLocale)
    : "en";

  const handleLocaleChange = async (value: string) => {
    if (!isSupported(value)) return;
    await changeLocale(value);
    await tauriPreferences.set(LOCALE_PREF_KEY, value);
    addToast({ title: t("language.toastChanged") });
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t("language.title")}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("language.description")}
      </p>
      <div>
        <label className="text-xs text-muted-foreground block mb-1.5">
          {t("language.label")}
        </label>
        <Select value={currentLocale} onValueChange={handleLocaleChange}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
