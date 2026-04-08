import { useState, useCallback, useEffect } from "react";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import {
  Button,
  Empty, EmptyHeader, EmptyTitle, EmptyDescription,
} from "@houston-ai/core";
import { FileText, Plus, Trash2 } from "lucide-react";
import {
  useInstructions,
  useSaveInstructions,
  useSkills,
  useSkillDetail,
  useSaveSkill,
  useInstallCommunitySkill,
  useListSkillsFromRepo,
  useInstallSkillFromRepo,
  useSearchCommunitySkills,
  useLearnings,
  useAddLearning,
  useRemoveLearning,
} from "../../hooks/queries";
import type { TabProps } from "../../lib/types";

type SubTab = "instructions" | "skills" | "learnings";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "instructions", label: "Instructions" },
  { id: "skills", label: "Skills" },
  { id: "learnings", label: "Learnings" },
];

export default function JobDescriptionTab({ agent }: TabProps) {
  const path = agent.folderPath;
  const [activeTab, setActiveTab] = useState<SubTab>("instructions");

  // Instructions (CLAUDE.md)
  const { data: instructions } = useInstructions(path);
  const saveInstructions = useSaveInstructions(path);

  // Skills
  const { data: summaries, isLoading: skillsLoading } = useSkills(path);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const { data: skillDetail } = useSkillDetail(path, selectedSkillName ?? undefined);
  const saveSkill = useSaveSkill(path);
  const installCommunity = useInstallCommunitySkill(path);
  const listFromRepo = useListSkillsFromRepo();
  const installFromRepo = useInstallSkillFromRepo(path);
  const searchCommunity = useSearchCommunitySkills();

  // Learnings
  const { data: learningsData } = useLearnings(path);
  const addLearning = useAddLearning(path);
  const removeLearning = useRemoveLearning(path);

  const skills: Skill[] = (summaries ?? []).map((s) => ({
    id: s.name,
    name: s.name,
    description: s.description,
    instructions: "",
    learnings: "",
    file_path: s.name,
  }));

  const selectedSkill =
    selectedSkillName && skillDetail
      ? {
          id: selectedSkillName,
          name: skillDetail.name,
          description: skillDetail.description,
          instructions: skillDetail.content,
          learnings: "",
          file_path: selectedSkillName,
        }
      : null;

  const handleSkillClick = useCallback((skill: Skill) => {
    setSelectedSkillName(skill.name);
  }, []);

  const handleSkillSave = useCallback(
    async (skillName: string, content: string) => {
      await saveSkill.mutateAsync({ name: skillName, content });
    },
    [saveSkill],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      return (await searchCommunity.mutateAsync(query)) as CommunitySkill[];
    },
    [searchCommunity],
  );

  const handleInstallCommunity = useCallback(
    async (skill: CommunitySkill) => {
      return await installCommunity.mutateAsync({ source: skill.source, skillId: skill.skillId });
    },
    [installCommunity],
  );

  const handleListFromRepo = useCallback(
    async (source: string) => {
      return await listFromRepo.mutateAsync(source);
    },
    [listFromRepo],
  );

  const handleInstallFromRepo = useCallback(
    async (source: string, skills: import("@houston-ai/skills").RepoSkill[]) => {
      return await installFromRepo.mutateAsync({ source, skills });
    },
    [installFromRepo],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Pill tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === tab.id
                ? "bg-gray-200 text-foreground font-medium dark:bg-gray-700"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {activeTab === "instructions" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              <InstructionsSection
                content={instructions ?? ""}
                onSave={(c) => saveInstructions.mutateAsync({ name: "CLAUDE.md", content: c })}
              />
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="p-6">
            <div className="max-w-3xl mx-auto">
              {selectedSkill ? (
                <SkillDetailPage
                  skill={selectedSkill}
                  onBack={() => setSelectedSkillName(null)}
                  onSave={handleSkillSave}
                />
              ) : (
                <SkillsGrid
                  skills={skills}
                  loading={skillsLoading}
                  onSkillClick={handleSkillClick}
                  onSearch={handleSearch}
                  onInstallCommunity={handleInstallCommunity}
                  onListFromRepo={handleListFromRepo}
                  onInstallFromRepo={handleInstallFromRepo}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "learnings" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              <LearningsSection
                entries={learningsData?.entries ?? []}
                onAdd={(text) => addLearning.mutateAsync(text)}
                onRemove={(index) => removeLearning.mutateAsync(index)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Instructions Section ──────────────────────────────────────────

function InstructionsSection({
  content,
  onSave,
}: {
  content: string;
  onSave: (content: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const handleBlur = async () => {
    if (value !== content) {
      setSaving(true);
      await onSave(value);
      setSaving(false);
    }
  };

  const isEmpty = !value.trim();

  return (
    <section className="flex-1 flex flex-col">
      {saving && (
        <span className="text-[10px] text-muted-foreground/50 mb-1">Saving...</span>
      )}
      {isEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No instructions yet</EmptyTitle>
            <EmptyDescription>
              Write a CLAUDE.md to tell your agent how to behave.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="rounded-full"
            onClick={() => {
              setValue(" ");
              requestAnimationFrame(() => {
                const el = document.querySelector<HTMLTextAreaElement>(
                  "[data-instructions-textarea]",
                );
                if (el) { el.value = ""; setValue(""); el.focus(); }
              });
            }}
          >
            <FileText className="h-4 w-4" />
            Write instructions
          </Button>
        </Empty>
      ) : (
        <textarea
          data-instructions-textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write instructions for your agent here..."
          rows={Math.max(8, value.split("\n").length + 1)}
          className="flex-1 w-full max-w-3xl mx-auto text-sm text-foreground leading-relaxed bg-[#f9f9f9] outline-none rounded-xl px-4 py-3 border border-black/[0.04] hover:border-black/[0.1] focus:border-black/[0.15] focus:bg-white transition-all duration-200 resize-none placeholder:text-muted-foreground/30"
        />
      )}
    </section>
  );
}

// ── Learnings Section ─────────────────────────────────────────────

function LearningsSection({
  entries,
  onAdd,
  onRemove,
}: {
  entries: { index: number; text: string }[];
  onAdd: (text: string) => Promise<unknown>;
  onRemove: (index: number) => Promise<unknown>;
}) {
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText("");
  };

  if (entries.length === 0) {
    return (
      <section>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No learnings yet</EmptyTitle>
            <EmptyDescription>
              The agent will save learnings here as it works, or you can add them manually.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="rounded-full" onClick={() => onAdd("New learning")}>
            <Plus className="h-4 w-4" />
            Add learning
          </Button>
        </Empty>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add a learning..."
          className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          onClick={handleAdd}
          disabled={!newText.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.index} className="flex items-start gap-2 text-sm">
            <span className="flex-1 bg-secondary rounded-lg px-3 py-2">
              {entry.text}
            </span>
            <button
              onClick={() => onRemove(entry.index)}
              className="shrink-0 mt-1.5 size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Remove learning"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
