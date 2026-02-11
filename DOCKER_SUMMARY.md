# Docker Setup Summary

This document provides an overview of all Docker-related files and their purposes.

## 📁 Files Overview

### Core Docker Files

| File | Purpose | Location |
|------|---------|----------|
| `docker-compose.yml` | Production deployment configuration | Root |
| `docker-compose.dev.yml` | Development deployment configuration | Root |
| `apps/web/Dockerfile` | Production web app image | `apps/web/` |
| `apps/web/Dockerfile.dev` | Development web app image | `apps/web/` |
| `apps/docs/Dockerfile` | Documentation site image | `apps/docs/` |
| `.dockerignore` | Files to exclude from Docker build | Root |

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `.env.example` | Environment variables template | Root |
| `.env` | Your local environment variables (not in git) | Root |

### Helper Scripts

| File | Purpose | Location |
|------|---------|----------|
| `Makefile` | Convenient Docker command shortcuts | Root |
| `quick-start.sh` | Interactive setup script | Root |

### Documentation

| File | Purpose | Location |
|------|---------|----------|
| `DOCKER.md` | Comprehensive Docker deployment guide | Root |
| `README.md` | Main project README (includes Docker section) | Root |

### CI/CD

| File | Purpose | Location |
|------|---------|----------|
| `.github/workflows/docker-build.yml` | Automated Docker builds on push | `.github/workflows/` |

## 🚀 Quick Commands Reference

### First Time Setup
```bash
./quick-start.sh
```

### Common Operations

**Production:**
```bash
make deploy         # Build and deploy
make logs-follow    # View logs
make down          # Stop services
```

**Development:**
```bash
make dev           # Build and start dev environment
make dev-logs      # View dev logs
make dev-down      # Stop dev services
```

**Utilities:**
```bash
make help          # Show all commands
make ps            # List running services
make shell         # Open shell in container
make clean         # Remove everything
```

## 📋 Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_API_URL`
- `NEXT_PUBLIC_RAG_API_URL`
- `NEXT_PUBLIC_DEPLOYMENTS`

### Optional
- `NEXT_PUBLIC_MCP_SERVER_URL`
- `NEXT_PUBLIC_MCP_AUTH_REQUIRED`
- `NEXT_PUBLIC_USE_LANGSMITH_AUTH`
- `NEXT_PUBLIC_GOOGLE_AUTH_DISABLED`
- `NEXT_PUBLIC_DEMO_APP`
- `WEB_PORT` (default: 3000)
- `DOCS_PORT` (default: 3001)

See `.env.example` for detailed descriptions.

## 🏗️ Architecture

### Production Deployment
```
docker-compose.yml
├── web (Next.js app)
│   ├── Multi-stage build
│   ├── Standalone output
│   └── Port 3000
└── docs (Documentation)
    ├── Multi-stage build
    └── Port 3001
```

### Development Deployment
```
docker-compose.dev.yml
└── web (Next.js dev server)
    ├── Hot-reload enabled
    ├── Volume-mounted source
    └── Port 3000
```

## 🔄 Deployment Workflows

### Local Development
1. Configure `.env`
2. Run `make dev`
3. Code changes auto-reload
4. Stop with `Ctrl+C` or `make dev-down`

### Production (Local)
1. Configure `.env`
2. Run `make deploy`
3. Access at http://localhost:3000
4. Manage with `make` commands

### Production (CI/CD)
1. Push to main branch
2. GitHub Actions builds images
3. Images pushed to GitHub Container Registry
4. Pull and deploy on server

## 🧪 Testing Docker Build

Before deploying, you can test the build:

```bash
# Test production build
docker-compose build --progress=plain

# Test without cache
docker-compose build --no-cache

# Test with specific service
docker-compose build web

# Dry run (check syntax)
docker-compose config
```

## 🐛 Common Issues

### Build Failures
```bash
# Clean and rebuild
make clean
make build
```

### Port Already in Use
```bash
# Change ports in .env
WEB_PORT=4000
DOCS_PORT=4001
```

### Permission Issues (Dev mode)
```bash
# Fix volume permissions
sudo chown -R $USER:$USER apps/web/node_modules
sudo chown -R $USER:$USER apps/web/.next
```

### Network Issues
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

## 📚 Additional Resources

- **Full Docker Guide**: See [DOCKER.md](./DOCKER.md)
- **Project README**: See [README.md](./README.md)
- **LangChain Docs**: https://docs.langchain.com/labs/oap
- **Docker Docs**: https://docs.docker.com
- **Docker Compose Docs**: https://docs.docker.com/compose

## 🔐 Security Notes

- Never commit `.env` file
- Use secrets management for production
- Keep Supabase keys secure
- Use HTTPS in production
- Review security settings before deployment
- Regularly update Docker images
- Enable health checks in production
- Implement rate limiting
- Use network segregation

## 📊 Monitoring

Suggested tools for production:
- **Container Monitoring**: Docker stats, cAdvisor
- **Logging**: ELK stack, Loki
- **Metrics**: Prometheus, Grafana
- **Uptime**: UptimeRobot, Pingdom
- **APM**: New Relic, Datadog

## 🤝 Contributing

When contributing Docker-related changes:
1. Test both production and dev builds
2. Update documentation
3. Verify `.env.example` is complete
4. Test on clean system
5. Update this summary if needed
