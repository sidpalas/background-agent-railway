import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  createSession,
  deleteSession,
  fetchSessions,
  getStoredToken,
  createSandboxToken,
  getProxyUrl,
  login,
  clearStoredToken,
  storeToken,
} from "./lib/api";

type Session = {
  id: string;
  name: string;
  status: string;
  railwayServiceId: string;
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [launchingSessionId, setLaunchingSessionId] = useState<string | null>(
    null,
  );
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const isLocalMode = import.meta.env.VITE_LOCAL_MODE === "true";

  const hasToken = Boolean(token);

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setSessions([]);
  };

  const handleApiError = (message: string) => {
    setError(message);
  };

  const refreshSessions = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const data = await fetchSessions(token);
      setSessions(data);
      setLastSyncedAt(new Date());
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "unauthorized") {
          handleLogout();
          handleApiError("Session expired. Please sign in again.");
          return;
        }
        handleApiError(error.message);
      }
    } finally {
      setSyncing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshSessions();
    }
  }, [refreshSessions, token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refreshSessions();
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshSessions, token]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login(password);
      storeToken(response.token);
      setToken(response.token);
      setPassword("");
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (isLocalMode) return;
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await createSession(token, name.trim() ? name.trim() : undefined);
      setName("");
      await refreshSessions();
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await deleteSession(token, id);
      await refreshSessions();
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSession = async (session: Session) => {
    if (!token) return;
    setLaunchingSessionId(session.id);
    setError(null);
    try {
      const sandboxToken = await createSandboxToken(token, session.id);
      const proxyUrl = getProxyUrl(sandboxToken.token);
      window.open(proxyUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error.message);
      }
    } finally {
      setLaunchingSessionId(null);
    }
  };

  const visibleSessions = useMemo(
    () =>
      showDeleted
        ? sessions
        : sessions.filter((session) => session.status !== "deleted"),
    [sessions, showDeleted],
  );

  const stats = useMemo(() => {
    const active = visibleSessions.filter(
      (session) => session.status === "active",
    );
    return {
      total: visibleSessions.length,
      active: active.length,
    };
  }, [visibleSessions]);

  return (
    <div className="app">
      {!hasToken ? (
        <>
          <header className="hero">
            <span className="eyebrow">Railway Session Control</span>
            <h1>Spin up sandbox services in seconds.</h1>
            <p>
              Launch, inspect, and retire Railway service sandboxes without
              leaving the browser.
            </p>
            <div className="hero-card">
              <div>
                <h2>Admin access</h2>
                <p>Sign in to manage ephemeral environments safely.</p>
              </div>
              <div className="pill">24h access token</div>
            </div>
          </header>
          <main className="panel">
            <div className="panel-body">
              <div className="panel-header">
                <div>
                  <h2>Sign in</h2>
                  <p>Use the admin password to unlock the session console.</p>
                </div>
              </div>
              <form className="form" onSubmit={handleLogin}>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="Admin password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                {error ? <div className="alert">{error}</div> : null}
                <button className="primary" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </main>
        </>
      ) : (
        <main className="panel">
          <div className="panel-body">
            <div className="panel-header">
              <div>
                <h2>Session dashboard</h2>
                <p>
                  {syncing ? "Syncing sessions..." : "Live Railway sessions."}
                </p>
              </div>
              <div className="panel-actions">
                <div className="metric">
                  <span>Total</span>
                  <strong>{stats.total}</strong>
                </div>
              <div className="metric">
                <span>Active</span>
                <strong>{stats.active}</strong>
              </div>
              <button
                className="ghost"
                onClick={() => setShowDeleted((prev) => !prev)}
              >
                {showDeleted ? "Hide deleted" : "Show deleted"}
              </button>
              <button className="ghost" onClick={handleLogout}>
                Sign out
              </button>
            </div>
            </div>

            <form className="form inline" onSubmit={handleCreateSession}>
              <label className="field">
                <span>New session</span>
                <input
                  type="text"
                  placeholder="Sandbox name (optional)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isLocalMode}
                />
              </label>
              <button
                className="primary"
                type="submit"
                disabled={loading || isLocalMode}
              >
                {loading ? "Creating..." : "Create session"}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => refreshSessions()}
                disabled={syncing}
              >
                Refresh
              </button>
            </form>

            {isLocalMode ? (
              <div className="alert">
                Session creation is disabled in local mode.
              </div>
            ) : null}

            {error ? <div className="alert">{error}</div> : null}

            <div className="sessions">
              {visibleSessions.length === 0 ? (
                <div className="empty">
                  <h3>No sessions to show</h3>
                  <p>
                    {showDeleted
                      ? "Create your first sandbox to start testing."
                      : "Toggle deleted sessions to view retired sandboxes."}
                  </p>
                </div>
              ) : (
                visibleSessions.map((session) => (
                  <article className="session-card" key={session.id}>
                    <div>
                      <h3>{session.name}</h3>
                      <p className="muted">
                        <span
                          className={`status-tag status-${session.status}`}
                        >
                          {session.status}
                        </span>
                        <span> · </span>
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p className="id">Service {session.railwayServiceId}</p>
                    </div>
                    <div className="session-actions">
                      <button
                        className="ghost"
                        onClick={() => handleLaunchSession(session)}
                        disabled={
                          loading ||
                          session.status !== "active" ||
                          launchingSessionId === session.id
                        }
                      >
                        {launchingSessionId === session.id
                          ? "Launching..."
                          : "Open sandbox"}
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={loading || session.status !== "active"}
                      >
                        Retire
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="footnote">
              {lastSyncedAt
                ? `Last synced ${lastSyncedAt.toLocaleTimeString()}`
                : "Awaiting first sync."}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
