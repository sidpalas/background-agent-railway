FROM node:22-bookworm-slim

ARG OPENCODE_VERSION="latest"
ARG CODE_SERVER_VERSION="latest"
ARG CLAUDE_CODE_VERSION="latest"
ARG CODEX_VERSION="latest"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    g++ \
    git \
    make \
    openssh-client \
    python3 \
  && rm -rf /var/lib/apt/lists/*

RUN if [ "$OPENCODE_VERSION" = "latest" ]; then \
    curl -fsSL https://opencode.ai/install | bash; \
  else \
    curl -fsSL https://opencode.ai/install | bash -s -- --version "$OPENCODE_VERSION"; \
  fi

RUN if [ "${CODE_SERVER_VERSION}" = "latest" ]; then \
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone; \
  else \
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --version "${CODE_SERVER_VERSION}" --method=standalone; \
  fi

RUN npm install -g @anthropic-ai/claude-code@"${CLAUDE_CODE_VERSION}"
RUN npm install -g @openai/codex@"${CODEX_VERSION}"
  
ENV PATH="/root/.opencode/bin:/root/.local/bin:${PATH}"

ENTRYPOINT ["code-server", "--host", "0.0.0.0", "--port", "8080", "--auth", "none"]
