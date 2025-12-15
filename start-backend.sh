#!/bin/bash

# SkillUp2Dev Backend Launcher
# Allows switching between SQLite and PostgreSQL at runtime

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SkillUp2Dev Backend Launcher${NC}"
echo ""

# Check if database type is provided as argument
if [ -z "$1" ]; then
    echo "Usage: ./start-backend.sh [sqlite|postgres]"
    echo ""
    echo "Examples:"
    echo "  ./start-backend.sh sqlite    # Use SQLite (development)"
    echo "  ./start-backend.sh postgres  # Use PostgreSQL (production)"
    exit 1
fi

DB_TYPE=$1

# Set DATABASE_URL based on choice
if [ "$DB_TYPE" = "sqlite" ]; then
    export DATABASE_URL="sqlite:///./skillup2dev.db"
    echo -e "${GREEN}✓ Using SQLite${NC}"
    echo "  Database: skillup2dev.db"
elif [ "$DB_TYPE" = "postgres" ]; then
    export DATABASE_URL="postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev"
    echo -e "${GREEN}✓ Using PostgreSQL${NC}"
    echo "  Database: skillup2dev"
    echo "  Host: localhost:5432"
else
    echo -e "${YELLOW}❌ Invalid database type: $DB_TYPE${NC}"
    echo "Please use 'sqlite' or 'postgres'"
    exit 1
fi

echo ""
echo -e "${BLUE}Starting backend server...${NC}"
echo ""

# Start the backend
cd backend
./venv/bin/python -m uvicorn app.main:app --reload
