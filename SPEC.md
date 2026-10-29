# SPEC.md — AI Mystery Room

> Blueprint for the AI Mystery Room project. A developer or AI coding assistant (e.g. Codex) should be able to build the full app from this file without major clarification. Build incrementally, following Section 12 (Build Order).

---

## 1. Project Requirements

### 1.1 Overview and Problem Statement
**AI Mystery Room** is a web app where a player enters a mystery premise, picks a difficulty, and Gemini generates a complete whodunit: a story, suspects, discoverable clues, and progressive hints. The player investigates, collects clues, optionally uses hints, and finally accuses one suspect. The app then reveals the verdict, the culprit, a full explanation, and a score.

**Problem it solves:** Mystery games are usually static and replayable only once. Using an LLM gives unlimited, personalized mysteries, but this needs structured output, validation, and server-side secrecy of the solution so the game stays fair.

### 1.2 Target Users and Expected Experience
- Casual players who enjoy puzzle and detective games (no account needed).
- Students/judges evaluating the project on the live site.

Expected experience: a player can go from the home page to a finished mystery in about 5–15 minutes, on desktop or mobile, with clear loading and error feedback.

### 1.3 Features
**Core (required)**
- Generate a mystery from a premise + difficulty (Easy / Medium / Hard).
- Investigation room with story, suspect cards, clues, hints, and progress.
- Discover clues one by one (clue content hidden until discovered).
- Request progressive hints (limited per difficulty).
- Accuse a suspect; receive verdict, culprit, explanation, score.
- Start another mystery.
- Backend-calculated scoring and validation.

**Optional enhancements (only after all core features pass acceptance)**
- Resume an in-progress case via saved case ID in `localStorage`.
- Notes pad in the investigation room (client-side only).
- "Surprise me" premise button.
- Shareable result summary text.
- Dark/light theme toggle.

### 1.4 Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (MongoDB Atlas in production), Mongoose |
| AI | Gemini API via `@google/genai` |
| Validation | Zod (AI output and request bodies) |
| Hosting | Frontend on Vercel; backend on a Node host (e.g. Render); DB on MongoDB Atlas |

### 1.5 Limitations
- No user accounts or authentication; a case is accessed by its unguessable ID.
- Single-player only.
- One final accusation per case (no retries).
- Generated content quality depends on Gemini; invalid output is rejected and retried, never shown.
- Mystery content must be non-graphic and suitable for general audiences.
- Free-tier hosting may cause cold starts (first request may be slow).

### 1.6 Final Deliverables
1. Complete `SPEC.md` (this file).
2. GitHub repository with full source (`client/` and `server/`), a README with setup instructions, and **no committed secrets**.
3. Live deployed website URL.
4. A mystery created and solved on the deployed site (demonstrated before submission).

Submission form: https://bit.ly/ai-mystery-room-sub-form — **Deadline: 2 November, 11:59 PM.**

---

## 2. User Flow

1. User opens the website (Home).
2. User clicks **Start** and goes to Create Mystery.
3. User enters a premise and selects a difficulty.
4. Backend asks Gemini to generate the mystery, suspects, clues, and hints; the output is validated and saved.
5. User is taken to the Investigation Room for the new case.
6. User reads the story, reviews suspects, and discovers clues.
7. User requests hints if stuck (score penalty applies).
8. User opens the Accusation page and selects a suspect.
9. Backend evaluates the accusation and reveals the solution.
10. Results page shows verdict, culprit, explanation, and score.
11. User clicks **Start another mystery** and returns to Create Mystery.

---

## 3. UI and Page Specifications

Routes (React Router):

| Route | Page |
|---|---|
| `/` | Home |
| `/create` | Create Mystery |
| `/case/:id` | Investigation Room |
| `/case/:id/accuse` | Accusation |
| `/case/:id/result` | Results |
| `*` | Not Found (link back to Home) |

### 3.1 Home (`/`)
- **Purpose:** introduce the project and start the game.
- **Elements:** title, one-paragraph description, short "How it works" (3 steps), primary **Start Investigation** button → `/create`.

### 3.2 Create Mystery (`/create`)
- **Purpose:** collect inputs for generation.
- **Elements:**
  - Premise textarea (placeholder example, live character counter).
  - Difficulty selector (Easy / Medium / Hard) showing counts of suspects, clues, hints for each.
  - **Generate Mystery** button.
