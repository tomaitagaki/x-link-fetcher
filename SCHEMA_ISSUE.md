# Schema Configuration Issue

## Problem Summary

The X Link Fetcher MCP tools (`fetch_tweet` and `transform_url`) are expecting URL parameters, but the tool schemas don't include parameter definitions.

## Technical Mismatch

- **What the server functions expect:** URL parameters
- **What the tool schemas define:** No parameters exposed

The MCP server is running correctly, but the schema isn't properly configured to accept the URL parameter that the functions require.

## Solution Required

Update the MCP server configuration to properly expose the URL parameter in the tool schemas.

---

## Server Logs

```
/home/workspace/x-link-fetcher → npm start

> x-link-fetcher@1.0.0 start
> node server.js

✨ X Link Fetcher server running on port 5001
📍 Using Nitter instance: nitter.poast.org
🔗 Health check: http://localhost:5001/health
📖 API docs: http://localhost:5001/
Received POST request to /sse
POST /sse body: {
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {
      "name": "Poke",
      "version": "1.0.0"
    }
  },
  "jsonrpc": "2.0",
  "id": 0
}
Session initialized with ID: d8b2afe0-8d20-43c4-927b-442d1a0001b0
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:42 +0000] "POST /sse HTTP/1.1" 200 - "-" "node"
Received POST request to /sse
POST /sse body: {
  "method": "notifications/initialized",
  "jsonrpc": "2.0"
}
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:43 +0000] "POST /sse HTTP/1.1" 202 - "-" "node"
Received GET request to /sse
Received POST request to /sse
POST /sse body: {
  "method": "tools/call",
  "params": {
    "name": "fetch_tweet",
    "arguments": {}
  },
  "jsonrpc": "2.0",
  "id": 1
}
Tool called: fetch_tweet, args: {}
URL is undefined! Full request.params: {"name":"fetch_tweet","arguments":{}}
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:43 +0000] "POST /sse HTTP/1.1" 200 - "-" "node"
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:43 +0000] "GET /sse HTTP/1.1" 200 - "-" "node"
Received POST request to /sse
POST /sse body: {
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {
      "name": "Poke",
      "version": "1.0.0"
    }
  },
  "jsonrpc": "2.0",
  "id": 0
}
Session initialized with ID: 1c17449a-f094-403b-91fa-7379343ed722
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:47 +0000] "POST /sse HTTP/1.1" 200 - "-" "node"
Received POST request to /sse
POST /sse body: {
  "method": "notifications/initialized",
  "jsonrpc": "2.0"
}
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:47 +0000] "POST /sse HTTP/1.1" 202 - "-" "node"
Received GET request to /sse
Received POST request to /sse
POST /sse body: {
  "method": "tools/call",
  "params": {
    "name": "transform_url",
    "arguments": {}
  },
  "jsonrpc": "2.0",
  "id": 1
}
Tool called: transform_url, args: {}
URL is undefined! Full request.params: {"name":"transform_url","arguments":{}}
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:48 +0000] "POST /sse HTTP/1.1" 200 - "-" "node"
::ffff:127.0.0.1 - - [30/Dec/2025:22:39:48 +0000] "GET /sse HTTP/1.1" 200 - "-" "node"
```

## Key Evidence

The logs show that when tools are called, the `arguments` object is empty:

```json
{
  "method": "tools/call",
  "params": {
    "name": "fetch_tweet",
    "arguments": {}
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

This results in:
```
URL is undefined! Full request.params: {"name":"fetch_tweet","arguments":{}}
```

The client isn't sending URL parameters because the tool schema doesn't define them as available inputs.
