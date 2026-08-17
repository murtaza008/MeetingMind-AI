"use client";

import { useState } from "react";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/dashboard/app-shell";
import { useCreateWorkspace, useUpdateOrg, useWorkspace } from "@/lib/hooks/use-org";
import { Reveal } from "@/components/motion/reveal";

export default function SettingsPage() {
  const { org, workspaces, canAdmin, isLoading } = useWorkspace();
  const updateOrg = useUpdateOrg(org?.id);
  const createWorkspace = useCreateWorkspace(org?.id);

  const [orgName, setOrgName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const [syncedOrgId, setSyncedOrgId] = useState<string | undefined>(undefined);
  if (org && org.id !== syncedOrgId) {
    setSyncedOrgId(org.id);
    setOrgName(org.name);
  }

  const orgWorkspaces = workspaces.filter((w) => w.membership.org.id === org?.id);

  return (
    <AppShell title="Settings">
      {isLoading ? (
        <div className="mono p-4 text-[12px] text-muted-foreground">Loading settings…</div>
      ) : !org ? (
        <EmptyState
          icon={SettingsIcon}
          title="No organization yet"
          body="Create an organization to configure workspaces and members."
        />
      ) : (
        <div className="max-w-3xl space-y-8 p-4">
          <Reveal>
            <section>
              <h2 className="text-[13px] font-medium text-foreground">Organization</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Shown across the workspace switcher and invites.
              </p>
              <div className="mt-2 flex gap-1.5">
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  disabled={!canAdmin}
                  className="h-8 max-w-xs flex-1 rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:border-ring disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={!canAdmin || updateOrg.isPending || !orgName.trim()}
                  onClick={() =>
                    updateOrg.mutate(
                      { name: orgName.trim() },
                      {
                        onError: (caught) => toast.error(caught.message),
                        onSuccess: () => toast.success("Organization updated."),
                      },
                    )
                  }
                  className="inline-flex h-8 items-center rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.05}>
            <section>
              <h2 className="text-[13px] font-medium text-foreground">Workspaces</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Meetings live inside a workspace. The Free plan is limited to one.
              </p>
              <div className="mt-2 overflow-hidden rounded-md border border-border">
                {orgWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between border-b border-border px-2.5 py-1.5 last:border-b-0">
                    <span className="text-[12px] text-foreground">{workspace.name}</span>
                    <span className="mono text-[10px] text-muted-foreground">{workspace.slug}</span>
                  </div>
                ))}
              </div>
              {canAdmin ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    placeholder="New workspace name"
                    className="h-8 max-w-xs flex-1 rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:border-ring"
                  />
                  <button
                    type="button"
                    disabled={createWorkspace.isPending || workspaceName.trim().length < 2}
                    onClick={() =>
                      createWorkspace.mutate(workspaceName.trim(), {
                        onError: (caught) => toast.error(caught.message),
                        onSuccess: () => {
                          setWorkspaceName("");
                          toast.success("Workspace created.");
                        },
                      })
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2} />
                    Add workspace
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>

          <Reveal delay={0.1}>
            <section>
              <h2 className="text-[13px] font-medium text-foreground">Plan</h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="mono rounded-full bg-primary/10 px-2.5 py-1 text-xs uppercase text-primary">
                  {org.plan.toLowerCase()}
                </span>
                <a href="/billing" className="text-xs text-primary hover:underline">
                  Manage billing →
                </a>
              </div>
            </section>
          </Reveal>
        </div>
      )}
    </AppShell>
  );
}
