// Calls Zhipu/Z.ai's GLM free-tier flash model to extract structured
// literature-review matrix fields from an already-extracted article text.
// Never called from the browser directly — GLM_API_KEY stays server-side,
// no VITE_ prefix.
//
// Tested against a real GLM API key: open.bigmodel.cn returned "Unknown
// Model" for both glm-4-flash and GLM-4-Flash on this account (bigmodel.cn
// serves mainland-China-registered accounts; this key is registered on
// z.ai instead). api.z.ai worked, but only with glm-4.5-flash — plain
// "GLM-4-Flash" isn't a valid model code on either endpoint for this
// account; GLM's free-tier flash model is now versioned as glm-4.5-flash.
const GLM_ENDPOINT = process.env.GLM_API_BASE || "https://api.z.ai/api/paas/v4/chat/completions";
const GLM_MODEL = process.env.GLM_MODEL || "glm-4.5-flash";
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

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "GLM_API_KEY is not configured on the server." }) };
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

  let glmRes;
  try {
    glmRes = await fetch(GLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
      }),
    });
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Couldn't reach the AI service: " + String(e.message || e) }) };
  }

  if (!glmRes.ok) {
    const errText = await glmRes.text().catch(() => "");
    return { statusCode: 502, body: JSON.stringify({ error: `AI service error (${glmRes.status}): ${errText.slice(0, 300)}` }) };
  }

  const data = await glmRes.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    return { statusCode: 502, body: JSON.stringify({ error: "AI service returned no content." }) };
  }

  let parsed;
  try {
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Couldn't parse the AI response as JSON." }) };
  }

  const result = {};
  for (const key of RESULT_FIELDS) {
    result[key] = typeof parsed[key] === "string" ? parsed[key] : "";
  }

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) };
};
