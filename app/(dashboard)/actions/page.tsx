"use client";

import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { useWorkspace } from "@/lib/hooks/use-org";
import {
  ACTION_STATUS_LABELS,
  useActionItems,
  useUpdateActionItem,
  type ActionItemRow,
  type ActionStatus,
} from "@/lib/hooks/use-action-items";
import { formatDueDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

const STATUSES: ActionStatus[] = ["OPEN", "IN_PROGRESS", "DONE"];
const COLUMN_DOT: Record<ActionStatus, string> = {
  OPEN: "bg-muted-foreground",
  IN_PROGRESS: "bg-primary",
  DONE: "bg-success",
};

export default function ActionsPage() {
  const { org } = useWorkspace();
  const { data: items, isLoading } = useActionItems(org?.id);
  const update = useUpdateActionItem(org?.id);
  const [view, setView] = useState<"board" | "list">("board");
  const [status, setStatus] = useState<ActionStatus | "all">("all");
  const [assignee, setAssignee] = useState("all");

  const assignees = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => i.assigneeLabel || "Unassigned"))).sort(),
    [items],
  );

  const visible = useMemo(
    () => (items ?? []).filter((i) => assignee === "all" || (i.assigneeLabel || "Unassigned") === assignee),
    [items, assignee],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ActionItemRow[]>();
    for (const item of visible) {
      if (status !== "all" && item.status !== status) continue;
      map.set(item.meetingId, [...(map.get(item.meetingId) ?? []), item]);
    }
    return Array.from(map.entries());
  }, [visible, status]);

  const move = (id: string, next: ActionStatus) => {
    const item = items?.find((i) => i.id === id);
    if (item && item.status !== next) update.mutate({ id, status: next });
  };

  return (
    <AppShell title="Action items">
      <div className="mx-auto max-w-6xl px-5 py-7 md:px-8">
        <Reveal>
          <h1 className="font-display text-2xl">Action items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything extracted across meetings. Drag a card between columns, or change its status.
          </p>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              ["board", "Board"],
              ["list", "By meeting"],
            ]}
          />
          {view === "list" && (
            <Segmented
              value={status}
              onChange={setStatus}
              options={[["all", "All"], ...STATUSES.map((s) => [s, ACTION_STATUS_LABELS[s]] as [ActionStatus, string])]}
            />
          )}
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
        ) : (items ?? []).length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No action items yet. Items appear here once a meeting finishes processing.
          </p>
        ) : view === "board" ? (
          <Board items={visible} onMove={move} />
        ) : grouped.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No action items match this view.</p>
        ) : (
          <div className="mt-6 space-y-5">
            {grouped.map(([meetingId, group]) => (
              <section key={meetingId} className="overflow-hidden rounded-lg border border-border bg-card">
                <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
                  <span className="truncate text-[13px] font-medium">{group[0]?.meeting?.title ?? "Meeting"}</span>
                  <MeetingLink meetingId={meetingId} />
                </header>
                <ul className="divide-y divide-border">
                  {group.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                      <input
                        type="checkbox"
                        aria-label="Mark done"
                        checked={item.status === "DONE"}
                        onChange={() => move(item.id, item.status === "DONE" ? "OPEN" : "DONE")}
                        className="mt-0.5 size-3.5 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <ItemText item={item} />
                      </span>
                      <StatusSelect value={item.status} onChange={(next) => move(item.id, next)} />
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

function Board({ items, onMove }: { items: ActionItemRow[]; onMove: (id: string, status: ActionStatus) => void }) {
  const [dragOver, setDragOver] = useState<ActionStatus | null>(null);

  const drop = (column: ActionStatus) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onMove(id, column);
  };

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {STATUSES.map((column) => {
        const cards = items.filter((i) => i.status === column);
        return (
          <section
            key={column}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(column);
            }}
            onDragLeave={() => setDragOver((c) => (c === column ? null : c))}
            onDrop={drop(column)}
            className={cn(
              "flex min-h-40 flex-col rounded-lg border bg-surface transition-colors",
              dragOver === column ? "border-primary bg-accent/40" : "border-border",
            )}
          >
            <header className="flex items-center gap-2 px-3 py-2.5">
              <span className={cn("size-2 rounded-full", COLUMN_DOT[column])} />
              <span className="text-[13px] font-medium">{ACTION_STATUS_LABELS[column]}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">{cards.length}</span>
            </header>
            <ul className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {cards.map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab rounded-md border border-border bg-card p-3 shadow-sm active:cursor-grabbing"
                >
                  <ItemText item={item} />
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <Link
                      href={`/meetings/${item.meetingId}`}
                      className="min-w-0 truncate text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.meeting?.title ?? "Meeting"}
                    </Link>
                    <StatusSelect value={item.status} onChange={(next) => onMove(item.id, next)} />
                  </div>
                </li>
              ))}
              {cards.length === 0 && (
                <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Drop items here
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ItemText({ item }: { item: ActionItemRow }) {
  const overdue = item.dueDate && item.status !== "DONE" && isOverdue(item.dueDate);
  return (
    <>
      <span
        className={cn(
          "block text-[13.5px] leading-snug",
          item.status === "DONE" && "text-muted-foreground line-through",
        )}
      >
        {item.description}
      </span>
      <span className="mt-1 block font-mono text-[10.5px] text-muted-foreground">
        {item.assigneeLabel || "Unassigned"}
        {item.dueDate ? (
          <span className={cn(overdue && "text-destructive")}>
            {` · ${overdue ? "overdue" : "due"} ${formatDueDate(item.dueDate)}`}
          </span>
        ) : null}
      </span>
    </>
  );
}

function StatusSelect({ value, onChange }: { value: ActionStatus; onChange: (status: ActionStatus) => void }) {
  return (
    <select
      aria-label="Status"
      value={value}
      onChange={(e) => onChange(e.target.value as ActionStatus)}
      className="shrink-0 rounded-md border border-input bg-background px-1.5 py-0.5 font-mono text-[10.5px] outline-none focus:border-primary"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {ACTION_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function MeetingLink({ meetingId }: { meetingId: string }) {
  return (
    <Link
      href={`/meetings/${meetingId}`}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Open meeting"
    >
      <ExternalLink className="size-3.5" />
    </Link>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-input bg-card p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={
            value === v
              ? "rounded-[5px] bg-secondary px-2.5 py-1 text-[12px] font-medium"
              : "rounded-[5px] px-2.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
