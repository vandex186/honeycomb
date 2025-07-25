# Use Gitpod's workspace-full image as base
FROM gitpod/workspace-full:latest

# Set environment variables for optimization
ENV DOCKER_BUILDKIT=1
ENV BUILDKIT_PROGRESS=plain
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NPM_CONFIG_CACHE=/workspace/.npm-cache
ENV VITE_CACHE_DIR=/workspace/.vite

# Install Node.js LTS with optimizations
USER gitpod
RUN bash -c ". .nvm/nvm.sh && nvm install --lts && nvm use --lts && nvm alias default lts/*"

# Configure npm for performance
RUN bash -c ". .nvm/nvm.sh && nvm use --lts && \
    npm config set cache /workspace/.npm-cache && \
    npm config set prefer-offline true && \
    npm config set audit false && \
    npm config set fund false"

# Install global npm packages with caching
RUN bash -c ". .nvm/nvm.sh && nvm use --lts && npm install -g \
    typescript@latest \
    @types/node@latest \
    vite@latest \
    prettier@latest \
    eslint@latest \
    @typescript-eslint/parser@latest \
    @typescript-eslint/eslint-plugin@latest \
    npm-check-updates@latest"

# Create cache directories with proper permissions
RUN mkdir -p /workspace/.npm-cache /workspace/.vite /workspace/node_modules && \
    chown -R gitpod:gitpod /workspace/.npm-cache /workspace/.vite

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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Switch back to gitpod user
USER gitpod

# Pre-configure git (optional - user can override)
RUN git config --global init.defaultBranch main && \
    git config --global pull.rebase false

# Set working directory
WORKDIR /workspace

# Optimize shell startup
RUN echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc && \
    echo 'export NPM_CONFIG_CACHE="/workspace/.npm-cache"' >> ~/.bashrc && \
    echo 'export VITE_CACHE_DIR="/workspace/.vite"' >> ~/.bashrc

# Expose common development ports
EXPOSE 5173 4173 3000 8080
