const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NITTER_INSTANCE = process.env.NITTER_INSTANCE || 'nitter.poast.org';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting configuration for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV !== 'production' // Skip rate limiting in development
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan(process.env.LOG_FORMAT || 'combined'));

// Apply rate limiting to API endpoints
app.use('/fetch', limiter);
app.use('/mcp', limiter);

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(parseInt(process.env.REQUEST_TIMEOUT) || 10000);
  next();
});

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
    nitterInstance: NITTER_INSTANCE,
    environment: NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * Readiness check endpoint for Zo platform
 */
app.get('/ready', (req, res) => {
  // Add any additional checks here (database, external services, etc.)
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
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
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      ready: '/ready',
      fetch: '/fetch?url=<twitter_url>',
      transform: '/transform?url=<twitter_url>',
      mcp: '/mcp (POST)'
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
const server = app.listen(PORT, () => {
  console.log(`✨ X Link Fetcher server running on port ${PORT}`);
  console.log(`📍 Using Nitter instance: ${NITTER_INSTANCE}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections, cleanup resources, etc.
    // Add any cleanup logic here
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT) || 30000;
  setTimeout(() => {
    console.error('⚠️  Forced shutdown due to timeout');
    process.exit(1);
  }, shutdownTimeout);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
