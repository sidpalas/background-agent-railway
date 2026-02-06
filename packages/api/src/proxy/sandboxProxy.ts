import type { IncomingMessage } from "http";
import type { ServerResponse } from "http";
import type { Duplex } from "stream";
import httpProxy from "http-proxy";

import { config } from "../config.js";
import { getAuthTokenPayload } from "../utils/auth.js";
import { HttpError } from "../utils/errors.js";
import { resolveSandboxTarget } from "../utils/sandboxTarget.js";

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  xfwd: true,
});

proxy.on("proxyReqWs", (proxyReq) => {
  proxyReq.removeHeader("origin");
  proxyReq.removeHeader("sec-websocket-origin");
});

proxy.on("proxyRes", (proxyRes, req, res) => {
  const token = (req as IncomingMessage & { sandboxToken?: string }).sandboxToken;
  if (!token) {
    return;
  }

  const cookieValue =
    `sandbox_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookieValue]);
    return;
  }

  res.setHeader("Set-Cookie", [existing.toString(), cookieValue]);
});

const normalizeHost = (host?: string) =>
  host?.toLowerCase().split(":")[0];

const getTokenFromUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    const token = parsed.searchParams.get("token");
    if (token) {
      return token;
    }
  } catch (error) {
    return undefined;
  }

  const match = url.match(/[?&]token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
};

export const isProxyHost = (host?: string) =>
  normalizeHost(host) === normalizeHost(config.apiProxyHost);

export const isDirectHost = (host?: string) =>
  normalizeHost(host) === normalizeHost(config.apiDirectHost);

const resolveSandboxTargetUrl = (sessionName: string) =>
  resolveSandboxTarget(sessionName);

const sendJsonError = (res: ServerResponse, error: HttpError) => {
  if (res.headersSent) {
    return;
  }

  res.writeHead(error.status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: error.message }));
};

const rejectUpgrade = (socket: Duplex, error: HttpError) => {
  socket.write(`HTTP/1.1 ${error.status} ${error.message}\r\n\r\n`);
  socket.destroy();
};

const getProxyTarget = (req: IncomingMessage) => {
  const payload = getAuthTokenPayload(req);
  const sessionName = payload.sessionName ?? payload.sub;

  if (!sessionName) {
    throw new HttpError(401, "Unauthorized");
  }

  return resolveSandboxTargetUrl(sessionName);
};

export const handleProxyRequest = (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  try {
    const tokenFromUrl = getTokenFromUrl(req.url);
    if (tokenFromUrl) {
      (req as IncomingMessage & { sandboxToken?: string }).sandboxToken =
        tokenFromUrl;
    }

    const target = getProxyTarget(req);
    proxy.web(req, res, { target }, (error) => {
      if (error) {
        sendJsonError(res, new HttpError(502, "Sandbox proxy error"));
      }
    });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJsonError(res, error);
      return;
    }

    sendJsonError(res, new HttpError(500, "Internal server error"));
  }
};

export const handleProxyUpgrade = (
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => {
  try {
    const target = getProxyTarget(req);
    proxy.ws(req, socket, head, { target }, (error) => {
      if (error) {
        rejectUpgrade(socket, new HttpError(502, "Sandbox proxy error"));
      }
    });
  } catch (error) {
    if (error instanceof HttpError) {
      rejectUpgrade(socket, error);
      return;
    }

    rejectUpgrade(socket, new HttpError(500, "Internal server error"));
  }
};
