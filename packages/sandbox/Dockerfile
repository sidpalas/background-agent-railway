FROM debian:bookworm-slim

ARG OPENCODE_VERSION="latest"
ARG CODE_SERVER_VERSION="latest"

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates bash \
  && rm -rf /var/lib/apt/lists/*

RUN if [ "$OPENCODE_VERSION" = "latest" ]; then \
    curl -fsSL https://opencode.ai/install | bash; \
  else \
    curl -fsSL https://opencode.ai/install | bash -s -- --version "$OPENCODE_VERSION"; \
  fi

RUN if [ "${CODE_SERVER_VERSION}" = "latest" ]; then \
    curl -fsSL https://code-server.dev/install.sh | sh; \
  else \
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --version "${CODE_SERVER_VERSION}"; \
  fi
  
ENV PATH="/root/.opencode/bin:${PATH}"

ENTRYPOINT ["code-server", "--host", "0.0.0.0", "--port", "8080", "--auth", "none"]
