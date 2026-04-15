import { useState, useEffect, useCallback, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { analytics } from "../lib/analytics";

type UpdateStatus =
  | { state: "idle" }
  | { state: "available"; version: string; body: string | null; install: () => Promise<void> }
  | { state: "downloading"; progress: number }
  | { state: "ready" };

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function useUpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = useCallback(async () => {
    try {
      const update = await check();
      if (!update) return;

      const install = async () => {
        let totalLength = 0;
        let downloaded = 0;

        await update.downloadAndInstall((event) => {
          if (event.event === "Started" && event.data.contentLength) {
            totalLength = event.data.contentLength;
          } else if (event.event === "Progress") {
            downloaded += event.data.chunkLength;
            const pct = totalLength > 0 ? Math.round((downloaded / totalLength) * 100) : 0;
            setStatus({ state: "downloading", progress: pct });
          } else if (event.event === "Finished") {
            analytics.track("app_update_downloaded", { version: update.version });
            setStatus({ state: "ready" });
          }
        });

        setStatus({ state: "ready" });
      };

      analytics.track("app_update_available", { version: update.version });
      setStatus({
        state: "available",
        version: update.version,
        body: update.body ?? null,
        install,
      });
    } catch {
      // Updater not configured or network error -- stay idle
    }
  }, []);

  useEffect(() => {
    runCheck();
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runCheck]);

  return { status, relaunch };
}
