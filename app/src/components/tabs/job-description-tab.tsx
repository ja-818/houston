import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { SkillsGrid, SkillDetailPage } from "@houston-ai/skills";
import type { Skill, CommunitySkill } from "@houston-ai/skills";
import {
  cn,
  Button,
  ConfirmDialog,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core";
import { FileText, Plus, Trash2 } from "lucide-react";
import {
  useInstructions,
  useSaveInstructions,
  useSkills,
  useSkillDetail,
  useSaveSkill,
  useDeleteSkill,
  useInstallCommunitySkill,
  useListSkillsFromRepo,
  useInstallSkillFromRepo,
  useSearchCommunitySkills,
  useLearnings,
  useAddLearning,
  useRemoveLearning,
  useUpdateLearning,
} from "../../hooks/queries";
import type { TabProps } from "../../lib/types";
import { useUIStore } from "../../stores/ui";

type SubTab = "instructions" | "skills" | "learnings";

const SUB_TAB_IDS: SubTab[] = ["instructions", "skills", "learnings"];

export default function JobDescriptionTab({ agent }: TabProps) {
  const { t } = useTranslation("agents");
  const { t: tSkills } = useTranslation(["skills", "common"]);
  const skillDetailLabels = {
    notFound: tSkills("skills:detail.notFound"),
    backAria: tSkills("skills:detail.backAria"),
    saveChanges: tSkills("skills:detail.saveChanges"),
    savingChanges: tSkills("skills:detail.savingChanges"),
    moreActions: tSkills("skills:detail.moreActions"),
    delete: tSkills("skills:detail.delete"),
    deleteTitle: (name: string) => tSkills("skills:detail.deleteTitle", { name }),
    deleteDescription: tSkills("skills:detail.deleteDescription"),
    deleteConfirmLabel: tSkills("common:actions.delete"),
    instructionsPlaceholder: tSkills("skills:detail.instructionsPlaceholder"),
  };
  const path = agent.folderPath;
  const [activeTab, setActiveTab] = useState<SubTab>("instructions");
  const targetTab = useUIStore((s) => s.jobDescriptionTarget);
  const setTargetTab = useUIStore((s) => s.setJobDescriptionTarget);

  // Instructions (CLAUDE.md)
  const { data: instructions } = useInstructions(path);
  const saveInstructions = useSaveInstructions(path);

  // Skills
  const { data: summaries, isLoading: skillsLoading } = useSkills(path);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  useEffect(() => {
    if (!targetTab) return;
    setActiveTab(targetTab);
    setSelectedSkillName(null);
    setTargetTab(null);
  }, [targetTab, setTargetTab]);
  const { data: skillDetail } = useSkillDetail(path, selectedSkillName ?? undefined);
  const saveSkill = useSaveSkill(path);
  const deleteSkill = useDeleteSkill(path);
  const installCommunity = useInstallCommunitySkill(path);
  const listFromRepo = useListSkillsFromRepo();
  const installFromRepo = useInstallSkillFromRepo(path);
  const searchCommunity = useSearchCommunitySkills();

  // Learnings
  const { data: learningsData } = useLearnings(path);
  const addLearning = useAddLearning(path);
  const removeLearning = useRemoveLearning(path);
  const updateLearning = useUpdateLearning(path);

  const skills: Skill[] = useMemo(
    () =>
      (summaries ?? []).map((s) => ({
        id: s.name,
        name: s.name,
        description: s.description,
        instructions: "",
        file_path: s.name,
      })),
    [summaries],
  );

  const selectedSkill =
    selectedSkillName && skillDetail
      ? {
          id: selectedSkillName,
          name: skillDetail.name,
          description: skillDetail.description,
          instructions: skillDetail.content,
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

  const handleSkillDelete = useCallback(
    async (skillName: string) => {
      await deleteSkill.mutateAsync(skillName);
      setSelectedSkillName(null);
    },
    [deleteSkill],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      return (await searchCommunity.mutateAsync(query)) as CommunitySkill[];
    },
    [searchCommunity],
  );

  const handleInstallCommunity = useCallback(
    async (skill: CommunitySkill) => {
      return await installCommunity.mutateAsync({
        source: skill.source,
        skillId: skill.skillId,
      });
    },
    [installCommunity],
  );

  const handleListFromRepo = useCallback(
    async (source: string) => listFromRepo.mutateAsync(source),
    [listFromRepo],
  );

  const handleInstallFromRepo = useCallback(
    async (
      source: string,
      repoSkills: import("@houston-ai/skills").RepoSkill[],
    ) => installFromRepo.mutateAsync({ source, skills: repoSkills }),
    [installFromRepo],
  );

  // Skills sub-tab in detail mode takes over the whole pane (its own header).
  if (activeTab === "skills" && selectedSkill) {
    return (
      <SkillDetailPage
        skill={selectedSkill}
        onBack={() => setSelectedSkillName(null)}
        onSave={handleSkillSave}
        onDelete={handleSkillDelete}
        labels={skillDetailLabels}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Sub-tab pills */}
      <div className="flex gap-1 px-6 pt-4 pb-3 shrink-0">
        {SUB_TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-medium transition-colors",
              activeTab === tabId
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
            )}
          >
            {t(`subTabs.${tabId}`)}
          </button>
        ))}
      </div>

      {/* Body — each sub-tab decides its own layout (centered Empty vs scrolled card) */}
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
          <SkillsContent
            skills={skills}
            loading={skillsLoading}
            onSkillClick={handleSkillClick}
            onDelete={handleSkillDelete}
            onSearch={handleSearch}
            onInstallCommunity={handleInstallCommunity}
            onListFromRepo={handleListFromRepo}
            onInstallFromRepo={handleInstallFromRepo}
          />
        )}

        {activeTab === "learnings" && (
          <LearningsContent
            entries={(learningsData?.entries ?? []) as LearningEntry[]}
            onAdd={(text) => addLearning.mutateAsync(text)}
            onRemove={(index) => removeLearning.mutateAsync(index)}
            onUpdate={(id, text) => updateLearning.mutateAsync({ id, text })}
          />
        )}
      </div>
    </div>
  );
}

