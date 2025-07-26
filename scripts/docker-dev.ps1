# Docker Development Helper Script for Windows
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "rebuild", "logs", "shell", "clean")]
    [string]$Action = "start"
)

# Enable Docker BuildKit for faster builds
$env:DOCKER_BUILDKIT = 1
$env:COMPOSE_DOCKER_CLI_BUILD = 1

switch ($Action) {
    "start" {
        Write-Host "🚀 Starting development environment..." -ForegroundColor Green
        docker-compose up -d
        Write-Host "✅ Development server should be available at http://localhost:5173" -ForegroundColor Green
    }
    "stop" {
        Write-Host "⏹️ Stopping development environment..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" {
        Write-Host "🔄 Restarting development environment..." -ForegroundColor Blue
        docker-compose restart
    }
    "rebuild" {
        Write-Host "🔨 Rebuilding containers..." -ForegroundColor Magenta
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        Write-Host "✅ Rebuild complete!" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📋 Showing logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "shell" {
        Write-Host "🐚 Opening shell in container..." -ForegroundColor Blue
        docker-compose exec vite sh
    }
    "clean" {
        Write-Host "🧩 Cleaning up Docker resources..." -ForegroundColor Red
        docker-compose down -v
        docker system prune -f
        docker-compose build
        Write-Host "✅ Cleanup complete!" -ForegroundColor Green
    }
}
