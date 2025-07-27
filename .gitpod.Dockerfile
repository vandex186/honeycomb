# Use Gitpod's workspace-full image as base
FROM gitpod/workspace-full:latest

# Set environment variables for optimization
ENV DOCKER_BUILDKIT=1
ENV BUILDKIT_PROGRESS=plain
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Node.js LTS using the system package manager
USER root
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install pnpm globally
RUN npm install -g pnpm

# Configure pnpm with persistent cache for faster installs
RUN mkdir -p /home/gitpod/.pnpm-store /home/gitpod/.pnpm-cache && \
    chown -R gitpod:gitpod /home/gitpod/.pnpm-store /home/gitpod/.pnpm-cache && \
    pnpm config set store-dir /home/gitpod/.pnpm-store && \
    pnpm config set cache-dir /home/gitpod/.pnpm-cache

# Install global packages (only the essentials)
RUN pnpm add -g \
    typescript@latest \
    @types/node@latest \
    vite@latest \
    prettier@latest \
    eslint@latest

# Install additional development tools
USER root
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    tree \
    jq \
    docker.io \
    docker-compose \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add gitpod user to docker group
RUN usermod -aG docker gitpod

# Switch back to gitpod user
USER gitpod

# Pre-configure git
RUN git config --global init.defaultBranch main && \
    git config --global pull.rebase false

# Set working directory
WORKDIR /workspace

# Copy package files for reference (dependencies will be installed at runtime)
COPY package.json pnpm-lock.yaml* ./

# Switch back to gitpod user
USER gitpod

# Note: Dependencies will be installed at runtime to avoid permission issues
# This allows for better caching and avoids Docker build permission problems

# Set up environment
RUN echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc && \
    echo 'export PATH="$PATH:./node_modules/.bin"' >> ~/.bashrc

# Expose common development ports
EXPOSE 5173 4173 3000 8080
