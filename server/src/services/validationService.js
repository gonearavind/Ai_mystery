import { z } from 'zod';

export const DIFFICULTY_CONFIG = {
  easy: { suspects: 3, clues: 5, hints: 2, minIncriminating: 2 },
  medium: { suspects: 4, clues: 7, hints: 3, minIncriminating: 3 },
  hard: { suspects: 5, clues: 9, hints: 3, minIncriminating: 4 }
};

export const generatedMysteryZodSchema = z.object({
  title: z.string().trim().min(3).max(120),
  story: z.string().trim().min(50).max(4000),
  suspects: z.array(
    z.object({
      id: z.string().trim().min(2).max(10),
      name: z.string().trim().min(2).max(100),
      role: z.string().trim().min(2).max(100),
      description: z.string().trim().min(5).max(1000),
      relationship: z.string().trim().min(2).max(500),
      alibi: z.string().trim().min(2).max(1000)
    })
  ),
  clues: z.array(
    z.object({
      id: z.string().trim().min(2).max(10),
      title: z.string().trim().min(2).max(100),
      description: z.string().trim().min(5).max(1000),
      location: z.string().trim().min(2).max(100),
      type: z.enum(['incriminating', 'exonerating', 'red_herring', 'neutral']),
      pointsTo: z.string().trim().nullable()
    })
  ),
  hints: z.array(
    z.object({
      index: z.number().int().positive(),
      text: z.string().trim().min(5).max(1000)
    })
  ),
  solution: z.object({
    culpritId: z.string().trim().min(2).max(10),
    motive: z.string().trim().min(5).max(1000),
    method: z.string().trim().min(5).max(1000),
    explanation: z.string().trim().min(10).max(3000)
  })
});

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validates generated mystery data against all 8 SPEC requirements.
 *
 * @param {object} rawData
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ valid: boolean, data: object }}
 * @throws {Error} If any validation check fails
 */
export function validateGeneratedMystery(rawData, difficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty level: '${difficulty}'. Must be easy, medium, or hard.`);
  }

  // 1. Zod schema validation: valid JSON matching schema, non-empty strings within limits
  const zodResult = generatedMysteryZodSchema.safeParse(rawData);
  if (!zodResult.success) {
    const errorDetails = zodResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Schema validation error: ${errorDetails}`);
  }

  const data = zodResult.data;

  // 2. Exact counts matching difficulty table
  if (data.suspects.length !== config.suspects) {
    throw new Error(
      `Invalid suspect count for difficulty '${difficulty}': expected ${config.suspects}, got ${data.suspects.length}`
    );
  }
  if (data.clues.length !== config.clues) {
    throw new Error(
      `Invalid clue count for difficulty '${difficulty}': expected ${config.clues}, got ${data.clues.length}`
    );
  }
  if (data.hints.length !== config.hints) {
    throw new Error(
      `Invalid hint count for difficulty '${difficulty}': expected ${config.hints}, got ${data.hints.length}`
    );
  }

  // 3. Unique IDs: s1..sN, c1..cN; hint indexes 1..M in order
  for (let i = 0; i < config.suspects; i++) {
    const expectedId = `s${i + 1}`;
    if (data.suspects[i].id !== expectedId) {
      throw new Error(`Suspect at index ${i} has ID '${data.suspects[i].id}', expected '${expectedId}'`);
    }
  }

  for (let i = 0; i < config.clues; i++) {
    const expectedId = `c${i + 1}`;
    if (data.clues[i].id !== expectedId) {
      throw new Error(`Clue at index ${i} has ID '${data.clues[i].id}', expected '${expectedId}'`);
    }
  }

  for (let i = 0; i < config.hints; i++) {
    const expectedIndex = i + 1;
    if (data.hints[i].index !== expectedIndex) {
      throw new Error(`Hint at index ${i} has index ${data.hints[i].index}, expected ${expectedIndex}`);
    }
  }

  // 4. culpritId matches exactly one suspect
  const culprit = data.suspects.find((s) => s.id === data.solution.culpritId);
  if (!culprit) {
    throw new Error(`solution.culpritId '${data.solution.culpritId}' does not match any suspect ID.`);
  }

  // 5. Every clue pointsTo is null or valid suspect id
  const validSuspectIds = new Set(data.suspects.map((s) => s.id));
  for (const clue of data.clues) {
    if (clue.pointsTo !== null && !validSuspectIds.has(clue.pointsTo)) {
      throw new Error(`Clue '${clue.id}' pointsTo invalid suspect ID '${clue.pointsTo}'`);
    }
  }

  // 6. Logical consistency:
  // - at least minIncriminating incriminating clues point to culprit
  const incriminatingCulpritClues = data.clues.filter(
    (c) => c.type === 'incriminating' && c.pointsTo === data.solution.culpritId
  );
  if (incriminatingCulpritClues.length < config.minIncriminating) {
    throw new Error(
      `Difficulty '${difficulty}' requires at least ${config.minIncriminating} incriminating clues pointing to culprit, found ${incriminatingCulpritClues.length}`
    );
  }

  // - at least one exonerating or red_herring for medium and hard
  if (difficulty === 'medium' || difficulty === 'hard') {
    const hasMisdirection = data.clues.some((c) => c.type === 'exonerating' || c.type === 'red_herring');
    if (!hasMisdirection) {
      throw new Error(`Difficulty '${difficulty}' requires at least one exonerating or red_herring clue.`);
    }
  }

  // - no incriminating clue points to a non-culprit unless typed red_herring
  const misleadingIncriminating = data.clues.find(
    (c) => c.type === 'incriminating' && c.pointsTo !== data.solution.culpritId
  );
  if (misleadingIncriminating) {
    throw new Error(
      `Clue '${misleadingIncriminating.id}' is typed 'incriminating' but points to non-culprit '${misleadingIncriminating.pointsTo}'. It must be typed 'red_herring'.`
    );
  }

  // 7. Culprit name NOT in story or hints
  const culpritName = culprit.name.trim();
  const fullNameRegex = new RegExp(`\\b${escapeRegex(culpritName)}\\b`, 'i');
  if (fullNameRegex.test(data.story)) {
    throw new Error(`Culprit name '${culpritName}' appears in the story text.`);
  }

  const titlesToIgnore = new Set(['lord', 'lady', 'sir', 'dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'miss', 'madam', 'count', 'countess']);
  const nameParts = culpritName
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !titlesToIgnore.has(p.toLowerCase()));

  for (const hint of data.hints) {
    if (fullNameRegex.test(hint.text)) {
      throw new Error(`Culprit name '${culpritName}' appears in hint #${hint.index}`);
    }
    for (const part of nameParts) {
      const partRegex = new RegExp(`\\b${escapeRegex(part)}\\b`, 'i');
      if (partRegex.test(hint.text)) {
        throw new Error(`Culprit name component '${part}' appears in hint #${hint.index}`);
      }
    }
  }

  // 8. Explanation references at least one incriminating clue by title or id
  const explanationLower = data.solution.explanation.toLowerCase();
  const referencesIncriminatingClue = incriminatingCulpritClues.some((c) => {
    const idFound = explanationLower.includes(c.id.toLowerCase());
    const titleFound = explanationLower.includes(c.title.toLowerCase().trim());
    return idFound || titleFound;
  });

  if (!referencesIncriminatingClue) {
    throw new Error('Solution explanation must reference at least one incriminating clue by title or id.');
  }

  return { valid: true, data };
}

export default validateGeneratedMystery;
