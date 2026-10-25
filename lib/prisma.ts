import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

// Recordings live in Meeting.audio (bytea, up to a few MB each). Without this,
// every meeting query — the dashboard list included — would pull them all
// from the database. Only /api/meetings/[id]/audio selects the column.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, omit: { meeting: { audio: true } } });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
