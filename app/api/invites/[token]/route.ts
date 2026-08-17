import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/handle-error";

/** Public preview so the invite page can show who's inviting before sign-in. */
export async function GET(_request: Request, ctx: RouteContext<"/api/invites/[token]">) {
  try {
    const { token } = await ctx.params;
    const invite = await prisma.orgInvite.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    });
    if (!invite) {
      return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
    }

    return NextResponse.json({
      orgName: invite.org.name,
      role: invite.role,
      invitedEmail: invite.email,
      expired: invite.expiresAt.getTime() < Date.now(),
      accepted: Boolean(invite.acceptedAt),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