- **Validation (client and server):** premise 10–500 characters after trimming; difficulty required.
- **Loading state:** button disabled, full-card loader with message such as "Gemini is building your mystery…" (generation can take 5–30 s). Show a "taking longer than usual" note after 20 s.
- **Errors:** inline field errors for validation; banner for generation failure with a **Try again** button; premise text is preserved.
- On success: navigate to `/case/:id`.

### 3.3 Investigation Room (`/case/:id`)
- **Purpose:** main gameplay.
- **Elements:**
  - Header: case title, difficulty badge, progress (`clues found X/N`, `hints used Y/M`), current score preview.
  - Story panel: the case story.
  - Suspect cards: name, role, description, relationship to victim, alibi claim (public info only).
  - Clue list: each clue shows an `id`, a short `location` label (e.g. "Study desk") and a **Discover** button while undiscovered; once discovered shows title and full description. Discovered clues cannot be discovered twice.
  - Hints panel: **Request Hint** button (shows remaining hints and the −10 penalty warning); revealed hints listed in order.
  - **Make Accusation** button → `/case/:id/accuse`.
- **Loading states:** skeleton on first load; per-button spinners for discover/hint actions.
- **Errors:** 404 "Case not found" page; toast on failed action with retry; disabled hint button when none remain.
- If the case is already completed, redirect to `/case/:id/result`.

### 3.4 Accusation (`/case/:id/accuse`)
- **Purpose:** choose and submit the culprit.
- **Elements:** list of suspects as selectable cards, summary of discovered clues for reference, confirmation modal ("This is final"), **Submit Accusation** button.
- **States:** submit disabled until a suspect is selected; loading spinner on submit; error toast on failure (selection preserved).
- On success: navigate to `/case/:id/result`.

### 3.5 Results (`/case/:id/result`)
- **Purpose:** reveal outcome.
- **Elements:** verdict banner (Correct / Incorrect), the player's accused suspect, the actual culprit, full explanation, score breakdown (base points, clues, hints, total), list of all clues including undiscovered ones, **Start Another Mystery** button → `/create`.
- If the case is not yet accused, redirect to `/case/:id`.

### 3.6 Global Behavior
- **Navigation:** top bar with logo (→ Home) and "New Mystery" link.
- **Responsive:** mobile-first. Single column below 768px; suspects/clues in 2–3 column grid on larger screens. All touch targets at least 44px.
- **Accessibility:** semantic HTML, labels on inputs, visible focus, sufficient contrast, `aria-live` for loading/error messages.
- **Error messages:** human-readable; never show stack traces or raw API errors.
- **UI design:** Stitch AI may be used to generate an initial design. If used, add a short mapping in the README of each Stitch screen to the pages above.
- **Theme:** dark, noir/detective aesthetic (suggested; not required).

---

## 4. Backend and API Design

