// Public demo account: one shared login that "Try demo" signs every visitor
// into. Client-safe on purpose — no secrets here; the password lives only in
// the DEMO_PASSWORD env var and is read by server code.

export const DEMO_EMAIL = "demo@meetingmind.demo";

/** Audio processing is the only paid-for-in-quota step, so the demo caps it hard. */
export const DEMO_DAILY_UPLOAD_LIMIT = 2;
export const DEMO_MAX_AUDIO_SECONDS = 180;

export const DEMO_BANNER_MESSAGE = "You're viewing a demo account. Data resets daily.";

export const DEMO_UPLOAD_LIMIT_MESSAGE =
  "Demo upload limit reached for today. Explore the sample meetings, or contact me on Upwork for a full trial.";

export const DEMO_TOO_LONG_MESSAGE =
  "Demo recordings are limited to 3 minutes. Trim the file or record a shorter clip.";

export function isDemoEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === DEMO_EMAIL;
}

/** Friendly copy for an action the demo account can't take, e.g. demoBlockedMessage("Deleting meetings"). */
export function demoBlockedMessage(action: string): string {
  return `${action} is turned off in the demo account so it stays intact for the next visitor. Create a free account to try it with your own data.`;
}
