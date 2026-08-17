import { prisma } from "@/lib/prisma";
import type { OrgRole } from "@/lib/generated/prisma/enums";

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this organization.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const ADMIN_ROLES: OrgRole[] = ["OWNER", "ADMIN"];

function slugify(value: string, fallback: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || fallback;
}

/** Role of `userId` inside `orgId`, or throws ForbiddenError if not a member. */
export async function requireOrgMember(userId: string, orgId: string): Promise<OrgRole> {
  const membership = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { role: true },
  });
  if (!membership) throw new ForbiddenError();
  return membership.role;
}

/** Like requireOrgMember, but also asserts the role is one of `allowed`. */
export async function requireOrgRole(
  userId: string,
  orgId: string,
  allowed: OrgRole[],
): Promise<OrgRole> {
  const role = await requireOrgMember(userId, orgId);
  if (!allowed.includes(role)) {
    throw new ForbiddenError("Your role does not allow this action.");
  }
  return role;
}

/** Resolve a workspace by id and assert the user has one of `allowed` roles in its org. */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowed: OrgRole[],
) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new ForbiddenError("Workspace not found.");
  const role = await requireOrgRole(userId, workspace.orgId, allowed);
  return { workspace, role };
}

/** Just membership (any role) in the org that owns this workspace. */
export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new ForbiddenError("Workspace not found.");
  const role = await requireOrgMember(userId, workspace.orgId);
  return { workspace, role };
}

/** All organizations + workspaces the user belongs to, for the workspace switcher. */
export async function listMembershipsForUser(userId: string) {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      org: {
        include: { workspaces: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  return memberships.map((m) => ({
    role: m.role,
    org: {
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      plan: m.org.plan,
    },
    workspaces: m.org.workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
  }));
}

/** Create an org, make the creator its OWNER, add a first workspace. */
export async function createOrgWithWorkspace(
  userId: string,
  orgName: string,
  workspaceName: string,
) {
  const orgSlug = `${slugify(orgName, "org")}-${Math.random().toString(36).slice(2, 6)}`;

  return prisma.$transaction(async (tx) => {
    const org = await tx.org.create({
      data: { name: orgName, slug: orgSlug, createdBy: userId },
    });
    await tx.orgMember.create({
      data: { orgId: org.id, userId, role: "OWNER" },
    });
    const workspace = await tx.workspace.create({
      data: {
        orgId: org.id,
        name: workspaceName || "General",
        slug: slugify(workspaceName || "general", "general"),
      },
    });
    return { org, workspace };
  });
}

/** Create an additional workspace inside an org the user already admins. */
export async function createWorkspace(orgId: string, name: string) {
  const slug = slugify(name, `ws-${Date.now()}`);
  return prisma.workspace.create({ data: { orgId, name, slug } });
}
