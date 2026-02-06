import type { IncomingMessage } from "http";
import type { Request } from "express";
import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { HttpError } from "./errors.js";

export type AuthTokenPayload = {
  sub: string;
  role: "admin" | "sandbox";
  sessionName?: string;
  iat?: number;
  exp?: number;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

const getAuthorizationHeader = (
  req: Pick<Request, "header"> | IncomingMessage,
) => {
  if ("header" in req) {
    return req.header("authorization");
  }

  const header = req.headers?.authorization;
  return Array.isArray(header) ? header[0] : header;
};

const getTokenFromQuery = (req: Pick<Request, "url"> | IncomingMessage) => {
  if (!req.url) {
    return undefined;
  }

  try {
    const parsed = new URL(req.url, "http://localhost");
    const token = parsed.searchParams.get("token");
    if (token) {
      return token;
    }
  } catch (error) {
    return undefined;
  }

  const match = req.url.match(/[?&]token=([^&]+)/);
  if (!match) {
    return undefined;
  }

  return decodeURIComponent(match[1]);
};

const getTokenFromCookie = (
  req: Pick<Request, "headers"> | IncomingMessage,
) => {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("sandbox_token="));
  if (!tokenCookie) {
    return undefined;
  }

  const [, value] = tokenCookie.split("=");
  return value ? decodeURIComponent(value) : undefined;
};

export const getAuthTokenPayload = (
  req: Pick<Request, "header" | "url" | "headers"> | IncomingMessage,
): AuthTokenPayload => {
  const header = getAuthorizationHeader(req);
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : getTokenFromQuery(req) ?? getTokenFromCookie(req);

  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  try {
    return jwt.verify(token, config.authTokenSecret) as AuthTokenPayload;
  } catch (error) {
    throw new HttpError(401, "Unauthorized");
  }
};

export const createAdminToken = () =>
  jwt.sign({ sub: "admin", role: "admin" }, config.authTokenSecret, {
    expiresIn: TOKEN_TTL_SECONDS,
  });

export const createSandboxToken = (sessionName: string) =>
  jwt.sign(
    { sub: sessionName, role: "sandbox", sessionName },
    config.authTokenSecret,
    { expiresIn: TOKEN_TTL_SECONDS },
  );

export const authTokenExpiresInSeconds = TOKEN_TTL_SECONDS;
