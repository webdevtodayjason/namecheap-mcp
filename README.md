# MCP Namecheap Registrar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![MCP Framework](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that enables AI assistants to interact with Namecheap's domain registration API. Check domain availability, get pricing, and register domains directly through Claude Desktop, Cursor, Roo Code, or any MCP-compatible client.


## ⚠️ Important Security Warning ⚠️

**This tool uses the Namecheap live API by default and can make REAL purchases that will charge your Namecheap account.** Always double-check domain registration commands before confirming purchases.

## Features

- 🔍 **Domain Availability Check** - Instantly check if a domain name is available
- 💰 **TLD Pricing** - Get current pricing for any top-level domain
- 🛒 **Domain Registration** - Register domains with WhoisGuard privacy protection
- 🔒 **Secure API Integration** - Uses Namecheap's secure API with IP whitelisting
- 🤖 **Multi-Client Support** - Works with Claude Desktop, Cursor, Roo Code, and more
- 🧪 **Sandbox Mode** - Test without making real purchases

## Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Namecheap account with API access enabled
- Your IP address whitelisted in Namecheap

### Namecheap API Requirements

To use the Namecheap API, your account must meet **one** of these requirements:
- Have at least 20 domains under your account
- Have at least $50 on your account balance
- Have at least $50 spent within the last 2 years

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/webdevtodayjason/mcp-namecheap-registrar.git
cd mcp-namecheap-registrar
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NAMECHEAP_USERNAME=your_namecheap_username
NAMECHEAP_API_KEY=your_api_key_here
NODE_ENV=production  # Use 'sandbox' for testing
```

### 3. Set Up Registrant Profile

```bash
cp registrant-profile.example.json registrant-profile.json
```

Edit `registrant-profile.json` with your contact details for domain registrations.

### 4. Build the Project

```bash
npm run build
```

### 5. Whitelist Your IP

1. Find your IP address:
   ```bash
   curl ifconfig.me
   ```
2. Log in to Namecheap
3. Go to **Profile → Tools → API Access**
4. Add your IP to the whitelist

## Configuration for Different Clients

### Claude Desktop

1. **Find the configuration file:**
   
   **macOS:**
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   
   **Windows:**
   ```bash
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```
   
   **Linux:**
   ```bash
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add the server configuration:**
   ```json
   {
     "mcpServers": {
       "namecheap-registrar": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-namecheap-registrar/dist/index.js"],
         "env": {
           "NAMECHEAP_USERNAME": "your_username",
           "NAMECHEAP_API_KEY": "your_api_key",
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** completely (Cmd+Q on macOS, Alt+F4 on Windows)

### Cursor

1. Open Cursor
2. Go to **Settings** (Cmd+, or Ctrl+,)
3. Search for "MCP" in settings
4. Click "Edit in settings.json"
5. Add the configuration:
   ```json
   {
     "mcp.servers": {
       "namecheap-registrar": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-namecheap-registrar/dist/index.js"],
         "env": {
           "NAMECHEAP_USERNAME": "your_username",
           "NAMECHEAP_API_KEY": "your_api_key",
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```
6. Restart Cursor

### Roo Code (Cline)

1. Open Roo Code
2. Install the Cline extension if not already installed
3. Open Cline settings (click the gear icon in Cline panel)
4. Add to MCP Servers:
   ```json
   {
     "namecheap-registrar": {
       "command": "node",
       "args": ["/absolute/path/to/mcp-namecheap-registrar/dist/index.js"],
       "env": {
         "NAMECHEAP_USERNAME": "your_username",
         "NAMECHEAP_API_KEY": "your_api_key",
         "NODE_ENV": "production"
       }
     }
   }
   ```
5. Save and restart the extension

### Claude.ai Code

1. Open Claude Code terminal
2. Run the MCP setup command:
   ```bash
   mcp add namecheap-registrar
   ```
3. When prompted, provide:
   - Command: `node`
   - Args: `/absolute/path/to/mcp-namecheap-registrar/dist/index.js`
   - Environment variables as shown above

## Usage Examples

### Check Domain Availability

```
"Is example123.com available?"
"Check if mydomain.io is taken"
"Can I register coolwebsite.net?"
```

**Example Response:**
```
Good news! The domain example123.com is available for registration.

Would you like to:
- Get pricing information for this domain?
- Register this domain?
- Check availability of other domains?
```

### Get Domain Pricing

```
"How much does a .com domain cost?"
"What's the price for .io domains?"
"Show me pricing for example.com"
```

**Example Response:**
```
Here's the pricing information for .com domains:

Registration Pricing:
• 1 year: $9.98
• 2 years: $24.96
• 5 years: $69.90
• 10 years: $144.80

Future Renewal: $12.98/year
Transfer cost: $9.98
```

### Register a Domain

Domain registration is a two-step process for safety:

**Step 1 - Preview Registration:**
```
"Register mydomain.com"
"Buy example.net for 2 years"
"Register coolsite.io with privacy protection"
```

**Step 2 - Confirm Purchase:**
```
"Confirm the purchase"
"Yes, register the domain"
```

**Optional Parameters:**
- `years`: Registration period (1-10 years)
- `nameservers`: Custom nameservers (comma-separated)
- `enableWhoisPrivacy`: Enable/disable WhoisGuard (default: true)

## Available Tools

### 1. `check_domain`
Check if a domain is available for registration.

**Parameters:**
- `domain` (string, required) - The domain name to check (e.g., "example.com")

### 2. `get_tld_pricing`
Get pricing information for a specific TLD.

**Parameters:**
- `tld` (string, required) - The top-level domain (e.g., "com", "net", "io")

### 3. `register_domain`
Register a new domain name.

**Parameters:**
- `domain` (string, required) - Domain to register
- `years` (string, optional) - Registration period (default: "1")
- `nameservers` (string, optional) - Comma-separated nameservers
- `confirmPurchase` (string, optional) - Set to "true" to complete purchase
- `enableWhoisPrivacy` (string, optional) - Enable WhoisGuard (default: "true")

## Troubleshooting

### Server Not Connecting

1. **Check logs directory exists:**
   ```bash
   mkdir -p logs
   ```

2. **Verify configuration path:**
   - Ensure the path is absolute, not relative
   - Use forward slashes even on Windows

3. **Test the server manually:**
   ```bash
   node dist/index.js
   ```

### Common API Errors

| Error | Solution |
|-------|----------|
| "Invalid API Key" | Verify API key in Namecheap account |
| "IP Not Whitelisted" | Add your IP to Namecheap whitelist |
| "Domain Unavailable" | Domain is already registered |
| "Insufficient Funds" | Add funds to Namecheap account |

### Debug Mode

View server logs:
```bash
tail -f logs/mcp-server-*.log
```

## Testing

### Run Test Suite
```bash
npm test
```

### Test Individual Features
```bash
node test-features.js
```

### Sandbox Mode

For testing without real purchases:
1. Set `NODE_ENV=sandbox` in `.env`
2. Get sandbox API credentials from Namecheap
3. Use test credit card numbers for purchases

## Security Best Practices

- **Never commit API keys** - Use `.env` files
- **Rotate API keys regularly** - Every 90 days recommended
- **Monitor account activity** - Check for unauthorized use
- **Use sandbox for testing** - Avoid accidental purchases
- **Limit IP whitelist** - Only add necessary IPs

## Development

### Project Structure

```
mcp-namecheap-registrar/
├── src/
│   ├── index.ts              # Main server entry
│   ├── tools/                # MCP tool implementations
│   │   ├── CheckDomainTool.ts
│   │   ├── GetPricingTool.ts
│   │   └── RegisterDomainTool.ts
│   └── utils/                # Utility functions
│       └── ipDetection.ts
├── dist/                     # Compiled JavaScript
├── logs/                     # Server logs
├── test/                     # Test files
├── .env.example              # Example environment
├── registrant-profile.example.json
├── package.json
├── tsconfig.json
└── README.md
```

### Development Mode

```bash
# Install dependencies
npm install

# Run in watch mode
npm run dev

# Run tests
npm test
```

### Building for Production

```bash
npm run build
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/webdevtodayjason/mcp-namecheap-registrar/issues)
- 💬 [Discussions](https://github.com/webdevtodayjason/mcp-namecheap-registrar/discussions)
- 📧 Email: jason@webdevtoday.com

## Acknowledgments

- Forked from [deployTo-Dev/mcp-namecheap-registrar](https://github.com/deployTo-Dev/mcp-namecheap-registrar) - Thanks to the original author for the foundation!
- Built with [MCP Framework](https://modelcontextprotocol.io)
- Powered by [Namecheap API](https://www.namecheap.com/support/api/intro/)
- Compatible with [Claude](https://claude.ai) by Anthropic
- Works with [Cursor](https://cursor.sh) IDE
- Supports [Roo Code](https://roo.app) with Cline

---

Made with ❤️ by Jason Brashear