/**
 * Test script for AI Mystery Room backend
 * Tests: scoring, serializer security, and validation logic
 * Run: node test-backend.js
 */

import 'dotenv/config';

// ===================== TEST SCORING =====================
import { computeScore, computeScorePreview } from './src/services/scoringService.js';

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

console.log('\n=== SCORING TESTS ===');

// Correct accusation
const easyCorrect = computeScore('easy', true, 5, 0);
assert(easyCorrect.base === 100, 'Easy correct base = 100');
assert(easyCorrect.cluePoints === 25, 'Easy 5 clues = 25 pts');
assert(easyCorrect.hintPenalty === 0, 'No hints = 0 penalty');
assert(easyCorrect.total === 125, 'Easy correct 5 clues 0 hints total = 125');

const medCorrect = computeScore('medium', true, 7, 2);
assert(medCorrect.base === 150, 'Medium correct base = 150');
assert(medCorrect.cluePoints === 35, 'Medium 7 clues = 35 pts');
assert(medCorrect.hintPenalty === -20, 'Medium 2 hints = -20');
assert(medCorrect.total === 165, 'Medium correct 7 clues 2 hints total = 165');

const hardCorrect = computeScore('hard', true, 9, 3);
assert(hardCorrect.base === 200, 'Hard correct base = 200');
assert(hardCorrect.cluePoints === 45, 'Hard 9 clues = 45 pts');
assert(hardCorrect.hintPenalty === -30, 'Hard 3 hints = -30');
assert(hardCorrect.total === 215, 'Hard correct 9 clues 3 hints total = 215');

// Incorrect accusation
const incorrectScore = computeScore('medium', false, 5, 2);
assert(incorrectScore.base === 0, 'Incorrect base = 0');
assert(incorrectScore.total === Math.max(0, 25 - 20), 'Incorrect total = max(0, 25-20) = 5');

// Minimum 0
const zeroScore = computeScore('easy', false, 0, 2);
assert(zeroScore.total === 0, 'Minimum score is 0 (negative clamped)');

// Score preview
const preview = computeScorePreview(3, 1);
assert(preview === Math.max(0, 15 - 10), 'Score preview 3 clues 1 hint = 5');

const previewZero = computeScorePreview(0, 2);
assert(previewZero === 0, 'Score preview 0 clues 2 hints = 0 (clamped)');

// ===================== TEST SERIALIZER SECURITY =====================
console.log('\n=== SERIALIZER SECURITY TESTS ===');

import { toPublicCase } from './src/services/../serializers/publicCase.js';
import { toResult } from './src/services/../serializers/result.js';

// Mock case document
const mockCase = {
  _id: '665f1234567890abcdef1234',
  title: 'Test Mystery',
  premise: 'A test premise',
  difficulty: 'medium',
  story: 'The story...',
  status: 'active',
  suspects: [
    { id: 's1', name: 'Alice', role: 'Maid', description: 'Quiet', relationship: 'Staff', alibi: 'Was cleaning' },
    { id: 's2', name: 'Bob', role: 'Butler', description: 'Formal', relationship: 'Staff', alibi: 'Was serving' },
    { id: 's3', name: 'Carol', role: 'Guest', description: 'Nervous', relationship: 'Friend', alibi: 'Was sleeping' },
    { id: 's4', name: 'Dave', role: 'Gardener', description: 'Strong', relationship: 'Employee', alibi: 'Was outside' },
  ],
  clues: [
    { id: 'c1', title: 'Muddy Boot', description: 'Left near the door', location: 'Hallway', pointsTo: 's2', type: 'incriminating', discovered: true, discoveredAt: new Date() },
    { id: 'c2', title: 'Secret Note', description: 'Hidden in drawer', location: 'Study', pointsTo: 's2', type: 'incriminating', discovered: false },
    { id: 'c3', title: 'Alibi Receipt', description: 'Shows elsewhere', location: 'Kitchen', pointsTo: 's1', type: 'exonerating', discovered: false },
  ],
  hints: [
    { index: 1, text: 'Someone was seen near the study', revealed: true },
    { index: 2, text: 'Check the window latch', revealed: false },
    { index: 3, text: 'The gardener was in a different wing', revealed: false },
  ],
  solution: {
    culpritId: 's2',
    motive: 'Jealousy',
    method: 'Poison',
    explanation: 'Bob did it with the Muddy Boot (c1)'
  },
  progress: { cluesDiscovered: 1, hintsUsed: 1 },
  accusation: null,
  score: null,
  createdAt: new Date(),
  toObject() { return this; }
};

