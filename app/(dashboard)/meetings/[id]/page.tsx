"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatusBadge } from "@/components/meetings/StatusBadge";
import { ProcessingSteps } from "@/components/meetings/ProcessingSteps";
import { useDeleteMeeting, useMeeting, useToggleShare, type Segment } from "@/lib/hooks/use-meetings";
import { useToggleActionItem } from "@/lib/hooks/use-action-items";
import { useWorkspace } from "@/lib/hooks/use-org";
import { formatDuration, formatMeetingDate, formatTimestamp, speakerClass } from "@/lib/format";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { org } = useWorkspace();
  const { data, isLoading } = useMeeting(id);
  const toggle = useToggleActionItem(org?.id);
  const toggleShare = useToggleShare(id);
  const deleteMeeting = useDeleteMeeting();
  const [tab, setTab] = useState<"summary" | "transcript">("summary");
  const [copied, setCopied] = useState(false);

  if (isLoading || !data?.meeting) {
    return (
      <AppShell title="Meeting">
        <div className="flex justify-center py-24">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const { meeting, transcript, summary, decisions, actionItems } = data;
  const segments = (transcript?.segments as unknown as Segment[] | null) ?? [];
  const speakers = Array.from(new Set(segments.map((s) => s.speaker)));

  async function copyEmail() {
    if (!summary?.followupEmail) return;
    await navigator.clipboard.writeText(summary.followupEmail);
    setCopied(true);
    toast.success("Follow-up email copied");
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyShareLink() {
    const result = await toggleShare.mutateAsync();
    if (result.shareToken) {
      const url = `${window.location.origin}/share/${result.shareToken}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied — anyone with it can view this meeting.");
    } else {
      toast.success("Share link disabled.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this meeting? This cannot be undone.")) return;
    await deleteMeeting.mutateAsync(id);
    toast.success("Meeting deleted");
    router.push("/dashboard");
  }

  return (
    <AppShell title={meeting.title}>
      <div className="mx-auto max-w-4xl px-5 py-7 md:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All meetings
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl">{meeting.title}</h1>
            <StatusBadge status={meeting.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              disabled={toggleShare.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-[12px] transition-colors hover:bg-secondary"
            >
              <Link2 className="size-3.5" />
              {meeting.shareToken ? "Sharing on — copy link" : "Share"}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-[12px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        </div>
        <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
          {formatMeetingDate(meeting.meetingDate)}
          {meeting.durationSeconds ? ` · ${formatDuration(meeting.durationSeconds)}` : ""}
          {meeting.workspaceName ? ` · ${meeting.workspaceName}` : ""}
        </p>

        {meeting.hasAudio && (
          <audio controls preload="none" className="mt-4 w-full" src={`/api/meetings/${id}/audio`} />
        )}

        {meeting.status === "PROCESSING" && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <ProcessingSteps />
          </div>
        )}

        {meeting.status === "FAILED" && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            Processing failed{meeting.error ? `: ${meeting.error}` : "."} Try uploading the recording again.
          </p>
        )}

        {meeting.status === "READY" && (
          <>
            <div className="mt-6 flex gap-0.5 rounded-md border border-input bg-card p-0.5">
              {(
                [
                  ["summary", "Summary & actions"],
                  ["transcript", "Transcript"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={
                    tab === value
                      ? "flex-1 rounded-[5px] bg-secondary px-3 py-1.5 text-[13px] font-medium"
                      : "flex-1 rounded-[5px] px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "summary" ? (
              <div className="mt-5 space-y-5">
                <section className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-display text-lg">Overview</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {summary?.summaryText ?? "No summary available."}
                  </p>
                  {Array.isArray(summary?.keyTopics) && summary.keyTopics.length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {summary.keyTopics.map((point, i) => (
                        <li key={i} className="flex gap-2 text-[13.5px]">
                          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-primary" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {decisions.length > 0 && (
                  <section className="rounded-lg border border-border bg-card p-5">
                    <h2 className="font-display text-lg">Decisions</h2>
                    <ul className="mt-3 space-y-2">
                      {decisions.map((d) => (
                        <li key={d.id} className="text-[13.5px]">
                          {d.description}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="overflow-hidden rounded-lg border border-border bg-card">
                  <header className="border-b border-border bg-surface px-5 py-2.5">
                    <h2 className="font-display text-lg">Action items</h2>
                  </header>
                  {actionItems.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-muted-foreground">
                      No action items were identified in this meeting.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {actionItems.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                          <input
                            type="checkbox"
                            checked={a.status === "DONE"}
                            onChange={() =>
                              toggle.mutate({ id: a.id, status: a.status === "DONE" ? "OPEN" : "DONE" })
                            }
                            className="mt-0.5 size-3.5 accent-primary"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={
                                a.status === "DONE"
                                  ? "block text-[13.5px] text-muted-foreground line-through"
                                  : "block text-[13.5px]"
                              }
                            >
                              {a.description}
                            </span>
                            <span className="font-mono text-[10.5px] text-muted-foreground">
                              {a.assigneeLabel || "Unassigned"}
                              {a.dueDate ? ` · due ${formatMeetingDate(a.dueDate)}` : ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {summary?.followupEmail && (
                  <section className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg">Follow-up email</h2>
                      <button
                        onClick={copyEmail}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-[12px] transition-colors hover:bg-secondary"
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                      {summary.followupEmail}
                    </pre>
                  </section>
                )}
              </div>
            ) : (
              <section className="mt-5 rounded-lg border border-border bg-card p-5">
                {segments.length === 0 ? (
                  <p className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                    {transcript?.fullText ?? "No transcript available."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {segments.map((s, i) => (
                      <li key={i} className="grid grid-cols-[52px_1fr] gap-3">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatTimestamp(s.start)}
                        </span>
                        <span>
                          <span className={`font-mono text-[11px] font-medium ${speakerClass(s.speaker, speakers)}`}>
                            {s.speaker}
                          </span>
                          <span className="mt-0.5 block text-[13.5px] leading-relaxed">{s.text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
