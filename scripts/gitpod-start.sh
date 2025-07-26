#!/bin/bash

# Gitpod startup script for Vite development server
echo "🚀 Starting Vite development server for Gitpod..."

# Debug: Check environment
echo "🔧 [DEBUG] Current directory: $(pwd)"
echo "🔧 [DEBUG] Node version: $(node --version)"
echo "🔧 [DEBUG] pnpm version: $(pnpm --version)"
echo "🔧 [DEBUG] Gitpod workspace URL: $GITPOD_WORKSPACE_URL"

# Install Task if not available
if ! command -v task &> /dev/null; then
    echo "📦 Installing Task runner..."
    curl -sL https://taskfile.dev/install.sh | sh -s -- -d -b ~/.local/bin
    export PATH="$PATH:~/.local/bin"
    echo "🔧 [DEBUG] Task installed at: $(which task)"
else
    echo "🔧 [DEBUG] Task already available at: $(which task)"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ [DEBUG] package.json not found in current directory!"
    exit 1
fi

# Start the development server using Task
echo "🔧 Using Task to start Gitpod development server..."
task gitpod:dev
