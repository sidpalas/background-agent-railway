FROM debian:bookworm-slim

ARG OPENCODE_VERSION="latest"

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates bash \
  && rm -rf /var/lib/apt/lists/*

RUN if [ "$OPENCODE_VERSION" = "latest" ]; then \
    curl -fsSL https://opencode.ai/install | bash; \
  else \
    curl -fsSL https://opencode.ai/install | bash -s -- --version "$OPENCODE_VERSION"; \
  fi

ENV PATH="/root/.opencode/bin:${PATH}"

ENTRYPOINT ["opencode", "web", "--port", "3000", "--hostname", "0.0.0.0"]
