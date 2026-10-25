import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signIn } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/demo";

/**
 * "Try demo": signs the visitor into the shared demo account entirely on the
 * server, so the password never reaches the browser. Posted to by a plain
 * <form>, so it works from server components and without JavaScript.
 */
export async function POST(request: Request) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return redirectTo(request, "/login?demo=unavailable");

  try {
    // With redirect: false, Auth.js doesn't always throw on failure (a bad
    // password or an untrusted host can come back as a plain URL), so the
    // only reliable success signal is a freshly written session cookie (compared
    // with the one the visitor arrived with, in case they were already signed in).
    const sessionToken = async () =>
      (await cookies()).getAll().find((c) => c.name.endsWith("authjs.session-token"))?.value;
    const before = await sessionToken();
    const result = await signIn("credentials", { email: DEMO_EMAIL, password, redirect: false });
    const after = await sessionToken();
    if (!after || after === before) {
      throw new Error(`Auth.js did not create a session (returned ${String(result)})`);
    }
  } catch (error) {
    console.error("Demo sign-in failed. Has `npm run seed:demo` run against this database?", error);
    return redirectTo(request, "/login?demo=unavailable");
  }
  return redirectTo(request, "/dashboard");
}

// 303 so the browser follows with a GET instead of re-posting.
function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}
