import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { tauriActivity } from "../../lib/tauri";

export function useActivity(workspacePath: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activity(workspacePath ?? ""),
    queryFn: () => tauriActivity.list(workspacePath!),
    enabled: !!workspacePath,
  });
}

export function useCreateActivity(workspacePath: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) =>
      tauriActivity.create(workspacePath!, title, description),
    onSuccess: () => {
      if (workspacePath) qc.invalidateQueries({ queryKey: queryKeys.activity(workspacePath) });
    },
  });
}

export function useUpdateActivity(workspacePath: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, update }: { activityId: string; update: { status?: string; title?: string; description?: string } }) =>
      tauriActivity.update(workspacePath!, activityId, update),
    onSuccess: () => {
      if (workspacePath) qc.invalidateQueries({ queryKey: queryKeys.activity(workspacePath) });
    },
  });
}

export function useDeleteActivity(workspacePath: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => tauriActivity.delete(workspacePath!, activityId),
    onSuccess: () => {
      if (workspacePath) qc.invalidateQueries({ queryKey: queryKeys.activity(workspacePath) });
    },
  });
}
