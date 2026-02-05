import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { HttpError } from "../utils/errors.js";

type AuthTokenPayload = {
  sub: string;
  role: "admin";
};

export const authTokenMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  try {
    jwt.verify(token, config.authTokenSecret) as AuthTokenPayload;
  } catch (error) {
    throw new HttpError(401, "Unauthorized");
  }

  next();
};
