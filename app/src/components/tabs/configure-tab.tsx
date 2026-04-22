import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import type { TabProps, AgentMode } from "../../lib/types";
import { tauriAgent, tauriConfig } from "../../lib/tauri";
import { queryKeys } from "../../lib/query-keys";
import {
  useInstructions,
  useSaveInstructions,
  useSkills,
  useSkillDetail,
  useSaveSkill,
  useDeleteSkill,
  useSearchCommunitySkills,
  useInstallCommunitySkill,
  useListSkillsFromRepo,
  useInstallSkillFromRepo,
  useLearnings,
  useAddLearning,
  useRemoveLearning,
} from "../../hooks/queries";
import { Section, AutoSaveTextarea, LearningsSection, SettingsForm } from "./configure-sections";

function usePromptFile(agentPath: string, fileName: string) {
  return useQuery({
    queryKey: [...queryKeys.instructions(agentPath), "prompt", fileName],
    queryFn: () =>
      tauriAgent.readFile(agentPath, `.houston/prompts/${fileName}`).catch(() => ""),
    enabled: !!agentPath,
  });
}

function useSavePromptFile(agentPath: string, fileName: string) {
  return useCallback(
    async (content: string) => {
      await tauriAgent.writeFile(agentPath, `.houston/prompts/${fileName}`, content);
    },
    [agentPath, fileName],
  );
}

function PromptEditor({ agentPath, mode }: { agentPath: string; mode: AgentMode }) {
  const { t } = useTranslation("agents");
  const { data: content } = usePromptFile(agentPath, mode.promptFile);
  const save = useSavePromptFile(agentPath, mode.promptFile);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{mode.name}</label>
      <AutoSaveTextarea value={content ?? ""} onSave={save} placeholder={t("configure.agentPrompts.placeholder", { name: mode.name })} />
    </div>
  );
}

export default function ConfigureTab({ agent, agentDef }: TabProps) {
  const { t } = useTranslation("agents");
  const path = agent.folderPath;
  const modes = agentDef.config.agents ?? [];

  const { data: instructions } = useInstructions(path);
  const saveInstructions = useSaveInstructions(path);

  const { data: summaries, isLoading: skillsLoading } = useSkills(path);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const { data: skillDetail } = useSkillDetail(path, selectedSkillName ?? undefined);
  const saveSkill = useSaveSkill(path);
  const deleteSkill = useDeleteSkill(path);
  const installCommunity = useInstallCommunitySkill(path);
  const listFromRepo = useListSkillsFromRepo();
  const installFromRepo = useInstallSkillFromRepo(path);
  const searchCommunity = useSearchCommunitySkills();

  const { data: learningsData } = useLearnings(path);
  const addLearning = useAddLearning(path);
  const removeLearning = useRemoveLearning(path);

  const { data: config } = useQuery({
    queryKey: queryKeys.config(path),
    queryFn: () => tauriConfig.read(path).catch(() => ({})),
  });

  const skills: Skill[] = (summaries ?? []).map((s) => ({
    id: s.name, name: s.name, description: s.description,
    instructions: "", learnings: "", file_path: s.name,
  }));

  const selectedSkill = selectedSkillName && skillDetail
    ? { id: selectedSkillName, name: skillDetail.name, description: skillDetail.description, instructions: skillDetail.content, learnings: "", file_path: selectedSkillName }
    : null;

  const handleSkillClick = useCallback((s: Skill) => setSelectedSkillName(s.name), []);
  const handleSkillSave = useCallback(async (n: string, c: string) => { await saveSkill.mutateAsync({ name: n, content: c }); }, [saveSkill]);
  const handleSkillDelete = useCallback(async (n: string) => { await deleteSkill.mutateAsync(n); setSelectedSkillName(null); }, [deleteSkill]);
  const handleSearch = useCallback(async (q: string) => (await searchCommunity.mutateAsync(q)) as CommunitySkill[], [searchCommunity]);
  const handleInstallCommunity = useCallback(async (s: CommunitySkill) => await installCommunity.mutateAsync({ source: s.source, skillId: s.skillId }), [installCommunity]);
  const handleListFromRepo = useCallback(async (src: string) => await listFromRepo.mutateAsync(src), [listFromRepo]);
  const handleInstallFromRepo = useCallback(async (src: string, s: import("@houston-ai/skills").RepoSkill[]) => await installFromRepo.mutateAsync({ source: src, skills: s }), [installFromRepo]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col gap-10">
        <Section title={t("configure.projectContext.title")} description={t("configure.projectContext.description")}>
          <AutoSaveTextarea
            value={instructions ?? ""}
            onSave={(c) => saveInstructions.mutateAsync({ name: "CLAUDE.md", content: c })}
            placeholder={t("configure.projectContext.placeholder")}
          />
        </Section>

        {modes.length > 0 && (
          <Section title={t("configure.agentPrompts.title")} description={t("configure.agentPrompts.description")}>
            <div className="flex flex-col gap-5">
              {modes.map((mode) => (
                <PromptEditor key={mode.id} agentPath={path} mode={mode} />
              ))}
            </div>
          </Section>
        )}

        <Section title={t("configure.skills.title")} description={t("configure.skills.description")}>
          {selectedSkill ? (
            <SkillDetailPage skill={selectedSkill} onBack={() => setSelectedSkillName(null)} onSave={handleSkillSave} onDelete={handleSkillDelete} />
          ) : (
            <SkillsGrid skills={skills} loading={skillsLoading} onSkillClick={handleSkillClick} onDelete={handleSkillDelete} onSearch={handleSearch} onInstallCommunity={handleInstallCommunity} onListFromRepo={handleListFromRepo} onInstallFromRepo={handleInstallFromRepo} />
          )}
        </Section>

        <Section title={t("configure.learnings.title")} description={t("configure.learnings.description")}>
          <LearningsSection entries={learningsData?.entries ?? []} onAdd={(txt) => addLearning.mutateAsync(txt)} onRemove={(i) => removeLearning.mutateAsync(i)} />
        </Section>

        <Section title={t("configure.settings.title")}>
          <SettingsForm agentPath={path} config={config ?? {}} />
        </Section>
      </div>
    </div>
  );
}
