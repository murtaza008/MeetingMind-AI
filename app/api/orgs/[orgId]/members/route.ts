import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(_request: Request, ctx: RouteContext<"/api/orgs/[orgId]/members">) {
  try {
    const { orgId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgMember(userId, orgId);

    const members = await prisma.orgMember.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        profile: { email: m.user.email, fullName: m.user.displayName },
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
