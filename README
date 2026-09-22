# Personal Health Monitor

A minimal, self-hosted website health monitor for checking the availability of HTTP/HTTPS health endpoints at regular intervals.

Built for personal use with a simple dashboard and no database, alerts, or monitoring history.

## Features

- Monitor HTTP/HTTPS health endpoints
- Configurable check intervals
- Automatic health checks in the background
- Shows current endpoint status
- Displays HTTP status code
- Displays response time
- Displays last checked time
- Add and remove monitors from the web interface
- Lightweight and minimal
- No database required
- No monitoring history
- No email or notification system

## How It Works

The server maintains the configured monitors in memory.

Each monitor periodically sends a `GET` request to its configured health endpoint.

For example:

```text
https://example.com/api/health