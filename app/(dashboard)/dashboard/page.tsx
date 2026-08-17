"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter, LayoutList, Loader2, Plus, Search } from "lucide-react";
import { AppShell, EmptyState } from "@/components/dashboard/app-shell";
import { useWorkspace } from "@/lib/hooks/use-org";
import { useMeetings } from "@/lib/hooks/use-meetings";
import { StatusBadge } from "@/components/meetings/StatusBadge";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { formatDuration, relativeDay } from "@/lib/format";

type StatusFilter = "all" | "processing" | "ready" | "open-actions";

export default function DashboardPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data: meetings, isLoading } = useMeetings({ workspaceId: workspace?.id, q: query });

  const filtered = useMemo(() => {
    return (meetings ?? []).filter((m) => {
      if (statusFilter === "processing" && m.status !== "PROCESSING") return false;
      if (statusFilter === "ready" && m.status !== "READY") return false;
      if (statusFilter === "open-actions" && m.openActionCount === 0) return false;
      return true;
    });
  }, [meetings, statusFilter]);

  return (
    <AppShell
      title="Meetings"
      actions={
        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" /> New meeting
        </Link>
      }
    >
      {wsLoading || !workspace ? (
        <div className="mono p-4 text-[12px] text-muted-foreground">Loading meetings…</div>
      ) : (
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-input bg-card px-2.5 py-1.5 focus-within:border-primary">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search meeting titles"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-0.5 rounded-md border border-input bg-card p-0.5">
              <Filter className="mx-1.5 size-3.5 text-muted-foreground" />
              {(
                [
                  ["all", "All"],
                  ["ready", "Ready"],
                  ["processing", "Processing"],
                  ["open-actions", "Open items"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={
                    statusFilter === value
                      ? "rounded-[5px] bg-secondary px-2.5 py-1 text-[12px] font-medium text-secondary-foreground"
                      : "rounded-[5px] px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <div className="hidden grid-cols-[1fr_88px_92px_110px] gap-4 border-b border-border bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
              <span>Meeting</span>
              <span>Duration</span>
              <span>Actions</span>
              <span className="text-right">Date</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={LayoutList}
                title={meetings && meetings.length > 0 ? "No meetings match these filters" : "No meetings yet"}
                body={
                  meetings && meetings.length > 0
                    ? "Clear the search or switch the status filter."
                    : "Upload an audio file or start recording to get your first transcript."
                }
                action={
                  !meetings?.length ? (
                    <Link
                      href="/new"
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <Plus className="size-4" /> New meeting
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/meetings/${m.id}`}
                      className="grid grid-cols-1 gap-1.5 px-4 py-3 transition-colors hover:bg-surface md:grid-cols-[1fr_88px_92px_110px] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PersonAvatar name={m.creatorName} />
                        <span className="truncate text-[13.5px] font-medium">{m.title}</span>
                        {m.status !== "READY" && <StatusBadge status={m.status} />}
                      </div>
                      <span className="font-mono text-[12px] text-muted-foreground">
                        {m.durationSeconds ? formatDuration(m.durationSeconds) : "—"}
                      </span>
                      <span className="font-mono text-[12px]">
                        {m.openActionCount > 0 ? (
                          <span className="text-primary">{m.openActionCount} open</span>
                        ) : (
                          <span className="text-muted-foreground">{m.actionCount ? "clear" : "—"}</span>
                        )}
                      </span>
                      <span className="font-mono text-[12px] text-muted-foreground md:text-right">
                        {relativeDay(m.meetingDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
