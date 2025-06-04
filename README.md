# Namecheap MCP Server

[![NPM Version](https://img.shields.io/npm/v/@webdevtoday/nc-mcp-server)](https://www.npmjs.com/package/@webdevtoday/nc-mcp-server)
[![License](https://img.shields.io/npm/l/@webdevtoday/nc-mcp-server)](https://github.com/webdevtodayjason/nc-mcp-server/blob/main/LICENSE)
[![smithery badge](https://smithery.ai/badge/@webdevtodayjason/namecheap-mcp)](https://smithery.ai/server/@webdevtodayjason/namecheap-mcp)
[![Deploy on Smithery](https://smithery.ai/badge/deploy)](https://smithery.ai/server/@webdevtoday/namecheap-domains)

## 🚀 The Problem

Managing domain registrations typically requires navigating complex web interfaces or writing custom API integrations. This creates friction when you want to quickly check domain availability or register domains as part of your workflow.

## 💡 The Solution

The Namecheap MCP Server brings comprehensive domain management directly into your AI assistant. Check availability, manage your portfolio, view DNS records, and register domains using natural language - all without leaving your conversation.

```
You: "Show me all my domains"
Assistant: "You have 12 domains. 2 are expiring soon: myblog.com (expires in 15 days)..."

You: "Get DNS records for myblog.com"
Assistant: "myblog.com has 4 A records, 2 MX records for email..."

You: "Is mycoolstartup.com available?"
Assistant: "Yes, mycoolstartup.com is available! A .com costs $9.58/year."

You: "Register it for 2 years"
Assistant: "I'll register mycoolstartup.com for 2 years. Total: $19.16. Confirm?"
```

## ⚠️ Important Security Warning

**This tool uses the Namecheap live API and can make REAL purchases.** Always double-check domain registration commands before confirming.

## 📦 Installation

<details open>
<summary><strong>Quick Start with Smithery (Recommended)</strong></summary>

1. Click [Deploy on Smithery](https://smithery.ai/server/@webdevtoday/namecheap-domains)
2. Configure your Namecheap credentials
3. Get your Smithery API key
4. Add to your MCP client

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

</details>

<details>
<summary><strong>Other MCP Clients (via Smithery)</strong></summary>

```json
{
  "mcpServers": {
    "namecheap": {
      "uri": "https://api.smithery.ai/mcp/@webdevtoday/namecheap-domains",
      "transport": {
        "type": "sse",
        "config": {
          "apiKey": "your-smithery-api-key"
        }
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Docker</strong></summary>

```bash
# Build
docker build -t nc-mcp-server .

# Run
docker run -p 3500:3500 \
  -e NC_USERNAME=your_username \
  -e NC_API_KEY=your_api_key \
  -e NODE_ENV=production \
  nc-mcp-server
```

</details>

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NC_USERNAME` | Your Namecheap username | ✅ |
| `NC_API_KEY` | Your Namecheap API key | ✅ |
| `NC_CLIENT_IP` | Your whitelisted IP (auto-detected if not set) | ❌ |
| `NODE_ENV` | Set to `sandbox` for testing | ❌ |
| `REGISTRANT_PROFILE` | JSON string with contact details | ❌ |
| `REGISTRANT_PROFILE_PATH` | Path to registrant JSON file | ❌ |

### Namecheap API Access

To use the Namecheap API, your account must meet **one** of these requirements:
- At least 20 domains in your account
- At least $50 account balance
- At least $50 spent in the last 2 years

### IP Whitelisting

1. Find your IP: `curl ifconfig.me`
2. Log in to Namecheap
3. Go to **Profile → Tools → API Access**
4. Add your IP to the whitelist

### Registrant Profile

<details>
<summary><strong>Setting up domain registration details</strong></summary>

**Option 1: Environment Variable**
```json
{
  "env": {
    "REGISTRANT_PROFILE": "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"address1\":\"123 Main St\",\"city\":\"New York\",\"stateProvince\":\"NY\",\"postalCode\":\"10001\",\"country\":\"US\",\"phone\":\"+1.2125551234\",\"email\":\"john@example.com\"}"
  }
}
```

**Option 2: JSON File**
Create `registrant-profile.json`:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  "city": "New York",
  "stateProvince": "NY",
  "postalCode": "10001",
  "country": "US",
  "phone": "+1.2125551234",
  "email": "john@example.com"
}
```

</details>

## 🛠️ Available Tools

### Domain Search & Information

#### `check_domain`
Check if a domain is available for registration.

```
"Is example.com available?"
"Check mydomain.io"
```

#### `get_domain_list`
List all domains in your Namecheap account with filtering options.

```
"Show me all my domains"
"List my expiring domains"
"Search for domains containing 'blog'"
```

#### `get_domain_info`
Get detailed information about a specific domain.

```
"Get info for mydomain.com"
"Show me details about example.com"
```

#### `get_domain_contacts`
Retrieve contact information for a domain.

```
"Show contacts for mydomain.com"
"Get registrant info for example.com"
```

### Domain Management

#### `get_tld_pricing`
Get current pricing for any TLD.

```
"How much does a .com cost?"
"Price for .io domains"
```

#### `register_domain`
Register a domain with optional WhoisGuard protection.

```
"Register mydomain.com"
"Register example.io for 2 years"
```

### DNS Management

#### `get_dns_hosts`
Retrieve DNS records for domains using Namecheap DNS.

```
"Show DNS records for mydomain.com"
"Get DNS settings for example.com"
```

## 🧪 Sandbox Mode

Test without making real purchases:

```json
{
  "env": {
    "NODE_ENV": "sandbox",
    "NC_USERNAME": "your_username",
    "NC_API_KEY": "your_sandbox_api_key"
  }
}
```

## 🐛 Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

### API Access Denied
- Ensure your account meets the requirements
- Verify your API key is correct
- Check IP whitelisting

### Connection Failed / IP Not Whitelisted
- Check the Smithery logs to find the actual IP being used
- Add that IP to your Namecheap whitelist (Profile → Tools → API Access)
- Alternatively, set NC_CLIENT_IP in Smithery configuration
- Note: Smithery servers may use different IPs than expected

### Invalid API Key Error
1. Verify API access is enabled in Namecheap
2. Check your account meets requirements:
   - At least 20 domains, OR
   - At least $50 balance, OR  
   - At least $50 spent in last 2 years
3. Ensure API key is correctly copied

### Registration Fails
- Verify registrant profile is properly formatted
- Ensure all required fields are filled
- Check domain availability first

</details>

## 🔨 Development

```bash
# Clone
git clone https://github.com/webdevtodayjason/nc-mcp-server
cd nc-mcp-server

# Install
npm install

# Build
npm run build

# Run
NC_USERNAME=your_username NC_API_KEY=your_key npm start
```

### Deploy Your Own

To install Namecheap MCP Server for any client automatically via Smithery:

```bash
npx -y @smithery/cli@latest install @webdevtoday/namecheap-domains --client <CLIENT_NAME> --key <YOUR_SMITHERY_KEY>
```

You can find your Smithery key in the [Smithery.ai](https://smithery.ai) dashboard.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Jason Brashear](https://github.com/webdevtodayjason)

## 🌟 Support

If you find this helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting issues
- 💡 Suggesting features
- 🤝 Contributing code

---

<p align="center">Made with ❤️ by <a href="https://github.com/webdevtodayjason">Jason Brashear</a></p>