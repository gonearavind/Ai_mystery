import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, computeScorePreview, BASE_POINTS_BY_DIFFICULTY } from '../src/services/scoringService.js';
import { validateGeneratedMystery, DIFFICULTY_CONFIG } from '../src/services/validationService.js';
import { getModelFallbackChain, DEFAULT_PRIMARY_MODEL, RETRYABLE_HTTP_STATUS_CODES, FATAL_HTTP_STATUS_CODES } from '../src/config/aiConfig.js';

test('Scoring Service — computeScore calculations', () => {
  // Easy: Base 100
  const easyCorrect = computeScore('easy', true, 5, 1);
  assert.equal(easyCorrect.base, 100);
  assert.equal(easyCorrect.cluePoints, 25);
  assert.equal(easyCorrect.hintPenalty, -10);
  assert.equal(easyCorrect.total, 115);

  // Medium: Base 150
  const mediumCorrect = computeScore('medium', true, 7, 2);
  assert.equal(mediumCorrect.base, 150);
  assert.equal(mediumCorrect.cluePoints, 35);
  assert.equal(mediumCorrect.hintPenalty, -20);
  assert.equal(mediumCorrect.total, 165);

  // Hard: Base 200
  const hardCorrect = computeScore('hard', true, 9, 3);
  assert.equal(hardCorrect.base, 200);
  assert.equal(hardCorrect.cluePoints, 45);
  assert.equal(hardCorrect.hintPenalty, -30);
  assert.equal(hardCorrect.total, 215);

  // Incorrect accusation yields 0 base points
  const incorrect = computeScore('hard', false, 9, 0);
  assert.equal(incorrect.base, 0);
  assert.equal(incorrect.cluePoints, 45);
  assert.equal(incorrect.total, 45);

  // Score total should never be negative
  const penalized = computeScore('easy', false, 0, 5);
  assert.equal(penalized.total, 0);
});

test('Scoring Service — computeScorePreview calculations', () => {
  assert.equal(computeScorePreview(0, 0), 0);
  assert.equal(computeScorePreview(3, 1), 5); // 15 - 10 = 5
  assert.equal(computeScorePreview(1, 2), 0); // 5 - 20 = -15 -> capped at 0
});

test('AI Config — Fallback Chain and Retry Sets', () => {
  const chain = getModelFallbackChain('custom-model');
  assert.equal(chain[0], 'custom-model');
  assert.ok(chain.length >= 4);

  const defaultChain = getModelFallbackChain();
  assert.equal(defaultChain[0], DEFAULT_PRIMARY_MODEL);

  assert.ok(RETRYABLE_HTTP_STATUS_CODES.has(429));
  assert.ok(RETRYABLE_HTTP_STATUS_CODES.has(503));
  assert.ok(FATAL_HTTP_STATUS_CODES.has(404));
  assert.ok(FATAL_HTTP_STATUS_CODES.has(400));
});

test('Validation Service — Valid Mystery Spec', () => {
  const validEasyMystery = {
    title: 'The Stolen Diamond',
    story: 'At the prestigious estate on the foggy cliff, the famous diamond disappeared from the gallery vault.',
    suspects: [
      { id: 's1', name: 'Arthur Pendelton', role: 'Butler', description: 'Quiet and efficient.', relationship: 'Employed 20 years.', alibi: 'Polishing silver in pantry.' },
      { id: 's2', name: 'Beatrice Vane', role: 'Guest', description: 'Wealthy socialite.', relationship: 'Old friend of the host.', alibi: 'Reading in library.' },
      { id: 's3', name: 'Charles Thorne', role: 'Chauffeur', description: 'Experienced driver.', relationship: 'Recently hired.', alibi: 'Tuning the engine in garage.' }
    ],
    clues: [
      { id: 'c1', title: 'Torn Tweed Fabric', description: 'Found caught on the vault latch.', location: 'Vault door', type: 'incriminating', pointsTo: 's1' },
      { id: 'c2', title: 'Silver Polish Smudge', description: 'A trace of cream polish on safe dial.', location: 'Safe door', type: 'incriminating', pointsTo: 's1' },
      { id: 'c3', title: 'Pencil Sketch', description: 'A drawing of the garden.', location: 'Library desk', type: 'neutral', pointsTo: null },
      { id: 'c4', title: 'Car Keys', description: 'Keys left on the dashboard.', location: 'Garage', type: 'neutral', pointsTo: null },
      { id: 'c5', title: 'Muddy Glove', description: 'Belongs to Charles, found near shed.', location: 'Rose garden', type: 'neutral', pointsTo: null }
    ],
    hints: [
      { index: 1, text: 'Examine physical traces left directly on the locking mechanism.' },
      { index: 2, text: 'The residue on the safe points to household cleaning duties.' }
    ],
    solution: {
      culpritId: 's1',
      motive: 'Desperate to settle ancient debts before retirement.',
      method: 'Used his duplicate key during the evening storm.',
      explanation: 'Arthur was identified because the Torn Tweed Fabric (c1) matched his jacket and the Silver Polish Smudge confirmed his presence.'
    }
  };

  const result = validateGeneratedMystery(validEasyMystery, 'easy');
  assert.equal(result.valid, true);
  assert.equal(result.data.title, 'The Stolen Diamond');
});

