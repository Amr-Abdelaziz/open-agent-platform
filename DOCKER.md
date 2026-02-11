# Docker Deployment Guide

This guide explains how to build and deploy the Open Agent Platform using Docker and Docker Compose.

## Prerequisites

- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)
- Git (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/open-agent-platform.git
cd open-agent-platform
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration values. At minimum, you need to set:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_BASE_API_URL`: Your LangGraph/LangSmith API URL
- `NEXT_PUBLIC_RAG_API_URL`: Your RAG API URL
- `NEXT_PUBLIC_DEPLOYMENTS`: JSON configuration for deployments

### 3. Build and Run (Production)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down
```

The application will be available at:
- Web App: http://localhost:3000
- Documentation: http://localhost:3001

### 4. Development Mode

For development with hot-reload:

```bash
# Build development images
docker-compose -f docker-compose.dev.yml build

# Start development services
docker-compose -f docker-compose.dev.yml up

# Stop development services
docker-compose -f docker-compose.dev.yml down
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `NEXT_PUBLIC_BASE_API_URL` | Base API URL for LangGraph | `http://localhost:8123` |
| `NEXT_PUBLIC_RAG_API_URL` | RAG API URL | `http://gorbit:8080` |
| `NEXT_PUBLIC_DEPLOYMENTS` | Deployment configurations | See example below |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MCP_SERVER_URL` | MCP server URL | - |
| `NEXT_PUBLIC_MCP_AUTH_REQUIRED` | MCP authentication required | `false` |
| `NEXT_PUBLIC_USE_LANGSMITH_AUTH` | Use LangSmith auth | `false` |
| `NEXT_PUBLIC_GOOGLE_AUTH_DISABLED` | Disable Google OAuth | `false` |
| `NEXT_PUBLIC_DEMO_APP` | Demo mode | `false` |
| `WEB_PORT` | Web application port | `3000` |
| `DOCS_PORT` | Documentation port | `3001` |

### Deployments Configuration Example

```json
[
  {
    "id": "production",
    "name": "Production",
    "url": "https://api.example.com",
    "auth_type": "local_auth"
  },
  {
    "id": "staging",
    "name": "Staging",
    "url": "https://staging-api.example.com",
    "auth_type": "local_auth"
  }
]
```

## Docker Commands Reference

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build web

# Build without cache
docker-compose build --no-cache

# Build with progress output
docker-compose build --progress=plain
```

### Running

```bash
# Start in detached mode
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up web

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart web
```

### Logs and Debugging

```bash
# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web

# View last 100 lines
docker-compose logs --tail=100 web
```

### Stopping and Cleanup

```bash
# Stop services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes
docker-compose down -v

# Stop, remove containers, volumes, and images
docker-compose down -v --rmi all
```

### Inspecting

```bash
# List running services
docker-compose ps

# Execute command in running container
docker-compose exec web sh

# Execute command in running container (bash)
docker-compose exec web bash

# View resource usage
docker stats
```

## Health Checks

The production Docker Compose configuration includes health checks for all services. You can check the health status:

```bash
# View service health
docker-compose ps

# Inspect health check details
docker inspect <container_id> | grep -A 10 Health
```

## Troubleshooting

### Build Failures

If the build fails, try:

```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
```

### Port Conflicts

If port 3000 or 3001 is already in use:

```bash
# Change ports in .env
WEB_PORT=4000
DOCS_PORT=4001

# Or use docker-compose port mapping
docker-compose up -d -p web:4000:3000
```

### Volume Permission Issues

If you encounter permission issues with volumes:

```bash
# Fix permissions (development mode)
sudo chown -R $USER:$USER apps/web/node_modules apps/web/.next
```

### Network Issues

If services can't communicate:

```bash
# Verify network
docker network ls
docker network inspect open-agent-platform

# Recreate network
docker-compose down
docker-compose up -d
```

### Environment Variables Not Loading

Ensure your `.env` file:
- Is in the root directory
- Doesn't have syntax errors
- Uses the correct format (no quotes around values unless needed)
- Is referenced by Docker Compose (v2 loads .env automatically)

## Production Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper Supabase credentials
- [ ] Set up proper API URLs (not localhost)
- [ ] Enable SSL/TLS for all API endpoints
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test health checks
- [ ] Review security settings
- [ ] Set resource limits in docker-compose.yml
- [ ] Configure restart policies

## Advanced Configuration

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Custom Networks

For multi-container setups:

```yaml
networks:
  frontend:
  backend:

services:
  web:
    networks:
      - frontend
      - backend
```

### Using Docker Secrets

For sensitive data:

```yaml
secrets:
  supabase_key:
    file: ./secrets/supabase_key.txt

services:
  web:
    secrets:
      - supabase_key
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/open-agent-platform/issues
- Documentation: See `/apps/docs`
