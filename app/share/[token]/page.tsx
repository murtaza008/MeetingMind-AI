"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mic } from "lucide-react";
import { json } from "@/lib/hooks/fetcher";
import type { MeetingDetail, Segment } from "@/lib/hooks/use-meetings";
import { formatDuration, formatMeetingDate, formatTimestamp, speakerClass } from "@/lib/format";

export default function SharedMeetingPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-meeting", token],
    queryFn: () => json<MeetingDetail>(`/api/public/meetings/${token}`),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-[5px] bg-primary">
              <Mic className="size-3.5 text-primary-foreground" strokeWidth={2.25} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">MeetingMind</span>
          </Link>
          <span className="mono ml-auto text-[11px] text-muted-foreground">Shared read-only view</span>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : error || !data?.meeting ? (
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="font-display text-xl">This link is invalid or no longer shared.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask whoever sent this link to re-enable sharing on the meeting.
          </p>
        </div>
      ) : (
        <SharedMeetingBody data={data} />
      )}
    </div>
  );
}

function SharedMeetingBody({ data }: { data: MeetingDetail }) {
  const { meeting, transcript, summary, decisions, actionItems } = data;
  const segments = (transcript?.segments as unknown as Segment[] | null) ?? [];
  const speakers = Array.from(new Set(segments.map((s) => s.speaker)));

  return (
    <div className="mx-auto max-w-4xl px-5 py-7 md:px-8">
      <h1 className="font-display text-2xl">{meeting.title}</h1>
      <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
        {formatMeetingDate(meeting.meetingDate)}
        {meeting.durationSeconds ? ` · ${formatDuration(meeting.durationSeconds)}` : ""}
        {meeting.workspaceName ? ` · ${meeting.workspaceName}` : ""}
      </p>

      <div className="mt-6 space-y-5">
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
            <p className="px-5 py-6 text-sm text-muted-foreground">No action items were identified.</p>
          ) : (
            <ul className="divide-y divide-border">
              {actionItems.map((a) => (
                <li key={a.id} className="px-5 py-3 text-[13.5px]">
                  <span className={a.status === "DONE" ? "text-muted-foreground line-through" : ""}>
                    {a.description}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-muted-foreground">
                    {a.assigneeLabel || "Unassigned"}
                    {a.dueDate ? ` · due ${formatMeetingDate(a.dueDate)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {segments.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg">Transcript</h2>
            <ul className="mt-3 space-y-3">
              {segments.map((s, i) => (
                <li key={i} className="grid grid-cols-[52px_1fr] gap-3">
                  <span className="font-mono text-[11px] text-muted-foreground">{formatTimestamp(s.start)}</span>
                  <span>
                    <span className={`font-mono text-[11px] font-medium ${speakerClass(s.speaker, speakers)}`}>
                      {s.speaker}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed">{s.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
