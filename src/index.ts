import { MCPServer } from "mcp-framework";
import dotenv from "dotenv";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Ensure logs directory exists in the project root
const logsDir = join(projectRoot, 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (err) {
  // Ignore if directory already exists
}

// Change working directory to project root so logs are written to the right place
process.chdir(projectRoot);

// Override process.stdout.write to filter out log messages
const originalWrite = process.stdout.write;
process.stdout.write = function(chunk: any, ...args: any[]): boolean {
  // Convert chunk to string
  const str = chunk?.toString() || '';
  
  // Filter out log messages that start with timestamp pattern
  if (str.match(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)) {
    // This is a log message, don't write it to stdout
    return true;
  }
  
  // For all other output (JSON-RPC messages), pass through
  return originalWrite.apply(process.stdout, [chunk, ...args] as any);
};

// Create and configure the server
const server = new MCPServer({
  name: "namecheap-domains",
  version: "1.0.0"
});

// Start the server
server.start(); 
