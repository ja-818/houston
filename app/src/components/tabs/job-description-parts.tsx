import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  cn,
} from "@houston-ai/core";
import { FileText } from "lucide-react";

export type SubTab = "instructions" | "skills" | "learnings";

const SUB_TAB_IDS: SubTab[] = ["instructions", "skills", "learnings"];

export function SubTabPills({
  activeTab,
  onChange,
}: {
  activeTab: SubTab;
  onChange: (tab: SubTab) => void;
}) {
  const { t } = useTranslation("agents");
  return (
    <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
      {SUB_TAB_IDS.map((tabId) => (
        <button
          key={tabId}
          onClick={() => onChange(tabId)}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-medium transition-colors",
            activeTab === tabId
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
          )}
        >
          {t(`subTabs.${tabId}`)}
        </button>
      ))}
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved";

export function InstructionsContent({
  content,
  onSave,
}: {
  content: string;
  onSave: (content: string) => Promise<unknown>;
}) {
  const { t } = useTranslation("agents");
  const [value, setValue] = useState(content);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    setValue(content);
  }, [content]);

  const textareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (el && editing) el.focus();
    },
    [editing],
  );

  const handleBlur = async () => {
    if (value === content) return;
    setState("saving");
    await onSave(value);
    setState("saved");
    window.setTimeout(() => setState("idle"), 2000);
  };

  if (!value.trim() && !editing) {
    return (
      <div className="mx-auto max-w-md flex flex-col items-center gap-6 text-center pt-24 px-6">
        <EmptyHeader>
          <EmptyTitle>{t("instructions.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("instructions.emptyDescription")}</EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => setEditing(true)}>
          <FileText className="size-4" />
          {t("instructions.writeButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-12 pt-2">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <p className="text-xs text-muted-foreground max-w-md">
          {t("instructions.helper")}
        </p>
        <span
          className={cn(
            "text-[11px] tabular-nums transition-opacity duration-200",
            state === "idle" ? "opacity-0" : "opacity-100 text-muted-foreground",
          )}
          aria-live="polite"
        >
          {state === "saving" ? t("instructions.saving") : state === "saved" ? t("instructions.saved") : ""}
        </span>
      </div>
      <section className="rounded-xl bg-secondary p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={t("instructions.placeholder")}
          rows={Math.max(12, value.split("\n").length + 2)}
          className={cn(
            "w-full px-4 py-3 text-sm text-foreground leading-relaxed",
            "placeholder:text-muted-foreground/60",
            "bg-background border border-black/[0.04] rounded-lg",
            "outline-none resize-none transition-shadow duration-200",
            "focus:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          )}
        />
      </section>
    </div>
  );
}
