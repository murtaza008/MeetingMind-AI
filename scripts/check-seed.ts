/** Quick read-only check of what the seed script created. */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const EMAIL = (process.argv[2] ?? "murtazaaa7798@gmail.com").toLowerCase();

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const member = await prisma.orgMember.findFirst({
    where: { user: { email: EMAIL } },
    include: { org: { include: { workspaces: true } } },
  });
  if (!member) throw new Error(`No org for ${EMAIL}`);

  const workspace = member.org.workspaces[0];
  const meetings = await prisma.meeting.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { meetingDate: "desc" },
    include: {
      transcript: { select: { fullText: true } },
      summary: { select: { keyTopics: true, followupEmail: true } },
      _count: { select: { decisions: true, actionItems: true } },
    },
  });

  console.log(`\nOrg: ${member.org.name} · Workspace: ${workspace.name}\n`);
  for (const m of meetings) {
    const audioKb = m.audio ? (m.audio.length / 1024).toFixed(0) + " KB" : "no audio";
    console.log(`${m.title}`);
    console.log(
      `   ${m.status} · ${m.meetingDate.toISOString().slice(0, 10)} · ${m.durationSeconds}s · ${audioKb}`,
    );
    console.log(
      `   transcript: ${m.transcript ? m.transcript.fullText.split("\n").length + " lines" : "MISSING"}` +
        ` · summary: ${m.summary ? m.summary.keyTopics.length + " topics" : "MISSING"}` +
        ` · email draft: ${m.summary?.followupEmail ? "yes" : "no"}` +
        ` · decisions: ${m._count.decisions} · actions: ${m._count.actionItems}`,
    );
  }
  console.log(`\n${meetings.length} meetings total.\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