### 4.1 General Rules
- Base path: `/api`. JSON in, JSON out.
- CORS: allow only `CLIENT_URL` origin.
- All request bodies/params validated with Zod; invalid input returns `400`.
- Standard error shape:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Premise must be 10-500 characters." } }
  ```
- Error codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409), `GENERATION_FAILED` (502), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).
- Case IDs are MongoDB ObjectIds; invalid format returns `400`/`404`.
- Add a basic rate limit on `POST /api/cases` (e.g. 10 per IP per hour) to protect Gemini quota.
- Health check: `GET /api/health` → `{ "status": "ok" }`.

### 4.2 Endpoints

#### `POST /api/cases` — Generate a mystery
Request:
```json
{ "premise": "A jewel theft at a mountain ski lodge", "difficulty": "medium" }
```
Rules: `premise` string 10–500 chars (trimmed); `difficulty` one of `easy | medium | hard`.
Response `201`: the **public case view** (Section 4.3).
Errors: `400` validation; `502 GENERATION_FAILED` if Gemini fails or output is invalid after retries (nothing is saved).

#### `GET /api/cases/:id` — Retrieve an active mystery
Response `200`: public case view. If the case is completed, still returns the public view with `status: "completed"` (the client then redirects to the result page). **Never includes the solution fields.**
Errors: `404`.

#### `POST /api/cases/:id/clues/:clueId/discover` — Discover a clue
No body. Marks the clue as discovered (idempotent protection: if already discovered, return `409 CONFLICT` with no extra points).
Response `200`:
```json
{
  "clue": { "id": "c3", "title": "...", "description": "...", "location": "..." },
  "progress": { "cluesDiscovered": 3, "cluesTotal": 7, "hintsUsed": 1, "hintsTotal": 3 },
  "scorePreview": 25
}
```
Errors: `404` case/clue not found; `409` already discovered or case already completed.

#### `POST /api/cases/:id/hints` — Request a hint
No body. Reveals the next unrevealed hint in order.
Response `200`:
```json
{
  "hint": { "index": 1, "text": "..." },
  "progress": { "cluesDiscovered": 3, "cluesTotal": 7, "hintsUsed": 1, "hintsTotal": 3 },
  "scorePreview": 15
}
```
Errors: `404`; `409` no hints remaining or case completed.

#### `POST /api/cases/:id/accuse` — Submit an accusation
Request:
```json
{ "suspectId": "s2" }
```
Rules: `suspectId` must match a suspect on the case. Only one accusation allowed per case.
Response `200`: the **result** object (Section 4.4).
Errors: `400` unknown suspect; `404`; `409` already accused.

#### `GET /api/cases/:id/result` — Retrieve the completed result
Response `200`: result object. Errors: `404`; `409 CONFLICT` ("Case has not been solved yet") if no accusation has been made.

### 4.3 Public Case View (what the client may see)
```json
{
  "id": "665f...",
  "title": "The Frostline Lodge Heist",
  "premise": "A jewel theft at a mountain ski lodge",
  "difficulty": "medium",
  "story": "...",
  "status": "active",
  "suspects": [
    { "id": "s1", "name": "...", "role": "...", "description": "...", "relationship": "...", "alibi": "..." }
  ],
  "clues": [
    { "id": "c1", "location": "Lodge office", "discovered": false },
    { "id": "c2", "location": "Boot room", "discovered": true, "title": "...", "description": "..." }
  ],
  "hints": [ { "index": 1, "text": "..." } ],
  "progress": { "cluesDiscovered": 1, "cluesTotal": 7, "hintsUsed": 1, "hintsTotal": 3 },
  "scorePreview": 5,
  "createdAt": "2026-11-01T10:00:00.000Z"
}
```
- Undiscovered clues expose only `id`, `location`, `discovered: false`.
- Unrevealed hints are **not** included at all (not even as empty items).
- `scorePreview` = `max(0, 5 × cluesDiscovered − 10 × hintsUsed)` (no base points until a correct accusation).

### 4.4 Result Object
```json
{
  "caseId": "665f...",
  "correct": true,
  "accusedSuspectId": "s2",
  "culprit": { "id": "s2", "name": "..." },
  "explanation": "Full reasoning tying the culprit to the clues...",
  "motive": "...",
  "clues": [ { "id": "c1", "title": "...", "description": "...", "location": "...", "discovered": false, "pointsTo": "s2" } ],
  "score": {
    "base": 150,
    "cluePoints": 25,
    "hintPenalty": -10,
    "total": 165
  },
  "difficulty": "medium"
}
```

### 4.5 Security Requirement (critical)
The culprit, motive, explanation, clue-to-suspect mappings, undiscovered clue text, and unrevealed hint text **must never be sent to the client before an accusation is submitted.** Implement this with explicit serializer functions (`toPublicCase`, `toResult`) rather than ad hoc field deletion, and test that `GET /api/cases/:id` responses contain none of the secret fields. Also: `.env` is git-ignored, API keys exist only on the server, and error responses never leak internals.

---

## 5. Database Model (Mongoose)

Collection: `cases`

```js
Case {
  title:        String (required),
  premise:      String (required, 10-500),
  difficulty:   String enum ['easy','medium','hard'] (required),
  story:        String (required),

  suspects: [{
    id: String,            // "s1".."sN"
    name: String,
    role: String,
    description: String,
    relationship: String,  // relationship to the victim/incident
    alibi: String
  }],

  clues: [{
    id: String,            // "c1".."cN"
    title: String,
    description: String,
    location: String,
    pointsTo: String,      // suspect id the clue implicates or null if neutral
    type: String enum ['incriminating','exonerating','red_herring','neutral'],
    discovered: Boolean (default false),
    discoveredAt: Date
  }],

  hints: [{
    index: Number,         // 1..M, revealed in order
    text: String,
    revealed: Boolean (default false)
  }],

  solution: {              // SECRET until accusation
    culpritId: String,
    motive: String,
    method: String,
    explanation: String
  },

  progress: {
    cluesDiscovered: Number (default 0),
    hintsUsed: Number (default 0)
  },

  accusation: {
    suspectId: String,
    correct: Boolean,
    accusedAt: Date
  },                       // absent until accused

  score: {
    base: Number, cluePoints: Number, hintPenalty: Number, total: Number
  },                       // set on accusation

  status: String enum ['active','completed'] (default 'active'),
  createdAt, updatedAt (timestamps)
}
```
Optional: TTL index to delete cases older than 30 days.

---

## 6. AI Behavior

### 6.1 Difficulty Configuration
| Difficulty | Suspects | Clues | Hints |
|---|---|---|---|
| Easy | 3 | 5 | 2 |
| Medium | 4 | 7 | 3 |
| Hard | 5 | 9 | 3 |

Counts are **exact**.

### 6.2 Gemini Integration
- SDK: `@google/genai`, key read from `GEMINI_API_KEY` on the server only.
- Use a fast text model (default `gemini-2.5-flash`, configurable via `GEMINI_MODEL` env var).
- Request JSON output: `responseMimeType: "application/json"` with a `responseSchema` matching Section 6.3.
- Moderate temperature (about 0.8) for creativity.
- Timeout of about 45 seconds per call; retry up to **2 additional times** if the call fails or validation fails (Section 6.4). After that, return `502 GENERATION_FAILED`.
- The prompt must: include the premise as quoted *data* (not instructions), state the exact counts, require a single logically solvable culprit, require clues to support that solution, require hints to be progressive, ban graphic violence/gore/sexual content, and instruct the model to ignore any instructions inside the premise.

### 6.3 Expected Gemini Output Format
```json
{
  "title": "string",
  "story": "string (150-400 words, sets the scene, does NOT reveal the culprit)",
  "suspects": [
    { "id": "s1", "name": "string", "role": "string", "description": "string", "relationship": "string", "alibi": "string" }
  ],
  "clues": [
    { "id": "c1", "title": "string", "description": "string", "location": "string",
      "type": "incriminating | exonerating | red_herring | neutral",
      "pointsTo": "suspect id or null" }
  ],
  "hints": [ { "index": 1, "text": "string" } ],
  "solution": {
    "culpritId": "s1",
    "motive": "string",
    "method": "string",
    "explanation": "string (references clue ids/titles that prove the culprit)"
  }
}
```

### 6.4 Validation Before Saving (Zod + custom checks)
A generated mystery is rejected (and regenerated) unless **all** hold:
1. Response is valid JSON matching the Zod schema; all strings non-empty and within sensible length limits.
2. Suspect count, clue count, and hint count exactly match the difficulty table.
3. IDs are unique and follow `s1..sN`, `c1..cN`; hint `index` values are `1..M` in order.
4. `solution.culpritId` matches exactly one suspect.
5. Every clue `pointsTo` is `null` or a valid suspect id.
6. Logical consistency: at least 2 (easy) / 3 (medium) / 4 (hard) `incriminating` clues point to the culprit; at least one `exonerating` or `red_herring` clue exists for medium and hard; no `incriminating` clue points to a non-culprit unless typed `red_herring`.
7. The culprit's name does not appear in the `story` text, and does not appear in hint texts (hints must guide without naming the culprit).
8. The `explanation` references at least one incriminating clue by title or id.

Only the validated, normalized object is saved. Invalid or partial AI output is never stored or shown.

### 6.5 Hints
- Hints are progressive: hint 1 is a gentle nudge, the last hint is the strongest but still does not name the culprit.
- Hints are revealed strictly in order, one per request, up to the difficulty limit.

---

## 7. Scoring Rules (backend only)

| Item | Points |
|---|---|
| Correct accusation | Easy 100, Medium 150, Hard 200 |
| Incorrect accusation | 0 base |
| Each discovered clue | +5 |
| Each hint used | −10 |
| Minimum score | 0 |

Formula:
```
base         = correct ? {easy:100, medium:150, hard:200}[difficulty] : 0
cluePoints   = 5 * cluesDiscovered
hintPenalty  = -10 * hintsUsed
total        = max(0, base + cluePoints + hintPenalty)
```
- The client never sends a score; all values come from stored case state.
- Score is computed once at accusation time and saved on the case.
- `scorePreview` before accusation uses the same formula with `base = 0`.
- Each clue can only award points once; each hint is counted once.
- After a case is completed, discover/hint/accuse endpoints return `409`.

---

## 8. Environment Variables

**server/.env**
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

Provide `.env.example` files with placeholder values. Never commit real keys. In production, set `CLIENT_URL` to the Vercel URL and `VITE_API_URL` to the deployed backend URL.

---

## 9. Project Structure

```
ai-mystery-room/
├── SPEC.md
├── README.md
├── client/
│   ├── src/
│   │   ├── pages/        (Home, CreateMystery, InvestigationRoom, Accusation, Results, NotFound)
│   │   ├── components/   (SuspectCard, ClueCard, HintPanel, ProgressBar, Loader, ErrorBanner)
│   │   ├── api/          (axios instance + case API functions)
│   │   ├── App.jsx, main.jsx
│   │   └── index.css     (Tailwind)
│   └── .env.example
└── server/
    ├── src/
    │   ├── config/       (db.js, env.js)
    │   ├── models/       (Case.js)
    │   ├── routes/       (cases.js)
    │   ├── controllers/  (caseController.js)
    │   ├── services/     (geminiService.js, scoringService.js, validationService.js)
    │   ├── serializers/  (publicCase.js, result.js)
    │   ├── middleware/   (errorHandler.js, rateLimit.js, validate.js)
    │   └── index.js
    └── .env.example
