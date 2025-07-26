#!/bin/bash

# Gitpod Validation Script
echo "🔧 [GITPOD VALIDATION] Starting comprehensive validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check() {
    local description="$1"
    local command="$2"
    total_checks=$((total_checks + 1))
    
    echo -n "🔍 Checking $description... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        success_count=$((success_count + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

echo ""
echo "📋 Configuration Files:"
check "Gitpod YAML config" "test -f .gitpod.yml"
check "Gitpod Dockerfile" "test -f .gitpod.Dockerfile"
check "Gitpod startup script" "test -f scripts/gitpod-start.sh"
check "Package.json exists" "test -f package.json"
check "Taskfile exists" "test -f Taskfile.yml"
check "Vite config exists" "test -f vite.config.ts"

echo ""
echo "🔧 Development Tools:"
check "Node.js available" "command -v node"
check "pnpm available" "command -v pnpm"
check "TypeScript available" "command -v tsc"

echo ""
echo "📦 Dependencies:"
check "Dependencies installed" "test -d node_modules"
check "Package lock exists" "test -f pnpm-lock.yaml"

echo ""
echo "🧪 Code Quality:"
echo "Running TypeScript check..."
if pnpm tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation: PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ TypeScript compilation: FAIL${NC}"
fi
total_checks=$((total_checks + 1))

echo "Running linting check..."
if pnpm lint; then
    echo -e "${GREEN}✅ ESLint check: PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ ESLint check: FAIL${NC}"
fi
total_checks=$((total_checks + 1))

echo "Running tests..."
if pnpm test:run; then
    echo -e "${GREEN}✅ Tests: PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ Tests: FAIL${NC}"
fi
total_checks=$((total_checks + 1))

echo "Testing build process..."
if pnpm build; then
    echo -e "${GREEN}✅ Build process: PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ Build process: FAIL${NC}"
fi
total_checks=$((total_checks + 1))

echo ""
echo "🚀 Gitpod-specific Tasks:"
echo "Testing prebuild task..."
if task gitpod:prebuild; then
    echo -e "${GREEN}✅ Gitpod prebuild: PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ Gitpod prebuild: FAIL${NC}"
fi
total_checks=$((total_checks + 1))

echo ""
echo "📊 VALIDATION SUMMARY:"
echo "========================"
echo -e "Total checks: ${total_checks}"
echo -e "Passed: ${GREEN}${success_count}${NC}"
echo -e "Failed: ${RED}$((total_checks - success_count))${NC}"

if [ $success_count -eq $total_checks ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Your project is ready for Gitpod! 🚀${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the issues above.${NC}"
    exit 1
fi
