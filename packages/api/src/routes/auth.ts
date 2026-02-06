import { Router } from "express";
import { config } from "../config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  authTokenExpiresInSeconds,
  createAdminToken,
} from "../utils/auth.js";
import { HttpError } from "../utils/errors.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { password } = req.body ?? {};

    if (typeof password !== "string" || password !== config.adminPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = createAdminToken();

    res.json({ token, expiresIn: authTokenExpiresInSeconds });
  }),
);

export default router;
