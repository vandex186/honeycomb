# Use Gitpod's workspace-full image as base
FROM gitpod/workspace-full:latest

# Set environment variables for optimization (no caching)
ENV DOCKER_BUILDKIT=1
ENV BUILDKIT_PROGRESS=plain
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Node.js LTS
USER gitpod
RUN bash -c ". .nvm/nvm.sh && nvm install --lts && nvm use --lts && nvm alias default lts/*"

# Install pnpm globally
RUN bash -c ". .nvm/nvm.sh && nvm use --lts && npm install -g pnpm"

# Configure pnpm for fresh installs (no caching)
RUN bash -c ". .nvm/nvm.sh && nvm use --lts && \
    pnpm config set store-dir /tmp/.pnpm-store && \
    pnpm config set cache-dir /tmp/.pnpm-cache"

# Install global packages (only the essentials)
RUN bash -c ". .nvm/nvm.sh && nvm use --lts && pnpm add -g \
    typescript@latest \
    @types/node@latest \
    vite@latest \
    prettier@latest \
    eslint@latest"

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

# Set up environment for fresh installs
RUN echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc

# Expose common development ports
EXPOSE 5173 4173 3000 8080
