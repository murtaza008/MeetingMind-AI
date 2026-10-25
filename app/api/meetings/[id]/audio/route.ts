import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(request: Request, ctx: RouteContext<"/api/meetings/[id]/audio">) {
  try {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      select: { audio: true, audioMimeType: true, workspace: { select: { orgId: true } } },
    });
    if (!meeting || !meeting.audio) {
      return NextResponse.json({ error: "No audio stored for this meeting." }, { status: 404 });
    }
    await requireOrgMember(userId, meeting.workspace.orgId);

    const audio = new Uint8Array(meeting.audio);
    const headers = {
      "Content-Type": meeting.audioMimeType ?? "audio/webm",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
    };

    // Safari won't play (and no browser seeks well) without byte-range support.
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    if (range && (range[1] || range[2])) {
      const size = audio.length;
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start >= size || start > end) {
        return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
      }
      return new NextResponse(audio.slice(start, end + 1), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }

    return new NextResponse(audio, { headers: { ...headers, "Content-Length": String(audio.length) } });
  } catch (error) {
    return handleApiError(error);
  }
}
