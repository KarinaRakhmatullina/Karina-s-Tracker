// Corpus-wide research gap detection. Unlike analyze-literature.js (one
// article's full text in, matrix fields out), this sends GLM a compact
// summary of EVERY article in the library — title, year, topic, key
// concepts, findings only, never full PDF text — so it stays cheap even
// with a large library, and asks it to point at under-studied areas across
// the set. See _lib/glm.js for the shared client (same GLM_API_KEY/BASE/
// MODEL env vars as analyze-literature.js — not duplicated here).
import { callGLM } from "./_lib/glm.js";

const MIN_ARTICLES = 3;
const MAX_ARTICLES = 80; // defensive cap for very large libraries
const MAX_CORPUS_CHARS = 16000;
const MAX_GAPS = 6;

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

  const articles = Array.isArray(body.articles) ? body.articles.slice(0, MAX_ARTICLES) : [];
  if (articles.length < MIN_ARTICLES) {
    return { statusCode: 400, body: JSON.stringify({ error: `At least ${MIN_ARTICLES} articles with extracted content are needed to detect gaps.` }) };
  }

  const thesisContext = typeof body.thesisContext === "string" ? body.thesisContext.trim() : "";
  const existingGaps = Array.isArray(body.existingGaps)
    ? body.existingGaps.filter((g) => typeof g === "string" && g.trim())
    : [];

  let corpusText = articles
    .map((a, i) => {
      const parts = [];
      if (a.topic) parts.push(`Topic: ${a.topic}`);
      if (a.keyConcepts) parts.push(`Key concepts: ${a.keyConcepts}`);
      if (a.findings) parts.push(`Findings: ${a.findings}`);
      return `${i + 1}. "${a.title || "Untitled"}"${a.year ? ` (${a.year})` : ""} — ${parts.join("; ") || "(no extracted fields yet)"}`;
    })
    .join("\n");
  if (corpusText.length > MAX_CORPUS_CHARS) corpusText = corpusText.slice(0, MAX_CORPUS_CHARS);

  const systemPrompt = `You are a research assistant helping a master's student spot potential gaps in their literature review corpus. You receive a compact summary of each article (title, year, topic, key concepts, findings) — never the full text. Identify between 2 and ${MAX_GAPS} potential research gaps: relationships, contexts, or sub-topics that appear under-studied or unaddressed across THIS SPECIFIC set of articles. These are hypotheses for the student to verify herself, never established facts — do not phrase them as certainties, and do not claim a gap exists in the wider field, only that it appears under-covered in this corpus. Ground every gap in terms that actually appear in the provided summaries, not generic placeholders (e.g. "Few of these articles connect [concept from the corpus] to [another concept from the corpus] in the context of [context from the corpus]"). If the corpus is too thin or too narrow to say anything specific, return fewer gaps rather than inventing vague ones. Respond with ONLY a JSON object of the shape {"gaps": ["...", "..."]}, each entry a single concise sentence.`;

  const userPromptParts = [
    thesisContext ? `Thesis context: ${thesisContext}` : null,
    existingGaps.length
      ? `Gaps already noted by the student — do not repeat anything substantially similar to these:\n${existingGaps.map((g) => `- ${g}`).join("\n")}`
      : null,
    `Articles in the corpus (${articles.length} total):\n${corpusText}`,
  ].filter(Boolean).join("\n\n");

  const { data: parsed, error: glmError } = await callGLM({ systemPrompt, userPrompt: userPromptParts });
  if (glmError) {
    return { statusCode: 502, body: JSON.stringify({ error: glmError }) };
  }

  const gaps = Array.isArray(parsed.gaps)
    ? parsed.gaps.filter((g) => typeof g === "string" && g.trim()).slice(0, MAX_GAPS)
    : [];

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gaps }) };
};
