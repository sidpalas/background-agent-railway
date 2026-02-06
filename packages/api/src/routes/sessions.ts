import { Router } from "express";

import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
} from "../services/sessions.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  authTokenExpiresInSeconds,
  createSandboxToken,
} from "../utils/auth.js";
import { HttpError } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const sessions = await listSessions();
    res.json({ data: sessions });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.id);
    res.json({ data: session });
  }),
);

router.post(
  "/:id/token",
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== "admin") {
      throw new HttpError(403, "Forbidden");
    }

    const session = await getSession(req.params.id);
    const token = createSandboxToken(session.name);

    res.json({
      data: {
        token,
        expiresIn: authTokenExpiresInSeconds,
        sessionName: session.name,
      },
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};

    const session = await createSession({
      name: typeof name === "string" ? name : undefined,
    });

    res.status(201).json({ data: session });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const session = await deleteSession(req.params.id);
    res.json({ data: session });
  }),
);

export default router;
