const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
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
};
