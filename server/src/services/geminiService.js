/**
 * geminiService.js — Enterprise-Grade Resilient Gemini Mystery Generator
 *
 * Implements:
 *   - Centralized model fallback chain via aiConfig
 *   - Per-model exponential backoff with jitter
 *   - AbortSignal timeout termination (prevents socket/memory leaks)
 *   - Structured error classification (using SDK status codes and ApiError)
 *   - Non-leaking, sanitized user-facing errors
 *   - Full prompt security isolation and strict schema validation
 */

import { GoogleGenAI, Type, ApiError } from '@google/genai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import {
  getModelFallbackChain,
  AI_RETRY_CONFIG,
  RETRYABLE_HTTP_STATUS_CODES,
  FATAL_HTTP_STATUS_CODES
} from '../config/aiConfig.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateGeneratedMystery, DIFFICULTY_CONFIG } from './validationService.js';
import logger from '../utils/logger.js';

// ─── SDK Client ──────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Prioritized model fallback list
const MODEL_FALLBACK_LIST = getModelFallbackChain(GEMINI_MODEL);

// ─── Gemini Structured Response Schema ────────────────────────────────────────

const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    story: {
      type: Type.STRING,
      description: '150-400 words setting the scene, incident, and atmosphere. Must NOT name or reveal the culprit.'
    },
    suspects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id:           { type: Type.STRING, description: 's1, s2, etc.' },
          name:         { type: Type.STRING },
          role:         { type: Type.STRING },
          description:  { type: Type.STRING },
          relationship: { type: Type.STRING },
          alibi:        { type: Type.STRING }
        },
        required: ['id', 'name', 'role', 'description', 'relationship', 'alibi']
      }
    },
    clues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id:          { type: Type.STRING, description: 'c1, c2, etc.' },
          title:       { type: Type.STRING },
          description: { type: Type.STRING },
          location:    { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['incriminating', 'exonerating', 'red_herring', 'neutral']
          },
          pointsTo: {
            type: Type.STRING,
            description: "Suspect ID like 's1', or null if neutral",
            nullable: true
          }
        },
        required: ['id', 'title', 'description', 'location', 'type']
      }
    },
    hints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          text:  { type: Type.STRING }
        },
        required: ['index', 'text']
      }
    },
    solution: {
      type: Type.OBJECT,
      properties: {
        culpritId:   { type: Type.STRING, description: 'Exact ID of culprit, e.g. s1' },
        motive:      { type: Type.STRING },
        method:      { type: Type.STRING },
        explanation: {
          type: Type.STRING,
          description: 'Full reasoning tying culprit to the crime. Must reference at least one incriminating clue by title or id.'
        }
      },
      required: ['culpritId', 'motive', 'method', 'explanation']
    }
  },
  required: ['title', 'story', 'suspects', 'clues', 'hints', 'solution']
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(premise, difficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const suspectIds = Array.from({ length: config.suspects }, (_, i) => `s${i + 1}`).join(', ');
  const clueIds    = Array.from({ length: config.clues },    (_, i) => `c${i + 1}`).join(', ');
  const hintIdxs   = Array.from({ length: config.hints },    (_, i) => i + 1).join(', ');

  return `You are the master AI mystery engine for AI Mystery Room.
Your highest priority is to fulfill the user's exact premise with zero hallucination and strict adherence to all narrative, character, location, and difficulty constraints.

STRICT OPERATIONAL RULES:
1. FAITHFUL THEMATIC ADHERENCE:
   - Every clue, suspect, timeline, piece of evidence, motive, and solution must directly match the user's requested theme, setting, location, characters, crime type, and constraints.
   - If the user specifies characters, location, tone, or details in the premise, incorporate them exactly. Do not change the topic or introduce unrelated narrative tangents.
   - Accuracy and logical consistency are paramount. Do not introduce contradictory facts.
2. BAN GRAPHIC CONTENT:
   - Absolutely no graphic gore, gratuitous violence, sexual violence, or explicit horror. Keep content appropriate for general mystery enthusiasts.
3. EXACT SCHEMA & STRUCTURAL COUNTS FOR DIFFICULTY '${difficulty.toUpperCase()}':
   - Suspects: Exactly ${config.suspects} suspects with IDs: ${suspectIds}.
   - Clues: Exactly ${config.clues} clues with IDs: ${clueIds}.
   - Hints: Exactly ${config.hints} hints with sequential index numbers: ${hintIdxs}.
4. LOGICAL DEDUCTION & SOLVABILITY:
   - Exactly ONE suspect is the culprit (identified in solution.culpritId).
   - At least ${config.minIncriminating} clues must be typed "incriminating" and have pointsTo equal to the culprit's ID.
   ${difficulty !== 'easy' ? '- At least one clue must be typed "exonerating" or "red_herring" to provide fair misdirection.' : ''}
   - NO clue may have type "incriminating" pointing to an innocent suspect (if it misleadingly implicates an innocent person, its type MUST be "red_herring").
   - Neutral clues must have pointsTo: null.
5. FAIR PLAY & SECRECY:
   - The "story" (150-400 words) sets the scene, incident, and atmosphere. Do NOT name or reveal the culprit in the story.
   - Hints must be progressive: Hint 1 is a subtle clue; later hints are more focused. NEVER reveal the culprit's name in any hint.
   - The "explanation" in the solution must explicitly reference at least one incriminating clue by its exact ID (e.g. c1) or exact title.
6. ZERO UNRELATED CONTENT:
   - Output ONLY the valid JSON object conforming strictly to the responseSchema without extraneous commentary, conversational filler, or formatting deviations.

<USER_PREMISE>
"""${premise.replace(/"/g, '\\"')}"""
</USER_PREMISE>

Generate the complete JSON response conforming strictly to the requested schema.`;
}

