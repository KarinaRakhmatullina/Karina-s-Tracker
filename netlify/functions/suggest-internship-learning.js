// Suggests topics/concepts/frameworks for the internship "Daily Professional
// Learning" list — never specific article titles or links, since GLM can't
// guarantee a cited source actually exists. See _lib/glm.js for the shared
// client (same GLM_API_KEY/BASE/MODEL env vars as the other AI functions —
// not duplicated here).
import { callGLM } from "./_lib/glm.js";

const MAX_SUGGESTIONS = 5;
const DIRECTION = "Design Strategy + Spatial Strategy / Space Organization";

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

  const existingTopics = Array.isArray(body.existingTopics)
    ? body.existingTopics.filter((t) => typeof t === "string" && t.trim()).slice(0, 100)
    : [];

  const systemPrompt = `You help a design/urbanism master's student build a self-directed professional learning list during her internship. Her stated direction is: "${DIRECTION}". Suggest between 3 and ${MAX_SUGGESTIONS} SPECIFIC topics, concepts, or frameworks worth exploring in this direction — for example named frameworks or methods like "Double Diamond" or "Jobs to be Done", or specific named concepts in strategic design, behavioral design, or spatial planning. Never suggest vague filler like "learn more about design" or "read about strategy". Do NOT suggest specific article titles, papers, or URLs — you cannot verify those actually exist, so never invent a link or a specific publication. If you name an established book or framework, that's fine (e.g. "Double Diamond (Design Council)"), but frame it as a topic to research, not a specific source to click. For each suggestion give: "topic" (the concept/framework name, concise), "whyRelevant" (1-2 sentences on why it matters for this direction), and "howItHelps" (1-2 sentences on how exploring it helps her professional development). Respond with ONLY a JSON object of the shape {"suggestions": [{"topic": "...", "whyRelevant": "...", "howItHelps": "..."}, ...]}.`;

  const userPrompt = existingTopics.length
    ? `Topics already on her list — suggest different ones, don't repeat anything substantially similar to these:\n${existingTopics.map((t) => `- ${t}`).join("\n")}`
    : "Her list is currently empty.";

  const { data: parsed, error: glmError } = await callGLM({ systemPrompt, userPrompt });
  if (glmError) {
    return { statusCode: 502, body: JSON.stringify({ error: glmError }) };
  }

  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .filter((s) => s && typeof s.topic === "string" && s.topic.trim())
        .slice(0, MAX_SUGGESTIONS)
        .map((s) => ({
          topic: s.topic.trim(),
          whyRelevant: typeof s.whyRelevant === "string" ? s.whyRelevant.trim() : "",
          howItHelps: typeof s.howItHelps === "string" ? s.howItHelps.trim() : "",
        }))
    : [];

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suggestions }) };
};
