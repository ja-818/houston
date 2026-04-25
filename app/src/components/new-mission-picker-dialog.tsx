import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Spinner,
} from "@houston-ai/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSkills } from "../hooks/queries";
import { SkillCard } from "./skill-card";
import type { Agent, SkillSummary } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When set, the dialog is locked to this agent and the agent selector is
   * hidden (per-agent board button). When omitted, the dialog exposes an
   * agent picker (Mission Control).
   */
  lockedAgent?: Agent;
  agents?: Agent[];
  onBlank?: (agentPath: string | undefined) => void;
  onSkill: (agentPath: string, skillName: string) => void;
  /** Hide the "Blank conversation" card on the Featured tab. */
  hideBlank?: boolean;
}

const FEATURED_TAB = "__featured__";
const OTHER_TAB = "__other__";

/** Turn a skill slug like "do-something_cool" into "Do something cool". */
function humanizeSkillName(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  if (spaced.length === 0) return slug;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function NewMissionPickerDialog({
  open,
  onOpenChange,
  lockedAgent,
  agents = [],
  onBlank,
  onSkill,
  hideBlank = false,
}: Props) {
  const { t } = useTranslation("dashboard");

  const [pickedAgentPath, setPickedAgentPath] = useState<string>("");
  const activeAgentPath = lockedAgent
    ? lockedAgent.folderPath
    : pickedAgentPath || (agents.length === 1 ? agents[0].folderPath : "");

  const { data: skills, isLoading: skillsLoading } = useSkills(
    activeAgentPath || undefined,
  );

  const { categoryNames, byCategory, featured } = useMemo(() => {
    const byCategory = new Map<string, SkillSummary[]>();
    const featured: SkillSummary[] = [];
    for (const s of skills ?? []) {
      if (s.featured) featured.push(s);
      const cat = s.category?.trim() || OTHER_TAB;
      const list = byCategory.get(cat) ?? [];
      list.push(s);
      byCategory.set(cat, list);
    }
    const names = Array.from(byCategory.keys())
      .filter((c) => c !== OTHER_TAB)
      .sort((a, b) => a.localeCompare(b));
    return { categoryNames: names, byCategory, featured };
  }, [skills]);

  const hasOther = byCategory.has(OTHER_TAB);

  const [activeTab, setActiveTab] = useState<string>(FEATURED_TAB);

  useEffect(() => {
    if (open) setActiveTab(FEATURED_TAB);
  }, [open, activeAgentPath]);

  const tabs: { id: string; label: string }[] = [
    { id: FEATURED_TAB, label: t("actionPicker.featuredTab") },
    ...categoryNames.map((c) => ({ id: c, label: c })),
    ...(hasOther ? [{ id: OTHER_TAB, label: t("actionPicker.otherTab") }] : []),
  ];

  const skillsForActiveTab: SkillSummary[] =
    activeTab === FEATURED_TAB ? featured : byCategory.get(activeTab) ?? [];

  const sortedSkills = useMemo(
    () => [...skillsForActiveTab].sort((a, b) => a.name.localeCompare(b.name)),
    [skillsForActiveTab],
  );

  const showBlankCard = !hideBlank && activeTab === FEATURED_TAB;

  const handleBlank = () => {
    if (!onBlank) return;
    if (lockedAgent && !activeAgentPath) return;
    onBlank(activeAgentPath || undefined);
    onOpenChange(false);
  };

  const handleSkill = (name: string) => {
    if (!activeAgentPath) return;
    onSkill(activeAgentPath, name);
    onOpenChange(false);
  };

  const needsAgent = !activeAgentPath;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
          <DialogTitle>{t("actionPicker.title")}</DialogTitle>
          <DialogDescription>
            {lockedAgent
              ? t("actionPicker.descriptionWithAgent", { name: lockedAgent.name })
              : t("actionPicker.description")}
          </DialogDescription>
        </DialogHeader>

        {!lockedAgent && agents.length > 1 && (
          <div className="shrink-0 px-6 pb-3">
            <label htmlFor="nmp-agent" className="text-sm font-medium block mb-1.5">
              {t("actionPicker.agentLabel")}
            </label>
            <select
              id="nmp-agent"
              value={pickedAgentPath}
              onChange={(e) => setPickedAgentPath(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("actionPicker.agentPlaceholder")}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.folderPath}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <ScrollableTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <div className="flex flex-col gap-2">
            {showBlankCard && (
              <SkillCard
                image="speech-balloon"
                title={t("actionPicker.blank")}
                description={t("actionPicker.blankDescription")}
                onClick={handleBlank}
                disabled={!!lockedAgent && needsAgent}
              />
            )}

            <SkillList
              agentReady={!needsAgent}
              loading={skillsLoading}
              skills={sortedSkills}
              emptyLabel={
                activeTab === FEATURED_TAB
                  ? t("actionPicker.featuredEmpty")
                  : t("actionPicker.skillsEmpty")
              }
              pickAgentLabel={t("actionPicker.pickAgentFirst")}
              loadingLabel={t("actionPicker.skillsLoading")}
              hideEmpty={showBlankCard && sortedSkills.length === 0}
              onSkill={handleSkill}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SkillList({
  agentReady,
  loading,
  skills,
  emptyLabel,
  pickAgentLabel,
  loadingLabel,
  hideEmpty,
  onSkill,
}: {
  agentReady: boolean;
  loading: boolean;
  skills: SkillSummary[];
  emptyLabel: string;
  pickAgentLabel: string;
  loadingLabel: string;
  hideEmpty?: boolean;
  onSkill: (name: string) => void;
}) {
  if (!agentReady) {
    return <p className="text-sm text-muted-foreground">{pickAgentLabel}</p>;
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-3.5" />
        {loadingLabel}
      </div>
    );
  }
  if (skills.length === 0) {
    if (hideEmpty) return null;
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <>
      {skills.map((s) => (
        <SkillCard
          key={s.name}
          image={s.image}
          title={humanizeSkillName(s.name)}
          description={s.description}
          integrations={s.integrations}
          onClick={() => onSkill(s.name)}
        />
      ))}
    </>
  );
}

interface ScrollableTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Horizontal pill-tab list with subtle chevron arrows when overflow exists.
 * Arrows fade in/out based on scroll position; native horizontal scroll is
 * preserved for trackpad users but the visible scrollbar is hidden.
 *
 * Clicking the active tab also scrolls it into view, so users tabbing across
 * a wide list don't lose orientation.
 */
function ScrollableTabs({ tabs, activeTab, onTabChange }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const measure = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useLayoutEffect(() => {
    measure();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabs.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.6), behavior: "smooth" });
  };

  // When the active tab changes, scroll it into view so the user always sees it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeTab]);

  return (
    <div className="shrink-0 relative px-6 pb-3">
      <div
        ref={scrollRef}
        onScroll={measure}
        className="flex gap-1 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {canLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll tabs left"
          className="absolute left-2 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background/90 border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors -mt-1.5"
        >
          <ChevronLeft className="size-3.5" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll tabs right"
          className="absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background/90 border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors -mt-1.5"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  );
}