// ─── Data Normalizer ──────────────────────────────────────────────────────────

function normalizeGeneratedData(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const data = { ...parsed };

  if (Array.isArray(data.clues)) {
    data.clues = data.clues.map((c) => {
      let pointsTo = c.pointsTo;
      if (pointsTo === 'null' || pointsTo === '' || pointsTo === undefined) {
        pointsTo = null;
      }
      return { ...c, pointsTo };
    });
  }

  if (Array.isArray(data.hints)) {
    data.hints = data.hints.map((h, i) => ({
      ...h,
      index: typeof h.index === 'number' ? h.index : i + 1
    }));
  }

  return data;
}

// ─── Error Classifier ─────────────────────────────────────────────────────────

/**
 * Extracts a numeric HTTP status and classifies the error type reliably.
 *
 * @param {Error|any} err
 * @returns {{ httpStatus: number|null, isRetryable: boolean, skipModel: boolean, label: string }}
 */
function classifyError(err) {
  let httpStatus = null;

  // 1. Check direct status code on SDK ApiError or standard response
  if (typeof err?.status === 'number') {
    httpStatus = err.status;
  } else if (typeof err?.statusCode === 'number') {
    httpStatus = err.statusCode;
  } else if (typeof err?.response?.status === 'number') {
    httpStatus = err.response.status;
  }

  const msg = err?.message || String(err || '');

  // 2. Parse from JSON string embedded in error message if not present
  if (!httpStatus) {
    const jsonMatch = msg.match(/"code"\s*:\s*(\d+)/);
    if (jsonMatch) {
      httpStatus = parseInt(jsonMatch[1], 10);
    }
  }

  // 3. Fallback string status inspection
  if (!httpStatus) {
    const plain = msg.match(/\b(4\d{2}|5\d{2})\b/);
    if (plain) {
      httpStatus = parseInt(plain[1], 10);
    }
  }

  // 4. Map gRPC/standard status keywords
  if (!httpStatus) {
    if (msg.includes('UNAVAILABLE')) {
      httpStatus = 503;
    } else if (msg.includes('NOT_FOUND')) {
      httpStatus = 404;
    } else if (msg.includes('RESOURCE_EXHAUSTED')) {
      httpStatus = 429;
    } else if (msg.includes('timed out') || msg.includes('timeout') || err?.name === 'TimeoutError') {
      httpStatus = 504;
    }
  }

  const isRetryable = httpStatus !== null && RETRYABLE_HTTP_STATUS_CODES.has(httpStatus);
  const skipModel   = httpStatus !== null && FATAL_HTTP_STATUS_CODES.has(httpStatus);

  const statusLabel = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'MODEL_NOT_FOUND',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };

  let label = statusLabel[httpStatus] || 'UNKNOWN_ERROR';
  if (httpStatus === null) {
    if (msg.includes('validation') || msg.includes('Schema')) label = 'VALIDATION_ERROR';
    else if (msg.includes('JSON') || msg.includes('parse'))   label = 'JSON_PARSE_ERROR';
    else if (msg.includes('Empty response'))                  label = 'EMPTY_RESPONSE';
  }

  return { httpStatus, isRetryable, skipModel, label };
}

