.PHONY: help build up down restart logs logs-follow clean dev-build dev-up dev-down dev-logs ps exec shell health

# Help target - default when running 'make' without arguments
help:
	@echo "Open Agent Platform - Docker Commands"
	@echo ""
	@echo "Production Commands:"
	@echo "  make build          - Build production images"
	@echo "  make up            - Start production services (detached)"
	@echo "  make down          - Stop and remove production services"
	@echo "  make restart       - Restart production services"
	@echo "  make logs          - View production logs"
	@echo "  make logs-follow   - Follow production logs"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-build     - Build development images"
	@echo "  make dev-up        - Start development services"
	@echo "  make dev-down      - Stop and remove development services"
	@echo "  make dev-logs      - Follow development logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make ps            - Show running services"
	@echo "  make exec          - Execute command in web container (e.g. make exec cmd='ls -la')"
	@echo "  make shell         - Open shell in web container"
	@echo "  make health        - Check health status of services"
	@echo "  make clean         - Remove all containers, volumes, and images"
	@echo ""

# Production commands
build:
	@echo "Building production images..."
	docker compose build --progress=plain

up:
	@echo "Starting production services..."
	docker compose up -d
	@echo "Services started. Web app: http://localhost:3000"

down:
	@echo "Stopping production services..."
	docker compose down

restart:
	@echo "Restarting production services..."
	docker compose restart

logs:
	docker compose logs

logs-follow:
	docker compose logs -f

# Development commands
dev-build:
	@echo "Building development images..."
	docker compose -f docker-compose.dev.yml build --progress=plain

dev-up:
	@echo "Starting development services..."
	docker compose -f docker-compose.dev.yml up
	@echo "Development server will start on http://localhost:3000"

dev-down:
	@echo "Stopping development services..."
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# Utility commands
ps:
	docker compose ps

exec:
	docker compose exec web $(cmd)

shell:
	docker compose exec web /bin/sh

health:
	@echo "Checking health status..."
	@docker compose ps
	@echo ""
	@echo "Detailed health info:"
	@docker ps --filter "name=open-agent-platform" --format "table {{.Names}}\t{{.Status}}"

clean:
	@echo "WARNING: This will remove all containers, volumes, and images"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --rmi all; \
		docker compose -f docker-compose.dev.yml down -v --rmi all; \
		echo "Cleanup complete"; \
	fi

# Build and start production in one command
deploy: build up
	@echo "Deployment complete!"

# Build and start development in one command
dev: dev-build dev-up
	@echo "Development environment ready!"
