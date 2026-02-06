const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const parseSandboxLocalMap = (value?: string) => {
  if (!value) {
    return {};
  }

  return value.split(",").reduce<Record<string, string>>((acc, entry) => {
    const [key, target] = entry.split("=");
    if (!key || !target) {
      return acc;
    }

    acc[key.trim()] = target.trim();
    return acc;
  }, {});
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requiredEnv("DATABASE_URL"),
  railwayApiToken: requiredEnv("RAILWAY_API_TOKEN"),
  railwayProjectId: requiredEnv("RAILWAY_PROJECT_ID"),
  railwayEnvironmentId: requiredEnv("RAILWAY_ENVIRONMENT_ID"),
  railwayServiceImage: requiredEnv("RAILWAY_SERVICE_IMAGE"),
  railwayGraphqlUrl:
    process.env.RAILWAY_GRAPHQL_URL ?? "https://backboard.railway.app/graphql/v2",
  adminPassword: requiredEnv("ADMIN_PASSWORD"),
  authTokenSecret: requiredEnv("AUTH_TOKEN_SECRET"),
  webOrigin: process.env.WEB_ORIGIN,
  apiDirectHost: process.env.API_DIRECT_HOST ?? "localhost",
  apiProxyHost: process.env.API_PROXY_HOST ?? "proxy.localhost",
  sandboxInternalDomain:
    process.env.SANDBOX_INTERNAL_DOMAIN ?? "railway.internal",
  sandboxPort: Number(process.env.SANDBOX_PORT ?? 8080),
  sandboxLocalBaseUrl: process.env.SANDBOX_LOCAL_BASE_URL,
  sandboxLocalMap: parseSandboxLocalMap(process.env.SANDBOX_LOCAL_MAP),
  sandboxRepoUrl: process.env.SANDBOX_REPO_URL,
  githubPersonalAccessToken: process.env.GH_TOKEN,
  localMode:
    process.env.LOCAL_MODE === "true" ||
    ((process.env.SANDBOX_LOCAL_BASE_URL || process.env.SANDBOX_LOCAL_MAP) &&
      (process.env.NODE_ENV ?? "development") !== "production"),
};
