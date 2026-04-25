import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Textarea } from "@houston-ai/core";
import { ArrowUp, X } from "lucide-react";
import { SkillIcon } from "./skill-icon";
import { IntegrationLogos } from "./integration-logos";
import type { SkillSummary } from "../lib/types";

interface Props {
  skill: SkillSummary;
  /**
   * Fires with the user's filled values. The parent assembles the
   * Claude-bound prompt + the chat-feed display marker so the form
   * doesn't need to know about either.
   */
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

/**
 * Composer-replacement card rendered when the user has picked an action.
 *
 * Owns the bottom of the chat panel until the user hits Start or Cancel.
 * Renders one labeled field per declared `inputs` entry; for actions
 * that don't declare inputs the form just shows the action info plus a
 * Start button (the user is confirming "go run this") so the UX is
 * symmetric with input-bearing actions.
 *
 * "Start" assembles the final prompt by interpolating `{{var}}`
 * placeholders against the form values, falling back to a synthesised
 * structured prompt when the author didn't provide a `prompt_template`.
 */
export function ActionForm({ skill, onSubmit, onCancel }: Props) {
  const { t } = useTranslation("board");

  const [values, setValues] = useState<Record<string, string>>(() =>
    seedValues(skill),
  );

  // Reset values when the user switches actions without dismissing.
  useEffect(() => {
    setValues(seedValues(skill));
  }, [skill.name, skill.inputs]);

  const isValid = useMemo(
    () =>
      skill.inputs.every(
        (i) => !i.required || (values[i.name] ?? "").trim() !== "",
      ),
    [skill.inputs, values],
  );

  const handleStart = () => {
    if (!isValid) return;
    onSubmit(values);
  };

  return (
    <div
      className={
        // Mirror the composer's container styling so the action card reads
        // as the same surface the chat input lives on (rounded, card bg,
        // soft border + subtle shadow).
        "rounded-[28px] border border-border/50 bg-card p-3 w-full " +
        "shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
      }
    >
      <div className="flex items-start gap-3 mb-3 px-1.5 pt-1.5">
        <SkillIcon image={skill.image} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {humanize(skill.name)}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("actionForm.cancel")}
              className="size-6 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground flex items-center justify-center shrink-0 -mr-1 -mt-1"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {skill.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {skill.description}
            </p>
          )}
          {skill.integrations.length > 0 && (
            <div className="mt-2">
              <IntegrationLogos toolkits={skill.integrations} />
            </div>
          )}
        </div>
      </div>

      {skill.inputs.length > 0 && (
        <div className="flex flex-col gap-3 mb-3 px-1.5">
          {skill.inputs.map((input) => (
            <div key={input.name} className="flex flex-col gap-1.5">
              <label
                htmlFor={`action-input-${input.name}`}
                className="text-xs font-medium text-foreground"
              >
                {input.label}
                {!input.required && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                    {t("actionForm.optional")}
                  </span>
                )}
              </label>
              {input.type === "textarea" ? (
                <Textarea
                  id={`action-input-${input.name}`}
                  value={values[input.name] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [input.name]: e.target.value }))
                  }
                  placeholder={input.placeholder}
                  className="min-h-[72px] resize-none"
                />
              ) : input.type === "select" ? (
                <select
                  id={`action-input-${input.name}`}
                  value={values[input.name] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [input.name]: e.target.value }))
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {!input.required && (
                    <option value="">{input.placeholder ?? "—"}</option>
                  )}
                  {(input.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`action-input-${input.name}`}
                  value={values[input.name] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [input.name]: e.target.value }))
                  }
                  placeholder={input.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStart();
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end px-1.5 pb-1.5">
        <button
          type="button"
          aria-label={t("actionForm.start")}
          onClick={handleStart}
          disabled={!isValid}
          data-keep-panel-open
          className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Initial values for the form. For `select` inputs we default to the
 * declared `default`, otherwise the first option (so a required select
 * is always pre-filled and doesn't gate the Start button on a no-op).
 */
function seedValues(skill: SkillSummary): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of skill.inputs) {
    if (i.type === "select") {
      out[i.name] =
        i.default ?? (i.required ? (i.options?.[0] ?? "") : "");
    } else {
      out[i.name] = i.default ?? "";
    }
  }
  return out;
}

function humanize(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  return spaced.length === 0
    ? slug
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
