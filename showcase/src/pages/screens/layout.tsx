import { TabBarPage } from "../layout/tab-bar";
import { SplitViewPage } from "../layout/split-view";
import { AppSidebarPage } from "../layout/app-sidebar";

export function LayoutScreen() {
  return (
    <div className="space-y-16">
      <AppSidebarPage />
      <hr className="border-border" />
      <TabBarPage />
      <hr className="border-border" />
      <SplitViewPage />
    </div>
  );
}
