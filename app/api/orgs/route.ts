import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/session";
import { listMembershipsForUser, createOrgWithWorkspace } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

/** GET: every org (+ its workspaces) the signed-in user belongs to. */
export async function GET() {
  try {
    const userId = await requireUserId();
    const memberships = await listMembershipsForUser(userId);
    return NextResponse.json(memberships);
  } catch (error) {
    return handleApiError(error);
  }
}

const CreateOrgInput = z.object({
  orgName: z.string().trim().min(2, "Organization name is too short.").max(80),
  workspaceName: z.string().trim().max(80).default("General"),
});

/** POST: create an org, make the caller OWNER, add a first workspace. */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = CreateOrgInput.parse(await request.json());
    const { org, workspace } = await createOrgWithWorkspace(
      userId,
      body.orgName,
      body.workspaceName,
    );
    return NextResponse.json({ orgId: org.id, workspaceId: workspace.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