const publicView = toPublicCase(mockCase);

// Must NOT contain secrets
assert(!publicView.solution, 'Public view has no solution field');
assert(!JSON.stringify(publicView).includes('"culpritId"'), 'Public view has no culpritId');
assert(!JSON.stringify(publicView).includes('"motive"'), 'Public view has no motive');
assert(!JSON.stringify(publicView).includes('"method"'), 'Public view has no method');
assert(!JSON.stringify(publicView).includes('"explanation"'), 'Public view has no explanation field');

// Clue security
const publicClues = publicView.clues;
const discoveredClue = publicClues.find(c => c.id === 'c1');
const undiscoveredClue = publicClues.find(c => c.id === 'c2');

assert(discoveredClue && discoveredClue.title, 'Discovered clue shows title');
assert(discoveredClue && discoveredClue.description, 'Discovered clue shows description');
assert(!discoveredClue?.pointsTo, 'Discovered clue has NO pointsTo');
assert(!discoveredClue?.type, 'Discovered clue has NO type');
assert(undiscoveredClue && undiscoveredClue.discovered === false, 'Undiscovered clue shows discovered=false');
assert(!undiscoveredClue?.title, 'Undiscovered clue has NO title');
assert(!undiscoveredClue?.description, 'Undiscovered clue has NO description');
assert(!undiscoveredClue?.pointsTo, 'Undiscovered clue has NO pointsTo');
assert(!undiscoveredClue?.type, 'Undiscovered clue has NO type');

// Hints security - only revealed hint shown
assert(publicView.hints.length === 1, 'Only 1 revealed hint shown');
assert(publicView.hints[0].index === 1, 'Shown hint is index 1');
assert(!publicView.hints.find(h => h.index === 2), 'Unrevealed hint 2 NOT shown');
assert(!publicView.hints.find(h => h.index === 3), 'Unrevealed hint 3 NOT shown');

// Progress and scorePreview
assert(publicView.progress.cluesDiscovered === 1, 'Progress cluesDiscovered correct');
assert(publicView.progress.hintsUsed === 1, 'Progress hintsUsed correct');
assert(typeof publicView.scorePreview === 'number', 'scorePreview is a number');
assert(publicView.scorePreview === Math.max(0, 5*1 - 10*1), 'scorePreview = max(0, 5-10) = 0');

// Test toResult (post-accusation)
const completedCase = {
  ...mockCase,
  status: 'completed',
  accusation: { suspectId: 's2', correct: true, accusedAt: new Date() },
  score: { base: 150, cluePoints: 5, hintPenalty: -10, total: 145 },
  toObject() { return this; }
};

const resultView = toResult(completedCase);
assert(resultView.correct === true, 'Result shows correct=true');
assert(resultView.culprit?.id === 's2', 'Result shows culprit id');
assert(resultView.culprit?.name === 'Bob', 'Result shows culprit name');
assert(resultView.motive === 'Jealousy', 'Result shows motive');
assert(resultView.explanation.includes('Bob'), 'Result shows explanation');
assert(Array.isArray(resultView.clues), 'Result shows ALL clues');
assert(resultView.clues.every(c => c.pointsTo !== undefined || c.pointsTo === null), 'Result clues have pointsTo');
assert(resultView.score.total === 145, 'Result score total correct');

// ===================== TEST VALIDATION SERVICE =====================
console.log('\n=== VALIDATION SERVICE TESTS ===');

