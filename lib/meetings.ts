import type {
  ActionItem,
  Decision,
  Meeting,
  MeetingSummary,
  Transcript,
  Workspace,
} from "@/lib/generated/prisma/client";

type FullMeeting = Meeting & {
  workspace: Workspace;
  transcript: Transcript | null;
  summary: MeetingSummary | null;
  decisions: Decision[];
  actionItems: ActionItem[];
};

/** Shapes a fully-loaded Meeting row into the JSON contract the dashboard and public share page expect. */
export function shapeMeetingDetail(meeting: FullMeeting) {
  return {
    meeting: {
      id: meeting.id,
      title: meeting.title,
      meetingDate: meeting.meetingDate,
      durationSeconds: meeting.durationSeconds,
      status: meeting.status,
      error: meeting.error,
      shareToken: meeting.shareToken,
      hasAudio: meeting.audio != null,
      workspaceName: meeting.workspace.name,
    },
    transcript: meeting.transcript
      ? { fullText: meeting.transcript.fullText, segments: meeting.transcript.segments }
      : null,
    summary: meeting.summary
      ? {
          summaryText: meeting.summary.summaryText,
          keyTopics: meeting.summary.keyTopics,
          followupEmail: meeting.summary.followupEmail,
        }
      : null,
    decisions: meeting.decisions.map((d) => ({
      id: d.id,
      description: d.description,
      context: d.context,
    })),
    actionItems: meeting.actionItems.map((a) => ({
      id: a.id,
      description: a.description,
      assigneeLabel: a.assigneeLabel,
      dueDate: a.dueDate,
      status: a.status,
    })),
  };
}

export const MEETING_DETAIL_INCLUDE = {
  workspace: true,
  transcript: true,
  summary: true,
  decisions: { orderBy: { createdAt: "asc" as const } },
  actionItems: { orderBy: { createdAt: "asc" as const } },
};
