import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES, ForbiddenError } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

const UpdateRoleInput = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

async function findTarget(orgId: string, memberId: string) {
  const target = await prisma.orgMember.findUnique({ where: { id: memberId } });
  if (!target || target.orgId !== orgId) throw new ForbiddenError("Member not found.");
  return target;
}

async function assertNotLastOwner(orgId: string, target: { role: string }) {
  if (target.role !== "OWNER") return;
  const ownerCount = await prisma.orgMember.count({ where: { orgId, role: "OWNER" } });
  if (ownerCount <= 1) {
    throw new ForbiddenError("An organization needs at least one owner.");
  }
}

/** Only owners may grant, revoke or remove the owner role; admins manage everyone else. */
function assertCanManage(callerRole: string, targetRole: string, newRole?: string) {
  if (callerRole !== "OWNER" && (targetRole === "OWNER" || newRole === "OWNER")) {
    throw new ForbiddenError("Only an owner can change who owns the organization.");
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/orgs/[orgId]/members/[memberId]">,
) {
  try {
    const { orgId, memberId } = await ctx.params;
    const user = await requireSessionUser();
    forbidInDemo(user, "Changing team roles");
    const callerRole = await requireOrgRole(user.id, orgId, ADMIN_ROLES);
    const { role } = UpdateRoleInput.parse(await request.json());

    const target = await findTarget(orgId, memberId);
    assertCanManage(callerRole, target.role, role);
    if (role !== "OWNER") await assertNotLastOwner(orgId, target);

    const member = await prisma.orgMember.update({
      where: { id: memberId, orgId },
      data: { role },
    });
    return NextResponse.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/orgs/[orgId]/members/[memberId]">,
) {
  try {
    const { orgId, memberId } = await ctx.params;
    const user = await requireSessionUser();
    forbidInDemo(user, "Removing team members");
    const callerRole = await requireOrgRole(user.id, orgId, ADMIN_ROLES);

    const target = await findTarget(orgId, memberId);
    assertCanManage(callerRole, target.role);
    await assertNotLastOwner(orgId, target);

    await prisma.orgMember.delete({ where: { id: memberId, orgId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
