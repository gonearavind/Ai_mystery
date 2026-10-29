/**
 * env.js — Central environment variable loader and startup validator
 *
 * Import constants from here instead of reading process.env directly,
 * so misconfiguration is caught at startup, not at runtime.
 */

import 'dotenv/config';
import { DEFAULT_PRIMARY_MODEL } from './aiConfig.js';
import logger from '../utils/logger.js';

export const NODE_ENV       = process.env.NODE_ENV || 'development';
export const PORT           = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
export const MONGODB_URI    = process.env.MONGODB_URI;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_MODEL   = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
export const CLIENT_URL     = process.env.CLIENT_URL || 'http://localhost:5173';
export const TRUST_PROXY    = process.env.TRUST_PROXY || '1';

// ─── Startup guards ───────────────────────────────────────────────────────────

if (!MONGODB_URI) {
  logger.error('[env] MONGODB_URI is missing from environment. Copy server/.env.example to server/.env and provide your MongoDB connection URI.');
  throw new Error('MONGODB_URI is required.');
}

if (!GEMINI_API_KEY) {
  logger.error('[env] GEMINI_API_KEY is missing from environment. Copy server/.env.example to server/.env and provide your Gemini API key.');
  throw new Error('GEMINI_API_KEY is required.');
}

// Mask API key in logs for security
const maskedKey = GEMINI_API_KEY.length > 8
  ? `${GEMINI_API_KEY.slice(0, 4)}****${GEMINI_API_KEY.slice(-4)}`
  : '****';

logger.info(`[env] Configuration loaded: NODE_ENV=${NODE_ENV} | PORT=${PORT} | PRIMARY_MODEL=${GEMINI_MODEL} | KEY=${maskedKey} | CLIENT_URL=${CLIENT_URL}`);
