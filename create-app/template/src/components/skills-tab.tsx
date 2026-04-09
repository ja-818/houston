import { useState, useEffect, useCallback } from "react";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import { tauriSkills } from "../lib/tauri";

interface SkillsTabProps {
  workspacePath: string;
}

export function SkillsTab({ workspacePath }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await tauriSkills.list(workspacePath);
      const mapped: Skill[] = summaries.map((s) => ({
        id: s.name,
        name: s.name,
        description: s.description,
        instructions: "",
        learnings: "",
        file_path: s.name,
      }));
      setSkills(mapped);
    } catch (e) {
      console.error("[skills] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [workspacePath]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSkillClick = useCallback(
    async (skill: Skill) => {
      try {
        const detail = await tauriSkills.load(workspacePath, skill.name);
        setSelectedSkill({ ...skill, instructions: detail.content });
      } catch (e) {
        console.error("[skills] Failed to load detail:", e);
      }
    },
    [workspacePath],
  );

  const handleSave = useCallback(
    async (skillName: string, instructions: string) => {
      await tauriSkills.save(workspacePath, skillName, instructions);
    },
    [workspacePath],
  );

  const handleDelete = useCallback(
    async (skillName: string) => {
      await tauriSkills.delete(workspacePath, skillName);
      await loadSkills();
    },
    [workspacePath, loadSkills],
  );

  const handleSearch = useCallback(async (query: string) => {
    const results = await tauriSkills.searchCommunity(query);
    return results as CommunitySkill[];
  }, []);

  const handleInstallCommunity = useCallback(
    async (skill: CommunitySkill) => {
      const name = await tauriSkills.installCommunity(
        workspacePath,
        skill.source,
        skill.skillId,
      );
      await loadSkills();
      return name;
    },
    [workspacePath, loadSkills],
  );

  const handleInstallFromRepo = useCallback(
    async (source: string) => {
      const installed = await tauriSkills.installFromRepo(
        workspacePath,
        source,
      );
      await loadSkills();
      return installed;
    },
    [workspacePath, loadSkills],
  );

  const handleBack = useCallback(() => {
    setSelectedSkill(null);
    loadSkills();
  }, [loadSkills]);

  if (selectedSkill) {
    return (
      <SkillDetailPage
        skill={selectedSkill}
        onBack={handleBack}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <SkillsGrid
      skills={skills}
      loading={loading}
      onSkillClick={handleSkillClick}
      onSearch={handleSearch}
      onInstallCommunity={handleInstallCommunity}
      onInstallFromRepo={handleInstallFromRepo}
    />
  );
}
