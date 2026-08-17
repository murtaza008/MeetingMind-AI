"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { useWorkspace } from "@/lib/hooks/use-org";
import { useActionItems, useToggleActionItem } from "@/lib/hooks/use-action-items";
import { formatMeetingDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";

export default function ActionsPage() {
  const { org } = useWorkspace();
  const { data: items, isLoading } = useActionItems(org?.id);
  const toggle = useToggleActionItem(org?.id);
  const [status, setStatus] = useState<"OPEN" | "DONE" | "all">("OPEN");
  const [assignee, setAssignee] = useState("all");

  const assignees = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => i.assigneeLabel || "Unassigned"))).sort(),
    [items],
  );

  const grouped = useMemo(() => {
    const filtered = (items ?? []).filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (assignee !== "all" && (i.assigneeLabel || "Unassigned") !== assignee) return false;
      return true;
    });
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const key = item.meetingId;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return Array.from(map.entries());
  }, [items, status, assignee]);

  return (
    <AppShell title="Action items">
      <div className="mx-auto max-w-4xl px-5 py-7 md:px-8">
        <Reveal>
          <h1 className="font-display text-2xl">Action items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything extracted across meetings, grouped by where it was said.
          </p>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-input bg-card p-0.5">
            {(["OPEN", "DONE", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={
                  status === s
                    ? "rounded-[5px] bg-secondary px-2.5 py-1 text-[12px] font-medium capitalize"
                    : "rounded-[5px] px-2.5 py-1 text-[12px] capitalize text-muted-foreground hover:text-foreground"
                }
              >
                {s === "OPEN" ? "Open" : s === "DONE" ? "Done" : "All"}
              </button>
            ))}
          </div>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="rounded-md border border-input bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-primary"
          >
            <option value="all">All assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No action items match this view. Items appear here once a meeting finishes processing.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {grouped.map(([meetingId, group]) => (
              <section key={meetingId} className="overflow-hidden rounded-lg border border-border bg-card">
                <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
                  <span className="truncate text-[13px] font-medium">{group[0]?.meeting?.title ?? "Meeting"}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {group[0]?.meeting?.meetingDate ? formatMeetingDate(group[0].meeting.meetingDate) : ""}
                    </span>
                    <Link
                      href={`/meetings/${meetingId}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Open meeting"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </header>
                <ul className="divide-y divide-border">
                  {group.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={item.status === "DONE"}
                        onChange={() =>
                          toggle.mutate({ id: item.id, status: item.status === "DONE" ? "OPEN" : "DONE" })
                        }
                        className="mt-0.5 size-3.5 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            item.status === "DONE"
                              ? "block text-[13.5px] text-muted-foreground line-through"
                              : "block text-[13.5px]"
                          }
                        >
                          {item.description}
                        </span>
                        <span className="font-mono text-[10.5px] text-muted-foreground">
                          {item.assigneeLabel || "Unassigned"}
                          {item.dueDate ? ` · due ${formatMeetingDate(item.dueDate)}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