// ── Instructions ──────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved";

function InstructionsContent({
  content,
  onSave,
}: {
  content: string;
  onSave: (content: string) => Promise<unknown>;
}) {
  const { t } = useTranslation("agents");
  const [value, setValue] = useState(content);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    setValue(content);
  }, [content]);

  const showEmpty = !value.trim() && !editing;

  const textareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (el && editing) el.focus();
    },
    [editing],
  );

  const handleBlur = async () => {
    if (value === content) return;
    setState("saving");
    await onSave(value);
    setState("saved");
    window.setTimeout(() => setState("idle"), 2000);
  };

  if (showEmpty) {
    return (
      <div className="mx-auto max-w-md flex flex-col items-center gap-6 text-center pt-24 px-6">
        <EmptyHeader>
          <EmptyTitle>{t("instructions.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("instructions.emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() => {
            setValue("");
            setEditing(true);
          }}
        >
          <FileText className="size-4" />
          {t("instructions.writeButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-12 pt-2">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <p className="text-xs text-muted-foreground max-w-md">
          {t("instructions.helper")}
        </p>
        <span
          className={cn(
            "text-[11px] tabular-nums transition-opacity duration-200",
            state === "idle"
              ? "opacity-0"
              : "opacity-100 text-muted-foreground",
          )}
          aria-live="polite"
        >
          {state === "saving" ? t("instructions.saving") : state === "saved" ? t("instructions.saved") : ""}
        </span>
      </div>
      <section className="rounded-xl bg-secondary p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={t("instructions.placeholder")}
          rows={Math.max(12, value.split("\n").length + 2)}
          className={cn(
            "w-full px-4 py-3 text-sm text-foreground leading-relaxed",
            "placeholder:text-muted-foreground/60",
            "bg-background border border-black/[0.04] rounded-lg",
            "outline-none resize-none transition-shadow duration-200",
            "focus:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          )}
        />
      </section>
    </div>
  );
}

// ── Skills ────────────────────────────────────────────────────────

type SkillsContentProps = React.ComponentProps<typeof SkillsGrid>;

function SkillsContent(props: SkillsContentProps) {
  const { t } = useTranslation("skills");
  const labels = {
    loading: t("grid.loading"),
    emptyTitle: t("grid.emptyTitle"),
    emptyDescription: t("grid.emptyDescription"),
    addSkill: t("grid.addSkill"),
    descriptionShort: t("grid.descriptionShort"),
    deleteTitle: (name: string) => t("detail.deleteTitle", { name }),
    deleteDescription: t("detail.deleteDescription"),
    deleteConfirmLabel: t("detail.delete"),
  };
  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-12 pt-2 flex-1 flex flex-col">
      <SkillsGrid {...props} labels={labels} />
    </div>
  );
}

// ── Learnings ─────────────────────────────────────────────────────

interface LearningEntry {
  index: number;
  text: string;
  id: string;
}

function LearningsContent({
  entries,
  onAdd,
  onRemove,
  onUpdate,
}: {
  entries: LearningEntry[];
  onAdd: (text: string) => Promise<unknown>;
  onRemove: (index: number) => Promise<unknown>;
  onUpdate: (id: string, text: string) => Promise<unknown>;
}) {
  const { t } = useTranslation("agents");
  // Local IDs for unsaved drafts (separate from server-assigned IDs).
  const [drafts, setDrafts] = useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = useState<LearningEntry | null>(null);

  const draftCounterRef = useRef(0);

  const addDraft = () => {
    draftCounterRef.current += 1;
    setDrafts((prev) => [`draft-${draftCounterRef.current}`, ...prev]);
  };

  const removeDraft = (localId: string) => {
    setDrafts((prev) => prev.filter((id) => id !== localId));
  };

  const handleSaveDraft = async (localId: string, text: string) => {
    removeDraft(localId);
    await onAdd(text);
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    const idx = pendingRemove.index;
    setPendingRemove(null);
    await onRemove(idx);
  };

  // Pure empty: no entries and no drafts in flight.
  if (entries.length === 0 && drafts.length === 0) {
    return (
      <div className="mx-auto max-w-md flex flex-col items-center gap-6 text-center pt-24 px-6">
        <EmptyHeader>
          <EmptyTitle>{t("learnings.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("learnings.emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={addDraft}>
          <Plus className="size-4" />
          {t("learnings.addLearning")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-12 pt-2">
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-xs text-muted-foreground max-w-md">
          {t("learnings.helper")}
        </p>
        <Button size="sm" onClick={addDraft} className="shrink-0">
          <Plus className="size-3.5" />
          {t("learnings.addLearning")}
        </Button>
      </div>

      <div className="rounded-xl bg-secondary overflow-hidden divide-y divide-border/60">
        {drafts.map((localId) => (
          <LearningRow
            key={localId}
            initialText=""
            isDraft
            onSave={(text) => handleSaveDraft(localId, text)}
            onCancel={() => removeDraft(localId)}
          />
        ))}
        {entries.map((entry) => (
          <LearningRow
            key={entry.id}
            initialText={entry.text}
            onSave={(text) => onUpdate(entry.id, text)}
            onDelete={() => setPendingRemove(entry)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        title={t("learnings.confirmRemoveTitle")}
        description={t("learnings.confirmRemoveDescription")}
        confirmLabel={t("learnings.confirmRemoveLabel")}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}

/**
 * One row in the learnings list. Always-editable input that looks like text;
 * persists on blur or Enter. Drafts (no server id yet) call `onCancel` if
 * blurred while empty so we don't keep a dangling row.
 */
function LearningRow({
  initialText,
  onSave,
  onDelete,
  onCancel,
  isDraft,
}: {
  initialText: string;
  onSave: (text: string) => Promise<unknown> | unknown;
  onDelete?: () => void;
  onCancel?: () => void;
  isDraft?: boolean;
}) {
  const { t } = useTranslation(["agents", "common"]);
  const [value, setValue] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialText);
  }, [initialText]);

  useEffect(() => {
    if (isDraft) inputRef.current?.focus();
  }, [isDraft]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      // Empty: drafts get cancelled, existing rows revert.
      if (isDraft && onCancel) onCancel();
      else setValue(initialText);
      return;
    }
    if (trimmed === initialText) return;
    await onSave(trimmed);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-5 py-3",
        "transition-colors duration-150",
        "hover:bg-black/[0.03] focus-within:bg-black/[0.03]",
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            if (isDraft && onCancel) onCancel();
            else {
              setValue(initialText);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }
        }}
        onBlur={commit}
        placeholder={isDraft ? t("agents:learnings.inputPlaceholder") : ""}
        className={cn(
          "flex-1 bg-transparent text-sm text-foreground",
          "placeholder:text-muted-foreground/60",
          "outline-none min-w-0",
        )}
      />
      {onDelete && (
        <button
          onClick={onDelete}
          className={cn(
            "shrink-0 size-7 flex items-center justify-center rounded-md",
            "text-muted-foreground hover:text-red-500 hover:bg-black/[0.05]",
            "transition-colors",
          )}
          aria-label={t("agents:learnings.removeAria")}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
      {isDraft && onCancel && (
        <button
          onClick={onCancel}
          className={cn(
            "shrink-0 text-[11px] text-muted-foreground hover:text-foreground",
            "px-2 py-1 rounded-md transition-colors",
          )}
        >
          {t("common:actions.cancel")}
        </button>
      )}
    </div>
  );
}
