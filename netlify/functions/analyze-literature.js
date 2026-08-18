// Calls Zhipu/Z.ai's GLM free-tier flash model to extract structured
// literature-review matrix fields from an already-extracted article text.
// Never called from the browser directly — GLM_API_KEY stays server-side,
// no VITE_ prefix. See _lib/glm.js for the endpoint/model defaults and the
// shared request/response plumbing (also used by detect-research-gaps.js).
import { callGLM } from "./_lib/glm.js";

const MAX_CHARS = 24000; // keeps the prompt within a safe context size for the free tier

const RESULT_FIELDS = [
  "topic", "researchQuestion", "method", "sample", "context",
  "keyConcepts", "findings", "limitations", "relevanceToThesis", "potentialGap",
];

// Named ESM export, not `exports.handler` — the project's package.json has
// "type": "module", so plain CommonJS assignment here is silently a no-op
// (confirmed by testing: `require()`d the file and got an empty exports
// object). Netlify's function runtime supports ESM handlers natively.
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return { statusCode: 400, body: JSON.stringify({ error: "No article text was extracted — nothing to analyze." }) };
  }

  const thesisContext = typeof body.thesisContext === "string" ? body.thesisContext.trim() : "";
  const truncated = text.slice(0, MAX_CHARS);

  const fieldList = RESULT_FIELDS.map((k) => `"${k}"`).join(", ");
  const systemPrompt = `You are a research assistant helping a master's student build a literature review matrix. Extract structured information STRICTLY from the article text the user provides — never invent facts, numbers, or claims that are not present in the text. If a field cannot be determined from the text, return an empty string "" for it instead of guessing. Respond with ONLY a single JSON object, no markdown code fences, no commentary, with exactly these string keys: ${fieldList}. Keep each field short (1-3 sentences), except "keyConcepts" which should be a short comma-separated list of terms.`;

  const userPrompt = [
    thesisContext
      ? `The student's thesis context: ${thesisContext}\nUse this only to judge "relevanceToThesis" — briefly explain why (or why not) the article is relevant to this thesis.`
      : null,
    `Article text:\n\n${truncated}`,
  ].filter(Boolean).join("\n\n");

  const { data: parsed, error: glmError } = await callGLM({ systemPrompt, userPrompt });
  if (glmError) {
    return { statusCode: 502, body: JSON.stringify({ error: glmError }) };
  }

  const result = {};
  for (const key of RESULT_FIELDS) {
    result[key] = typeof parsed[key] === "string" ? parsed[key] : "";
  }

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) };
};
