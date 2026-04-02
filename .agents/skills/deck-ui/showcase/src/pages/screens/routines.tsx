import { RoutinesGridPage } from "../routines/routines-grid";
import { HeartbeatConfigPage } from "../routines/heartbeat-config";
import { ScheduleBuilderPage } from "../routines/schedule-builder";

export function RoutinesScreen() {
  return (
    <div className="space-y-16">
      <RoutinesGridPage />
      <hr className="border-border" />
      <HeartbeatConfigPage />
      <hr className="border-border" />
      <ScheduleBuilderPage />
    </div>
  );
}
