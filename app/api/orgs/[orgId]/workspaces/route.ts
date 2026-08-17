import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES, createWorkspace } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

const CreateWorkspaceInput = z.object({
  name: z.string().trim().min(2, "Workspace name is too short.").max(80),
});

export async function POST(request: Request, ctx: RouteContext<"/api/orgs/[orgId]/workspaces">) {
  try {
    const { orgId } = await ctx.params;
    const userId = await requireUserId();
    await requireOrgRole(userId, orgId, ADMIN_ROLES);
    const body = CreateWorkspaceInput.parse(await request.json());

    const workspace = await createWorkspace(orgId, body.name);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
