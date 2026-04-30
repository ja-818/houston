import { useCallback, useState } from "react";
import type { CommunitySkill, RepoSkill, Skill } from "@houston-ai/skills";
import {
  useDeleteSkill,
  useInstallCommunitySkill,
  useInstallSkillFromRepo,
  useListSkillsFromRepo,
  useSaveSkill,
  useSearchCommunitySkills,
  useSkillDetail,
  useSkills,
} from "../../hooks/queries";
import { useSkillSurfaceLabels } from "./use-skill-surface-labels";

export function useActionSurface(agentPath: string) {
  const { skillDetailLabels } = useSkillSurfaceLabels();
  const { data: summaries, isLoading: skillsLoading } = useSkills(agentPath);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const { data: skillDetail } = useSkillDetail(
    agentPath,
    selectedSkillName ?? undefined,
  );
  const saveSkill = useSaveSkill(agentPath);
  const deleteSkill = useDeleteSkill(agentPath);
  const installCommunity = useInstallCommunitySkill(agentPath);
  const listFromRepo = useListSkillsFromRepo();
  const installFromRepo = useInstallSkillFromRepo(agentPath);
  const searchCommunity = useSearchCommunitySkills();

  const selectedSkill: Skill | undefined =
    selectedSkillName && skillDetail
      ? {
          id: selectedSkillName,
          name: skillDetail.name,
          description: skillDetail.description,
          instructions: skillDetail.content,
          file_path: selectedSkillName,
        }
      : undefined;

  const clearSelectedSkill = useCallback(() => {
    setSelectedSkillName(null);
  }, []);

  const handleSkillSave = useCallback(
    async (name: string, content: string) => {
      await saveSkill.mutateAsync({ name, content });
    },
    [saveSkill],
  );

  const handleSkillDelete = useCallback(
    async (name: string) => {
      await deleteSkill.mutateAsync(name);
      setSelectedSkillName(null);
    },
    [deleteSkill],
  );

  const handleSearch = useCallback(
    async (query: string) =>
      (await searchCommunity.mutateAsync(query)) as CommunitySkill[],
    [searchCommunity],
  );

  const handleInstallCommunity = useCallback(
    async (skill: CommunitySkill) =>
      installCommunity.mutateAsync({
        source: skill.source,
        skillId: skill.skillId,
      }),
    [installCommunity],
  );

  const handleListFromRepo = useCallback(
    async (source: string) => listFromRepo.mutateAsync(source),
    [listFromRepo],
  );

  const handleInstallFromRepo = useCallback(
    async (source: string, skills: RepoSkill[]) =>
      installFromRepo.mutateAsync({ source, skills }),
    [installFromRepo],
  );

  return {
    skillDetailLabels,
    skills: summaries ?? [],
    skillsLoading,
    selectedSkill,
    selectSkill: setSelectedSkillName,
    clearSelectedSkill,
    handleSkillSave,
    handleSkillDelete,
    handleSearch,
    handleInstallCommunity,
    handleListFromRepo,
    handleInstallFromRepo,
  };
}
