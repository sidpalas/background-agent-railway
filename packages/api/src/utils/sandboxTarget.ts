import { config } from "../config.js";

export const resolveSandboxTarget = (sessionName: string) => {
  const localTarget =
    config.sandboxLocalMap[sessionName] ?? config.sandboxLocalBaseUrl;

  if (config.localMode && localTarget) {
    return localTarget;
  }

  return `http://${sessionName}.${config.sandboxInternalDomain}:${config.sandboxPort}`;
};

export const resolveSandboxHealthUrl = (sessionName: string) => {
  const target = resolveSandboxTarget(sessionName);
  return new URL("/healthz", target).toString();
};
