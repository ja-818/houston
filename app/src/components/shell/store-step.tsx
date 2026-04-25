import { Input, cn } from "@houston-ai/core";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AgentDefinition, AgentCategory, StoreListing } from "../../lib/types";
import { AgentCard, StoreAgentCard } from "./experience-card";

const CATEGORY_KEYS: { id: "all" | AgentCategory; labelKey: string }[] = [
  { id: "all", labelKey: "categoryAll" },
  { id: "productivity", labelKey: "categoryProductivity" },
  { id: "development", labelKey: "categoryDevelopment" },
  { id: "research", labelKey: "categoryResearch" },
  { id: "creative", labelKey: "categoryCreative" },
  { id: "business", labelKey: "categoryBusiness" },
];

interface StoreStepProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: "all" | AgentCategory;
  onCategoryChange: (cat: "all" | AgentCategory) => void;
  houstonAgents: AgentDefinition[];
  communityAgents: AgentDefinition[];
  storeCatalog: StoreListing[];
  installedIds: Set<string>;
  hasResults: boolean;
  onSelect: (id: string) => void;
  onInstall: (listing: StoreListing) => Promise<void>;
}

export function StoreStep({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  houstonAgents,
  communityAgents,
  storeCatalog,
  installedIds,
  hasResults,
  onSelect,
  onInstall,
}: StoreStepProps) {
  const { t } = useTranslation("shell");
  // Filter store listings that aren't already in builtin/community lists
  const localIds = new Set([
    ...houstonAgents.map((d) => d.config.id),
    ...communityAgents.map((d) => d.config.id),
  ]);

  const filteredStore = storeCatalog.filter((s) => {
    if (localIds.has(s.id)) return false;
    if (category !== "all" && s.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalResults =
    houstonAgents.length + communityAgents.length + filteredStore.length;

  return (
    <>
      <div className="shrink-0 px-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("store.searchPlaceholder")}
            className="pl-9 rounded-full bg-secondary border-border focus:bg-background"
          />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-5 px-6 border-b border-border">
        {CATEGORY_KEYS.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "relative pb-2.5 pt-3 text-sm transition-colors duration-200",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`store.${cat.labelKey}`)}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {houstonAgents.length > 0 && (
          <StoreSection label={t("store.sectionHoustonAgents")}>
            {houstonAgents.map((def) => (
              <AgentCard
                key={def.config.id}
                config={def.config}
                onSelect={onSelect}
              />
            ))}
          </StoreSection>
        )}

        {communityAgents.length > 0 && (
          <StoreSection label={t("store.sectionCommunityAgents")}>
            {communityAgents.map((def) => (
              <AgentCard
                key={def.config.id}
                config={def.config}
                onSelect={onSelect}
              />
            ))}
          </StoreSection>
        )}

        {filteredStore.length > 0 && (
          <StoreSection label={t("store.sectionStore")}>
            {filteredStore.map((listing) => (
              <StoreAgentCard
                key={listing.id}
                listing={listing}
                isInstalled={installedIds.has(listing.id)}
                onInstall={onInstall}
                onSelect={onSelect}
              />
            ))}
          </StoreSection>
        )}

        {totalResults === 0 && !hasResults && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              {t("store.noResults")}
            </p>
          </div>
        )}

      </div>
    </>
  );
}

function StoreSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-xs font-medium text-muted-foreground mb-3">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

