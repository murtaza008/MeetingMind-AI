"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { ease } from "@/components/motion/reveal";
import { json } from "@/lib/hooks/fetcher";

type InviteInfo = {
  orgName: string;
  role: string;
  invitedEmail: string;
  accepted: boolean;
  expired: boolean;
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [err, setErr] = useState<string | null>(null);

  const { data: invite, isLoading } = useQuery({
    queryKey: ["invite", token],
    queryFn: () => json<InviteInfo>(`/api/invites/${token}`),
  });

  const accept = useMutation({
    mutationFn: () => json<{ workspaceId: string | null }>("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
    onSuccess: () => router.push("/dashboard"),
    onError: (e: Error) => setErr(e.message),
  });

  function goAuth(mode: "login" | "signup") {
    sessionStorage.setItem("pending_invite_token", token);
    router.push(`/${mode}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="size-5" />
        </div>

        {isLoading && (
          <p className="mono mt-5 animate-pulse text-muted-foreground">Loading invite…</p>
        )}

        {!isLoading && !invite && (
          <>
            <h1 className="mt-5 font-display text-2xl font-semibold">Invite not found.</h1>
            <p className="mt-2 text-muted-foreground">This link may have been revoked or never existed.</p>
          </>
        )}

        {!isLoading && invite && (invite.accepted || invite.expired) && (
          <>
            <h1 className="mt-5 font-display text-2xl font-semibold">
              {invite.accepted ? "Already used." : "Invite expired."}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ask an admin at {invite.orgName} to send a new invite link.
            </p>
          </>
        )}

        {!isLoading && invite && !invite.accepted && !invite.expired && (
          <>
            <div className="text-eyebrow mt-5">You&rsquo;re invited</div>
            <h1 className="mt-2 font-display text-3xl font-semibold">Join {invite.orgName}</h1>
            <p className="mt-2 text-muted-foreground">
              As {invite.role.toLowerCase()} · {invite.invitedEmail}
            </p>

            {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

            {status === "authenticated" ? (
              <button
                onClick={() => accept.mutate()}
                disabled={accept.isPending}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {accept.isPending ? "Joining…" : `Accept as ${session?.user?.email ?? "you"} →`}
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => goAuth("signup")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  Create an account →
                </button>
                <button
                  onClick={() => goAuth("login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-strong px-5 py-3 font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Sign in
                </button>
              </div>
            )}
          </>
        )}

        <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to MeetingMind
        </Link>
      </motion.div>
    </div>
  );
}
