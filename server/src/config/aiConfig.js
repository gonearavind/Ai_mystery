/**
 * aiConfig.js — Centralized AI Provider Configuration
 *
 * Manages model fallback priorities, retry policies, backoff parameters,
 * and error classifications for Google Gemini SDK.
 */

// Supported models ordered by priority and reliability
// GEMINI_MODEL from env overrides primary, followed by reliable fallbacks
export const DEFAULT_PRIMARY_MODEL = 'gemini-2.5-flash';

export const SUPPORTED_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Builds the prioritized model fallback chain.
 * De-duplicates models and places primary model first.
 *
 * @param {string} [preferredModel]
 * @returns {string[]} Ordered list of model identifiers
 */
export function getModelFallbackChain(preferredModel) {
  const chain = [];
  if (preferredModel && typeof preferredModel === 'string' && preferredModel.trim()) {
    chain.push(preferredModel.trim());
  } else {
    chain.push(DEFAULT_PRIMARY_MODEL);
  }

  for (const model of SUPPORTED_MODEL_CANDIDATES) {
    if (!chain.includes(model)) {
      chain.push(model);
    }
  }

  return chain;
}

// ─── Resilience & Retry Policies ─────────────────────────────────────────────

export const AI_RETRY_CONFIG = {
  maxRetriesPerModel: 4,
  baseBackoffMs: 1500,
  maxBackoffMs: 20000,
  timeoutMs: 90000, // 90 seconds timeout per Gemini generation request
  jitterFactor: 0.25 // Add +/- 25% random jitter to avoid thundering herd
};

// HTTP status codes that represent transient, retryable failures
export const RETRYABLE_HTTP_STATUS_CODES = new Set([
  429, // Rate limit / Quota exhausted
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable / Overloaded
  504  // Gateway Timeout
]);

// HTTP status codes indicating permanent failure for this specific model or payload
export const FATAL_HTTP_STATUS_CODES = new Set([
  400, // Bad Request (invalid schema / format)
  401, // Unauthorized (invalid API key)
  403, // Forbidden
  404  // Not Found (model does not exist or deprecated)
]);

export default {
  DEFAULT_PRIMARY_MODEL,
  SUPPORTED_MODEL_CANDIDATES,
  getModelFallbackChain,
  AI_RETRY_CONFIG,
  RETRYABLE_HTTP_STATUS_CODES,
  FATAL_HTTP_STATUS_CODES
};

