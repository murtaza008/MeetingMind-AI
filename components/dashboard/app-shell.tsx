"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  CreditCard,
  LayoutList,
  ListChecks,
  LogOut,
  Mic,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/lib/hooks/use-org";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Meetings", icon: LayoutList },
  { to: "/new", label: "New meeting", icon: Plus },
  { to: "/actions", label: "Action items", icon: ListChecks },
  { to: "/team", label: "Team", icon: Users },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-display text-[15px] font-semibold", className)}>
      <span className="flex size-5 items-center justify-center rounded-[5px] bg-primary">
        <Mic className="size-3 text-primary-foreground" strokeWidth={2.25} />
      </span>
      MeetingMind
    </span>
  );
}

function WorkspaceSwitcher() {
  const { workspace, workspaces, org, setActive } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent">
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
            {workspace?.name ?? "No workspace"}
          </span>
          <span className="mono block truncate text-[10px] leading-tight text-muted-foreground">
            {org?.name ?? "—"} · {(org?.plan ?? "free").toLowerCase()}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onClick={() => setActive(w.id)} className="gap-2">
            <Check
              className={cn("h-3.5 w-3.5", w.id === workspace?.id ? "opacity-100" : "opacity-0")}
              strokeWidth={2}
            />
            <span className="truncate">{w.name}</span>
            <span className="mono ml-auto text-[10px] text-muted-foreground">
              {w.membership.org.name}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding">Create organization</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useWorkspace();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut({ redirect: false });
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-12 items-center border-b border-border px-3">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="p-2">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("h-3.5 w-3.5", active && "text-primary")}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border p-2">
          <ThemeToggle />
          <div className="flex items-center justify-between px-1">
            <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {role?.toLowerCase() ?? "—"}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3 w-3" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
            {title}
          </div>
          {actions}
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon: Icon = LayoutList,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: typeof LayoutList;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
