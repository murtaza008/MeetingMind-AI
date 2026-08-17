"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/dashboard/app-shell";
import { useCreateOrg, useAcceptInvite } from "@/lib/hooks/use-org";

function parseToken(raw: string) {
  return raw.includes("/invite/") ? (raw.split("/invite/")[1] ?? raw) : raw;
}

export default function OnboardingPage() {
  const router = useRouter();
  const createOrg = useCreateOrg();
  const acceptInvite = useAcceptInvite();

  const [orgName, setOrgName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("General");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createOrg.mutateAsync({ orgName: orgName.trim(), workspaceName: workspaceName.trim() });
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await acceptInvite.mutateAsync(parseToken(token.trim()));
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      <Link href="/">
        <Logo className="text-base" />
      </Link>
      <h1 className="mt-6 text-lg text-foreground">Set up your organization</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        An organization holds your workspaces, members and billing. You can add more workspaces
        later.
      </p>

      {error ? (
        <p className="mono mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[11px] leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      <form onSubmit={submitCreate} className="mt-6 rounded-lg border border-border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Organization name
            </span>
            <input
              required
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              placeholder="Acme Inc"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-ring"
            />
          </label>
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              First workspace
            </span>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="General"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-ring"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={createOrg.isPending}
          className="mt-4 flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {createOrg.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Create organization
        </button>
      </form>

      <form onSubmit={submitJoin} className="mt-3 rounded-lg border border-border bg-surface p-5">
        <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Or join with an invite link
        </span>
        <div className="mt-2 flex gap-2">
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="paste invite link or token"
            className="mono h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={acceptInvite.isPending || token.trim().length === 0}
            className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {acceptInvite.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Join
          </button>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          The invite must have been sent to the email you are signed in with.
        </p>
      </form>
    </div>
  );
}