// ─── Exponential Backoff with Jitter ──────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoffMs(attempt) {
  const { baseBackoffMs, maxBackoffMs, jitterFactor } = AI_RETRY_CONFIG;
  const exponential = baseBackoffMs * Math.pow(2, attempt - 1);
  const capped = Math.min(exponential, maxBackoffMs);
  const jitter = (Math.random() - 0.5) * 2 * (capped * jitterFactor);
  return Math.max(500, Math.round(capped + jitter));
}

// ─── Single API Call with AbortSignal Timeout ────────────────────────────────

async function callGeminiOnce(model, prompt) {
  // Use AbortSignal.timeout to cancel network socket cleanly without leaking
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error(`Gemini call timed out after ${AI_RETRY_CONFIG.timeoutMs / 1000}s`));
  }, AI_RETRY_CONFIG.timeoutMs);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: geminiResponseSchema,
        temperature: 0.75,
        abortSignal: abortController.signal
      }
    });

    const text = response.text;
    if (!text || text.trim() === '') {
      throw new Error('Empty response received from Gemini API');
    }
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Per-Model Retry Loop ─────────────────────────────────────────────────────

async function tryModel(model, prompt, difficulty) {
  let lastErr = null;
  const maxAttempts = AI_RETRY_CONFIG.maxRetriesPerModel;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`[Gemini] Attempt ${attempt}/${maxAttempts} with model=${model}`);

    try {
      const rawText = await callGeminiOnce(model, prompt);

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`JSON parse failed: ${parseErr.message}`);
      }

      const normalized = normalizeGeneratedData(parsed);
      const { data }   = validateGeneratedMystery(normalized, difficulty);

      logger.info(`[Gemini] Mystery generated successfully using model=${model}`);
      return data;

    } catch (err) {
      lastErr = err;
      const { httpStatus, isRetryable, skipModel, label } = classifyError(err);

      logger.warn(`[Gemini] Failure on model=${model} (attempt ${attempt}/${maxAttempts}): ${label} (HTTP ${httpStatus ?? 'n/a'})`, {
        error: err.message
      });

      // Fatal error for this model (404/401/403/400) — switch model immediately
      if (skipModel) {
        logger.warn(`[Gemini] Skipping model=${model} due to permanent error status (${label}).`);
        throw { skipModel: true, lastErr };
      }

      // Retryable error and attempts remain
      if (isRetryable && attempt < maxAttempts) {
        const wait = calculateBackoffMs(attempt);
        logger.info(`[Gemini] Transient error (${label}) — backing off for ${wait}ms before retry ${attempt + 1}...`);
        await sleep(wait);
        continue;
      }

      // Non-HTTP logic or parse error
      if (!isRetryable && attempt < maxAttempts) {
        logger.info(`[Gemini] Non-HTTP error (${label}) — retrying generation in 1500ms...`);
        await sleep(1500);
        continue;
      }

      // Attempts exhausted
      logger.warn(`[Gemini] Retries exhausted for model=${model}`);
      throw { skipModel: false, lastErr };
    }
  }

  throw { skipModel: false, lastErr: lastErr || new Error('Unknown error during generation') };
}

// ─── Main Public Generation Function ──────────────────────────────────────────

/**
 * Generates a complete mystery with automatic model fallback + exponential backoff.
 *
 * @param {string} premise
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {Promise<object>} Validated mystery data
 */
export async function generateMystery(premise, difficulty) {
  const prompt = buildPrompt(premise, difficulty);
  const failureLog = [];

  logger.info(`[Gemini] Commencing mystery generation | difficulty=${difficulty} | models=${MODEL_FALLBACK_LIST.join(' -> ')}`);

  for (const model of MODEL_FALLBACK_LIST) {
    try {
      const data = await tryModel(model, prompt, difficulty);
      return data;
    } catch (thrown) {
      const skipModel = thrown?.skipModel ?? false;
      const lastErr   = thrown?.lastErr   ?? thrown;
      failureLog.push(`${model}: ${lastErr?.message?.slice(0, 100) || 'Unknown error'}`);

      logger.warn(`[Gemini] ${skipModel ? 'Permanent failure' : 'Retries exhausted'} on ${model}. Moving to next model in fallback list.`);
    }
  }

  // All models exhausted — return a safe, sanitized operational error
  logger.error(`[Gemini] All fallback models failed to generate valid mystery:\n  ${failureLog.join('\n  ')}`);

  throw new AppError(
    502,
    'GENERATION_FAILED',
    'The detective AI is currently experiencing high load. Please try again in a few moments.'
  );
}

export default { generateMystery };
