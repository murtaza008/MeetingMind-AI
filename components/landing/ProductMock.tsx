import { Check, Play, Search } from "lucide-react";

const SEGMENTS = [
  {
    speaker: "Priya",
    color: "text-speaker-1",
    time: "04:12",
    text: "The migration slipped because the staging data was stale. I don't want to move the launch date again — I'd rather cut the reporting tab from v1.",
  },
  {
    speaker: "Marcus",
    color: "text-speaker-2",
    time: "04:31",
    text: "Agreed. Reporting is the only thing blocking us, and nobody in the beta group has asked for it yet.",
  },
  {
    speaker: "Priya",
    color: "text-speaker-1",
    time: "04:44",
    text: "Then we ship on the 14th without reporting. Dana, can you tell the beta list before Friday so it isn't a surprise?",
  },
  {
    speaker: "Dana",
    color: "text-speaker-3",
    time: "04:58",
    text: "Yes. I'll send the note Thursday and update the changelog draft at the same time.",
  },
  {
    speaker: "Marcus",
    color: "text-speaker-2",
    time: "05:10",
    text: "One more thing — we still owe legal the data retention answer. That's on me, end of next week.",
  },
];

const ACTIONS = [
  { text: "Notify the beta list that reporting ships after v1", who: "Dana", due: "Thu", done: false },
  { text: "Update the changelog draft", who: "Dana", due: "Thu", done: false },
  { text: "Send legal the data retention answer", who: "Marcus", due: "Nov 21", done: false },
  { text: "Refresh staging dataset", who: "Priya", due: "—", done: true },
];

/** A live replica of the meeting detail view, used as the landing hero visual. */
export function ProductMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-raise">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1">
          <Search className="size-3 text-muted-foreground" />
          <span className="font-mono text-[11px] text-muted-foreground">
            Search transcripts and summaries
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary">
          <Play className="size-3.5 fill-current text-primary-foreground" strokeWidth={0} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">Q4 launch sync — Product</p>
          <p className="font-mono text-[10px] text-muted-foreground">Nov 12 · 32:04 · 3 speakers</p>
        </div>
        <div className="hidden h-1 flex-[2] overflow-hidden rounded-full bg-secondary sm:block">
          <div className="h-full w-[38%] rounded-full bg-primary" />
        </div>
        <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">12:14 / 32:04</span>
      </div>

      <div className="grid md:grid-cols-[1fr_280px]">
        <div className="space-y-4 p-5 md:p-6">
          {SEGMENTS.map((s, i) => (
            <div key={i} className="group flex gap-4">
              <span className="mt-0.5 w-10 shrink-0 font-mono text-[11px] text-muted-foreground">{s.time}</span>
              <p className="text-[13.5px] leading-relaxed text-foreground">
                <span className={`mr-2 font-medium ${s.color}`}>{s.speaker}</span>
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <aside className="border-t border-border bg-surface p-5 md:border-l md:border-t-0">
          <p className="text-eyebrow">Decisions</p>
          <ul className="mt-2.5 space-y-2">
            <li className="rounded-md border border-border bg-card px-3 py-2 text-[12.5px] leading-snug">
              Ship v1 on Nov 14 without the reporting tab.
            </li>
          </ul>

          <p className="text-eyebrow mt-6">Action items</p>
          <ul className="mt-2.5 space-y-1.5">
            {ACTIONS.map((a) => (
              <li key={a.text} className="flex gap-2.5">
                <span
                  className={
                    a.done
                      ? "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border border-success bg-success"
                      : "mt-0.5 size-3.5 shrink-0 rounded-[4px] border border-border-strong"
                  }
                >
                  {a.done && <Check className="size-2.5 text-success-foreground" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span
                    className={
                      a.done
                        ? "block text-[12.5px] leading-snug text-muted-foreground line-through"
                        : "block text-[12.5px] leading-snug"
                    }
                  >
                    {a.text}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {a.who} · {a.due}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
