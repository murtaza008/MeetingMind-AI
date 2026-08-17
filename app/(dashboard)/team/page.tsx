"use client";

import { useState } from "react";
import { Copy, Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/dashboard/app-shell";
import { useWorkspace, type OrgRole } from "@/lib/hooks/use-org";
import {
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useRevokeInvite,
  useUpdateMemberRole,
} from "@/lib/hooks/use-team";
import { relativeTime } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";

const ROLES: OrgRole[] = ["OWNER", "ADMIN", "MEMBER"];

export default function TeamPage() {
  const { org, canAdmin, isLoading: wsLoading } = useWorkspace();
  const { data: members, isLoading, error } = useMembers(org?.id);
  const { data: invites } = useInvites(org?.id);
  const updateRole = useUpdateMemberRole(org?.id);
  const removeMember = useRemoveMember(org?.id);
  const createInvite = useCreateInvite(org?.id);
  const revokeInvite = useRevokeInvite(org?.id);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("MEMBER");

  async function invite() {
    if (!email.includes("@")) return toast.error("Enter a valid email address.");
    try {
      const { token } = await createInvite.mutateAsync({ email, role });
      const link = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(link).catch(() => undefined);
      setEmail("");
      toast.success("Invite created — link copied to your clipboard.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success("Invite link copied.");
  }

  return (
    <AppShell title="Team & roles">
      {wsLoading || isLoading ? (
        <div className="mono p-4 text-[12px] text-muted-foreground">Loading team…</div>
      ) : error ? (
        <div className="mono m-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[11px] text-destructive">
          {error.message}
        </div>
      ) : !org ? (
        <EmptyState
          icon={Users}
          title="No organization yet"
          body="Create an organization first, then invite your teammates into it."
        />
      ) : (
        <div className="space-y-6 p-3">
          <Reveal>
          <section>
            <div className="mono mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Members · {org.name}
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <div className="mono flex items-center gap-3 border-b border-border bg-surface px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="min-w-0 flex-1">Person</span>
                <span className="w-24 shrink-0">Role</span>
                <span className="w-20 shrink-0 text-right">Joined</span>
                <span className="w-6 shrink-0" />
              </div>
              {(members ?? []).map((member) => (
                <div key={member.id} className="row-hover flex items-center gap-3 border-b border-border px-2.5 py-1.5 last:border-b-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-foreground">
                      {member.profile?.fullName || member.profile?.email || "Unknown user"}
                    </span>
                    <span className="mono block truncate text-[10px] text-muted-foreground">
                      {member.profile?.email ?? member.userId}
                    </span>
                  </span>
                  <span className="w-24 shrink-0">
                    {canAdmin ? (
                      <select
                        value={member.role}
                        onChange={(event) =>
                          updateRole.mutate(
                            { memberId: member.id, role: event.target.value as OrgRole },
                            {
                              onError: (caught) => toast.error(caught.message),
                              onSuccess: () => toast.success("Role updated."),
                            },
                          )
                        }
                        className="mono h-7 w-full rounded-md border border-input bg-background px-1.5 text-[11px] outline-none focus:border-ring"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="mono text-[11px] text-muted-foreground">{member.role.toLowerCase()}</span>
                    )}
                  </span>
                  <span className="mono w-20 shrink-0 text-right text-[10px] text-muted-foreground">
                    {relativeTime(member.createdAt)}
                  </span>
                  <span className="w-6 shrink-0 text-right">
                    {canAdmin ? (
                      <button
                        type="button"
                        aria-label="Remove member"
                        onClick={() =>
                          removeMember.mutate(member.id, {
                            onError: (caught) => toast.error(caught.message),
                            onSuccess: () => toast.success("Member removed."),
                          })
                        }
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          {canAdmin ? (
            <Reveal delay={0.05}>
            <section>
              <div className="mono mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Invite a teammate
              </div>
              <div className="flex flex-wrap gap-1.5">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  className="h-8 min-w-[220px] flex-1 rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:border-ring"
                />
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as OrgRole)}
                  className="mono h-8 rounded-md border border-input bg-background px-2 text-[11px] outline-none focus:border-ring"
                >
                  {ROLES.filter((r) => r !== "OWNER").map((r) => (
                    <option key={r} value={r}>
                      {r.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={invite}
                  disabled={createInvite.isPending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {createInvite.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" strokeWidth={2} />}
                  Create invite
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-md border border-border">
                {(invites ?? []).length === 0 ? (
                  <p className="mono p-2.5 text-[11px] text-muted-foreground">No invites outstanding.</p>
                ) : (
                  (invites ?? []).map((inv) => (
                    <div key={inv.id} className="row-hover flex items-center gap-3 border-b border-border px-2.5 py-1.5 last:border-b-0">
                      <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{inv.email}</span>
                      <span className="mono w-16 shrink-0 text-[11px] text-muted-foreground">{inv.role.toLowerCase()}</span>
                      <span className="mono w-24 shrink-0 text-right text-[10px] text-muted-foreground">
                        {inv.acceptedAt ? `accepted ${relativeTime(inv.acceptedAt)}` : `expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                      </span>
                      <button
                        type="button"
                        aria-label="Copy invite link"
                        onClick={() => copyLink(inv.token)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        aria-label="Revoke invite"
                        onClick={() =>
                          revokeInvite.mutate(inv.id, {
                            onError: (caught) => toast.error(caught.message),
                            onSuccess: () => toast.success("Invite revoked."),
                          })
                        }
                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
            </Reveal>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Only owners and admins can change roles or invite teammates.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
