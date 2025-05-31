# Namecheap MCP Server

An MCP (Model Context Protocol) server that provides tools for interacting with the Namecheap domain registration API. Check domain availability, get pricing, and register domains through Claude Desktop or any MCP-compatible client.

## ⚠️ Important Security Warning

**This tool uses the Namecheap live API by default and can make REAL purchases that will charge your Namecheap account.** Always double-check domain registration commands before confirming purchases.

## Features

- 🔍 **Domain Availability Check** - Instantly check if a domain name is available
- 💰 **TLD Pricing** - Get current pricing for any top-level domain
- 🛒 **Domain Registration** - Register domains with WhoisGuard privacy protection
- 🔒 **Secure API Integration** - Uses Namecheap's secure API with IP whitelisting
- 🧪 **Sandbox Mode** - Test without making real purchases

## Prerequisites

- Namecheap account with API access enabled
- Your IP address whitelisted in Namecheap

### Namecheap API Requirements

To use the Namecheap API, your account must meet **one** of these requirements:
- Have at least 20 domains under your account
- Have at least $50 on your account balance
- Have at least $50 spent within the last 2 years

## Installation

You can run this MCP server using `npx` without installing it locally:

```bash
npx @webdevtoday/nc-mcp-server
```

## Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "namecheap": {
      "command": "npx",
      "args": ["-y", "@webdevtoday/nc-mcp-server"],
      "env": {
        "NC_USERNAME": "your_namecheap_username",
        "NC_API_KEY": "your_namecheap_api_key",
        "NODE_ENV": "production"
      }
    }
  }
}
```

To find your Claude Desktop configuration:
1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config

### Setting up Registrant Profile

For domain registration, you'll need to provide registrant contact information. You can do this in two ways:

1. **Environment Variable (Recommended for npx)**:
   Add a `REGISTRANT_PROFILE` environment variable with JSON data:
   ```json
   {
     "mcpServers": {
       "namecheap": {
         "command": "npx",
         "args": ["-y", "@webdevtoday/nc-mcp-server"],
         "env": {
           "NC_USERNAME": "your_username",
           "NC_API_KEY": "your_api_key",
           "NODE_ENV": "production",
           "REGISTRANT_PROFILE": "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"address1\":\"123 Main St\",\"city\":\"New York\",\"stateProvince\":\"NY\",\"postalCode\":\"10001\",\"country\":\"US\",\"phone\":\"+1.2125551234\",\"email\":\"john@example.com\"}"
         }
       }
     }
   }
   ```

2. **Local File**: 
   If running locally, create a `registrant-profile.json` file in your working directory.

## Whitelisting Your IP

1. Find your IP address:
   ```bash
   curl ifconfig.me
   ```
2. Log in to Namecheap
3. Go to **Profile → Tools → API Access**
4. Add your IP to the whitelist

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

## Usage Examples

### Check Domain Availability
```
"Is example123.com available?"
"Check if mydomain.io is taken"
```

### Get Domain Pricing
```
"How much does a .com domain cost?"
"What's the price for .io domains?"
```

### Register a Domain
Domain registration is a two-step process for safety:

**Step 1 - Preview:**
```
"Register mydomain.com"
```

**Step 2 - Confirm:**
```
"Confirm the purchase"
```

## Sandbox Mode

For testing without real purchases, set `NODE_ENV=sandbox`:

```json
{
  "env": {
    "NC_USERNAME": "your_username",
    "NC_API_KEY": "your_sandbox_api_key",
    "NODE_ENV": "sandbox"
  }
}
```

## Development

### Local Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run locally:
   ```bash
   NC_USERNAME=your_username NC_API_KEY=your_key node dist/index.js
   ```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ by Jason Brashear (WebDevToday)