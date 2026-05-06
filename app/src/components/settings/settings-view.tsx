import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@houston-ai/core";
import {
  User,
  Smartphone,
  Folder,
  Bot,
  Clock,
  Languages,
  Palette,
  Trash2,
} from "lucide-react";
import { useWorkspaceStore } from "../../stores/workspaces";
import {
  SidebarSectionNav,
  type SidebarSectionItem,
} from "../shared/sidebar-section-nav";

type SettingsSectionId =
  | "account"
  | "phone"
  | "workspace"
  | "provider"
  | "timezone"
  | "language"
  | "appearance"
  | "danger";
import { AccountSection, useAccountAvailable } from "./sections/account";
import { ConnectPhoneSection } from "./sections/connect-phone";
import { WorkspaceSection } from "./sections/workspace";
import { ProviderSection } from "./sections/provider";
import { TimezoneSection } from "./sections/timezone";
import { LanguageSection } from "./sections/language";
import { AppearanceSection } from "./sections/appearance";
import { DangerSection } from "./sections/danger";

export function SettingsView() {
  const { t } = useTranslation(["settings", "common"]);
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const accountAvailable = useAccountAvailable();

  const items = useMemo<SidebarSectionItem<SettingsSectionId>[]>(() => {
    const list: SidebarSectionItem<SettingsSectionId>[] = [];
    if (accountAvailable) {
      list.push({ id: "account", label: t("settings:nav.account"), icon: User });
    }
    list.push(
      { id: "workspace", label: t("settings:nav.workspace"), icon: Folder },
      { id: "phone", label: t("settings:nav.phone"), icon: Smartphone, beta: true },
      { id: "provider", label: t("settings:nav.provider"), icon: Bot },
      { id: "timezone", label: t("settings:nav.timezone"), icon: Clock },
      { id: "language", label: t("settings:nav.language"), icon: Languages },
      { id: "appearance", label: t("settings:nav.appearance"), icon: Palette },
      {
        id: "danger",
        label: t("settings:nav.danger"),
        icon: Trash2,
        destructive: true,
      },
    );
    return list;
  }, [accountAvailable, t]);

  const [active, setActive] = useState<SettingsSectionId>(
    accountAvailable ? "account" : "workspace",
  );

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  // If the active id was hidden (e.g., signed out), fall back to a visible one.
  const activeVisible = items.some((i) => i.id === active) ? active : items[0].id;

  return (
    <div className="flex-1 flex min-h-0">
      <SidebarSectionNav
        ariaLabel={t("settings:title")}
        items={items}
        active={activeVisible}
        onSelect={setActive}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-8 py-10">
          {activeVisible === "account" && <AccountSection />}
          {activeVisible === "workspace" && <WorkspaceSection />}
          {activeVisible === "phone" && <ConnectPhoneSection />}
          {activeVisible === "provider" && <ProviderSection />}
          {activeVisible === "timezone" && <TimezoneSection />}
          {activeVisible === "language" && <LanguageSection />}
          {activeVisible === "appearance" && <AppearanceSection />}
          {activeVisible === "danger" && <DangerSection />}
        </div>
      </div>
    </div>
  );
}
