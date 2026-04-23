import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import type { TabProps } from "../../lib/types";
import {
  useSkills,
  useSkillDetail,
  useSaveSkill,
  useDeleteSkill,
  useSearchCommunitySkills,
  useInstallCommunitySkill,
  useListSkillsFromRepo,
  useInstallSkillFromRepo,
} from "../../hooks/queries";

export default function SkillsTab({ agent }: TabProps) {
  const { t } = useTranslation(["skills", "common"]);
  const skillDetailLabels = {
    notFound: t("skills:detail.notFound"),
    backAria: t("skills:detail.backAria"),
    saveChanges: t("skills:detail.saveChanges"),
    savingChanges: t("skills:detail.savingChanges"),
    moreActions: t("skills:detail.moreActions"),
    delete: t("skills:detail.delete"),
    deleteTitle: (name: string) => t("skills:detail.deleteTitle", { name }),
    deleteDescription: t("skills:detail.deleteDescription"),
    deleteConfirmLabel: t("common:actions.delete"),
    instructionsPlaceholder: t("skills:detail.instructionsPlaceholder"),
  };
  const path = agent.folderPath;
  const { data: summaries, isLoading: skillsLoading } = useSkills(path);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const { data: skillDetail } = useSkillDetail(path, selectedSkillName ?? undefined);
  const saveSkill = useSaveSkill(path);
  const deleteSkill = useDeleteSkill(path);
  const installCommunity = useInstallCommunitySkill(path);
  const listFromRepo = useListSkillsFromRepo();
  const installFromRepo = useInstallSkillFromRepo(path);
  const searchCommunity = useSearchCommunitySkills();

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
      <div className="max-w-3xl mx-auto px-6 py-6">
        <h2 className="text-sm font-medium text-foreground">{t("page.title")}</h2>
        <p className="text-xs text-muted-foreground/60 mt-0.5 mb-3">
          {t("page.description")}
        </p>
        {selectedSkill ? (
          <SkillDetailPage skill={selectedSkill} onBack={() => setSelectedSkillName(null)} onSave={handleSkillSave} onDelete={handleSkillDelete} labels={skillDetailLabels} />
        ) : (
          <SkillsGrid
            skills={skills}
            loading={skillsLoading}
            onSkillClick={handleSkillClick}
            onDelete={handleSkillDelete}
            onSearch={handleSearch}
            onInstallCommunity={handleInstallCommunity}
            onListFromRepo={handleListFromRepo}
            onInstallFromRepo={handleInstallFromRepo}
            labels={{
              loading: t("grid.loading"),
              emptyTitle: t("grid.emptyTitle"),
              emptyDescription: t("grid.emptyDescription"),
              addSkill: t("grid.addSkill"),
              descriptionShort: t("grid.descriptionShort"),
              deleteTitle: (name) => t("detail.deleteTitle", { name }),
              deleteDescription: t("detail.deleteDescription"),
              deleteConfirmLabel: t("detail.delete"),
            }}
          />
        )}
      </div>
    </div>
  );
}
