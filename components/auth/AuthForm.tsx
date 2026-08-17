"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import { Mic } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ease } from "@/components/motion/reveal";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextDestination() {
    const pending =
      typeof window !== "undefined" ? sessionStorage.getItem("pending_invite_token") : null;
    if (pending) {
      sessionStorage.removeItem("pending_invite_token");
      return `/invite/${pending}`;
    }
    return isSignup ? "/onboarding" : "/dashboard";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not create your account.");
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Incorrect email or password.");

      router.push(nextDestination());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary-foreground/15">
            <Mic className="size-3.5" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-semibold">MeetingMind</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative z-10"
        >
          <p className="font-display text-3xl leading-tight" style={{ letterSpacing: "-0.01em" }}>
            &ldquo;We stopped keeping two sets of notes. The decision log is now the source of truth.&rdquo;
          </p>
          <div className="mono mt-5 text-primary-foreground/60">Priya Raman — Head of Product</div>
        </motion.div>
        <div className="mono relative z-10 text-[11px] text-primary-foreground/40">
          Audio never trains a model. Yours stays yours.
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center p-8">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="mb-10 flex items-center gap-2 md:hidden">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary">
              <Mic className="size-3.5 text-primary-foreground" strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-semibold text-foreground">MeetingMind</span>
          </Link>
          <div className="text-eyebrow mb-3">{isSignup ? "Free forever · No card" : "Welcome back"}</div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground">
            {isSignup ? "Create your organization." : "Sign in to MeetingMind."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isSignup ? "Your first transcript in under five minutes." : "Pick up where you left off."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <Field
                label="Your name"
                value={name}
                onChange={setName}
                type="text"
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
            />
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-all duration-150 hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? "One sec…" : isSignup ? "Create account →" : "Sign in →"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to MeetingMind? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-primary hover:underline"
            >
              {isSignup ? "Sign in" : "Get started free"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </label>
  );
}
