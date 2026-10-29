/**
 * Serializes a completed Case document into the full result object.
 *
 * @param {object} caseDoc
 * @returns {object}
 */
export function toResult(caseDoc) {
  if (!caseDoc) return null;

  const doc = typeof caseDoc.toObject === 'function' ? caseDoc.toObject() : caseDoc;

  const caseId = (doc._id || doc.id)?.toString();
  const culpritId = doc.solution?.culpritId;
  const culpritSuspect = (doc.suspects || []).find((s) => s.id === culpritId);

  const clues = (doc.clues || []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    location: c.location,
    discovered: Boolean(c.discovered),
    pointsTo: c.pointsTo ?? null
  }));

  return {
    caseId,
    correct: Boolean(doc.accusation?.correct),
    accusedSuspectId: doc.accusation?.suspectId || null,
    culprit: {
      id: culpritId,
      name: culpritSuspect?.name || 'Unknown'
    },
    explanation: doc.solution?.explanation || '',
    motive: doc.solution?.motive || '',
    clues,
    score: {
      base: doc.score?.base ?? 0,
      cluePoints: doc.score?.cluePoints ?? 0,
      hintPenalty: doc.score?.hintPenalty ?? 0,
      total: doc.score?.total ?? 0
    },
    difficulty: doc.difficulty
  };
}

export default toResult;
