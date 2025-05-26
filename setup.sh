#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Namecheap Domains MCP Setup${NC}"
echo "==============================="
echo -e "This script will help you set up the Namecheap Domains MCP for Cursor."
echo ""

# Check if Node.js is installed
echo -e "${YELLOW}Checking for Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v16 or higher before continuing.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "Node.js ${GREEN}$NODE_VERSION${NC} detected."

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error installing dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created.${NC}"
    echo -e "${YELLOW}Please edit the .env file with your Namecheap API credentials.${NC}"
else
    echo -e "\n${YELLOW}.env file already exists.${NC}"
fi

# Create registrant profile if it doesn't exist
if [ ! -f registrant-profile.json ]; then
    echo -e "\n${YELLOW}Creating registrant profile...${NC}"
    cp registrant-profile.example.json registrant-profile.json
    echo -e "${GREEN}registrant-profile.json created.${NC}"
    echo -e "${YELLOW}Please edit registrant-profile.json with your contact information.${NC}"
else
    echo -e "\n${YELLOW}registrant-profile.json already exists.${NC}"
fi

# Build the project
echo -e "\n${YELLOW}Building the project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error building the project.${NC}"
    exit 1
fi
echo -e "${GREEN}Project built successfully.${NC}"

# Make start-mcp.sh executable if it exists
if [ -f start-mcp.sh ]; then
    chmod +x start-mcp.sh
    echo -e "\n${GREEN}Made start-mcp.sh executable.${NC}"
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "To start the MCP server, run: ${YELLOW}./start-mcp.sh${NC}"
echo -e "Before starting, make sure to edit:"
echo -e "  1. ${YELLOW}.env${NC} with your Namecheap API credentials"
echo -e "  2. ${YELLOW}registrant-profile.json${NC} with your contact information"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: This tool can make real domain purchases with your Namecheap account.${NC}"
echo -e "${YELLOW}   Set NODE_ENV=sandbox in .env for testing without real purchases.${NC}" 