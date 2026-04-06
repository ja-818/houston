import { useState, useEffect, useCallback } from "react";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import { ContentArea } from "../shell/content-area";
import { tauriSkills } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function SkillsTab({ workspace }: TabProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const path = workspace.folderPath;

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await tauriSkills.list(path);
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
  }, [path]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSkillClick = useCallback(
    async (skill: Skill) => {
      try {
        const detail = await tauriSkills.load(path, skill.name);
        setSelectedSkill({ ...skill, instructions: detail.content });
      } catch (e) {
        console.error("[skills] Failed to load detail:", e);
      }
    },
    [path],
  );

  const handleSave = useCallback(
    async (skillName: string, instructions: string) => {
      await tauriSkills.save(path, skillName, instructions);
    },
    [path],
  );

  const handleSearch = useCallback(async (query: string) => {
    const results = await tauriSkills.searchCommunity(query);
    return results as CommunitySkill[];
  }, []);

  const handleInstallCommunity = useCallback(
    async (skill: CommunitySkill) => {
      const name = await tauriSkills.installCommunity(
        path,
        skill.source,
        skill.skillId,
      );
      await loadSkills();
      return name;
    },
    [path, loadSkills],
  );

  const handleInstallFromRepo = useCallback(
    async (source: string) => {
      const installed = await tauriSkills.installFromRepo(path, source);
      await loadSkills();
      return installed;
    },
    [path, loadSkills],
  );

  const handleBack = useCallback(() => {
    setSelectedSkill(null);
    loadSkills();
  }, [loadSkills]);

  if (selectedSkill) {
    return (
      <ContentArea centered>
        <SkillDetailPage
          skill={selectedSkill}
          onBack={handleBack}
          onSave={handleSave}
        />
      </ContentArea>
    );
  }

  return (
    <ContentArea centered>
      <SkillsGrid
        skills={skills}
        loading={loading}
        onSkillClick={handleSkillClick}
        onSearch={handleSearch}
        onInstallCommunity={handleInstallCommunity}
        onInstallFromRepo={handleInstallFromRepo}
      />
    </ContentArea>
  );
}