import { validateGeneratedMystery } from './src/services/validationService.js';

const validEasyMystery = {
  title: 'The Missing Heirloom',
  story: 'A priceless ring went missing from the manor house during the dinner party. Three guests were present when the theft occurred. The butler discovered the empty display case at midnight. All three suspects deny any knowledge of the incident.',
  suspects: [
    { id: 's1', name: 'Lord Whitmore', role: 'Host', description: 'Elderly gentleman', relationship: 'Owner', alibi: 'Was in study' },
    { id: 's2', name: 'Lady Gray', role: 'Guest', description: 'Elegant woman', relationship: 'Friend', alibi: 'Was in garden' },
    { id: 's3', name: 'Dr. Marsh', role: 'Physician', description: 'Quiet man', relationship: 'Doctor', alibi: 'Was reading' },
  ],
  clues: [
    { id: 'c1', title: 'Torn Glove Fragment', description: 'Found near display case', location: 'Drawing room', type: 'incriminating', pointsTo: 's2' },
    { id: 'c2', title: 'Muddy Footprints', description: 'From garden direction', location: 'Hallway', type: 'incriminating', pointsTo: 's2' },
    { id: 'c3', title: 'Alibi Letter', description: 'Confirms Lord was in study', location: 'Study desk', type: 'exonerating', pointsTo: 's1' },
    { id: 'c4', title: 'Missing Candle', description: 'Light source removed', location: 'Display room', type: 'neutral', pointsTo: null },
    { id: 'c5', title: 'Hidden Pocket', description: 'Sewn into guest coat', location: 'Cloakroom', type: 'incriminating', pointsTo: 's2' },
  ],
  hints: [
    { index: 1, text: 'Someone was in the garden when the rain fell.' },
    { index: 2, text: 'Look carefully at what was left behind near the display case.' },
  ],
  solution: {
    culpritId: 's2',
    motive: 'Financial desperation',
    method: 'Sleight of hand during distraction',
    explanation: 'Lady Gray committed the theft. The Torn Glove Fragment (c1) and Muddy Footprints match her shoes and path from the garden.'
  }
};

try {
  const result = validateGeneratedMystery(validEasyMystery, 'easy');
  assert(result.valid === true, 'Valid easy mystery passes validation');
} catch (e) {
  assert(false, 'Valid easy mystery passes validation', e.message);
}

// Test wrong count rejection
const badCount = { ...validEasyMystery, suspects: validEasyMystery.suspects.slice(0, 2) };
try {
  validateGeneratedMystery(badCount, 'easy');
  assert(false, 'Wrong suspect count is rejected');
} catch (e) {
  assert(e.message.includes('suspect count'), 'Wrong suspect count gives correct error', e.message);
}

// Test culprit in story rejection
const culpritInStory = { ...validEasyMystery, story: 'Lady Gray stole the ring.' };
try {
  validateGeneratedMystery(culpritInStory, 'easy');
  assert(false, 'Culprit name in story is rejected');
} catch (e) {
  assert(e.message.includes('story'), 'Culprit name in story gives correct error', e.message);
}

// Test culprit in hint rejection  
const culpritInHint = {
  ...validEasyMystery,
  hints: [
    { index: 1, text: 'Lady Gray was seen near the display case.' },
    { index: 2, text: 'Check the garden path.' },
  ]
};
try {
  validateGeneratedMystery(culpritInHint, 'easy');
  assert(false, 'Culprit name in hint is rejected');
} catch (e) {
  assert(e.message.includes('hint'), 'Culprit name in hint gives correct error', e.message);
}

// Test bad culpritId rejection
const badCulprit = { ...validEasyMystery, solution: { ...validEasyMystery.solution, culpritId: 's9' } };
try {
  validateGeneratedMystery(badCulprit, 'easy');
  assert(false, 'Invalid culpritId is rejected');
} catch (e) {
  assert(e.message.includes('culpritId'), 'Invalid culpritId gives correct error', e.message);
}

// ===================== RESULTS =====================
console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
}
