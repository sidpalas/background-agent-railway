import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

import { config } from "../config.js";
import { db } from "../db/client.js";
import { sessions } from "../db/schema.js";
import { railwayRequest } from "../railway/client.js";
import {
  serviceCreateMutation,
  serviceDeleteMutation,
} from "../railway/mutations.js";
import { HttpError } from "../utils/errors.js";

type ServiceCreateResponse = {
  serviceCreate: {
    id: string;
  };
};

type ServiceDeleteResponse = {
  serviceDelete: boolean;
};

export type CreateSessionInput = {
  name?: string;
};

const generateSessionName = () => `sandbox-${Date.now()}`;

export const createSession = async ({ name }: CreateSessionInput) => {
  if (config.localMode) {
    throw new HttpError(403, "Session creation disabled in local mode");
  }

  const resolvedName = name?.trim() ? name.trim() : generateSessionName();
  const sandboxVariables: Record<string, string> = {};

  if (config.sandboxRepoUrl) {
    sandboxVariables.SANDBOX_REPO_URL = config.sandboxRepoUrl;
  }

  if (config.githubPersonalAccessToken) {
    sandboxVariables.GH_TOKEN = config.githubPersonalAccessToken;
  }

  const serviceCreateInput: Record<string, unknown> = {
    projectId: config.railwayProjectId,
    environmentId: config.railwayEnvironmentId,
    name: resolvedName,
    source: {
      image: config.railwayServiceImage,
    },
  };

  if (Object.keys(sandboxVariables).length > 0) {
    serviceCreateInput.variables = sandboxVariables;
  }

  const data = await railwayRequest<ServiceCreateResponse>(
    serviceCreateMutation,
    {
      input: serviceCreateInput,
    },
  );

  if (!data.serviceCreate?.id) {
    throw new HttpError(502, "Railway API error: missing service id");
  }

  const id = randomUUID();
  const now = new Date();

  const [session] = await db
    .insert(sessions)
    .values({
      id,
      name: resolvedName,
      status: "starting",
      railwayServiceId: data.serviceCreate.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return session;
};

export const listSessions = async () =>
  db.select().from(sessions).orderBy(desc(sessions.createdAt));

export const getSession = async (id: string) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  return session;
};

export const deleteSession = async (id: string) => {
  const session = await getSession(id);

  if (session.status === "deleted") {
    return session;
  }

  const [terminating] = await db
    .update(sessions)
    .set({
      status: "terminating",
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id))
    .returning();

  try {
    await railwayRequest<ServiceDeleteResponse>(serviceDeleteMutation, {
      id: session.railwayServiceId,
    });
  } catch (error) {
    await db
      .update(sessions)
      .set({ status: session.status, updatedAt: new Date() })
      .where(eq(sessions.id, id));
    throw error;
  }

  const [updated] = await db
    .update(sessions)
    .set({
      status: "deleted",
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id))
    .returning();

  return updated;
};