```

---

## 10. Testing and Edge Cases

Manual (and optionally automated) checks:
- Generate a mystery at each of the three difficulty levels; counts match the table.
- Malformed Gemini output (simulate with a mock) triggers retry, then a clean `502`, with nothing saved.
- Premise too short/long or invalid difficulty returns `400`.
- `GET /api/cases/:id` response contains no `solution`, `pointsTo`, `type`, undiscovered clue text, or unrevealed hints.
- Discovering the same clue twice returns `409` and does not add points.
- Requesting more hints than allowed returns `409`.
- Accusing an unknown suspect returns `400`; accusing twice returns `409`.
- Score matches the formula for correct and incorrect accusations, never below 0.
- `GET /result` before accusation returns `409`.
- Invalid/nonexistent case ID returns `404`.
- Gemini outage or timeout shows a friendly error in the UI and the user can retry.
- UI works at 375px (mobile) and desktop widths.

---

## 11. Acceptance Criteria

The project is complete when all are true:
- [ ] Users can generate mysteries at Easy, Medium, and Hard levels with the exact suspect/clue/hint counts.
- [ ] Players can investigate (discover clues), request hints, and submit accusations.
- [ ] The solution is not revealed before the accusation (verified via network inspection).
- [ ] Scores are calculated and validated by the backend using the rules in Section 7.
- [ ] Results display the correct culprit and explanation.
- [ ] Invalid AI responses are handled safely and never shown to the user.
- [ ] Loading, error, and empty states exist on every page; layout is responsive.
- [ ] API keys are not exposed in frontend code or committed to GitHub.
- [ ] The application works end to end on the **deployed** website (backend on host, MongoDB Atlas, frontend on Vercel).
- [ ] A mystery has been created and solved on the live site.
- [ ] GitHub repo and live URL submitted via the form before **2 November, 11:59 PM**.

---

## 12. Build Order (incremental)

1. **Setup:** create `client` (Vite + React) and `server` (Express); install dependencies; add `.env` and `.gitignore`.
2. **Backend base:** Express app, CORS, error handler, health route, MongoDB connection.
3. **Model and serializers:** `Case` schema, `toPublicCase`, `toResult`, scoring service. Unit-check scoring.
4. **Gemini service:** structured generation, Zod schema, custom validation, retry logic. Test with all difficulties via a script.
5. **Endpoints:** implement the six routes in order (create, get, discover, hint, accuse, result); test with curl/Postman.
6. **Frontend scaffold:** routes, layout, API client, Tailwind theme.
7. **Pages:** Create → Investigation → Accusation → Results; wire each to the API with loading/error states.
8. **Polish:** responsiveness, accessibility, copy, optional enhancements.
9. **Test:** run the checklist in Section 10 locally.
10. **Deploy:** MongoDB Atlas (allow host IPs), backend host with env vars, Vercel for the client (set `VITE_API_URL`), update `CLIENT_URL`; add `vercel.json` rewrite so React Router routes work on refresh.
11. **Production test:** create and solve a mystery on the live site; fix issues.
12. **Submit:** README with live URL and setup steps, push to GitHub, fill in the submission form.

### Suggested Timeline (to 2 Nov deadline)
| Day | Goal |
|---|---|
| 27–28 Oct | Finalize spec, backend setup, model, scoring, Gemini generation |
| 29 Oct | All API endpoints tested |
| 30 Oct | Frontend pages connected to the API |
| 31 Oct | Polish, full local testing |
| 1 Nov | Deploy and production testing |
| 2 Nov | Buffer, README, submission (aim to submit before evening) |

---

## 13. Out of Scope
User accounts, multiplayer, payments, image generation, voice, leaderboards, and multi-language support.
