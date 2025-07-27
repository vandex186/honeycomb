#!/bin/bash

echo "🔧 [GITPOD VALIDATION]"
echo "====================="

# Check if we're in Gitpod
if [ -n "$GITPOD_WORKSPACE_URL" ]; then
    echo "✅ Running in Gitpod environment"
    echo "   Workspace URL: $GITPOD_WORKSPACE_URL"
else
    echo "⚠️  Not running in Gitpod environment"
fi

# Check Node.js
echo ""
echo "📦 Node.js Environment:"
if command -v node &> /dev/null; then
    echo "   ✅ Node.js: $(node --version)"
else
    echo "   ❌ Node.js not found"
    exit 1
fi

# Check pnpm
echo ""
echo "📦 Package Manager:"
if command -v pnpm &> /dev/null; then
    echo "   ✅ pnpm: $(pnpm --version)"
else
    echo "   ❌ pnpm not found"
    exit 1
fi

# Check if package.json exists
echo ""
echo "📁 Project Files:"
if [ -f "package.json" ]; then
    echo "   ✅ package.json found"
else
    echo "   ❌ package.json not found"
    exit 1
fi

if [ -f "pnpm-lock.yaml" ]; then
    echo "   ✅ pnpm-lock.yaml found"
else
    echo "   ⚠️  pnpm-lock.yaml not found (will be generated)"
fi

# Check if Task is available
echo ""
echo "🛠️  Development Tools:"
if command -v task &> /dev/null; then
    echo "   ✅ Task runner available"
else
    echo "   ⚠️  Task runner not found (will be installed)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "   ✅ Docker available"
else
    echo "   ⚠️  Docker not available"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "   ✅ Git available"
else
    echo "   ❌ Git not found"
fi

echo ""
echo "🎯 Ready for development!"
echo "   Run 'task gitpod:dev' to start the development server"
echo "   Run 'task gitpod:test-hosts' to test host configuration"
