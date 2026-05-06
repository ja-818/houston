import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
  buildSkillPickerTabs,
  FEATURED_SKILLS_TAB_ID,
  OTHER_SKILLS_TAB_ID,
  resolveActiveSkillPickerTab,
  shouldShowSkillPickerTabs,
} from "../src/components/new-mission-picker-tab-model.ts";

describe("new mission picker tab model", () => {
  it("omits Featured when no skills are featured", () => {
    const tabs = buildSkillPickerTabs({
      categoryNames: ["Research"],
      hasFeatured: false,
      hasOther: true,
      featuredLabel: "Featured",
      otherLabel: "Other",
    });

    deepStrictEqual(tabs, [
      { id: "Research", label: "Research" },
      { id: OTHER_SKILLS_TAB_ID, label: "Other" },
    ]);
  });

  it("keeps Featured first when featured skills exist", () => {
    const tabs = buildSkillPickerTabs({
      categoryNames: ["Research"],
      hasFeatured: true,
      hasOther: false,
      featuredLabel: "Featured",
      otherLabel: "Other",
    });

    deepStrictEqual(tabs, [
      { id: FEATURED_SKILLS_TAB_ID, label: "Featured" },
      { id: "Research", label: "Research" },
    ]);
  });

  it("hides the tab bar when only one skill tab exists", () => {
    const tabs = buildSkillPickerTabs({
      categoryNames: ["Research"],
      hasFeatured: false,
      hasOther: false,
      featuredLabel: "Featured",
      otherLabel: "Other",
    });

    strictEqual(shouldShowSkillPickerTabs(tabs), false);
  });

  it("shows the tab bar when multiple skill tabs exist", () => {
    const tabs = buildSkillPickerTabs({
      categoryNames: ["Research"],
      hasFeatured: false,
      hasOther: true,
      featuredLabel: "Featured",
      otherLabel: "Other",
    });

    strictEqual(shouldShowSkillPickerTabs(tabs), true);
  });

  it("falls back to the first tab when active tab is missing", () => {
    const tabs = [
      { id: "Research", label: "Research" },
      { id: OTHER_SKILLS_TAB_ID, label: "Other" },
    ];

    strictEqual(resolveActiveSkillPickerTab(tabs, "missing"), "Research");
  });
});
