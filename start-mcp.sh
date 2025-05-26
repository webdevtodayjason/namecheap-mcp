#!/bin/bash

# Define the path to the project directory
PROJECT_DIR="$(dirname "$(realpath "$0")")"
echo "Starting MCP server from $PROJECT_DIR"

# Change to the project directory
cd "$PROJECT_DIR" || { 
  echo "Error: Failed to change to directory $PROJECT_DIR"; 
  exit 1; 
}

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_DIR/.env" ]; then
  echo "Loading environment variables from .env file"
  set -o allexport
  source "$PROJECT_DIR/.env"
  set +o allexport
else
  echo "Warning: .env file not found"
fi

# Check for required environment variables
if [ -z "$NAMECHEAP_API_KEY" ] || [ -z "$NAMECHEAP_USERNAME" ]; then
  echo "Error: Required environment variables NAMECHEAP_API_KEY and/or NAMECHEAP_USERNAME are not set"
  echo "Please ensure these are defined in your .env file or set them manually"
  exit 1
fi

# Check if the server build exists
if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
  echo "Error: Server build not found at $PROJECT_DIR/dist/index.js"
  echo "Please run 'npm run build' first"
  exit 1
fi

# Print status
echo "Starting Namecheap Domains MCP server..."
echo "Using Node.js version: $(node -v)"
echo "API Username: $NAMECHEAP_USERNAME"
echo "Environment: ${NODE_ENV:-development}"

# Start the server
exec node "$PROJECT_DIR/dist/index.js" 