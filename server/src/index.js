import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PORT, CLIENT_URL, TRUST_PROXY, NODE_ENV } from './config/env.js';
import { connectDB, disconnectDB, isDatabaseConnected } from './config/db.js';
import casesRouter from './routes/cases.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/security.js';
import logger from './utils/logger.js';

const app = express();

// Trust proxy for rate limiters and reverse proxies (Render, Vercel, Nginx, Cloudflare)
if (TRUST_PROXY) {
  app.set('trust proxy', TRUST_PROXY);
}

// ─── Security & Standard Middlewares ──────────────────────────────────────────

app.use(securityHeaders);

// CORS configuration — allow localhost in dev; specified CLIENT_URL in production
const allowedOriginCheck = (origin, callback) => {
  // Allow curl, Postman, mobile clients, and same-origin requests (origin is undefined)
  if (!origin) return callback(null, true);

  if (NODE_ENV !== 'production') {
    // In development, allow any localhost/127.0.0.1 port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
  }

  // Check exact client URL match or comma-delimited origins
  const allowedList = CLIENT_URL.split(',').map((url) => url.trim());
  if (allowedList.includes(origin)) {
    return callback(null, true);
  }

  logger.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
  return callback(new AppError(403, 'CORS_ERROR', `Origin '${origin}' not allowed by CORS policy.`));
};

app.use(cors({ origin: allowedOriginCheck, credentials: true }));

// Body parser with size limits to prevent Denial-of-Service attacks
app.use(express.json({ limit: '100kb' }));

// ─── Health Check Endpoint ───────────────────────────────────────────────────

const serverStartTime = Date.now();

app.get('/api/health', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

  const status = dbConnected ? 'ok' : 'degraded';
  const statusCode = dbConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    uptimeSeconds,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/cases', casesRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
});

// Centralized error handling
app.use(errorHandler);

// ─── Server Lifecycle Management ──────────────────────────────────────────────

let server = null;

async function startServer() {
  try {
    logger.info('[Server] Connecting to MongoDB...');
    await connectDB();
  } catch (err) {
    logger.error(`[Server] Critical: Failed to establish database connection at startup: ${err.message}`, { error: err });
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    logger.info(`[Server] Listening on port ${PORT} in ${NODE_ENV} mode.`);
    logger.info(`[Server] Allowed CORS origins: ${CLIENT_URL}`);
  });
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

async function handleShutdown(signal) {
  logger.info(`[Server] Received ${signal}. Commencing graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('[Server] HTTP listener closed.');
      await disconnectDB();
      logger.info('[Server] Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes longer than 10s
    setTimeout(() => {
      logger.error('[Server] Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000).unref();
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error(`[Process] Uncaught Exception: ${err.message}`, { error: err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[Process] Unhandled Promise Rejection: ${reason instanceof Error ? reason.message : reason}`, {
    error: reason instanceof Error ? reason : undefined
  });
});

startServer();

export default app;
