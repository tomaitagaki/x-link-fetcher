# X Link Fetcher

> Transform X/Twitter URLs to Nitter and fetch tweet content without API keys. Works as an MCP server for Poke.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## Features

✨ **No API Keys Required** - Works without Twitter/X API authentication

🔄 **Automatic URL Transformation** - Converts X/Twitter URLs to Nitter instances

📊 **JSON API** - Returns structured tweet data in JSON format

🚀 **MCP Server Support** - Compatible with Poke and other MCP clients

☁️ **Easy Deployment** - Deploy to Vercel, Railway, Render, or any Node.js host

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/tomaitagaki/x-link-fetcher.git
cd x-link-fetcher

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## Usage

### As a REST API

**Fetch Tweet Content:**

```bash
curl "http://localhost:3000/fetch?url=https://x.com/user/status/1234567890"
```

**Response:**

```json
{
  "success": true,
  "originalUrl": "https://x.com/user/status/1234567890",
  "nitterUrl": "https://nitter.poast.org/user/status/1234567890",
  "content": {
    "text": "Tweet content here...",
    "author": "@username",
    "timestamp": "2025-12-27T12:00:00Z"
  }
}
```

### As an MCP Server

Add to your Poke configuration file (`~/.poke/config.json` or similar):

```json
{
  "mcpServers": {
    "x-link-fetcher": {
      "url": "http://localhost:3000/mcp",
      "type": "http"
    }
  }
}
```

Or if running remotely:

```json
{
  "mcpServers": {
    "x-link-fetcher": {
      "url": "https://your-deployment.vercel.app/mcp",
      "type": "http"
    }
  }
}
```

## API Endpoints

### GET `/fetch`

Fetch and parse tweet content.

**Query Parameters:**
- `url` (required) - X/Twitter URL to fetch

**Example:**
```bash
GET /fetch?url=https://x.com/elonmusk/status/1234567890
```

### GET `/transform`

Transform X/Twitter URL to Nitter URL without fetching.

**Query Parameters:**
- `url` (required) - X/Twitter URL to transform

**Example:**
```bash
GET /transform?url=https://x.com/user/status/123
```

**Response:**
```json
{
  "originalUrl": "https://x.com/user/status/123",
  "nitterUrl": "https://nitter.poast.org/user/status/123"
}
```

### POST `/mcp`

MCP server endpoint for Poke integration.

**Body:**
```json
{
  "method": "fetch_tweet",
  "params": {
    "url": "https://x.com/user/status/123"
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T21:15:00Z"
}
```

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tomaitagaki/x-link-fetcher)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Connect your GitHub repository
2. Railway will auto-detect the Node.js app
3. Deploy!

### Deploy to Render

1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy

### Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NITTER_INSTANCE` - Nitter instance to use (default: nitter.poast.org)
- `NODE_ENV` - Environment (development/production)

## Configuration

### Custom Nitter Instance

You can specify a custom Nitter instance:

```bash
export NITTER_INSTANCE=nitter.net
npm start
```

Or in your deployment platform's environment variables.

### Available Nitter Instances

- `nitter.poast.org` (default)
- `nitter.net`
- `nitter.it`
- `nitter.privacydev.net`
- `nitter.unixfox.eu`

*Note: Nitter instances may have varying reliability. Test which works best for you.*

## How It Works

1. **URL Transformation**: Converts X/Twitter URLs to Nitter URLs
   - `x.com` → `nitter.poast.org`
   - `twitter.com` → `nitter.poast.org`

2. **Content Fetching**: Makes HTTP requests to Nitter (no API needed)

3. **HTML Parsing**: Extracts tweet data from HTML using cheerio

4. **JSON Response**: Returns structured data

5. **MCP Integration**: Provides MCP-compatible endpoint for Poke

## Examples

### Node.js Client

```javascript
const axios = require('axios');

async function fetchTweet(url) {
  const response = await axios.get('http://localhost:3000/fetch', {
    params: { url }
  });
  return response.data;
}

fetchTweet('https://x.com/user/status/123')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Python Client

```python
import requests

def fetch_tweet(url):
    response = requests.get('http://localhost:3000/fetch', params={'url': url})
    return response.json()

data = fetch_tweet('https://x.com/user/status/123')
print(data)
```

### cURL

```bash
# Fetch tweet
curl "http://localhost:3000/fetch?url=https://x.com/user/status/123"

# Transform URL only
curl "http://localhost:3000/transform?url=https://x.com/user/status/123"

# Health check
curl http://localhost:3000/health
```

## Troubleshooting

### Nitter Instance Unreachable

If the default Nitter instance is down, try changing it:

```bash
export NITTER_INSTANCE=nitter.net
npm start
```

### Rate Limiting

Nitter instances may rate limit. Consider:
- Using your own Nitter instance
- Implementing caching
- Adding delays between requests

### Parsing Errors

If tweet content can't be parsed:
- The tweet may be deleted or private
- Nitter's HTML structure may have changed
- Try a different Nitter instance

## Development

### Project Structure

```
x-link-fetcher/
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── README.md          # Documentation
├── LICENSE            # MIT License
├── .gitignore         # Git ignore rules
└── .github/
    └── workflows/
        └── deploy.yml  # CI/CD automation
```

### Running Tests

```bash
npm test
```

### Code Style

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational purposes. Be respectful of rate limits and terms of service for both X/Twitter and Nitter instances.

## Acknowledgments

- [Nitter](https://github.com/zedeus/nitter) - Privacy-focused Twitter frontend
- [Express](https://expressjs.com/) - Web framework
- [Cheerio](https://cheerio.js.org/) - HTML parsing
- MCP Protocol for inter-application communication

## Support

- 🐛 [Report a bug](https://github.com/tomaitagaki/x-link-fetcher/issues)
- 💡 [Request a feature](https://github.com/tomaitagaki/x-link-fetcher/issues)
- ⭐ Star this repo if you find it useful!

---

Made with ❤️ by [Toma Itagaki](https://github.com/tomaitagaki)
