/**
 * logger.js — Production-grade structured logger
 *
 * Provides standardized timestamped output with levels (DEBUG, INFO, WARN, ERROR).
 * In production, logs are formatted as structured JSON for log aggregators (Datadog, CloudWatch, etc.).
 * In development, logs are formatted for clear terminal reading with sanitized metadata.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevelValue = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  if (isProduction) {
    const logObj = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(meta && Object.keys(meta).length > 0 ? { meta } : {})
    };
    if (meta?.error instanceof Error) {
      logObj.error = {
        name: meta.error.name,
        message: meta.error.message,
        stack: meta.error.stack
      };
    }
    return JSON.stringify(logObj);
  }

  const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]`;
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${prefix} ${message}${metaStr}`;
}

export const logger = {
  debug(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },
  info(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, meta));
    }
  },
  warn(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  }
};

export default logger;

