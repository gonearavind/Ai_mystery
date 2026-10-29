import { Router } from 'express';
import { z } from 'zod';
import {
  createCase,
  getCase,
  discoverClue,
  requestHint,
  accuseCase,
  getResult
} from '../controllers/caseController.js';
import { validate } from '../middleware/validate.js';
import { caseCreationRateLimit } from '../middleware/rateLimit.js';

const router = Router();

const createCaseSchema = z.object({
  premise: z
    .string({ required_error: 'Premise is required' })
    .trim()
    .min(10, 'Premise must be 10-500 characters.')
    .max(500, 'Premise must be 10-500 characters.'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: "Difficulty must be 'easy', 'medium', or 'hard'." })
  })
});

const accuseCaseSchema = z.object({
  suspectId: z
    .string({ required_error: 'Suspect ID is required' })
    .trim()
    .min(1, 'Suspect ID is required.')
});

// 1. POST /api/cases - create mystery
router.post('/', caseCreationRateLimit, validate(createCaseSchema), createCase);

// 2. GET /api/cases/:id - public case view
router.get('/:id', getCase);

// 3. POST /api/cases/:id/clues/:clueId/discover - discover clue
router.post('/:id/clues/:clueId/discover', discoverClue);

// 4. POST /api/cases/:id/hints - request hint
router.post('/:id/hints', requestHint);

// 5. POST /api/cases/:id/accuse - submit accusation
router.post('/:id/accuse', validate(accuseCaseSchema), accuseCase);

// 6. GET /api/cases/:id/result - get result
router.get('/:id/result', getResult);

export default router;
