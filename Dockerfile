# Use Node.js 20 LTS for better performance
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code (done after deps for better caching)
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vite -u 1001 -G nodejs && \
    chown -R vite:nodejs /app

USER vite

# Expose port
EXPOSE 5173

# Start development server with hot reload and proper signal handling
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]
