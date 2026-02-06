const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const PROXY_BASE_URL =
  import.meta.env.VITE_PROXY_BASE_URL ?? "http://proxy.localhost:3000";
const TOKEN_KEY = "railway_admin_token";

type ApiResponse<T> = {
  data: T;
};

type LoginResponse = {
  token: string;
  expiresIn: number;
};

type SandboxTokenResponse = {
  token: string;
  expiresIn: number;
  sessionName: string;
};

type Session = {
  id: string;
  name: string;
  status: string;
  railwayServiceId: string;
  createdAt: string;
  updatedAt: string;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error ?? "Request failed";
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const login = async (password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (response.status === 401) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error ?? "Invalid credentials";
    throw new Error(message);
  }

  return handleResponse<LoginResponse>(response);
};

export const fetchSessions = async (token: string): Promise<Session[]> => {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await handleResponse<ApiResponse<Session[]>>(response);
  return result.data;
};

export const createSession = async (
  token: string,
  name?: string,
): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const result = await handleResponse<ApiResponse<Session>>(response);
  return result.data;
};

export const deleteSession = async (
  token: string,
  id: string,
): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await handleResponse<ApiResponse<Session>>(response);
  return result.data;
};

export const createSandboxToken = async (
  token: string,
  id: string,
): Promise<SandboxTokenResponse> => {
  const response = await fetch(`${API_URL}/sessions/${id}/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await handleResponse<ApiResponse<SandboxTokenResponse>>(response);
  return result.data;
};

export const getProxyUrl = (token: string) =>
  `${PROXY_BASE_URL}/?token=${encodeURIComponent(token)}`;

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const storeToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
