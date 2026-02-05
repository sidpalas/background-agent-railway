import { config } from "../config.js";
import { HttpError } from "../utils/errors.js";

type RailwayResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>; 
};

export const railwayRequest = async <T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(config.railwayGraphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.railwayApiToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new HttpError(502, `Railway API error: ${response.status}`);
  }

  const payload = (await response.json()) as RailwayResponse<T>;

  if (payload.errors?.length) {
    const messages = payload.errors
      .map((error) => error.message ?? "Unknown error")
      .join("; ");
    throw new HttpError(502, `Railway API error: ${messages}`);
  }

  if (!payload.data) {
    throw new HttpError(502, "Railway API error: missing response data");
  }

  return payload.data;
};
