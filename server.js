const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
require('dotenv').config();

// MCP SDK imports for SSE endpoint
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

const app = express();
const PORT = process.env.PORT || 5001;
const NITTER_INSTANCE = process.env.NITTER_INSTANCE || 'nitter.poast.org';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

/**
 * Transform X/Twitter URL to Nitter URL
 * @param {string} url - Original X/Twitter URL
 * @returns {string} - Transformed Nitter URL
 */
function transformToNitter(url) {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Twitter/X URL
    if (!urlObj.hostname.includes('twitter.com') && !urlObj.hostname.includes('x.com')) {
      throw new Error('Not a valid Twitter/X URL');
    }
    
    // Replace hostname with Nitter instance
    urlObj.hostname = NITTER_INSTANCE;
    
    return urlObj.toString();
  } catch (error) {
    throw new Error(`URL transformation failed: ${error.message}`);
  }
}

/**
 * Parse tweet content from Nitter HTML
 * @param {string} html - HTML content from Nitter
 * @returns {object} - Parsed tweet data
 */
function parseTweetContent(html) {
  const $ = cheerio.load(html);
  
  // Extract tweet content
  const tweetText = $('.tweet-content').first().text().trim();
  const author = $('.fullname').first().text().trim();
  const username = $('.username').first().text().trim();
  const timestamp = $('.tweet-date a').first().attr('title') || '';
  const stats = {
    replies: $('.icon-comment').parent().text().trim() || '0',
    retweets: $('.icon-retweet').parent().text().trim() || '0',
    likes: $('.icon-heart').parent().text().trim() || '0'
  };
  
  // Extract media URLs if present
  const mediaUrls = [];
  $('.attachment.image img').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src) {
      mediaUrls.push(`https://${NITTER_INSTANCE}${src}`);
    }
  });
  
  return {
    text: tweetText,
    author: author,
    username: username,
    timestamp: timestamp,
    stats: stats,
    media: mediaUrls,
    hasContent: tweetText.length > 0
  };
}

/**
 * Fetch tweet content from Nitter
 * @param {string} nitterUrl - Nitter URL to fetch
 * @returns {object} - Fetched and parsed content
 */
async function fetchTweetContent(nitterUrl) {
  try {
    const response = await axios.get(nitterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    return parseTweetContent(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nitterInstance: NITTER_INSTANCE
  });
});

/**
 * Root endpoint with API information
 */
app.get('/', (req, res) => {
  res.json({
    name: 'X Link Fetcher',
    version: '1.0.0',
    description: 'Transform X/Twitter URLs to Nitter and fetch tweet content without API keys',
    endpoints: {
      health: '/health',
      fetch: '/fetch?url=<twitter_url>',
      transform: '/transform?url=<twitter_url>',
      mcp: '/mcp (POST)',
      sse: '/sse (GET) - MCP SSE endpoint for Poke integration',
      messages: '/messages (POST) - SSE client-to-server messages'
    },
    repository: 'https://github.com/tomaitagaki/x-link-fetcher',
    documentation: 'https://github.com/tomaitagaki/x-link-fetcher#readme'
  });
});

/**
 * Transform X/Twitter URL to Nitter URL
 */
app.get('/transform', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }
  
  try {
    const nitterUrl = transformToNitter(url);
    res.json({
      success: true,
      originalUrl: url,
      nitterUrl: nitterUrl
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Fetch tweet content
 */
app.get('/fetch', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }
  
  try {
    const nitterUrl = transformToNitter(url);
    const content = await fetchTweetContent(nitterUrl);
    
    if (!content.hasContent) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found or could not be parsed'
      });
    }
    
    res.json({
      success: true,
      originalUrl: url,
      nitterUrl: nitterUrl,
      content: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP Server endpoint for Poke integration
 */
app.post('/mcp', async (req, res) => {
  const { method, params } = req.body;
  
  if (!method) {
    return res.status(400).json({
      error: 'Method is required',
      availableMethods: ['fetch_tweet', 'transform_url']
    });
  }
  
  try {
    switch (method) {
      case 'fetch_tweet': {
        const { url } = params || {};
        
        if (!url) {
          return res.status(400).json({
            error: 'URL parameter is required'
          });
        }
        
        const nitterUrl = transformToNitter(url);
        const content = await fetchTweetContent(nitterUrl);
        
        res.json({
          result: {
            originalUrl: url,
            nitterUrl: nitterUrl,
            content: content
          }
        });
        break;
      }
      
      case 'transform_url': {
        const { url } = params || {};
        
        if (!url) {
          return res.status(400).json({
            error: 'URL parameter is required'
          });
        }
        
        const nitterUrl = transformToNitter(url);
        
        res.json({
          result: {
            originalUrl: url,
            nitterUrl: nitterUrl
          }
        });
        break;
      }
      
      default:
        res.status(400).json({
          error: `Unknown method: ${method}`,
          availableMethods: ['fetch_tweet', 'transform_url']
        });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// MCP SSE endpoint for Poke integration
// Store active transports by session ID
const transports = new Map();

// Helper to create an MCP server with tools
function createMcpServer() {
  const server = new McpServer({
    name: 'x-link-fetcher',
    version: '1.0.0'
  });

  // Register tools
  server.tool('fetch_tweet', 'Fetch and parse tweet content from X/Twitter URL', {
    url: { type: 'string', description: 'X/Twitter URL to fetch' }
  }, async ({ url }) => {
    const nitterUrl = transformToNitter(url);
    const content = await fetchTweetContent(nitterUrl);
    return {
      content: [{ type: 'text', text: JSON.stringify(content, null, 2) }]
    };
  });

  server.tool('transform_url', 'Transform X/Twitter URL to Nitter URL', {
    url: { type: 'string', description: 'X/Twitter URL to transform' }
  }, async ({ url }) => {
    const nitterUrl = transformToNitter(url);
    return {
      content: [{ type: 'text', text: JSON.stringify({ originalUrl: url, nitterUrl }, null, 2) }]
    };
  });

  return server;
}

// SSE endpoint - GET establishes SSE connection, POST sends messages
app.get('/sse', (req, res) => {
  // Use /sse as the message endpoint (Poke posts to same path)
  const transport = new SSEServerTransport('/sse', res);
  const server = createMcpServer();

  const sessionId = crypto.randomUUID();
  transports.set(sessionId, transport);

  res.on('close', () => {
    transports.delete(sessionId);
  });

  server.connect(transport);
});

// POST /sse - handle messages from Poke
app.post('/sse', (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);

  if (transport) {
    transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Messages endpoint for SSE client-to-server (legacy/alternate path)
app.post('/messages', (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);

  if (transport) {
    transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// OAuth discovery endpoints for MCP clients
// For a PUBLIC server (no auth required), return 404 to indicate no OAuth config
// This tells Poke that authentication is not required

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  // Return 404 to indicate no OAuth server configured (public access)
  res.status(404).json({ error: 'OAuth not configured - public access' });
});

app.get('/.well-known/oauth-protected-resource', (req, res) => {
  // Return 404 to indicate resource is not OAuth protected
  res.status(404).json({ error: 'Resource not protected - public access' });
});

app.get('/.well-known/oauth-protected-resource/:path', (req, res) => {
  // Handle path-specific OAuth discovery (e.g., /sse)
  res.status(404).json({ error: 'Resource not protected - public access' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ X Link Fetcher server running on port ${PORT}`);
  console.log(`📍 Using Nitter instance: ${NITTER_INSTANCE}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});

module.exports = app;
