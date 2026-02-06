import { eq, inArray } from "drizzle-orm";

import { db } from "../db/client.js";
import { sessions } from "../db/schema.js";
import { resolveSandboxHealthUrl } from "../utils/sandboxTarget.js";

const HEALTH_TIMEOUT_MS = 3000;
const HEALTH_CHECK_STATUSES = ["starting", "active"] as const;

const checkSandboxHealth = async (healthUrl: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const updateSessionStatus = async (id: string, status: string) => {
  await db
    .update(sessions)
    .set({ status, updatedAt: new Date() })
    .where(eq(sessions.id, id));
};

export const pollSandboxHealth = async () => {
  const candidates = await db
    .select()
    .from(sessions)
    .where(inArray(sessions.status, [...HEALTH_CHECK_STATUSES]));

  await Promise.all(
    candidates.map(async (session) => {
      const healthUrl = resolveSandboxHealthUrl(session.name);
      const isHealthy = await checkSandboxHealth(healthUrl);
      const nextStatus = isHealthy ? "active" : "starting";

      if (session.status !== nextStatus) {
        await updateSessionStatus(session.id, nextStatus);
      }
    }),
  );
};
