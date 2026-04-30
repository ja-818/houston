import { useUIStore } from "../stores/ui";
import { analytics, classifyAnalyticsError } from "./analytics";
import { reportBug } from "./bug-report";
import { getCurrentUserEmail } from "./current-user";

/**
 * Surface an error to the user as a toast with a working "Report bug" action.
 * `command` is a short machine-readable tag (e.g. "list_workspaces",
 * "uncaught_error") that goes into the bug-report payload for triage.
 */
export function showErrorToast(command: string, message: string): void {
  const timestamp = new Date().toISOString();
  const addToast = useUIStore.getState().addToast;
  analytics.track("app_error_shown", {
    source: command,
    error_kind: classifyAnalyticsError(message),
  });

  addToast({
    title: "Houston, we have a problem!",
    description: message,
    variant: "error",
    action: {
      label: "Report bug",
      onClick: () => {
        reportBug({
          command,
          error: message,
          timestamp,
          appVersion: __APP_VERSION__,
          userEmail: getCurrentUserEmail(),
        })
          .then(() => {
            addToast({
              title: "Roger that, report received.",
              description: "Mission control is on it, deploying a fix.",
              variant: "success",
            });
          })
          .catch((e) => {
            console.error("Failed to report bug:", e);
            addToast({
              title: "Couldn't send report",
              description: e instanceof Error ? e.message : String(e),
              variant: "error",
            });
          });
      },
    },
  });
}
