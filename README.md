# X Link Fetcher

> Transform X/Twitter URLs to Nitter and fetch tweet content without API keys. Works as an MCP server for Poke.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Production Ready](https://img.shields.io/badge/production-ready-green)](https://github.com/tomaitagaki/x-link-fetcher)

## Features

✨ **No API Keys Required** - Works without Twitter/X API authentication

🔄 **Automatic URL Transformation** - Converts X/Twitter URLs to Nitter instances

📊 **JSON API** - Returns structured tweet data in JSON format

🚀 **MCP Server Support** - Compatible with Poke and other MCP clients

☁️ **Easy Deployment** - Deploy to Zo, Vercel, Railway, Render, or any Node.js host

🛡️ **Production Ready** - Rate limiting, graceful shutdown, health checks, and monitoring

⚡ **High Performance** - Optimized for scalability and reliability

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
      "url": "https://your-deployment.zo.dev/mcp",
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

Health check endpoint with detailed system information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T21:15:00Z",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 18874368,
    "heapUsed": 15728640
  }
}
```

### GET `/ready`

Readiness check endpoint for load balancers and orchestrators.

## Deployment

### Deploy to Zo (Recommended for Production)

Zo is a modern hosting platform optimized for Node.js applications with automatic scaling and zero-downtime deployments.

#### Prerequisites

1. **Install Zo CLI:**
```bash
npm install -g zo-cli
# or
curl -sSL https://get.zo.dev | sh
```

2. **Login to Zo:**
```bash
zo login
```

#### Deployment Steps

1. **Configure Environment Variables:**

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
NODE_ENV=production
PORT=3000
NITTER_INSTANCE=nitter.poast.org
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

2. **Deploy to Zo:**

```bash
# Deploy from the zo-hosting-support branch
zo deploy

# Or specify the branch explicitly
zo deploy --branch zo-hosting-support
```

3. **Monitor Your Deployment:**

```bash
# Check deployment status
zo status

# View logs
zo logs --follow

# View metrics
zo metrics
```

#### Zo Configuration

The `zo.toml` file contains all necessary configuration:

- **Auto-scaling:** Scales from 1 to 5 instances based on CPU/memory usage
- **Health checks:** Automatic health monitoring every 30 seconds
- **Rolling deployments:** Zero-downtime deployments
- **Resource limits:** 512MB memory, 0.5 CPU per instance
- **Built-in rate limiting:** Configured via environment variables

#### Zo Environment Variables

Set environment variables in the Zo dashboard or via CLI:

```bash
zo env:set NODE_ENV=production
zo env:set NITTER_INSTANCE=nitter.poast.org
zo env:set RATE_LIMIT_MAX_REQUESTS=100
```

#### Zo CLI Commands

```bash
# Deploy application
npm run zo:deploy

# View logs
npm run zo:logs

# Check status
npm run zo:status

# Scale instances
zo scale --instances 3

# Update environment variables
zo env:set KEY=value

# View environment variables
zo env:list

# Rollback deployment
zo rollback

# View deployment history
zo history
```

#### Zo Features

- ✅ **Automatic SSL/TLS:** Free SSL certificates via Let's Encrypt
- ✅ **CDN Integration:** Global content delivery network
- ✅ **Auto-scaling:** Horizontal scaling based on load
- ✅ **Zero-downtime:** Rolling deployments with health checks
- ✅ **Monitoring:** Built-in metrics and logging
- ✅ **Database Support:** Easy integration with PostgreSQL, Redis, etc.
- ✅ **Custom Domains:** Use your own domain
- ✅ **GitHub Integration:** Auto-deploy from Git pushes

#### Production Best Practices for Zo

1. **Enable Auto-scaling:**
```bash
zo scale --auto --min 1 --max 5
```

2. **Set up Alerts:**
```bash
zo alerts:create --type cpu --threshold 80
zo alerts:create --type memory --threshold 80
zo alerts:create --type error-rate --threshold 5
```

3. **Configure Custom Domain:**
```bash
zo domains:add yourdomain.com
zo domains:verify yourdomain.com
```

4. **Enable Monitoring:**
```bash
zo monitoring:enable
zo apm:enable
```

5. **Set up CI/CD:**

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Zo

on:
  push:
    branches: [main, zo-hosting-support]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: zo-dev/deploy-action@v1
        with:
          api-key: ${{ secrets.ZO_API_KEY }}
          app-name: x-link-fetcher
```

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
3. Set environment variables from `.env.example`
4. Deploy!

### Deploy to Render

1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm run start:prod`
5. Add environment variables from `.env.example`
6. Deploy

### Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set NITTER_INSTANCE=nitter.poast.org

# Deploy
git push heroku main
```

### Environment Variables

All environment variables are documented in `.env.example`. Key variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `NITTER_INSTANCE` - Nitter instance to use (default: nitter.poast.org)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- `SHUTDOWN_TIMEOUT` - Graceful shutdown timeout in ms (default: 30000)

## Production Features

### Rate Limiting

Rate limiting is automatically enabled in production mode:
- Default: 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- Returns 429 status when limit exceeded

### Graceful Shutdown

The server handles shutdown signals gracefully:
- Stops accepting new connections
- Completes in-flight requests
- Cleans up resources
- Times out after 30 seconds (configurable)

### Health Checks

- `/health` - Detailed health information
- `/ready` - Readiness for load balancers
- Includes uptime, memory usage, and environment info

### Monitoring

Integrated with Zo platform monitoring:
- Real-time metrics
- Error tracking
- Performance monitoring
- Optional APM integration

### Security

- Helmet.js for HTTP headers security
- CORS configuration
- Rate limiting
- Request timeout protection
- Error handling middleware

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

# Readiness check
curl http://localhost:3000/ready
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
- Increasing rate limit values in production

### Parsing Errors

If tweet content can't be parsed:
- The tweet may be deleted or private
- Nitter's HTML structure may have changed
- Try a different Nitter instance

### Memory Issues

If experiencing high memory usage:
- Adjust `max-old-space-size` in Procfile
- Monitor with `/health` endpoint
- Scale horizontally on Zo platform

## Development

### Project Structure

```
x-link-fetcher/
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── zo.toml            # Zo platform configuration
├── Procfile           # Process configuration
├── .env.example       # Environment variables template
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
npm run lint:fix
```

### Health Check

```bash
npm run health-check
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
- [Zo Platform](https://zo.dev) - Modern Node.js hosting
- MCP Protocol for inter-application communication

## Support

- 🐛 [Report a bug](https://github.com/tomaitagaki/x-link-fetcher/issues)
- 💡 [Request a feature](https://github.com/tomaitagaki/x-link-fetcher/issues)
- ⭐ Star this repo if you find it useful!
- 📧 Contact: [Toma Itagaki](https://github.com/tomaitagaki)

---

Made with ❤️ by [Toma Itagaki](https://github.com/tomaitagaki)
