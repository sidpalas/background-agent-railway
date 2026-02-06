import { inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "./client.js";
import { sessions } from "./schema.js";

const LOCAL_SESSIONS = [
  {
    name: "sandbox-a",
    railwayServiceId: "local-sandbox-a",
  },
  {
    name: "sandbox-b",
    railwayServiceId: "local-sandbox-b",
  },
];

export const seedLocalSessions = async () => {
  const names = LOCAL_SESSIONS.map((session) => session.name);
  const existing = await db
    .select({ name: sessions.name })
    .from(sessions)
    .where(inArray(sessions.name, names));
  const existingNames = new Set(existing.map((session) => session.name));
  const now = new Date();

  const missing = LOCAL_SESSIONS.filter(
    (session) => !existingNames.has(session.name),
  ).map((session) => ({
    id: randomUUID(),
    name: session.name,
    status: "starting",
    railwayServiceId: session.railwayServiceId,
    createdAt: now,
    updatedAt: now,
  }));

  if (missing.length === 0) {
    return;
  }

  await db.insert(sessions).values(missing);
};
