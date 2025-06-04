# Namecheap MCP Server

[![NPM Version](https://img.shields.io/npm/v/@webdevtoday/nc-mcp-server)](https://www.npmjs.com/package/@webdevtoday/nc-mcp-server)
[![License](https://img.shields.io/npm/l/@webdevtoday/nc-mcp-server)](https://github.com/webdevtodayjason/nc-mcp-server/blob/main/LICENSE)
[![smithery badge](https://smithery.ai/badge/@webdevtodayjason/namecheap-mcp)](https://smithery.ai/server/@webdevtodayjason/namecheap-mcp)
[![Deploy on Smithery](https://smithery.ai/badge/deploy)](https://smithery.ai/server/@webdevtoday/namecheap-domains)

## 🚀 The Problem

Managing domain registrations typically requires navigating complex web interfaces or writing custom API integrations. This creates friction when you want to quickly check domain availability or register domains as part of your workflow.

## 💡 The Solution

The Namecheap MCP Server brings domain management directly into your AI assistant. Check availability, compare prices, and register domains using natural language - all without leaving your conversation.

```
You: "Is mycoolstartup.com available?"
Assistant: "Yes, mycoolstartup.com is available! Would you like to register it?"

You: "What's the price for a .io domain?"
Assistant: "A .io domain costs $32.98 for the first year."

You: "Register mycoolstartup.io for 2 years"
Assistant: "I'll register mycoolstartup.io for 2 years. Total: $65.96. Confirm?"
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

### `check_domain`
Check if a domain is available for registration.

```
"Is example.com available?"
"Check mydomain.io"
```

### `get_tld_pricing`
Get current pricing for any TLD.

```
"How much does a .com cost?"
"Price for .io domains"
```

### `register_domain`
Register a domain with optional WhoisGuard protection.

```
"Register mydomain.com"
"Register example.io for 2 years"
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

### Connection Failed
- Confirm your IP is whitelisted
- Try updating your IP in Namecheap settings
- Check if using VPN (may need to whitelist VPN IP)

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