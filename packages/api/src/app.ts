import { sql } from "drizzle-orm";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import { config } from "./config.js";
import { db } from "./db/client.js";
import { authTokenMiddleware } from "./middleware/authToken.js";
import authRouter from "./routes/auth.js";
import sessionsRouter from "./routes/sessions.js";
import { HttpError } from "./utils/errors.js";

const app = express();

app.use(
  cors({
    origin: config.webOrigin ?? true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    res.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.use("/auth", authRouter);

app.use(authTokenMiddleware);

app.use("/sessions", sessionsRouter);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Not found"));
});

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
