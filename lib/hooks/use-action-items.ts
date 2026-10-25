"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { json } from "@/lib/hooks/fetcher";

export type ActionStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export type ActionItemRow = {
  id: string;
  meetingId: string;
  description: string;
  assigneeLabel: string | null;
  dueDate: string | null;
  status: ActionStatus;
  meeting: { id: string; title: string; meetingDate: string } | null;
};

export function useActionItems(orgId?: string) {
  return useQuery({
    queryKey: ["action-items", orgId],
    enabled: !!orgId,
    queryFn: () => json<ActionItemRow[]>(`/api/action-items?orgId=${orgId}`),
  });
}

/** Moves an action item between Open / In progress / Done, updating the board instantly. */
export function useUpdateActionItem(orgId?: string) {
  const qc = useQueryClient();
  const key = ["action-items", orgId];
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) =>
      json(`/api/action-items/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ActionItemRow[]>(key);
      qc.setQueryData<ActionItemRow[]>(key, (rows) => rows?.map((r) => (r.id === id ? { ...r, status } : r)));
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      toast.error(error.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["meeting"] });
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
