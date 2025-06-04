#!/bin/bash

echo "Building project..."
npm run build

echo -e "\nRunning tests..."
echo "Using .env file for configuration"

# Run tests with .env loaded
node test-tools.js