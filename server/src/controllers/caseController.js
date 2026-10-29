import mongoose from 'mongoose';
import { Case } from '../models/Case.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateMystery } from '../services/geminiService.js';
import { computeScore, computeScorePreview } from '../services/scoringService.js';
import { toPublicCase } from '../serializers/publicCase.js';
import { toResult } from '../serializers/result.js';
import logger from '../utils/logger.js';

function validateObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, 'NOT_FOUND', 'Case not found');
  }
}

/**
 * POST /api/cases
 * Generate a new mystery and persist to MongoDB.
 */
export async function createCase(req, res, next) {
  try {
    const { premise, difficulty } = req.body;

    logger.info(`[CaseController] Creating new case | difficulty=${difficulty}`);
    const generated = await generateMystery(premise, difficulty);

    const newCase = new Case({
      title: generated.title,
      premise,
      difficulty,
      story: generated.story,
      suspects: generated.suspects,
      clues: generated.clues.map((c) => ({
        ...c,
        discovered: false,
        discoveredAt: null
      })),
      hints: generated.hints.map((h) => ({
        ...h,
        revealed: false
      })),
      solution: generated.solution,
      progress: {
        cluesDiscovered: 0,
        hintsUsed: 0
      },
      status: 'active'
    });

    await newCase.save();
    logger.info(`[CaseController] Case created successfully | id=${newCase._id}`);

    res.status(201).json(toPublicCase(newCase));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/cases/:id
 * Retrieve sanitized public case view.
 */
export async function getCase(req, res, next) {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError(404, 'NOT_FOUND', 'Case not found');
    }

    res.status(200).json(toPublicCase(caseDoc));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cases/:id/clues/:clueId/discover
 * Discover a specific clue by ID.
 */
export async function discoverClue(req, res, next) {
  try {
    const { id, clueId } = req.params;
    validateObjectId(id);

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError(404, 'NOT_FOUND', 'Case not found');
    }

    if (caseDoc.status === 'completed') {
      throw new AppError(409, 'CONFLICT', 'Case is already completed');
    }

    const clue = caseDoc.clues.find((c) => c.id === clueId);
    if (!clue) {
      throw new AppError(404, 'NOT_FOUND', 'Clue not found');
    }

    if (clue.discovered) {
      throw new AppError(409, 'CONFLICT', 'Clue has already been discovered');
    }

    clue.discovered = true;
    clue.discoveredAt = new Date();
    caseDoc.progress.cluesDiscovered = caseDoc.clues.filter((c) => c.discovered).length;

    await caseDoc.save();

    const scorePreview = computeScorePreview(
      caseDoc.progress.cluesDiscovered,
      caseDoc.progress.hintsUsed
    );

    logger.info(`[CaseController] Clue discovered: id=${clueId} on case=${id}`);

    res.status(200).json({
      clue: {
        id: clue.id,
        title: clue.title,
        description: clue.description,
        location: clue.location
      },
      progress: {
        cluesDiscovered: caseDoc.progress.cluesDiscovered,
        cluesTotal: caseDoc.clues.length,
        hintsUsed: caseDoc.progress.hintsUsed,
        hintsTotal: caseDoc.hints.length
      },
      scorePreview
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cases/:id/hints
 * Request progressive hint in order.
 */
export async function requestHint(req, res, next) {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError(404, 'NOT_FOUND', 'Case not found');
    }

    if (caseDoc.status === 'completed') {
      throw new AppError(409, 'CONFLICT', 'Case is already completed');
    }

    // Find next unrevealed hint in ascending index order
    const nextHint = caseDoc.hints
      .slice()
      .sort((a, b) => a.index - b.index)
      .find((h) => !h.revealed);

    if (!nextHint) {
      throw new AppError(409, 'CONFLICT', 'No hints remaining');
    }

    nextHint.revealed = true;
    caseDoc.progress.hintsUsed = caseDoc.hints.filter((h) => h.revealed).length;

    await caseDoc.save();

    const scorePreview = computeScorePreview(
      caseDoc.progress.cluesDiscovered,
      caseDoc.progress.hintsUsed
    );

    logger.info(`[CaseController] Hint revealed: index=${nextHint.index} on case=${id}`);

    res.status(200).json({
      hint: {
        index: nextHint.index,
        text: nextHint.text
      },
      progress: {
        cluesDiscovered: caseDoc.progress.cluesDiscovered,
        cluesTotal: caseDoc.clues.length,
        hintsUsed: caseDoc.progress.hintsUsed,
        hintsTotal: caseDoc.hints.length
      },
      scorePreview
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cases/:id/accuse
 * Submit final accusation.
 */
export async function accuseCase(req, res, next) {
  try {
    const { id } = req.params;
    const { suspectId } = req.body;
    validateObjectId(id);

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError(404, 'NOT_FOUND', 'Case not found');
    }

    if (caseDoc.status === 'completed' || caseDoc.accusation) {
      throw new AppError(409, 'CONFLICT', 'Case has already been accused');
    }

    const suspect = caseDoc.suspects.find((s) => s.id === suspectId);
    if (!suspect) {
      throw new AppError(400, 'VALIDATION_ERROR', `Suspect '${suspectId}' does not exist on this case.`);
    }

    const correct = suspectId === caseDoc.solution.culpritId;
    const score = computeScore(
      caseDoc.difficulty,
      correct,
      caseDoc.progress.cluesDiscovered,
      caseDoc.progress.hintsUsed
    );

    caseDoc.status = 'completed';
    caseDoc.accusation = {
      suspectId,
      correct,
      accusedAt: new Date()
    };
    caseDoc.score = score;

    await caseDoc.save();

    logger.info(`[CaseController] Accusation solved on case=${id} | suspectId=${suspectId} | correct=${correct} | score=${score.total}`);

    res.status(200).json(toResult(caseDoc));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/cases/:id/result
 * Retrieve completed results.
 */
export async function getResult(req, res, next) {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError(404, 'NOT_FOUND', 'Case not found');
    }

    if (caseDoc.status !== 'completed' || !caseDoc.accusation) {
      throw new AppError(409, 'CONFLICT', 'Case has not been solved yet');
    }

    res.status(200).json(toResult(caseDoc));
  } catch (err) {
    next(err);
  }
}

export default {
  createCase,
  getCase,
  discoverClue,
  requestHint,
  accuseCase,
  getResult
};
