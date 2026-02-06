#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_DIR="/home/sandbox/workspace"
REPO_DIR="${WORKSPACE_DIR}/repo"
REPO_URL="${SANDBOX_REPO_URL:-https://github.com/sidpalas/background-agent-railway.git}"
GITHUB_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GITHUB_TOKEN:-${GH_TOKEN:-}}}"

mkdir -p "${WORKSPACE_DIR}"

if [ -n "${GITHUB_TOKEN}" ] && [ ! -d "${REPO_DIR}/.git" ]; then
  CLONE_URL="${REPO_URL}"

  if [[ "${REPO_URL}" == https://github.com/* ]]; then
    CLONE_URL="https://x-access-token:${GITHUB_TOKEN}@${REPO_URL#https://}"
  fi

  git clone "${CLONE_URL}" "${REPO_DIR}"

  if [[ "${REPO_URL}" == https://github.com/* ]]; then
    git -C "${REPO_DIR}" remote set-url origin "${REPO_URL}"
  fi
fi

CODE_SERVER_DIR="${WORKSPACE_DIR}"

if [ -d "${REPO_DIR}/.git" ]; then
  CODE_SERVER_DIR="${REPO_DIR}"
fi

exec code-server --host 0.0.0.0 --port 8080 --auth none "${CODE_SERVER_DIR}"
