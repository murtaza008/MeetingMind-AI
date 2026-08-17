import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

const UpdateOrgInput = z.object({
  name: z.string().trim().min(2).max(80).optional(),
});

/** PATCH: rename the org. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/orgs/[orgId]">) {
  try {
    const { orgId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);
    const body = UpdateOrgInput.parse(await request.json());

    const org = await prisma.org.update({ where: { id: orgId }, data: body });
    return NextResponse.json(org);
  } catch (error) {
    return handleApiError(error);
  }
}
