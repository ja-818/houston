import { useState, useEffect, useCallback } from "react";
import { SkillsGrid, SkillDetailPage } from "@deck-ui/skills";
import type { Skill } from "@deck-ui/skills";
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
        setSelectedSkill({
          ...skill,
          instructions: detail.content,
        });
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
      />
    );
  }

  return (
    <SkillsGrid
      skills={skills}
      loading={loading}
      onSkillClick={handleSkillClick}
    />
  );
}
