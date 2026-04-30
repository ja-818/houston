import { useEffect, useState } from "react";
import { SkillDetailPage } from "@houston-ai/skills";
import {
  useInstructions,
  useSaveInstructions,
  useLearnings,
  useAddLearning,
  useRemoveLearning,
  useUpdateLearning,
} from "../../hooks/queries";
import type { TabProps } from "../../lib/types";
import { useUIStore } from "../../stores/ui";
import { LearningsContent } from "./learnings-content";
import {
  InstructionsContent,
  SubTabPills,
  type SubTab,
} from "./job-description-parts";
import { ActionsContent } from "./actions-content";
import { useActionSurface } from "./use-action-surface";

export default function JobDescriptionTab({ agent }: TabProps) {
  const path = agent.folderPath;
  const actions = useActionSurface(path);
  const [activeTab, setActiveTab] = useState<SubTab>("instructions");
  const targetTab = useUIStore((s) => s.jobDescriptionTarget);
  const setTargetTab = useUIStore((s) => s.setJobDescriptionTarget);

  // Instructions (CLAUDE.md)
  const { data: instructions } = useInstructions(path);
  const saveInstructions = useSaveInstructions(path);

  useEffect(() => {
    if (!targetTab) return;
    setActiveTab(targetTab);
    actions.clearSelectedSkill();
    setTargetTab(null);
  }, [targetTab, setTargetTab, actions.clearSelectedSkill]);

  // Learnings
  const { data: learningsData } = useLearnings(path);
  const addLearning = useAddLearning(path);
  const removeLearning = useRemoveLearning(path);
  const updateLearning = useUpdateLearning(path);

  // Actions sub-tab in detail mode takes over the whole pane (its own header).
  if (activeTab === "skills" && actions.selectedSkill) {
    return (
      <SkillDetailPage
        skill={actions.selectedSkill}
        onBack={actions.clearSelectedSkill}
        onSave={actions.handleSkillSave}
        onDelete={actions.handleSkillDelete}
        labels={actions.skillDetailLabels}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <SubTabPills activeTab={activeTab} onChange={setActiveTab} />

      {/* Body: each sub-tab decides its own layout. */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {activeTab === "instructions" && (
          <InstructionsContent
            content={instructions ?? ""}
            onSave={(c) =>
              saveInstructions.mutateAsync({ name: "CLAUDE.md", content: c })
            }
          />
        )}

        {activeTab === "skills" && (
          <div className="max-w-3xl mx-auto w-full px-6 pb-12 pt-2 flex-1 flex flex-col">
            <ActionsContent
              skills={actions.skills}
              loading={actions.skillsLoading}
              onActionClick={actions.selectSkill}
              onSearch={actions.handleSearch}
              onInstallCommunity={actions.handleInstallCommunity}
              onListFromRepo={actions.handleListFromRepo}
              onInstallFromRepo={actions.handleInstallFromRepo}
            />
          </div>
        )}

        {activeTab === "learnings" && (
          <LearningsContent
            entries={learningsData?.entries ?? []}
            onAdd={(text) => addLearning.mutateAsync(text)}
            onRemove={(index) => removeLearning.mutateAsync(index)}
            onUpdate={(id, text) => updateLearning.mutateAsync({ id, text })}
          />
        )}
      </div>
    </div>
  );
}
