import { Router } from "express";
import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/errors.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { password } = req.body ?? {};

    if (typeof password !== "string" || password !== config.adminPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        sub: "admin",
        role: "admin",
      },
      config.authTokenSecret,
      { expiresIn: "24h" },
    );

    res.json({ token, expiresIn: 60 * 60 * 24 });
  }),
);

export default router;
