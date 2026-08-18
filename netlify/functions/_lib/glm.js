// Shared GLM (Zhipu/Z.ai) client for every AI-backed Netlify function in
// this app — one place for the endpoint/model defaults and the request/
// response plumbing, so each function only supplies its own prompts.
// Filename prefixed with "_" so Netlify doesn't treat this directory as
// its own function.
//
// Endpoint/model confirmed working against a real key during the Literature
// AI-analysis phase: open.bigmodel.cn returns "Unknown Model" for this
// account (that endpoint serves mainland-China-registered accounts; this
// key is registered on z.ai), and the free-tier flash model is versioned
// as glm-4.5-flash, not the plain "GLM-4-Flash" name.
export const GLM_ENDPOINT = process.env.GLM_API_BASE || "https://api.z.ai/api/paas/v4/chat/completions";
export const GLM_MODEL = process.env.GLM_MODEL || "glm-4.5-flash";

// Returns { data } on success or { error } on failure — never throws, so
// callers can turn either straight into an HTTP response.
export async function callGLM({ systemPrompt, userPrompt }) {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return { error: "GLM_API_KEY is not configured on the server." };

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
    return { error: "Couldn't reach the AI service: " + String(e.message || e) };
  }

  if (!glmRes.ok) {
    const errText = await glmRes.text().catch(() => "");
    return { error: `AI service error (${glmRes.status}): ${errText.slice(0, 300)}` };
  }

  const data = await glmRes.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) return { error: "AI service returned no content." };

  try {
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
    return { data: JSON.parse(cleaned) };
  } catch (e) {
    return { error: "Couldn't parse the AI response as JSON." };
  }
}
