import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  detectTimezone,
  useTimezonePreference,
} from "../../../hooks/use-timezone-preference";
import { useUIStore } from "../../../stores/ui";

export function TimezoneSection() {
  const { t } = useTranslation("settings");
  const tz = useTimezonePreference();
  const addToast = useUIStore((s) => s.addToast);
  const [tzDraft, setTzDraft] = useState("");

  useEffect(() => {
    setTzDraft(tz.timezone ?? "");
  }, [tz.timezone]);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t("timezone.title")}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("timezone.description")}
      </p>
      <div>
        <label className="text-xs text-muted-foreground block mb-1.5">
          {t("timezone.label")}
        </label>
        <input
          type="text"
          value={tzDraft}
          onChange={(e) => setTzDraft(e.target.value)}
          onBlur={async () => {
            const trimmed = tzDraft.trim();
            if (!trimmed || trimmed === tz.timezone) return;
            await tz.confirm(trimmed);
            addToast({ title: t("toasts.timezoneSet", { zone: trimmed }) });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder={t("timezone.placeholder")}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
        />
        <div className="mt-1.5 text-xs text-muted-foreground">
          <button
            onClick={async () => {
              const d = detectTimezone();
              setTzDraft(d);
              await tz.confirm(d);
              addToast({ title: t("toasts.timezoneSet", { zone: d }) });
            }}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("timezone.useDetected", { zone: tz.detected })}
          </button>
        </div>
      </div>
    </section>
  );
}
