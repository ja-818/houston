import { useTranslation } from "react-i18next";
import type { ToolkitSuggestion } from "../lib/toolkit-suggestions";
import { SkillCard } from "./skill-card";

interface Props {
  suggestions: ToolkitSuggestion[];
  onPick: (prompt: string) => void;
  onConnectClick?: () => void;
}

export function ToolkitSuggestionsEmptyState({
  suggestions,
  onPick,
  onConnectClick,
}: Props) {
  const { t } = useTranslation("board");
  const isEmpty = suggestions.length === 0;
  return (
    <div className="self-stretch w-full h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-4 flex flex-col gap-3">
        <div className="text-center mb-1">
          <h3 className="text-base font-semibold text-foreground">
            {t(
              isEmpty
                ? "chatEmpty.suggestions.headingEmpty"
                : "chatEmpty.suggestions.heading",
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              isEmpty
                ? "chatEmpty.suggestions.subheadingEmpty"
                : "chatEmpty.suggestions.subheading",
            )}
          </p>
        </div>
        {isEmpty && onConnectClick ? (
          <SkillCard
            image="electric-plug"
            title={t("chatEmpty.suggestions.connectCta.title")}
            description={t("chatEmpty.suggestions.connectCta.description")}
            onClick={onConnectClick}
          />
        ) : (
          suggestions.map((s) => (
            <SkillCard
              key={s.id}
              image={s.image}
              title={t(`chatEmpty.suggestions.${s.id}.title` as const)}
              description={t(`chatEmpty.suggestions.${s.id}.description` as const)}
              integrations={s.toolkits}
              onClick={() => onPick(t(`chatEmpty.suggestions.${s.id}.prompt` as const))}
            />
          ))
        )}
      </div>
    </div>
  );
}
