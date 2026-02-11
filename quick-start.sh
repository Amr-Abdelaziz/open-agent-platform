#!/bin/bash

# Open Agent Platform - Quick Start Script
# This script helps you set up the environment and deploy the application

set -e

echo "================================================"
echo "Open Agent Platform - Quick Start Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.example .env
        echo -e "${GREEN}✓ Created new .env file from .env.example${NC}"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
fi

echo ""
echo "================================================"
echo "Environment Configuration"
echo "================================================"
echo ""
echo "You need to configure the following environment variables:"
echo "1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL"
echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key"
echo "3. NEXT_PUBLIC_BASE_API_URL - Your LangGraph API URL"
echo "4. NEXT_PUBLIC_RAG_API_URL - Your RAG API URL"
echo "5. NEXT_PUBLIC_DEPLOYMENTS - Your deployment configuration"
echo ""

# Ask if user wants to configure now
read -p "Do you want to configure these now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Opening .env file in your default editor..."
    ${EDITOR:-nano} .env
    echo -e "${GREEN}✓ Environment variables configured${NC}"
else
    echo -e "${YELLOW}! Don't forget to edit .env before deploying${NC}"
fi

echo ""
echo "================================================"
echo "Deployment Options"
echo "================================================"
echo ""
echo "Choose how you want to proceed:"
echo "1. Build and deploy for production (recommended)"
echo "2. Build and start development environment"
echo "3. Skip deployment (I'll do it manually)"
echo ""

read -p "Enter your choice (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        echo ""
        echo "Building and deploying for production..."
        make deploy
        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}Deployment Complete!${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo "Your application is now running:"
        echo "  - Web App: http://localhost:3000"
        echo "  - Documentation: http://localhost:3001"
        echo ""
        echo "Useful commands:"
        echo "  - View logs: make logs-follow"
        echo "  - Stop services: make down"
        echo "  - Restart: make restart"
        echo "  - All commands: make help"
        ;;
    2)
        echo ""
        echo "Building and starting development environment..."
        make dev-build
        echo ""
        echo -e "${GREEN}Development build complete!${NC}"
        echo ""
        echo "To start the development server, run:"
        echo "  make dev-up"
        echo ""
        echo "Your application will be available at:"
        echo "  - Web App: http://localhost:3000"
        ;;
    3)
        echo ""
        echo "Setup complete! You can deploy manually using:"
        echo "  - Production: make deploy"
        echo "  - Development: make dev"
        echo "  - All commands: make help"
        ;;
    *)
        echo ""
        echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo "For more information, see DOCKER.md"
echo ""
