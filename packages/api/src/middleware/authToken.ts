import { Request, Response, NextFunction } from "express";

import { getAuthTokenPayload } from "../utils/auth.js";

export const authTokenMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const payload = getAuthTokenPayload(req);
  req.auth = payload;

  next();
};
