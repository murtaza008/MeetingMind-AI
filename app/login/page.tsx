import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in — MeetingMind AI" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { demo } = await searchParams;
  return <AuthForm mode="login" demoUnavailable={demo === "unavailable"} />;
}
