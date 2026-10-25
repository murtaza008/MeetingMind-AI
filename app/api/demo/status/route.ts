import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session";
import { handleApiError } from "@/lib/handle-error";
import { DEMO_DAILY_UPLOAD_LIMIT, DEMO_MAX_AUDIO_SECONDS } from "@/lib/demo";
import { demoUploadsUsedToday } from "@/lib/demo-limits";

/** Lets the New meeting page show how many shared demo uploads are left today. */
export async function GET() {
  try {
    const user = await requireSessionUser();
    if (!user.isDemo) return NextResponse.json({ isDemo: false });
    const used = await demoUploadsUsedToday();
    return NextResponse.json({
      isDemo: true,
      uploadLimit: DEMO_DAILY_UPLOAD_LIMIT,
      uploadsRemaining: Math.max(0, DEMO_DAILY_UPLOAD_LIMIT - used),
      maxSeconds: DEMO_MAX_AUDIO_SECONDS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
