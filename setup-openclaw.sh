#!/usr/bin/env bash
set -euo pipefail

# Setup script for OpenClaw development environment

echo "=== Installing OpenClaw CLI globally ==="
npm install -g openclaw@latest

echo "=== Running OpenClaw onboard ==="
openclaw onboard --install-daemon

echo "=== Cloning OpenClaw repository ==="
if [ ! -d "openclaw" ]; then
  git clone https://github.com/openclaw/openclaw.git
else
  echo "openclaw/ directory already exists, skipping clone"
fi

cd openclaw

echo "=== Installing dependencies ==="
pnpm install

echo "=== Building UI ==="
pnpm ui:build

echo "=== Building project ==="
pnpm build

echo "=== Running onboard from repo ==="
pnpm openclaw onboard --install-daemon

echo ""
echo "Setup complete! To start the dev loop with auto-reload:"
echo "  cd openclaw && pnpm gateway:watch"
