#!/bin/bash

# Gitpod startup script for Vite development server
echo "🚀 Starting Vite development server for Gitpod..."

# Install Task if not available
if ! command -v task &> /dev/null; then
    echo "📦 Installing Task runner..."
    curl -sL https://taskfile.dev/install.sh | sh -s -- -d -b ~/.local/bin
    export PATH="$PATH:~/.local/bin"
fi

# Start the development server using Task
echo "🔧 Using Task to start Gitpod development server..."
task gitpod:dev
