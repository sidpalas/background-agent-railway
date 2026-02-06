import "dotenv/config";

import { createServer } from "node:http";

import app from "./app.js";
import { config } from "./config.js";
import { seedLocalSessions } from "./db/seed.js";
import { pollSandboxHealth } from "./services/sandboxHealth.js";
import {
  handleProxyRequest,
  handleProxyUpgrade,
  isDirectHost,
  isProxyHost,
} from "./proxy/sandboxProxy.js";

const server = createServer((req, res) => {
  const host = req.headers.host;

  if (isProxyHost(host)) {
    handleProxyRequest(req, res);
    return;
  }

  if (isDirectHost(host)) {
    app(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.on("upgrade", (req, socket, head) => {
  const host = req.headers.host;

  if (isProxyHost(host)) {
    handleProxyUpgrade(req, socket, head);
    return;
  }

  socket.destroy();
});

const startServer = async () => {
  if (config.localMode) {
    await seedLocalSessions();
  }

  const poll = async () => {
    try {
      await pollSandboxHealth();
    } catch (error) {
      console.error("Sandbox health poll failed", error);
    }
  };

  let pollInFlight = false;
  setInterval(() => {
    if (pollInFlight) {
      return;
    }
    pollInFlight = true;
    poll()
      .finally(() => {
        pollInFlight = false;
      })
      .catch(() => undefined);
  }, 5000);

  server.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
