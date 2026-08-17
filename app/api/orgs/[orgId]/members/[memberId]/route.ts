import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES, ForbiddenError } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

const UpdateRoleInput = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

async function assertNotLastOwner(orgId: string, memberId: string) {
  const target = await prisma.orgMember.findUnique({ where: { id: memberId } });
  if (!target || target.role !== "OWNER") return;
  const ownerCount = await prisma.orgMember.count({ where: { orgId, role: "OWNER" } });
  if (ownerCount <= 1) {
    throw new ForbiddenError("An organization needs at least one owner.");
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/orgs/[orgId]/members/[memberId]">,
) {
  try {
    const { orgId, memberId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);
    const { role } = UpdateRoleInput.parse(await request.json());

    if (role !== "OWNER") await assertNotLastOwner(orgId, memberId);

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
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);
    await assertNotLastOwner(orgId, memberId);

    await prisma.orgMember.delete({ where: { id: memberId, orgId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
