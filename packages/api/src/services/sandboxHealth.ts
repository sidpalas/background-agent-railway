import { eq, inArray } from "drizzle-orm";

import { db } from "../db/client.js";
import { sessions } from "../db/schema.js";
import { resolveSandboxHealthUrl } from "../utils/sandboxTarget.js";

const HEALTH_TIMEOUT_MS = 3000;
const STARTUP_TIMEOUT_MS = 90_000;
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

  const now = Date.now();

  await Promise.all(
    candidates.map(async (session) => {
      const healthUrl = resolveSandboxHealthUrl(session.name);
      const isHealthy = await checkSandboxHealth(healthUrl);

      if (isHealthy) {
        if (session.status !== "active") {
          await updateSessionStatus(session.id, "active");
        }
        return;
      }

      if (
        session.status === "starting" &&
        session.createdAt &&
        now - session.createdAt.getTime() > STARTUP_TIMEOUT_MS
      ) {
        await updateSessionStatus(session.id, "failed");
        return;
      }

      if (session.status !== "starting") {
        await updateSessionStatus(session.id, "starting");
      }
    }),
  );
};
