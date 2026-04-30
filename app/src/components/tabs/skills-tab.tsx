import { useTranslation } from "react-i18next";
import { SkillDetailPage } from "@houston-ai/skills";
import type { TabProps } from "../../lib/types";
import { ActionsContent } from "./actions-content";
import { useActionSurface } from "./use-action-surface";

export default function SkillsTab({ agent }: TabProps) {
  const { t } = useTranslation("skills");
  const actions = useActionSurface(agent.folderPath);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <h2 className="text-sm font-medium text-foreground">{t("page.title")}</h2>
        <p className="text-xs text-muted-foreground/60 mt-0.5 mb-3">
          {t("page.description")}
        </p>
        {actions.selectedSkill ? (
          <SkillDetailPage
            skill={actions.selectedSkill}
            onBack={actions.clearSelectedSkill}
            onSave={actions.handleSkillSave}
            onDelete={actions.handleSkillDelete}
            labels={actions.skillDetailLabels}
          />
        ) : (
          <ActionsContent
            skills={actions.skills}
            loading={actions.skillsLoading}
            onActionClick={actions.selectSkill}
            onSearch={actions.handleSearch}
            onInstallCommunity={actions.handleInstallCommunity}
            onListFromRepo={actions.handleListFromRepo}
            onInstallFromRepo={actions.handleInstallFromRepo}
          />
        )}
      </div>
    </div>
  );
}
