/**
 * Builds (or rebuilds) the public demo organization, "Lumen Labs".
 *
 *   npm run seed:demo
 *
 * Idempotent: every run wipes only the demo org and the demo accounts'
 * memberships, then recreates five finished meetings with dates relative to
 * today. Real users, orgs and meetings are never touched. The same reset runs
 * daily from /api/cron/demo-reset.
 *
 * Needs DATABASE_URL and DEMO_PASSWORD (a long random string) in the env.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { resetDemoData } from "../lib/demo-seed";
import { DEMO_EMAIL } from "../lib/demo";
import { DEMO_SHARE_TOKEN } from "../lib/demo-data";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
  try {
    const result = await resetDemoData(prisma, { password: process.env.DEMO_PASSWORD ?? "" });
    console.log(
      `Demo reset: ${result.meetings} meetings, ${result.actionItems} action items, ` +
        `${result.members} members (replaced ${result.removedOrgs} previous demo org${result.removedOrgs === 1 ? "" : "s"}).`,
    );
    console.log(`Sign in via "Try demo" (account ${DEMO_EMAIL}). Public share link: /share/${DEMO_SHARE_TOKEN}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
