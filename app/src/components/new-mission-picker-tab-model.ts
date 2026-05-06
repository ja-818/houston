export const FEATURED_SKILLS_TAB_ID = "__featured__";
export const OTHER_SKILLS_TAB_ID = "__other__";

export interface PickerTab {
  id: string;
  label: string;
}

export function buildSkillPickerTabs({
  categoryNames,
  hasFeatured,
  hasOther,
  featuredLabel,
  otherLabel,
}: {
  categoryNames: string[];
  hasFeatured: boolean;
  hasOther: boolean;
  featuredLabel: string;
  otherLabel: string;
}): PickerTab[] {
  return [
    ...(hasFeatured
      ? [{ id: FEATURED_SKILLS_TAB_ID, label: featuredLabel }]
      : []),
    ...categoryNames.map((category) => ({
      id: category,
      label: category,
    })),
    ...(hasOther ? [{ id: OTHER_SKILLS_TAB_ID, label: otherLabel }] : []),
  ];
}

export function resolveActiveSkillPickerTab(
  tabs: PickerTab[],
  activeTab: string,
): string {
  if (tabs.some((tab) => tab.id === activeTab)) return activeTab;
  return tabs[0]?.id ?? "";
}

export function shouldShowSkillPickerTabs(tabs: PickerTab[]): boolean {
  return tabs.length > 1;
}