test('Validation Service — Rejects when culprit name is in story', () => {
  const invalidStoryMystery = {
    title: 'The Stolen Diamond',
    story: 'Arthur Pendelton entered the room and was nervous as everyone talked and shouted in the hall.',
    suspects: [
      { id: 's1', name: 'Arthur Pendelton', role: 'Butler', description: 'Quiet person.', relationship: 'Employed 20 years.', alibi: 'Pantry room.' },
      { id: 's2', name: 'Beatrice Vane', role: 'Guest', description: 'Socialite lady.', relationship: 'Friend of host.', alibi: 'Library room.' },
      { id: 's3', name: 'Charles Thorne', role: 'Chauffeur', description: 'Driver person.', relationship: 'Hired driver.', alibi: 'Garage room.' }
    ],
    clues: [
      { id: 'c1', title: 'Clue 1 Title', description: 'Description 1', location: 'Location 1', type: 'incriminating', pointsTo: 's1' },
      { id: 'c2', title: 'Clue 2 Title', description: 'Description 2', location: 'Location 2', type: 'incriminating', pointsTo: 's1' },
      { id: 'c3', title: 'Clue 3 Title', description: 'Description 3', location: 'Location 3', type: 'neutral', pointsTo: null },
      { id: 'c4', title: 'Clue 4 Title', description: 'Description 4', location: 'Location 4', type: 'neutral', pointsTo: null },
      { id: 'c5', title: 'Clue 5 Title', description: 'Description 5', location: 'Location 5', type: 'neutral', pointsTo: null }
    ],
    hints: [
      { index: 1, text: 'Look closer at the scene.' },
      { index: 2, text: 'Examine safe latch.' }
    ],
    solution: {
      culpritId: 's1',
      motive: 'Mounting gambling debts.',
      method: 'Used duplicate key.',
      explanation: 'Found with Clue 1 Title.'
    }
  };

  assert.throws(() => {
    validateGeneratedMystery(invalidStoryMystery, 'easy');
  }, /Culprit name 'Arthur Pendelton' appears in the story text/);
});

test('Validation Service — Rejects when explanation lacks incriminating clue reference', () => {
  const invalidExplanationMystery = {
    title: 'The Stolen Diamond',
    story: 'At the prestigious estate on the foggy cliff, the famous diamond disappeared from the gallery vault.',
    suspects: [
      { id: 's1', name: 'Arthur Pendelton', role: 'Butler', description: 'Quiet and efficient.', relationship: 'Employed 20 years.', alibi: 'Polishing silver in pantry.' },
      { id: 's2', name: 'Beatrice Vane', role: 'Guest', description: 'Wealthy socialite.', relationship: 'Old friend of the host.', alibi: 'Reading in library.' },
      { id: 's3', name: 'Charles Thorne', role: 'Chauffeur', description: 'Experienced driver.', relationship: 'Recently hired.', alibi: 'Tuning the engine in garage.' }
    ],
    clues: [
      { id: 'c1', title: 'Torn Tweed Fabric', description: 'Found caught on the vault latch.', location: 'Vault door', type: 'incriminating', pointsTo: 's1' },
      { id: 'c2', title: 'Silver Polish Smudge', description: 'A trace of cream polish on safe dial.', location: 'Safe door', type: 'incriminating', pointsTo: 's1' },
      { id: 'c3', title: 'Pencil Sketch', description: 'A drawing of the garden.', location: 'Library desk', type: 'neutral', pointsTo: null },
      { id: 'c4', title: 'Car Keys', description: 'Keys left on the dashboard.', location: 'Garage', type: 'neutral', pointsTo: null },
      { id: 'c5', title: 'Muddy Glove', description: 'Belongs to Charles, found near shed.', location: 'Rose garden', type: 'neutral', pointsTo: null }
    ],
    hints: [
      { index: 1, text: 'Examine physical traces left directly on the locking mechanism.' },
      { index: 2, text: 'The residue on the safe points to household cleaning duties.' }
    ],
    solution: {
      culpritId: 's1',
      motive: 'Desperate to settle ancient debts before retirement.',
      method: 'Used his duplicate key during the evening storm.',
      explanation: 'The butler was clearly guilty because of general suspicion.' // Lacks clue title or ID
    }
  };

  assert.throws(() => {
    validateGeneratedMystery(invalidExplanationMystery, 'easy');
  }, /Solution explanation must reference at least one incriminating clue/);
});
