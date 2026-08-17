import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(_request: Request, ctx: RouteContext<"/api/orgs/[orgId]/invites">) {
  try {
    const { orgId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);

    const invites = await prisma.orgInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invites);
  } catch (error) {
    return handleApiError(error);
  }
}

const CreateInviteInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const INVITE_TTL_DAYS = 7;

export async function POST(request: Request, ctx: RouteContext<"/api/orgs/[orgId]/invites">) {
  try {
    const { orgId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);
    const body = CreateInviteInput.parse(await request.json());

    const invite = await prisma.orgInvite.create({
      data: {
        orgId,
        email: body.email,
        role: body.role,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ token: invite.token }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
