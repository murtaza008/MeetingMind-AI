"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { json } from "@/lib/hooks/fetcher";

export type MeetingStatus = "PROCESSING" | "READY" | "FAILED";

export type MeetingListItem = {
  id: string;
  title: string;
  meetingDate: string;
  durationSeconds: number;
  status: MeetingStatus;
  workspaceId: string;
  workspaceName: string;
  openActionCount: number;
  actionCount: number;
  creatorName: string | null;
};

export type Segment = { speaker: string; start: number; end: number; text: string };

export type MeetingDetail = {
  meeting: {
    id: string;
    title: string;
    meetingDate: string;
    durationSeconds: number;
    status: MeetingStatus;
    error: string | null;
    shareToken: string | null;
    hasAudio: boolean;
    workspaceName: string;
  };
  transcript: { fullText: string; segments: Segment[] } | null;
  summary: { summaryText: string; keyTopics: string[]; followupEmail: string | null } | null;
  decisions: { id: string; description: string; context: string | null }[];
  actionItems: {
    id: string;
    description: string;
    assigneeLabel: string | null;
    dueDate: string | null;
    status: "OPEN" | "DONE";
  }[];
};

export function useMeetings(params: { workspaceId?: string; status?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.workspaceId) search.set("workspaceId", params.workspaceId);
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);

  return useQuery({
    queryKey: ["meetings", params.workspaceId, params.status, params.q],
    enabled: !!params.workspaceId,
    refetchInterval: (query) => (hasProcessing(query.state.data) ? 5000 : false),
    queryFn: () => json<MeetingListItem[]>(`/api/meetings?${search.toString()}`),
  });
}

function hasProcessing(data: unknown) {
  return Array.isArray(data) && data.some((m) => (m as MeetingListItem).status === "PROCESSING");
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    enabled: !!id,
    refetchInterval: (query) =>
      (query.state.data as MeetingDetail | undefined)?.meeting?.status === "PROCESSING" ? 4000 : false,
    queryFn: () => json<MeetingDetail>(`/api/meetings/${id}`),
  });
}

export function useUploadMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: Blob; filename: string; title: string; workspaceId: string; durationSeconds: number }) => {
      const form = new FormData();
      form.append("file", input.file, input.filename);
      form.append("title", input.title);
      form.append("workspaceId", input.workspaceId);
      form.append("durationSeconds", String(Math.round(input.durationSeconds)));
      return json<{ id: string }>("/api/meetings/upload", { method: "POST", body: form });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => json(`/api/meetings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useToggleShare(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => json<{ shareToken: string | null }>(`/api/meetings/${id}/share`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting", id] }),
  });
}
