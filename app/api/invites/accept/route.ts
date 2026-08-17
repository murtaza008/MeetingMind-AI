import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/session";
import { handleApiError } from "@/lib/handle-error";

const AcceptInviteInput = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) throw new UnauthorizedError();
    const { token } = AcceptInviteInput.parse(await request.json());

    const invite = await prisma.orgInvite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "This invite has already been used." }, { status: 409 });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
    }
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address." },
        { status: 403 },
      );
    }

    const workspace = await prisma.$transaction(async (tx) => {
      await tx.orgMember.upsert({
        where: { orgId_userId: { orgId: invite.orgId, userId: session.user!.id! } },
        update: {},
        create: { orgId: invite.orgId, userId: session.user!.id!, role: invite.role },
      });
      await tx.orgInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return tx.workspace.findFirst({ where: { orgId: invite.orgId }, orderBy: { createdAt: "asc" } });
    });

    return NextResponse.json({ workspaceId: workspace?.id ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
