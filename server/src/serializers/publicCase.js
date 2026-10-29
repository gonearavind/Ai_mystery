import { computeScorePreview } from '../services/scoringService.js';

/**
 * Serializes a Case document to the public case view.
 * Guarantees that no secret fields (solution, clue.pointsTo, clue.type,
 * undiscovered clue title/description, unrevealed hints) are leaked to the client.
 *
 * @param {object} caseDoc
 * @returns {object}
 */
export function toPublicCase(caseDoc) {
  if (!caseDoc) return null;

  const doc = typeof caseDoc.toObject === 'function' ? caseDoc.toObject() : caseDoc;

  const id = (doc._id || doc.id)?.toString();

  const suspects = (doc.suspects || []).map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    description: s.description,
    relationship: s.relationship,
    alibi: s.alibi
  }));

  const clues = (doc.clues || []).map((c) => {
    if (c.discovered) {
      return {
        id: c.id,
        location: c.location,
        discovered: true,
        title: c.title,
        description: c.description
      };
    }
    return {
      id: c.id,
      location: c.location,
      discovered: false
    };
  });

  const hints = (doc.hints || [])
    .filter((h) => h.revealed)
    .sort((a, b) => a.index - b.index)
    .map((h) => ({
      index: h.index,
      text: h.text
    }));

  const cluesDiscovered = doc.progress?.cluesDiscovered ?? clues.filter((c) => c.discovered).length;
  const cluesTotal = clues.length;
  const hintsUsed = doc.progress?.hintsUsed ?? hints.length;
  const hintsTotal = (doc.hints || []).length;

  const progress = {
    cluesDiscovered,
    cluesTotal,
    hintsUsed,
    hintsTotal
  };

  const scorePreview = computeScorePreview(cluesDiscovered, hintsUsed);

  return {
    id,
    title: doc.title,
    premise: doc.premise,
    difficulty: doc.difficulty,
    story: doc.story,
    status: doc.status,
    suspects,
    clues,
    hints,
    progress,
    scorePreview,
    createdAt: doc.createdAt
  };
}

export default toPublicCase;
