import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Home, Calendar as CalendarIcon, Settings as SettingsIcon,
  BookOpen, FlaskConical, Users, ClipboardList, MessageSquare, Mic, FileText, Clock,
  Plus, X, Check, ChevronRight, ChevronLeft, ChevronDown, Download, Upload, Sparkles,
  AlertTriangle, CheckCircle2, Circle, Briefcase, Languages, Building2,
  Loader2, Edit3, Trash2, Info, LogOut, Search, Paperclip, ExternalLink,
  Table2, LayoutList, Volume2
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TOKENS, FontLoader } from "./theme";
import { supabase } from "./lib/supabaseClient";
import { useStore } from "./lib/useStore";

/* =========================================================================
   DATE HELPERS
   ========================================================================= */
const DAY_MS = 86400000;
function toISO(d) { return d.toISOString().slice(0, 10); }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / DAY_MS); }
function todayISO() {
  return toISO(new Date());
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function addDays(iso, n) { return toISO(new Date(parseISO(iso).getTime() + n * DAY_MS)); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

/* =========================================================================
   INITIAL DATA
   ========================================================================= */
function initSettings() {
  return {
    trackerStart: "2026-08-15",
    thesisMidterm: "2026-09-30",
    frenchTarget: "2026-10-31",
    chineseTarget: "2026-12-15",
    portfolioTarget: "2026-10-05",
    dailyFrenchMinutes: 75,
    dailyChineseWords: 5,
  };
}

/* -------------------------------------------------------------------------
   THESIS — 11 freeform sections (01–11), each a list of editable text
   blocks so multi-version content (e.g. RQ1/RQ2/RQ3 drafts) fits naturally
   without rigid fields. Two of them (Methodology, Data Collection) embed
   the structured sub-panels (Questionnaire, Case Studies, Observation).
   ------------------------------------------------------------------------- */
const THESIS_SECTIONS_META = [
  { key: "foundation", number: "01", title: "Research Foundation", short: "Foundation", description: "Topic, motivation, background context for the study." },
  { key: "literatureReview", number: "02", title: "Literature Review", short: "Lit. Review", description: "Synthesis of the literature — themes, debates, positioning." },
  { key: "framework", number: "03", title: "Conceptual Framework", short: "Framework", description: "How spatial characteristics, emotional experience and behavioural patterns relate." },
  { key: "researchQuestions", number: "04", title: "Research Questions", short: "Research Qs", description: "Main and sub research questions — keep multiple drafts (RQ1, RQ2, RQ3…) side by side as they evolve." },
  { key: "methodology", number: "05", title: "Methodology", short: "Methodology", description: "Research design and approach. Includes the Questionnaire panel below." },
  { key: "dataCollection", number: "06", title: "Data Collection", short: "Data Collection", description: "Fieldwork plan and log. Includes the Case Studies and Observation panels below." },
  { key: "dataAnalysis", number: "07", title: "Data Analysis", short: "Analysis", description: "Analytical approach and working notes." },
  { key: "findings", number: "08", title: "Findings", short: "Findings", description: "What the data shows." },
  { key: "discussion", number: "09", title: "Discussion", short: "Discussion", description: "Interpretation — how findings relate to the literature and framework." },
  { key: "designImplications", number: "10", title: "Design Implications", short: "Design Impl.", description: "Implications for spatial / urban design." },
  { key: "conclusion", number: "11", title: "Conclusion", short: "Conclusion", description: "Summary, contributions, limitations, future work." },
];

function initThesisSections() {
  const base = Object.fromEntries(THESIS_SECTIONS_META.map((s) => [s.key, { blocks: [] }]));
  // Framework carries two extra structured lists (concepts + relationships)
  // alongside its freeform blocks, so literature and research questions
  // have concrete, nameable things to link to instead of prose paragraphs.
  base.framework = { blocks: [], concepts: [], relationships: [], conceptsSeeded: false };
  return base;
}

// Seeds the framework with the thesis's actual conceptual chain (not a
// placeholder example) — Spatial Characteristics → Emotional Experience →
// Behavioral Patterns. Fully renamable/removable from the Framework tab.
function seedFrameworkConcepts() {
  const spatial = { id: uid(), name: "Spatial Characteristics", description: "" };
  const emotional = { id: uid(), name: "Emotional Experience", description: "" };
  const behavioral = { id: uid(), name: "Behavioral Patterns", description: "" };
  return {
    concepts: [spatial, emotional, behavioral],
    relationships: [
      { id: uid(), fromConceptId: spatial.id, toConceptId: emotional.id, label: "shapes" },
      { id: uid(), fromConceptId: emotional.id, toConceptId: behavioral.id, label: "influences" },
    ],
  };
}

// Strategic components — each carries its own list of small daily actions,
// distinct from the freeform sections above (this is the execution layer).
function initThesisComponents() {
  return ["Literature Review", "Framework", "Research Questions", "Methodology", "Questionnaire", "Fieldwork", "Analysis", "Writing"]
    .map((name) => ({ id: uid(), name, actions: [] }));
}

function initThesis() {
  const sections = initThesisSections();
  const seed = seedFrameworkConcepts();
  sections.framework.concepts = seed.concepts;
  sections.framework.relationships = seed.relationships;
  sections.framework.conceptsSeeded = true;
  return {
    sections,
    components: initThesisComponents(),
    claims: [],
    contradictions: [],
    questionnaire: {
      title: "", purpose: "", link: "", draftDate: "", supervisorReviewDate: "", pilotDate: "",
      launchDate: "", closingDate: "", targetParticipants: 200, currentResponses: 0, stage: "IDEA",
    },
    questionBank: [],
    caseStudies: [],
    observations: [],
    supervisor: {
      checklist: [
        "Thesis topic", "Research question", "Literature review progress", "Initial conceptual framework",
        "Proposed methodology", "Case study idea", "Observation plan", "Questionnaire draft", "Questions for supervisor",
      ].map((label) => ({ id: uid(), label, done: false })),
      meetings: [],
    },
    outputs: [],
    timeLog: [],
  };
}

// One-time upgrade path for accounts created before the 11-section rebuild:
// old `roadmap` / `framework` / embedded `literature` are replaced, but
// nothing authored is discarded — the original framework logic + research
// question are carried into the new sections as seed blocks.
function migrateThesisShape(raw) {
  const fresh = initThesis();
  const sections = initThesisSections();
  if (raw.framework && (raw.framework.logic || raw.framework.mainRQ)) {
    if (raw.framework.logic) {
      sections.framework.blocks.push({ id: uid(), label: "Conceptual logic (carried over)", text: raw.framework.logic, createdAt: todayISO() });
    }
    if (raw.framework.mainRQ) {
      sections.researchQuestions.blocks.push({ id: uid(), label: "RQ1 (carried over)", text: raw.framework.mainRQ, createdAt: todayISO() });
    }
    (raw.framework.subQuestions || []).forEach((q, i) => {
      sections.researchQuestions.blocks.push({ id: uid(), label: `RQ${i + 2} (carried over)`, text: q, createdAt: todayISO() });
    });
  }

  return {
    sections,
    components: fresh.components,
    claims: [],
    contradictions: [],
    questionnaire: raw.questionnaire || fresh.questionnaire,
    questionBank: raw.questionBank || [],
    caseStudies: raw.caseStudies || [],
    observations: raw.observations || [],
    supervisor: raw.supervisor || fresh.supervisor,
    outputs: raw.outputs || [],
    timeLog: raw.timeLog || [],
  };
}

// Additive Phase 2 upgrade: fills in claims/contradictions/framework
// concepts+relationships if missing, without touching anything already
// written. Runs on every load (old rows AND rows already on the Phase 1
// shape) so nothing needs a second migration flag.
function ensureThesisLinks(t) {
  const fw = t.sections.framework || { blocks: [] };
  // conceptsSeeded (not concepts.length) gates the one-time seed, so
  // deleting all concepts later — a legitimate, expected action — never
  // silently brings the defaults back.
  const alreadySeeded = fw.conceptsSeeded === true;
  const seed = alreadySeeded
    ? { concepts: Array.isArray(fw.concepts) ? fw.concepts : [], relationships: Array.isArray(fw.relationships) ? fw.relationships : [] }
    : seedFrameworkConcepts();
  return {
    ...t,
    claims: Array.isArray(t.claims) ? t.claims : [],
    contradictions: Array.isArray(t.contradictions) ? t.contradictions : [],
    sections: {
      ...t.sections,
      framework: { blocks: fw.blocks || [], concepts: seed.concepts, relationships: seed.relationships, conceptsSeeded: true },
    },
  };
}

function migrateThesis(raw) {
  if (!raw) return initThesis();
  const isPhase1Shape = raw.sections && typeof raw.sections === "object" && Array.isArray(raw.components);
  const shaped = isPhase1Shape ? raw : migrateThesisShape(raw);
  return ensureThesisLinks(shaped);
}

// Retro-planning: three phases spanning trackerStart → thesisMidterm.
// Purely computed from settings, so editing the midterm date in Settings
// recalculates the whole plan automatically — nothing here is persisted.
const THESIS_PLAN_PHASES = [
  { key: "foundation", title: "Foundation & Literature", description: "Research foundation and literature review groundwork." },
  { key: "framework", title: "Framework, Methodology & Collection Prep", description: "Conceptual framework, methodology design, questionnaire and fieldwork preparation." },
  { key: "analysis", title: "Analysis, Writing & Presentation Prep", description: "Data analysis, write-up, and midterm presentation preparation." },
];
function computeThesisPlan(settings) {
  const start = settings.trackerStart;
  const end = settings.thesisMidterm;
  const totalDays = Math.max(1, daysBetween(start, end));
  const cut1 = Math.round(totalDays / 3);
  const cut2 = Math.round((totalDays * 2) / 3);
  const bounds = [0, cut1, cut2, totalDays];
  const phases = THESIS_PLAN_PHASES.map((p, i) => ({
    ...p,
    start: addDays(start, bounds[i]),
    end: i === THESIS_PLAN_PHASES.length - 1 ? end : addDays(start, bounds[i + 1] - 1),
  }));
  const today = todayISO();
  let currentIndex = phases.findIndex((p) => today >= p.start && today <= p.end);
  if (currentIndex === -1) currentIndex = today > end ? phases.length - 1 : 0;
  return {
    phases,
    currentIndex,
    daysElapsed: Math.max(0, daysBetween(start, today)),
    daysLeft: Math.max(0, daysBetween(today, end)),
    totalDays,
  };
}

/* =========================================================================
   LITERATURE — its own top-level store (app_data key "literature"),
   separate from thesis so the bibliography can grow independently.
   Matrix columns are real fields on the article now (not a shadow "ai"
   copy) — they're manually editable today and will be the same fields an
   AI pass fills in later (Phase 2+), so nothing has to migrate later.
   ========================================================================= */
function initLiterature() {
  return { articles: [], researchGaps: [] };
}

function blankResearchGap(text) {
  return { id: uid(), text, status: "pending", note: "", createdAt: todayISO() };
}

// Safe-upgrade for accounts created before gap detection existed —
// literature used to be just {articles}. Same defensive-fill pattern as
// ensureChineseShape/ensurePortfolioShape/ensureInternshipShape.
function ensureLiteratureShape(raw) {
  if (!raw) return initLiterature();
  return {
    articles: Array.isArray(raw.articles) ? raw.articles : [],
    researchGaps: Array.isArray(raw.researchGaps) ? raw.researchGaps : [],
  };
}
function literatureNeedsUpgrade(raw) {
  return !(raw && Array.isArray(raw.researchGaps));
}

function blankLiteratureArticle() {
  return {
    id: null,
    authors: "", year: "", title: "", journal: "", doi: "", keywords: "",
    fileName: "", filePath: "", fileType: "", fileSize: 0, uploadedAt: null,
    topic: "", researchQuestion: "", method: "", sample: "", context: "",
    keyConcepts: "", findings: "", limitations: "",
    relevantEmotion: false, relevantBehavior: false, relevantSpace: false, relevantInformalLearning: false,
    relevanceToThesis: "", potentialGap: "", usedInThesis: false, chapter: "",
    status: "UNREAD", notes: "",
    linkedConceptIds: [], linkedRelationshipIds: [],
  };
}

// Matrix column definitions — driven by one list so the Library form and
// the Matrix table stay in sync instead of duplicating field names.
const LITERATURE_MATRIX_FIELDS = [
  { key: "authors", label: "Author(s)", width: 160 },
  { key: "year", label: "Year", width: 70 },
  { key: "topic", label: "Topic", width: 160 },
  { key: "researchQuestion", label: "RQ", width: 200 },
  { key: "method", label: "Method", width: 140 },
  { key: "sample", label: "Sample", width: 140 },
  { key: "context", label: "Context", width: 140 },
  { key: "keyConcepts", label: "Key Concepts", width: 180 },
  { key: "findings", label: "Findings", width: 220 },
  { key: "limitations", label: "Limitations", width: 180 },
  { key: "relevantEmotion", label: "Emotion?", width: 90, type: "bool" },
  { key: "relevantBehavior", label: "Behavior?", width: 90, type: "bool" },
  { key: "relevantSpace", label: "Space?", width: 90, type: "bool" },
  { key: "relevantInformalLearning", label: "Informal Learning?", width: 110, type: "bool" },
  { key: "relevanceToThesis", label: "Relevance to Thesis", width: 220 },
  { key: "potentialGap", label: "Potential Gap", width: 180 },
  { key: "usedInThesis", label: "Used?", width: 80, type: "bool" },
  { key: "chapter", label: "Chapter", width: 120 },
];

// One-time migration for articles that used to live inside thesis.literature.
function migrateLiteratureArticle(old) {
  return {
    ...blankLiteratureArticle(),
    id: old.id || uid(),
    authors: old.author || "",
    year: old.year || "",
    title: old.title || "",
    doi: old.doi || "",
    keywords: old.keywords || "",
    researchQuestion: old.rq || "",
    method: old.methodology || "",
    keyConcepts: old.keyIdea || "",
    findings: old.findings || "",
    relevanceToThesis: old.relevance || "",
    status: old.status || "UNREAD",
    notes: old.notes || "",
  };
}

/* -------------------------------------------------------------------------
   RESEARCH LINKS — reverse-lookup helpers. Every link below is stored once,
   on the side where the linking action happens (an article picks its
   concepts; an RQ picks its articles; a claim picks its evidence). These
   just filter to produce the other direction for display — nothing is
   ever stored twice.
   ------------------------------------------------------------------------- */
function articlesForConcept(literature, conceptId) {
  return literature.articles.filter((a) => (a.linkedConceptIds || []).includes(conceptId));
}
function articlesForRelationship(literature, relationshipId) {
  return literature.articles.filter((a) => (a.linkedRelationshipIds || []).includes(relationshipId));
}
function rqBlocksForArticle(thesis, articleId) {
  return (thesis.sections.researchQuestions.blocks || []).filter((b) => (b.linkedArticleIds || []).includes(articleId));
}
function claimsForArticle(thesis, articleId) {
  return (thesis.claims || []).filter((c) => (c.evidenceArticleIds || []).includes(articleId) || (c.contradictingArticleIds || []).includes(articleId));
}
function contradictionsForArticle(thesis, articleId) {
  return (thesis.contradictions || []).filter((c) => c.articleAId === articleId || c.articleBId === articleId);
}
function supportLevelForRQ(block) {
  const n = (block.linkedArticleIds || []).length;
  if (n >= 3) return "STRONG SUPPORT";
  if (n >= 1) return "WEAK SUPPORT";
  return "GAP";
}

// Real, complete 14-module French A0→A2 curriculum outline (topics + grammar
// focus per module). This is genuine curriculum design, built to spec section 22–23.
const FRENCH_MODULES = [
  { id: "m1", title: "Pronunciation & Survival French", level: "A0", days: 5,
    grammar: ["Alphabet & sounds", "Subject pronouns", "être (present tense)", "Basic sentence structure"],
    vocabThemes: ["Greetings", "Countries & nationalities", "Politeness formulas"] },
  { id: "m2", title: "Introducing Yourself", level: "A0", days: 5,
    grammar: ["avoir (present tense)", "Regular -er verbs", "Gender of nouns", "Negation (ne...pas)"],
    vocabThemes: ["Professions", "Personality adjectives", "Ages & personal info"] },
  { id: "m3", title: "Numbers, Dates & Time", level: "A1", days: 5,
    grammar: ["Numbers 0–100", "Days, months, seasons", "Telling time", "Question formation (est-ce que)"],
    vocabThemes: ["Calendar vocabulary", "Time expressions", "Ordinal numbers"] },
  { id: "m4", title: "Family & People", level: "A1", days: 5,
    grammar: ["Possessive adjectives", "Plural of nouns/adjectives", "Definite/indefinite articles", "Descriptive adjectives (agreement)"],
    vocabThemes: ["Family members", "Physical description", "Relationships"] },
  { id: "m5", title: "Food & Shopping", level: "A1", days: 6,
    grammar: ["Partitive articles (du/de la/des)", "-ir verbs", "Quantities & expressions", "Demonstratives (ce/cette/ces)"],
    vocabThemes: ["Food & drink", "Shops", "Prices & quantities"] },
  { id: "m6", title: "Home & Everyday Life", level: "A1", days: 6,
    grammar: ["Prepositions of place", "Reflexive verbs (present)", "-re verbs", "Adverbs of frequency"],
    vocabThemes: ["Rooms & furniture", "Daily routine", "Household chores"] },
  { id: "m7", title: "City & Transportation", level: "A1", days: 5,
    grammar: ["Imperative mood", "aller + infinitive (near future)", "Prepositions with places (à/en/au)", "Direction & location expressions"],
    vocabThemes: ["City landmarks", "Transport modes", "Giving directions"] },
  { id: "m8", title: "University & Work", level: "A1/A2", days: 6,
    grammar: ["Irregular verbs (faire, aller, pouvoir, vouloir, devoir)", "Object pronouns (le/la/les)", "Comparatives (plus/moins/aussi que)"],
    vocabThemes: ["Academic subjects", "Workplace vocabulary", "Skills & tasks"] },
  { id: "m9", title: "Past Events & Experiences", level: "A2", days: 7,
    grammar: ["Passé composé with avoir", "Passé composé with être", "Common past participles", "Time markers (hier, la semaine dernière)"],
    vocabThemes: ["Common activities", "Travel experiences", "Life events"] },
  { id: "m10", title: "Future Plans", level: "A2", days: 5,
    grammar: ["Futur simple (regular + key irregulars)", "Future time expressions", "Conditional politeness (je voudrais)"],
    vocabThemes: ["Goals & plans", "Weather", "Making appointments"] },
  { id: "m11", title: "Health & Everyday Problems", level: "A2", days: 5,
    grammar: ["Imparfait (formation & basic use)", "Body vocabulary + avoir mal à", "Modal verbs review"],
    vocabThemes: ["Body parts", "Symptoms & pharmacy", "Emergencies"] },
  { id: "m12", title: "Travel & Communication", level: "A2", days: 5,
    grammar: ["Direct/indirect object pronoun review", "Question words review", "Basic connectors (donc, parce que, mais, alors)"],
    vocabThemes: ["Airports & hotels", "Phone & internet", "Booking & reservations"] },
  { id: "m13", title: "Opinions, Preferences & Comparisons", level: "A2", days: 5,
    grammar: ["Expressing opinion (je pense que / à mon avis)", "Superlatives", "A2-level object pronoun placement"],
    vocabThemes: ["Likes & dislikes", "Comparisons", "Debate expressions"] },
  { id: "m14", title: "A2 Consolidation", level: "A2", days: 8,
    grammar: ["Full review: all tenses covered", "Mixed connectors", "Mock A2 exam practice"],
    vocabThemes: ["Mixed review by theme", "Exam vocabulary"] },
];

// Fully authored Module 1, Day 1 example lesson — matches the brief's worked example exactly (section 21).
const DAY1_LESSON = {
  title: "Greetings and Introducing Yourself",
  grammar: ["Subject pronouns (je, tu, il/elle, nous, vous, ils/elles)", "être — present tense", "Basic sentence structure (subject + verb + complement)"],
  vocabulary: [
    { fr: "Bonjour", en: "Hello / Good day", category: "Greetings" },
    { fr: "Bonsoir", en: "Good evening", category: "Greetings" },
    { fr: "Au revoir", en: "Goodbye", category: "Greetings" },
    { fr: "la France", en: "France", category: "Countries" },
    { fr: "la Chine", en: "China", category: "Countries" },
    { fr: "français / française", en: "French (nationality)", category: "Nationalities" },
    { fr: "chinois / chinoise", en: "Chinese (nationality)", category: "Nationalities" },
    { fr: "étudiant / étudiante", en: "student", category: "Professions" },
    { fr: "professeur", en: "teacher / professor", category: "Professions" },
    { fr: "habiter", en: "to live (somewhere)", category: "Verbs" },
  ],
  phrases: ["Bonjour !", "Comment ça va ?", "Je m'appelle...", "Je suis...", "J'habite à..."],
  listening: "Find a beginner French greetings dialogue (e.g. a French-teaching YouTube channel) and identify the five phrases above when spoken aloud.",
  speaking: "Introduce yourself out loud in five sentences using today's phrases.",
  reading: "Read three short self-introduction examples and underline every subject pronoun + être combination.",
  writing: "Write five sentences about yourself using je m'appelle, je suis, and j'habite à.",
  review: "No prior material yet — this is Day 1.",
};

function generateFrenchLessons(startISO, endISO) {
  const totalDays = daysBetween(startISO, endISO) + 1;
  const lessons = [];
  let dayCursor = 0;
  let moduleIdx = 0;
  let dayInModule = 0;
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startISO, i);
    const dayNumber = i + 1;
    const mod = FRENCH_MODULES[Math.min(moduleIdx, FRENCH_MODULES.length - 1)];
    dayInModule++;
    // Every 6th day within a module (once module has run 5+ days) becomes a review/consolidation day (spec §27)
    const isReviewDay = dayInModule > 0 && dayInModule % 6 === 0;
    let lesson;
    if (dayNumber === 1) {
      lesson = { ...DAY1_LESSON, moduleId: mod.id, moduleTitle: mod.title, isReview: false };
    } else if (isReviewDay) {
      lesson = {
        title: `Review & Consolidation — ${mod.title}`,
        grammar: mod.grammar,
        vocabulary: [],
        phrases: [],
        listening: "Re-listen to one earlier dialogue from this module.",
        speaking: "Recap: speak for one minute using only vocabulary learned this module.",
        reading: "Re-read your own writing entries from this module and correct mistakes.",
        writing: "Write a short paragraph combining grammar points from this module.",
        review: "10 min: 5 vocabulary questions, 3 grammar questions, 2 translation prompts from this module.",
        moduleId: mod.id, moduleTitle: mod.title, isReview: true,
      };
    } else {
      const grammarPoint = mod.grammar[(dayInModule - 1) % mod.grammar.length];
      const theme = mod.vocabThemes[(dayInModule - 1) % mod.vocabThemes.length];
      lesson = {
        title: `${mod.title} — Day ${dayInModule}`,
        grammar: [grammarPoint],
        vocabulary: [], // real words logged as learned via the Vocabulary Bank
        phrases: [],
        listening: `Find a short beginner (${mod.level}) audio or video on the theme "${theme}" and note 5 words you recognise.`,
        speaking: `Speak for 2–3 minutes using today's grammar point (${grammarPoint}) and the theme "${theme}".`,
        reading: `Read a short beginner text on "${theme}" and identify today's grammar point in context.`,
        writing: `Write 5 sentences combining "${grammarPoint}" with vocabulary from "${theme}".`,
        review: dayInModule > 1 ? "10 min: quick recap of yesterday's vocabulary and grammar point." : "Review previous module before starting.",
        moduleId: mod.id, moduleTitle: mod.title, isReview: false, vocabTheme: theme,
      };
    }
    lessons.push({
      id: uid(), date, dayNumber, ...lesson,
      status: "PENDING", minutesSpent: 0, targetMinutes: 75,
    });
    if (dayInModule >= mod.days && moduleIdx < FRENCH_MODULES.length - 1) {
      moduleIdx++; dayInModule = 0;
    }
  }
  return lessons;
}

function blankFrenchCertification() {
  return { chosenCert: "", customCertName: "", registrationDate: "", examDate: "", resultsDate: "" };
}

/* -------------------------------------------------------------------------
   CHINESE FLASHCARDS
   CHINESE_SEED_VOCAB is a personally curated starter list of common
   HSK1–3 band words (not pulled from an official HSK3 wordlist) — good
   enough to get daily flashcards going, but worth spot-checking against
   a textbook. Every card is fully editable/removable once generated.
   ------------------------------------------------------------------------- */
const CHINESE_SEED_VOCAB = [
  { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "hello", exampleSentence: "你好，我叫玛丽。", exampleTranslation: "Hello, my name is Mary." },
  { hanzi: "谢谢", pinyin: "xièxie", meaning: "thank you", exampleSentence: "谢谢你的帮助。", exampleTranslation: "Thank you for your help." },
  { hanzi: "时间", pinyin: "shíjiān", meaning: "time", exampleSentence: "我没有时间。", exampleTranslation: "I don't have time." },
  { hanzi: "朋友", pinyin: "péngyou", meaning: "friend", exampleSentence: "她是我的好朋友。", exampleTranslation: "She is my good friend." },
  { hanzi: "学习", pinyin: "xuéxí", meaning: "to study", exampleSentence: "我每天学习中文。", exampleTranslation: "I study Chinese every day." },
  { hanzi: "工作", pinyin: "gōngzuò", meaning: "work / to work", exampleSentence: "他在北京工作。", exampleTranslation: "He works in Beijing." },
  { hanzi: "高兴", pinyin: "gāoxìng", meaning: "happy", exampleSentence: "认识你我很高兴。", exampleTranslation: "I'm happy to meet you." },
  { hanzi: "喜欢", pinyin: "xǐhuan", meaning: "to like", exampleSentence: "我喜欢喝茶。", exampleTranslation: "I like drinking tea." },
  { hanzi: "因为", pinyin: "yīnwèi", meaning: "because", exampleSentence: "因为下雨，我没有去。", exampleTranslation: "Because it rained, I didn't go." },
  { hanzi: "所以", pinyin: "suǒyǐ", meaning: "so / therefore", exampleSentence: "我很累，所以我要休息。", exampleTranslation: "I'm tired, so I want to rest." },
  { hanzi: "但是", pinyin: "dànshì", meaning: "but", exampleSentence: "我想去，但是没有时间。", exampleTranslation: "I want to go, but I don't have time." },
  { hanzi: "已经", pinyin: "yǐjīng", meaning: "already", exampleSentence: "他已经走了。", exampleTranslation: "He has already left." },
  { hanzi: "一直", pinyin: "yìzhí", meaning: "always / continuously", exampleSentence: "我一直很忙。", exampleTranslation: "I've been busy the whole time." },
  { hanzi: "还是", pinyin: "háishi", meaning: "or (in questions) / still", exampleSentence: "你要咖啡还是茶？", exampleTranslation: "Do you want coffee or tea?" },
  { hanzi: "或者", pinyin: "huòzhě", meaning: "or", exampleSentence: "你可以坐公交车或者地铁。", exampleTranslation: "You can take the bus or the subway." },
  { hanzi: "如果", pinyin: "rúguǒ", meaning: "if", exampleSentence: "如果明天下雨，我们就不去。", exampleTranslation: "If it rains tomorrow, we won't go." },
  { hanzi: "虽然", pinyin: "suīrán", meaning: "although", exampleSentence: "虽然很难，但是我会努力。", exampleTranslation: "Although it's hard, I will try hard." },
  { hanzi: "然后", pinyin: "ránhòu", meaning: "then / afterwards", exampleSentence: "我先吃饭，然后去上班。", exampleTranslation: "I eat first, then go to work." },
  { hanzi: "觉得", pinyin: "juéde", meaning: "to feel / to think", exampleSentence: "我觉得这个电影很好看。", exampleTranslation: "I think this movie is very good." },
  { hanzi: "认为", pinyin: "rènwéi", meaning: "to believe / to think", exampleSentence: "我认为他是对的。", exampleTranslation: "I believe he is right." },
  { hanzi: "需要", pinyin: "xūyào", meaning: "to need", exampleSentence: "我需要你的帮助。", exampleTranslation: "I need your help." },
  { hanzi: "机会", pinyin: "jīhuì", meaning: "opportunity", exampleSentence: "这是一个好机会。", exampleTranslation: "This is a good opportunity." },
  { hanzi: "经验", pinyin: "jīngyàn", meaning: "experience", exampleSentence: "他有很多工作经验。", exampleTranslation: "He has a lot of work experience." },
  { hanzi: "生活", pinyin: "shēnghuó", meaning: "life", exampleSentence: "我喜欢我的生活。", exampleTranslation: "I like my life." },
  { hanzi: "问题", pinyin: "wèntí", meaning: "problem / question", exampleSentence: "我有一个问题。", exampleTranslation: "I have a question." },
  { hanzi: "意思", pinyin: "yìsi", meaning: "meaning", exampleSentence: "这个词是什么意思？", exampleTranslation: "What does this word mean?" },
  { hanzi: "便宜", pinyin: "piányi", meaning: "cheap", exampleSentence: "这个手机很便宜。", exampleTranslation: "This phone is cheap." },
  { hanzi: "贵", pinyin: "guì", meaning: "expensive", exampleSentence: "那家饭店太贵了。", exampleTranslation: "That restaurant is too expensive." },
  { hanzi: "快", pinyin: "kuài", meaning: "fast", exampleSentence: "他走得很快。", exampleTranslation: "He walks very fast." },
  { hanzi: "慢", pinyin: "màn", meaning: "slow", exampleSentence: "请说慢一点。", exampleTranslation: "Please speak a bit slower." },
  { hanzi: "忙", pinyin: "máng", meaning: "busy", exampleSentence: "我今天很忙。", exampleTranslation: "I'm very busy today." },
  { hanzi: "累", pinyin: "lèi", meaning: "tired", exampleSentence: "我今天很累。", exampleTranslation: "I'm very tired today." },
  { hanzi: "打算", pinyin: "dǎsuàn", meaning: "to plan", exampleSentence: "我打算明年去中国。", exampleTranslation: "I plan to go to China next year." },
  { hanzi: "希望", pinyin: "xīwàng", meaning: "to hope", exampleSentence: "我希望你能来。", exampleTranslation: "I hope you can come." },
  { hanzi: "决定", pinyin: "juédìng", meaning: "to decide", exampleSentence: "她决定学习中文。", exampleTranslation: "She decided to study Chinese." },
  { hanzi: "准备", pinyin: "zhǔnbèi", meaning: "to prepare", exampleSentence: "我在准备考试。", exampleTranslation: "I am preparing for the exam." },
  { hanzi: "考试", pinyin: "kǎoshì", meaning: "exam", exampleSentence: "下周有一个考试。", exampleTranslation: "There is an exam next week." },
  { hanzi: "记得", pinyin: "jìde", meaning: "to remember", exampleSentence: "我记得他的名字。", exampleTranslation: "I remember his name." },
  { hanzi: "忘记", pinyin: "wàngjì", meaning: "to forget", exampleSentence: "我忘记带钱包了。", exampleTranslation: "I forgot to bring my wallet." },
  { hanzi: "告诉", pinyin: "gàosu", meaning: "to tell", exampleSentence: "请告诉我你的名字。", exampleTranslation: "Please tell me your name." },
  { hanzi: "应该", pinyin: "yīnggāi", meaning: "should", exampleSentence: "你应该早点睡觉。", exampleTranslation: "You should sleep earlier." },
  { hanzi: "可能", pinyin: "kěnéng", meaning: "maybe / possible", exampleSentence: "明天可能会下雨。", exampleTranslation: "It might rain tomorrow." },
  { hanzi: "一定", pinyin: "yídìng", meaning: "definitely", exampleSentence: "我一定会来。", exampleTranslation: "I will definitely come." },
  { hanzi: "特别", pinyin: "tèbié", meaning: "especially / special", exampleSentence: "这个地方特别漂亮。", exampleTranslation: "This place is especially beautiful." },
  { hanzi: "其实", pinyin: "qíshí", meaning: "actually", exampleSentence: "其实我不喜欢咖啡。", exampleTranslation: "Actually, I don't like coffee." },
  { hanzi: "一般", pinyin: "yìbān", meaning: "generally / ordinary", exampleSentence: "我一般七点起床。", exampleTranslation: "I generally get up at 7." },
  { hanzi: "突然", pinyin: "tūrán", meaning: "suddenly", exampleSentence: "他突然站起来了。", exampleTranslation: "He suddenly stood up." },
  { hanzi: "提前", pinyin: "tíqián", meaning: "in advance", exampleSentence: "请提前告诉我。", exampleTranslation: "Please tell me in advance." },
  { hanzi: "环境", pinyin: "huánjìng", meaning: "environment", exampleSentence: "这里的环境很好。", exampleTranslation: "The environment here is very good." },
  { hanzi: "关系", pinyin: "guānxi", meaning: "relationship", exampleSentence: "他们的关系很好。", exampleTranslation: "Their relationship is good." },
];

// Simple, explicit spaced-repetition intervals (not SM-2) — editable here
// if a better schedule is found.
const CHINESE_REVIEW_INTERVALS = { DIFFICULT: 0, NEED_REVIEW: 1, LEARNED: 3, MASTERED: 7 };

function blankChineseFlashcard() {
  return {
    id: null,
    hanzi: "", pinyin: "", meaning: "", exampleSentence: "", exampleTranslation: "",
    status: "NEW", // NEW, then one of DIFFICULT / NEED_REVIEW / LEARNED / MASTERED after first review
    nextReviewDate: null,
    lastReviewedDate: null,
    addedDate: todayISO(),
    isCustom: false,
  };
}

function blankChineseExam() {
  return {
    registrationDate: "2026-12-03", examDate: "2026-12-13", resultsDate: "",
    confirmed: false, // unofficial-dates badge shows until Karina confirms or edits
  };
}

// Safe-upgrade for accounts created before flashcards existed — goals.chinese
// used to be just {logs, vocabCount, totalMinutes}. Never overwrites
// anything already present, only fills in what's missing.
function ensureChineseShape(chinese) {
  const c = chinese || {};
  return {
    logs: Array.isArray(c.logs) ? c.logs : [],
    vocabCount: c.vocabCount || 0,
    totalMinutes: c.totalMinutes || 0,
    flashcards: Array.isArray(c.flashcards) ? c.flashcards : [],
    streak: c.streak || 0,
    daysStudied: c.daysStudied || 0,
    lastStudyDate: c.lastStudyDate || null,
    exam: c.exam || blankChineseExam(),
  };
}
// Portfolio was previously a single 9-stage "urbanism case study" object,
// inconsistently split across goals.portfolio (the initGoals default) and
// goals.urbanism (what the tab actually wrote to once touched — a
// pre-existing bug). This consolidates both into one goals.portfolio.projects[]
// array under the new 5-stage shape, carrying forward anything already
// written instead of discarding it.
const PORTFOLIO_STAGES = ["Project idea", "Research", "Development", "Finalization", "Portfolio integration"];
function blankPortfolioProject() {
  return {
    id: uid(), title: "", stage: PORTFOLIO_STAGES[0],
    competition: { name: "", deadline: "" },
    research: { literatureId: null, notes: "" },
    thesisSectionKey: "",
    cvNote: "",
  };
}
const OLD_PORTFOLIO_STAGE_MAP = {
  RESEARCH: "Research", SITE: "Research", PROBLEM: "Research", USERS: "Research",
  CONCEPT: "Development", "URBAN STRATEGY": "Development", DEVELOPMENT: "Development",
  VISUALIZATION: "Finalization", "FINAL CASE STUDY": "Portfolio integration",
};
function ensurePortfolioShape(raw) {
  const current = raw && raw.portfolio;
  if (current && Array.isArray(current.projects)) return current;
  const old = (raw && raw.urbanism) || current || null;
  if (!old || !old.stages) return { projects: [blankPortfolioProject()] };
  const carried = ["site", "problem", "users", "concept", "strategy", "notes"]
    .map((k) => (old.project && old.project[k] ? `${k.charAt(0).toUpperCase()}${k.slice(1)}: ${old.project[k]}` : null))
    .filter(Boolean).join("\n\n");
  return {
    projects: [{
      id: uid(),
      title: (old.project && old.project.title) || "",
      stage: OLD_PORTFOLIO_STAGE_MAP[old.stage] || PORTFOLIO_STAGES[0],
      competition: { name: old.competitionLinked || "", deadline: "" },
      research: { literatureId: null, notes: carried },
      thesisSectionKey: "",
      cvNote: "",
    }],
  };
}
function portfolioGoalsNeedsUpgrade(raw) {
  return !(raw && raw.portfolio && Array.isArray(raw.portfolio.projects));
}

const LEARNING_RESOURCE_TYPES = ["Article", "Case Study", "Video", "Book", "Concept"];
function blankLearningResource() {
  return { id: null, title: "", link: "", type: "Article", relevance: "", howItHelps: "", status: "TO_READ" };
}

// Safe-upgrade: goals.internship used to be just {applications, active} —
// adds the Daily Professional Learning list, and (for accounts that already
// activated an internship) renames the old free-text "attendance" log to
// "hours" and fills in the two new log kinds (learned, weeklyReflections)
// without touching anything already written.
function ensureInternshipShape(internship) {
  const i = internship || { applications: [], active: null };
  const applications = Array.isArray(i.applications) ? i.applications : [];
  const learning = Array.isArray(i.learning) ? i.learning : [];
  let active = i.active || null;
  if (active) {
    const { attendance, ...restActive } = active;
    active = {
      ...restActive,
      hours: Array.isArray(active.hours) ? active.hours : (Array.isArray(attendance) ? attendance : []),
      projects: Array.isArray(active.projects) ? active.projects : [],
      learned: Array.isArray(active.learned) ? active.learned : [],
      skills: Array.isArray(active.skills) ? active.skills : [],
      deliverables: Array.isArray(active.deliverables) ? active.deliverables : [],
      notes: Array.isArray(active.notes) ? active.notes : [],
      weeklyReflections: Array.isArray(active.weeklyReflections) ? active.weeklyReflections : [],
    };
  }
  return { applications, active, learning };
}
function internshipGoalsNeedsUpgrade(raw) {
  const i = raw && raw.internship;
  if (!i || !Array.isArray(i.learning)) return true;
  if (i.active && !(Array.isArray(i.active.hours) && Array.isArray(i.active.learned) && Array.isArray(i.active.weeklyReflections))) return true;
  return false;
}

function normalizeGoals(raw) {
  if (!raw) return initGoals();
  const { urbanism, ...rest } = raw;
  return { ...rest, chinese: ensureChineseShape(raw.chinese), portfolio: ensurePortfolioShape(raw), internship: ensureInternshipShape(raw.internship) };
}
function chineseGoalsNeedsUpgrade(raw) {
  return !(
    raw && raw.chinese && Array.isArray(raw.chinese.flashcards) &&
    typeof raw.chinese.streak === "number" && raw.chinese.exam
  );
}

function initGoals() {
  return {
    internship: { applications: [], active: null, learning: [] },
    french: {
      modules: FRENCH_MODULES,
      lessons: generateFrenchLessons("2026-08-15", "2026-10-31"),
      vocabBank: [],
      currentDayIndex: 0,
      certification: blankFrenchCertification(),
    },
    chinese: {
      logs: [], vocabCount: 0, totalMinutes: 0,
      flashcards: [], streak: 0, daysStudied: 0, lastStudyDate: null,
      exam: blankChineseExam(),
    },
    portfolio: { projects: [blankPortfolioProject()] },
  };
}

function initCalendar() {
  const start = "2026-08-15";
  return {
    tasks: [
      { id: uid(), title: "Supervisor meeting — thesis kickoff", date: addDays(start, 6), time: "14:00", duration: 60, category: "Thesis", priority: "High", notes: "Bring preparation checklist.", completed: false, recurrence: "none" },
      { id: uid(), title: "Start literature review", date: start, time: "09:00", duration: 120, category: "Thesis", priority: "High", notes: "", completed: false, recurrence: "none" },
    ],
  };
}

function initMeta() {
  return { xp: 0, xpLog: [], topPriorities: {}, weeklyReviews: [] };
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
function StatusPill({ status }) {
  const map = {
    "ON TRACK": "pt-pill-ontrack", "AT RISK": "pt-pill-atrisk", "BEHIND": "pt-pill-behind",
    "COMPLETED": "pt-pill-completed", "NOT STARTED": "pt-pill-neutral", "IN PROGRESS": "pt-pill-atrisk",
    "PLANNED": "pt-pill-neutral", "OBSERVED": "pt-pill-ontrack",
    "UNREAD": "pt-pill-neutral", "READING": "pt-pill-atrisk", "ANALYSED": "pt-pill-ontrack",
    "RESEARCHING": "pt-pill-neutral", "CONTACTED": "pt-pill-atrisk", "APPLIED": "pt-pill-atrisk",
    "INTERVIEW": "pt-pill-atrisk", "OFFER": "pt-pill-ontrack", "REJECTED": "pt-pill-behind",
    "IDEA": "pt-pill-neutral", "DRAFT": "pt-pill-neutral", "SUPERVISOR REVIEW": "pt-pill-atrisk",
    "PILOT": "pt-pill-atrisk", "REVISED": "pt-pill-atrisk", "PUBLISHED": "pt-pill-ontrack",
    "COLLECTING RESPONSES": "pt-pill-ontrack", "CLOSED": "pt-pill-completed",
    "PREPARING": "pt-pill-atrisk", "SUBMITTED": "pt-pill-atrisk", "UNDER REVIEW": "pt-pill-atrisk", "ACCEPTED": "pt-pill-ontrack",
    "PENDING": "pt-pill-neutral",
    "STRONG SUPPORT": "pt-pill-ontrack", "WEAK SUPPORT": "pt-pill-atrisk", "GAP": "pt-pill-behind",
    "NEW": "pt-pill-neutral", "DIFFICULT": "pt-pill-behind", "NEED_REVIEW": "pt-pill-atrisk",
    "LEARNED": "pt-pill-ontrack", "MASTERED": "pt-pill-completed",
  };
  return <span className={`pt-pill ${map[status] || "pt-pill-neutral"}`}>{String(status).replace(/_/g, " ")}</span>;
}

function ProgressBar({ pct, color }) {
  return (
    <div className="pt-bar-track">
      <div className="pt-bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

function Field({ label, children }) {
  return <div className="pt-field"><label className="pt-label">{label}</label>{children}</div>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="pt-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pt-modal" style={wide ? { maxWidth: 720 } : undefined}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 className="pt-h2">{title}</h3>
          <button className="pt-btn pt-btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="pt-empty">{text}</div>;
}

// Scrollable multi-select used everywhere a manual link needs picking from
// an existing list (articles, framework concepts, methodology blocks…).
function CheckboxList({ items, selectedIds, onChange, getLabel, emptyText }) {
  if (items.length === 0) return <EmptyState text={emptyText || "Nothing to select yet."} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: 10 }}>
      {items.map((item) => (
        <label key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => onChange(selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id])}
          />
          {getLabel(item)}
        </label>
      ))}
    </div>
  );
}

// Generalized toast — same visual pattern as the original XP toast, extended
// to also carry a plain message and/or an Undo action for non-XP feedback.
function AppToast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="pt-xp-toast">
      <Sparkles size={15} />
      <span>{toast.amount != null ? `+${toast.amount} XP — ${toast.reason}` : toast.message}</span>
      {toast.undo && (
        <button className="pt-toast-undo" onClick={() => { toast.undo(); onDismiss(); }}>Undo</button>
      )}
    </div>
  );
}

// Reusable confirmation prompt for actions that can't easily be undone
// in place (e.g. a one-way status switch, or overwriting all local data).
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }) {
  return (
    <div className="pt-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pt-modal" style={{ maxWidth: 420 }}>
        <h3 className="pt-h2" style={{ marginBottom: 10 }}>{title}</h3>
        <p className="pt-sub" style={{ marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="pt-btn" onClick={onCancel}>Cancel</button>
          <button className={`pt-btn ${danger ? "pt-btn-danger" : "pt-btn-primary"}`} style={danger ? { borderColor: "var(--behind)" } : undefined} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// Collapsed by default — used for secondary panels that should stay
// reachable without competing for visual attention (academic-workspace
// tone rather than everything-expanded dashboard noise).
function Collapsible({ title, subtitle, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="pt-card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div>
          <div className="pt-h2" style={{ fontSize: 15, margin: 0 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        <ChevronDown size={16} color="var(--ink-faint)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */
export default function Tracker({ onSignOut }) {
  const [settings, saveSettings, sLoaded] = useStore("settings", initSettings);
  const [thesisRaw, saveThesis, tLoaded] = useStore("thesis", initThesis);
  const [goalsRaw, saveGoals, gLoaded] = useStore("goals", initGoals);
  const [calendar, saveCalendar, cLoaded] = useStore("calendar", initCalendar);
  const [meta, saveMeta, mLoaded] = useStore("meta", initMeta);
  const [literatureRaw, saveLiterature, lLoaded] = useStore("literature", initLiterature);

  const [nav, setNav] = useState("home");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const migratedRef = useRef(false);

  const allLoaded = sLoaded && tLoaded && gLoaded && cLoaded && mLoaded && lLoaded;

  // Render-safe: always compute the current-shape thesis/goals, even before
  // the one-time upgrade below has persisted back to Supabase.
  const thesis = useMemo(() => migrateThesis(thesisRaw), [thesisRaw]);
  const goals = useMemo(() => normalizeGoals(goalsRaw), [goalsRaw]);
  const literature = useMemo(() => ensureLiteratureShape(literatureRaw), [literatureRaw]);

  // One-time upgrade: old accounts (pre 11-section rebuild / pre-flashcards)
  // get their thesis and goals rows rewritten to the current shape, and any
  // articles that used to live inside thesis.literature are moved into
  // their own store. Runs once per load, only if needed.
  useEffect(() => {
    if (!allLoaded || migratedRef.current) return;
    migratedRef.current = true;
    const needsThesisUpgrade = !(
      thesisRaw && thesisRaw.sections && Array.isArray(thesisRaw.components) &&
      Array.isArray(thesisRaw.claims) && Array.isArray(thesisRaw.contradictions) &&
      thesisRaw.sections.framework && thesisRaw.sections.framework.conceptsSeeded === true
    );
    if (needsThesisUpgrade) saveThesis(migrateThesis(thesisRaw));
    if (chineseGoalsNeedsUpgrade(goalsRaw) || portfolioGoalsNeedsUpgrade(goalsRaw) || internshipGoalsNeedsUpgrade(goalsRaw)) saveGoals(normalizeGoals(goalsRaw));
    const oldArticles = Array.isArray(thesisRaw && thesisRaw.literature) ? thesisRaw.literature : [];
    if (oldArticles.length > 0 && literature.articles.length === 0) {
      saveLiterature({ articles: oldArticles.map(migrateLiteratureArticle), researchGaps: [] });
    } else if (literatureNeedsUpgrade(literatureRaw)) {
      saveLiterature(ensureLiteratureShape(literatureRaw));
    }
    // eslint-disable-next-line
  }, [allLoaded]);

  const showToast = useCallback((data, duration) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(data);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Generic feedback toast for create/edit/delete actions. Pass `undo` to
  // let the user reverse the action for a few seconds after it happens.
  const notify = useCallback((message, undo) => {
    showToast({ message, undo }, undo ? 6000 : 3000);
  }, [showToast]);

  const addXP = useCallback((amount, reason, undo) => {
    saveMeta((prev) => ({ ...prev, xp: (prev.xp || 0) + amount, xpLog: [{ id: uid(), date: todayISO(), amount, reason }, ...(prev.xpLog || [])].slice(0, 200) }));
    showToast({ amount, reason, undo }, undo ? 6000 : 2600);
  }, [saveMeta, showToast]);

  if (!allLoaded) {
    return (
      <div className="pt-root" style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
        <style>{TOKENS}</style>
        <FontLoader />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--ink-soft)" }}>
          <Loader2 className="pt-spin" size={22} />
          <span style={{ fontSize: 13 }}>Loading your tracker…</span>
        </div>
        <style>{`.pt-spin{ animation: spin 1s linear infinite; } @keyframes spin{ to{ transform:rotate(360deg);} }`}</style>
      </div>
    );
  }

  const ctx = { settings, saveSettings, thesis, saveThesis, goals, saveGoals, calendar, saveCalendar, meta, saveMeta, literature, saveLiterature, addXP, notify, nav, setNav, onSignOut };

  return (
    <div className="pt-root">
      <style>{TOKENS}</style>
      <FontLoader />
      <Sidebar ctx={ctx} />
      <main className="pt-main">
        {nav === "home" && <HomeScreen ctx={ctx} />}
        {nav === "thesis" && <ThesisScreen ctx={ctx} />}
        {nav === "french" && <FrenchScreen ctx={ctx} />}
        {nav === "chinese" && <ChineseScreen ctx={ctx} />}
        {nav === "internship" && <InternshipScreen ctx={ctx} />}
        {nav === "portfolio" && <PortfolioScreen ctx={ctx} />}
        {nav === "calendar" && <CalendarScreen ctx={ctx} />}
        {nav === "settings" && <SettingsScreen ctx={ctx} />}
      </main>
      <AppToast toast={toast} onDismiss={() => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); setToast(null); }} />
    </div>
  );
}

/* =========================================================================
   SIDEBAR
   ========================================================================= */
function Sidebar({ ctx }) {
  const { nav, setNav, onSignOut } = ctx;
  const items = [
    { key: "home", label: "Dashboard", icon: Home },
    { key: "thesis", label: "Thesis", icon: FlaskConical },
    { key: "french", label: "French", icon: Languages },
    { key: "chinese", label: "Chinese", icon: BookOpen },
    { key: "internship", label: "Internship", icon: Briefcase },
    { key: "portfolio", label: "Portfolio", icon: Building2 },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <aside className="pt-sidebar">
      <div className="pt-brand">Field Notes<span>Personal Tracker</span></div>
      <nav className="pt-nav">
        {items.map((it) => (
          <button
            key={it.key}
            className={`pt-nav-item ${nav === it.key ? "active" : ""}`}
            onClick={() => setNav(it.key)}
          >
            <it.icon size={16} /> {it.label}
          </button>
        ))}
      </nav>
      <div className="pt-sidebar-spacer" style={{ flex: 1 }} />
      <div className="pt-nav-divider" />
      <div className="pt-sidebar-note" style={{ padding: "0 10px", fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5, marginBottom: 10 }}>
        Private to your account.<br />Data syncs across devices.
      </div>
      <button className="pt-nav-item" onClick={onSignOut}>
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}

/* =========================================================================
   DERIVED PROGRESS CALCULATIONS
   ========================================================================= */
function computeThesisProgress(thesis, settings) {
  const plan = computeThesisPlan(settings);
  const timePct = Math.min(100, Math.round((plan.daysElapsed / plan.totalDays) * 100));
  const allActions = thesis.components.flatMap((c) => c.actions);
  const pct = allActions.length > 0 ? Math.round((allActions.filter((a) => a.done).length / allActions.length) * 100) : 0;
  let status = "ON TRACK";
  if (pct < timePct - 20) status = "BEHIND"; else if (pct < timePct - 8) status = "AT RISK";
  if (plan.daysLeft === 0 && pct >= 100) status = "COMPLETED";
  const currentPhase = plan.phases[plan.currentIndex];
  return { pct, current: currentPhase.title, next: `${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} to midterm`, status, timePct, plan };
}
function computeFrenchProgress(french) {
  const lessons = french.lessons;
  const completed = lessons.filter((l) => l.status === "COMPLETED").length;
  const pct = Math.round((completed / lessons.length) * 100);
  const nextLesson = lessons.find((l) => l.status !== "COMPLETED");
  const status = pct >= 100 ? "COMPLETED" : "ON TRACK";
  return { pct, current: nextLesson ? nextLesson.moduleTitle : "A2 reached", next: nextLesson ? `Day ${nextLesson.dayNumber}: ${nextLesson.title}` : "Consolidation", status };
}
function computeChineseProgress(chinese, settings) {
  const totalDays = Math.max(1, daysBetween(settings.trackerStart, settings.chineseTarget));
  const daysElapsed = Math.max(0, daysBetween(settings.trackerStart, todayISO()));
  const timePct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  const wordTarget = 1200; // realistic HSK3 vocabulary size, used only to compute a display percentage
  const wordsLearned = (chinese.flashcards || []).filter((c) => c.status === "MASTERED" || c.status === "LEARNED").length;
  const pct = Math.min(100, Math.round((wordsLearned / wordTarget) * 100));
  let status = "ON TRACK";
  if (pct < timePct - 20) status = "BEHIND"; else if (pct < timePct - 8) status = "AT RISK";
  return { pct, current: `${wordsLearned} words learned`, next: "Review today's flashcards", status, wordTarget };
}
function computeInternshipProgress(internship) {
  if (internship.active) return { pct: 100, current: internship.active.company, next: internship.active.position || "Active internship", status: "ON TRACK" };
  const n = internship.applications.length;
  const pct = Math.min(100, n * 8);
  const hasOffer = internship.applications.some((a) => a.status === "OFFER");
  return {
    pct,
    current: hasOffer ? "Offer received" : "Searching",
    next: `${n} application${n === 1 ? "" : "s"} tracked`,
    status: hasOffer ? "ON TRACK" : (n === 0 ? "BEHIND" : "AT RISK"),
  };
}
function computePortfolioProgress(portfolio) {
  const project = portfolio.projects[0];
  const idx = PORTFOLIO_STAGES.indexOf(project.stage);
  const pct = Math.round(((idx + 1) / PORTFOLIO_STAGES.length) * 100);
  const isLast = idx === PORTFOLIO_STAGES.length - 1;
  return { pct, current: project.stage, next: isLast ? "Done" : `Move to: ${PORTFOLIO_STAGES[idx + 1]}`, status: isLast ? "COMPLETED" : "ON TRACK" };
}

const GOAL_META = {
  thesis: { label: "Thesis", icon: FlaskConical, color: "var(--thesis)", soft: "var(--thesis-soft)", nav: "thesis" },
  internship: { label: "Internship", icon: Briefcase, color: "var(--internship)", soft: "var(--internship-soft)", nav: "internship" },
  french: { label: "French A2", icon: Languages, color: "var(--french)", soft: "var(--french-soft)", nav: "french" },
  chinese: { label: "Chinese HSK3", icon: BookOpen, color: "var(--chinese)", soft: "var(--chinese-soft)", nav: "chinese" },
  portfolio: { label: "Portfolio", icon: Building2, color: "var(--urbanism)", soft: "var(--urbanism-soft)", nav: "portfolio" },
};

/* =========================================================================
   HOME SCREEN
   ========================================================================= */
function HomeScreen({ ctx }) {
  const { settings, thesis, goals, calendar, meta, saveMeta, saveCalendar, setNav, addXP, notify } = ctx;
  const daysLeft = daysBetween(todayISO(), settings.thesisMidterm);

  const today = todayISO();
  const priorities = meta.topPriorities[today] || [];

  const thesisP = computeThesisProgress(thesis, settings);
  const frenchP = computeFrenchProgress(goals.french);
  const chineseP = computeChineseProgress(goals.chinese, settings);
  const internshipP = computeInternshipProgress(goals.internship);
  const portfolioP = computePortfolioProgress(goals.portfolio);

  const cards = [
    { key: "thesis", ...thesisP },
    { key: "french", ...frenchP },
    { key: "chinese", ...chineseP },
    { key: "internship", ...internshipP },
    { key: "portfolio", ...portfolioP },
  ];

  const todaysTasks = useMemo(
    () => calendar.tasks.filter((t) => t.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [calendar.tasks, today]
  );
  const tasksCompletedToday = todaysTasks.filter((t) => t.completed).length;

  function toggleTask(t) {
    saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)) }));
    if (!t.completed) addXP(10, "Task completed");
  }

  function togglePriority(id) {
    saveMeta((prev) => {
      const list = prev.topPriorities[today] || [];
      const next = list.map((p) => (p.id === id ? { ...p, done: !p.done } : p));
      return { ...prev, topPriorities: { ...prev.topPriorities, [today]: next } };
    });
  }
  function addPriority(text) {
    if (!text.trim()) return;
    saveMeta((prev) => {
      const list = prev.topPriorities[today] || [];
      if (list.length >= 3) return prev;
      return { ...prev, topPriorities: { ...prev.topPriorities, [today]: [...list, { id: uid(), text, done: false }] } };
    });
  }
  function removePriority(id) {
    const removed = (meta.topPriorities[today] || []).find((p) => p.id === id);
    saveMeta((prev) => ({ ...prev, topPriorities: { ...prev.topPriorities, [today]: (prev.topPriorities[today] || []).filter((p) => p.id !== id) } }));
    if (removed) {
      notify("Priority removed", () => saveMeta((prev) => {
        const list = prev.topPriorities[today] || [];
        if (list.some((p) => p.id === id)) return prev;
        return { ...prev, topPriorities: { ...prev.topPriorities, [today]: [...list, removed] } };
      }));
    }
  }
  const [newPriority, setNewPriority] = useState("");

  // Weekly review — folded in from the old standalone Progress screen.
  const [reviewDraft, setReviewDraft] = useState({ achievement: "", nextWeek: ["", "", ""] });
  function saveReview() {
    if (!reviewDraft.achievement.trim()) return;
    saveMeta((prev) => ({ ...prev, weeklyReviews: [{ id: uid(), date: todayISO(), ...reviewDraft }, ...prev.weeklyReviews] }));
    setReviewDraft({ achievement: "", nextWeek: ["", "", ""] });
    notify("Weekly review saved");
  }

  return (
    <div>
      <div className="pt-eyebrow">Dashboard</div>
      <h1 className="pt-h1">Overview</h1>
      <p className="pt-sub" style={{ marginBottom: 26 }}>Where every track stands today.</p>

      <div className="pt-hero" style={{ marginBottom: 22 }}>
        <div className="pt-hero-label">Thesis Midterm · {fmtDate(settings.thesisMidterm)}</div>
        <div className="pt-hero-count">{daysLeft >= 0 ? daysLeft : 0}</div>
        <div className="pt-hero-days">days left</div>
      </div>

      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Tracks</div>
      <div className="pt-grid5" style={{ marginBottom: 22 }}>
        {cards.map((c) => {
          const m = GOAL_META[c.key];
          return (
            <div key={c.key} className="pt-goalcard" onClick={() => setNav(m.nav)}>
              <div className="pt-goalcard-icon" style={{ background: m.soft }}><m.icon size={16} color={m.color} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8 }}>{c.pct}%</div>
              <ProgressBar pct={c.pct} color={m.color} />
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.4 }}>{c.current}</div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.3 }}>{c.next}</div>
              <div style={{ marginTop: 8 }}><StatusPill status={c.status} /></div>
            </div>
          );
        })}
      </div>

      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Today</div>
      <div className="pt-grid2" style={{ marginBottom: 22 }}>
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 14, marginBottom: 14 }}>Priorities</div>
          {priorities.length === 0 && <EmptyState text="No priorities set for today yet." />}
          {priorities.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => togglePriority(p.id)}>
                {p.done ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
              </button>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: p.done ? "line-through" : "none", color: p.done ? "var(--ink-faint)" : "var(--ink)" }}>{p.text}</span>
              <button className="pt-btn-ghost pt-btn pt-tap" onClick={() => removePriority(p.id)}><X size={13} /></button>
            </div>
          ))}
          {priorities.length < 3 && (
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <input className="pt-input" placeholder="Add a priority…" value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newPriority.trim()) { addPriority(newPriority); setNewPriority(""); } }} />
              <button className="pt-btn pt-btn-primary" disabled={!newPriority.trim()} onClick={() => { addPriority(newPriority); setNewPriority(""); }}><Plus size={14} /></button>
            </div>
          )}
        </div>

        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="pt-h2" style={{ fontSize: 14, margin: 0 }}>Scheduled today</div>
            <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{tasksCompletedToday} / {todaysTasks.length}</span>
          </div>
          {todaysTasks.length === 0 ? <EmptyState text="Nothing scheduled today." /> : todaysTasks.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => toggleTask(t)}>
                {t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
              </button>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</span>
              <span className="pt-chip">{t.category}</span>
            </div>
          ))}
          <button className="pt-btn pt-btn-sm" style={{ marginTop: 12 }} onClick={() => setNav("calendar")}>Open calendar <ChevronRight size={12} /></button>
        </div>
      </div>

      <Collapsible title="Weekly review" subtitle={`${meta.xp} pts · ${goals.french.streak || 0} day streak`}>
        <div className="pt-grid5" style={{ marginBottom: 16, marginTop: 4 }}>
          {cards.map((c) => (
            <div key={c.key}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>{GOAL_META[c.key].label}</div>
              <div style={{ fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{c.pct}%</div>
            </div>
          ))}
        </div>
        <Field label="Biggest achievement this week"><textarea className="pt-textarea" value={reviewDraft.achievement} onChange={(e) => setReviewDraft({ ...reviewDraft, achievement: e.target.value })} /></Field>
        <div className="pt-label" style={{ marginBottom: 6 }}>Next week — top 3 priorities</div>
        {reviewDraft.nextWeek.map((v, i) => (
          <input key={i} className="pt-input" style={{ marginBottom: 8 }} value={v} onChange={(e) => { const nw = [...reviewDraft.nextWeek]; nw[i] = e.target.value; setReviewDraft({ ...reviewDraft, nextWeek: nw }); }} />
        ))}
        {!reviewDraft.achievement.trim() && <div className="pt-field-error">Biggest achievement is required.</div>}
        <button className="pt-btn pt-btn-primary" disabled={!reviewDraft.achievement.trim()} onClick={saveReview}><Check size={14} /> Save weekly review</button>

        {meta.weeklyReviews.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="pt-label" style={{ marginBottom: 8 }}>Past reviews</div>
            {meta.weeklyReviews.map((r) => (
              <div key={r.id} className="pt-card pt-card-tight" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>{fmtDate(r.date)}</div>
                <div style={{ fontSize: 13 }}>{r.achievement}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>Next: {r.nextWeek.filter(Boolean).join(" · ")}</div>
              </div>
            ))}
          </div>
        )}
      </Collapsible>
    </div>
  );
}

/* =========================================================================
   THESIS SCREEN
   ========================================================================= */
const THESIS_TABS = [
  { key: "plan", label: "Plan" },
  { key: "literature", label: "Literature" },
  { key: "claims", label: "Claims" },
  { key: "contradictions", label: "Contradictions" },
  ...THESIS_SECTIONS_META.map((s) => ({ key: s.key, label: `${s.number} · ${s.short}` })),
];

function ThesisScreen({ ctx }) {
  const [tab, setTab] = useState("plan");
  const { settings } = ctx;
  const plan = computeThesisPlan(settings);
  const currentPhase = plan.phases[plan.currentIndex];

  return (
    <div>
      <div className="pt-eyebrow">Priority Goal</div>
      <h1 className="pt-h1">Thesis & Research</h1>
      <p className="pt-sub" style={{ marginBottom: 6 }}>Informal Learning Spaces in Shanghai Universities: Emotional Experience and Learning Behavior</p>
      <p className="pt-sub" style={{ marginBottom: 24, fontWeight: 600, color: "var(--thesis)" }}>
        {plan.daysLeft} days to midterm — {fmtDate(settings.thesisMidterm)} · This week: {currentPhase.title}
      </p>

      <div className="pt-tabs">
        {THESIS_TABS.map((t) => (
          <div key={t.key} className={`pt-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab === "plan" && <ThesisPlanTab ctx={ctx} />}
      {tab === "literature" && <LiteratureScreen ctx={ctx} />}
      {tab === "claims" && <ClaimsTab ctx={ctx} />}
      {tab === "contradictions" && <ContradictionsTab ctx={ctx} />}
      {THESIS_SECTIONS_META.some((s) => s.key === tab) && <ThesisSectionTab ctx={ctx} sectionKey={tab} />}

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="pt-label" style={{ marginBottom: -4 }}>More</div>
        <Collapsible title="Supervisor"><SupervisorTab ctx={ctx} /></Collapsible>
        <Collapsible title="Research Outputs"><OutputsTab ctx={ctx} /></Collapsible>
        <Collapsible title="Time Tracking"><TimeTrackingTab ctx={ctx} /></Collapsible>
      </div>
    </div>
  );
}

function ThesisPlanTab({ ctx }) {
  const { settings, thesis, saveThesis, saveCalendar, notify } = ctx;
  const plan = computeThesisPlan(settings);

  function addAction(componentId, text) {
    if (!text.trim()) return;
    saveThesis((prev) => ({ ...prev, components: prev.components.map((c) => (c.id === componentId ? { ...c, actions: [...c.actions, { id: uid(), text, done: false, createdAt: todayISO() }] } : c)) }));
  }
  function toggleAction(componentId, actionId) {
    saveThesis((prev) => ({ ...prev, components: prev.components.map((c) => (c.id === componentId ? { ...c, actions: c.actions.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)) } : c)) }));
  }
  function removeAction(componentId, actionId) {
    const comp = thesis.components.find((c) => c.id === componentId);
    const removed = comp.actions.find((a) => a.id === actionId);
    saveThesis((prev) => ({ ...prev, components: prev.components.map((c) => (c.id === componentId ? { ...c, actions: c.actions.filter((a) => a.id !== actionId) } : c)) }));
    notify("Action removed", () => saveThesis((prev) => ({ ...prev, components: prev.components.map((c) => (c.id === componentId ? { ...c, actions: c.actions.some((a) => a.id === actionId) ? c.actions : [...c.actions, removed] } : c)) })));
  }
  function sendActionToCalendar(component, action) {
    sendToCalendar(saveCalendar, notify, { title: action.text, category: "Thesis", type: "Task", linkedType: "Thesis action", linkedId: action.id, notes: `From strategic component: ${component.name}` });
  }

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Retro-plan</div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 14 }}>
          {fmtDate(settings.trackerStart)} → {fmtDate(settings.thesisMidterm)} — recalculates automatically if either date changes in Settings.
        </div>
        <div className="pt-timeline">
          {plan.phases.map((p, i) => (
            <div className="pt-tl-row" key={p.key}>
              <div className="pt-tl-rail">
                <div className={`pt-tl-dot ${i < plan.currentIndex ? "done" : ""}`} />
                {i < plan.phases.length - 1 && <div className="pt-tl-line" />}
              </div>
              <div className="pt-tl-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{fmtDate(p.start)} – {fmtDate(p.end)}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 4, maxWidth: 460 }}>{p.description}</div>
                  </div>
                  {i === plan.currentIndex && <StatusPill status="IN PROGRESS" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Strategic components & daily actions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {thesis.components.map((c) => (
          <ThesisComponentCard key={c.id} component={c} onAdd={(t) => addAction(c.id, t)} onToggle={(aid) => toggleAction(c.id, aid)} onRemove={(aid) => removeAction(c.id, aid)} onSendToCalendar={(a) => sendActionToCalendar(c, a)} />
        ))}
      </div>
    </div>
  );
}

function ThesisComponentCard({ component, onAdd, onToggle, onRemove, onSendToCalendar }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const done = component.actions.filter((a) => a.done).length;
  return (
    <div className="pt-card">
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{component.name}</div>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{done} / {component.actions.length}</span>
        </div>
        <ChevronDown size={16} color="var(--ink-faint)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
      </button>
      {component.actions.length > 0 && <div style={{ marginTop: 10 }}><ProgressBar pct={(done / Math.max(1, component.actions.length)) * 100} color="var(--thesis)" /></div>}
      {open && (
        <div style={{ marginTop: 14 }}>
          {component.actions.length === 0 ? <EmptyState text="No actions yet." /> : component.actions.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => onToggle(a.id)}>
                {a.done ? <CheckCircle2 size={16} color="var(--ontrack)" /> : <Circle size={16} color="var(--ink-faint)" />}
              </button>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: a.done ? "line-through" : "none", color: a.done ? "var(--ink-faint)" : "var(--ink)" }}>{a.text}</span>
              {onSendToCalendar && <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} title="Add to calendar" onClick={() => onSendToCalendar(a)}><CalendarIcon size={14} color="var(--ink-faint)" /></button>}
              <button className="pt-btn-ghost pt-btn pt-btn-danger pt-tap" onClick={() => onRemove(a.id)}><X size={13} /></button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input className="pt-input" placeholder="e.g. Read Smith (2021)" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onAdd(text); setText(""); } }} />
            <button className="pt-btn pt-btn-primary" disabled={!text.trim()} onClick={() => { onAdd(text); setText(""); }}><Plus size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThesisSectionTab({ ctx, sectionKey }) {
  const { thesis, saveThesis, notify } = ctx;
  const meta = THESIS_SECTIONS_META.find((s) => s.key === sectionKey);
  const section = thesis.sections[sectionKey] || { blocks: [] };
  function setBlocks(blocks) {
    saveThesis((prev) => ({ ...prev, sections: { ...prev.sections, [sectionKey]: { ...prev.sections[sectionKey], blocks } } }));
  }
  return (
    <div>
      <div className="pt-eyebrow">{meta.number}</div>
      <h2 className="pt-h2" style={{ marginBottom: 4 }}>{meta.title}</h2>
      <p className="pt-sub" style={{ marginBottom: 18 }}>{meta.description}</p>

      {sectionKey === "researchQuestions" ? (
        <ResearchQuestionsEditor ctx={ctx} blocks={section.blocks} onChange={setBlocks} />
      ) : (
        <SectionEditor blocks={section.blocks} onChange={setBlocks} notify={notify} />
      )}

      {sectionKey === "framework" && (
        <div style={{ marginTop: 32 }}>
          <FrameworkConceptsPanel ctx={ctx} />
        </div>
      )}
      {sectionKey === "methodology" && (
        <div style={{ marginTop: 32 }}>
          <div className="pt-h2" style={{ fontSize: 16, marginBottom: 14 }}>Questionnaire</div>
          <QuestionnaireTab ctx={ctx} />
        </div>
      )}
      {sectionKey === "dataCollection" && (
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 32 }}>
          <div>
            <div className="pt-h2" style={{ fontSize: 16, marginBottom: 14 }}>Case Studies</div>
            <CaseStudiesTab ctx={ctx} />
          </div>
          <div>
            <div className="pt-h2" style={{ fontSize: 16, marginBottom: 14 }}>Observation</div>
            <ObservationTab ctx={ctx} />
          </div>
        </div>
      )}
    </div>
  );
}

// Generic freeform block editor — backs every one of the 11 thesis
// sections. No rigid fields: a section is just a growing list of labelled
// text blocks, so multi-version content (RQ1/RQ2/RQ3 drafts, etc.) fits
// naturally instead of fighting a fixed schema.
function SectionEditor({ blocks, onChange, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);
  function blank() { return { id: null, label: "", text: "" }; }
  function upsert(b) {
    const isNew = !blocks.some((x) => x.id === b.id);
    const next = isNew
      ? [...blocks, { ...b, id: uid(), createdAt: todayISO() }]
      : blocks.map((x) => (x.id === b.id ? { ...x, ...b, updatedAt: todayISO() } : x));
    onChange(next);
    notify(isNew ? "Block added" : "Block updated");
  }
  function remove(id) {
    const prevBlocks = blocks;
    onChange(blocks.filter((b) => b.id !== id));
    notify("Block removed", () => onChange(prevBlocks));
  }
  const canSave = !!(draft && draft.text.trim());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setDraft(blank()); setShowForm(true); }}><Plus size={14} /> Add block</button>
      </div>
      {blocks.length === 0 ? <EmptyState text="Nothing written yet. Add a block to start developing this section." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {blocks.map((b) => (
            <div key={b.id} className="pt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{b.label || "Untitled"}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setDraft(b); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(b.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ink-soft)" }}>{b.text}</div>
              {b.updatedAt && <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 8 }}>Updated {fmtDate(b.updatedAt)}</div>}
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={draft.id ? "Edit block" : "Add block"} onClose={() => setShowForm(false)}>
          <Field label="Label (optional — e.g. 'RQ1', 'Draft v2')"><input className="pt-input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
          <Field label="Text"><textarea className="pt-textarea" style={{ minHeight: 160 }} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Text is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert(draft); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// Concepts + relationships live alongside the freeform framework blocks.
// "Supported by" lists are derived from the literature store, not stored
// here — the link itself is owned by the article (see LiteratureForm).
function FrameworkConceptsPanel({ ctx }) {
  const { thesis, saveThesis, literature, notify } = ctx;
  const fw = thesis.sections.framework;
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [conceptDraft, setConceptDraft] = useState(null);
  const [showRelForm, setShowRelForm] = useState(false);
  const [relDraft, setRelDraft] = useState(null);

  function patchFramework(patch) {
    saveThesis((prev) => ({ ...prev, sections: { ...prev.sections, framework: { ...prev.sections.framework, ...patch } } }));
  }

  function blankConcept() { return { id: null, name: "", description: "" }; }
  function upsertConcept(c) {
    const isNew = !fw.concepts.some((x) => x.id === c.id);
    const next = isNew ? [...fw.concepts, { ...c, id: uid() }] : fw.concepts.map((x) => (x.id === c.id ? c : x));
    patchFramework({ concepts: next });
    notify(isNew ? "Concept added" : "Concept updated");
  }
  function removeConcept(id) {
    const removed = fw.concepts.find((c) => c.id === id);
    const keptRelationships = fw.relationships.filter((r) => r.fromConceptId !== id && r.toConceptId !== id);
    const droppedRelationships = fw.relationships.filter((r) => r.fromConceptId === id || r.toConceptId === id);
    patchFramework({ concepts: fw.concepts.filter((c) => c.id !== id), relationships: keptRelationships });
    notify(
      droppedRelationships.length > 0 ? `Concept removed (and ${droppedRelationships.length} relationship${droppedRelationships.length > 1 ? "s" : ""})` : "Concept removed",
      () => patchFramework({ concepts: [...fw.concepts.filter((c) => c.id !== id), removed], relationships: [...keptRelationships, ...droppedRelationships] })
    );
  }
  const canSaveConcept = !!(conceptDraft && conceptDraft.name.trim());

  function blankRelationship() { return { id: null, fromConceptId: fw.concepts[0]?.id || "", toConceptId: fw.concepts[1]?.id || "", label: "" }; }
  function upsertRelationship(r) {
    const isNew = !fw.relationships.some((x) => x.id === r.id);
    const next = isNew ? [...fw.relationships, { ...r, id: uid() }] : fw.relationships.map((x) => (x.id === r.id ? r : x));
    patchFramework({ relationships: next });
    notify(isNew ? "Relationship added" : "Relationship updated");
  }
  function removeRelationship(id) {
    const removed = fw.relationships.find((r) => r.id === id);
    patchFramework({ relationships: fw.relationships.filter((r) => r.id !== id) });
    notify("Relationship removed", () => patchFramework({ relationships: [...fw.relationships.filter((r) => r.id !== id), removed] }));
  }
  const canSaveRel = !!(relDraft && relDraft.fromConceptId && relDraft.toConceptId && relDraft.fromConceptId !== relDraft.toConceptId);
  function conceptName(id) { return fw.concepts.find((c) => c.id === id)?.name || "—"; }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="pt-h2" style={{ fontSize: 16, margin: 0 }}>Concepts</div>
        <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => { setConceptDraft(blankConcept()); setShowConceptForm(true); }}><Plus size={13} /> Add concept</button>
      </div>
      {fw.concepts.length === 0 ? <EmptyState text="No concepts yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {fw.concepts.map((c) => {
            const supporting = articlesForConcept(literature, c.id);
            return (
              <div key={c.id} className="pt-card pt-card-tight">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{c.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setConceptDraft(c); setShowConceptForm(true); }}><Edit3 size={13} /></button>
                    <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => removeConcept(c.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
                  {supporting.length === 0 ? "No articles linked yet." : `Supported by: ${supporting.map((a) => a.title || "(untitled)").join(", ")}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="pt-h2" style={{ fontSize: 16, margin: 0 }}>Relationships</div>
        <button className="pt-btn pt-btn-sm pt-btn-primary" disabled={fw.concepts.length < 2} onClick={() => { setRelDraft(blankRelationship()); setShowRelForm(true); }}><Plus size={13} /> Add relationship</button>
      </div>
      {fw.concepts.length < 2 ? (
        <EmptyState text="Add at least two concepts to connect them." />
      ) : fw.relationships.length === 0 ? (
        <EmptyState text="No relationships yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fw.relationships.map((r) => {
            const supporting = articlesForRelationship(literature, r.id);
            return (
              <div key={r.id} className="pt-card pt-card-tight">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {conceptName(r.fromConceptId)} {r.label ? `— ${r.label} →` : "→"} {conceptName(r.toConceptId)}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setRelDraft(r); setShowRelForm(true); }}><Edit3 size={13} /></button>
                    <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => removeRelationship(r.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
                  {supporting.length === 0 ? "No articles linked yet." : `Supported by: ${supporting.map((a) => a.title || "(untitled)").join(", ")}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showConceptForm && (
        <Modal title={conceptDraft.id ? "Edit concept" : "Add concept"} onClose={() => setShowConceptForm(false)}>
          <Field label="Name"><input className="pt-input" value={conceptDraft.name} onChange={(e) => setConceptDraft({ ...conceptDraft, name: e.target.value })} /></Field>
          <Field label="Description (optional)"><textarea className="pt-textarea" value={conceptDraft.description} onChange={(e) => setConceptDraft({ ...conceptDraft, description: e.target.value })} /></Field>
          {!canSaveConcept && <div className="pt-field-error">Name is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveConcept} onClick={() => { upsertConcept(conceptDraft); setShowConceptForm(false); }}>Save</button>
        </Modal>
      )}
      {showRelForm && (
        <Modal title={relDraft.id ? "Edit relationship" : "Add relationship"} onClose={() => setShowRelForm(false)}>
          <Field label="From concept">
            <select className="pt-select" value={relDraft.fromConceptId} onChange={(e) => setRelDraft({ ...relDraft, fromConceptId: e.target.value })}>
              {fw.concepts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Relationship label (e.g. 'shapes', 'reduces')"><input className="pt-input" value={relDraft.label} onChange={(e) => setRelDraft({ ...relDraft, label: e.target.value })} /></Field>
          <Field label="To concept">
            <select className="pt-select" value={relDraft.toConceptId} onChange={(e) => setRelDraft({ ...relDraft, toConceptId: e.target.value })}>
              {fw.concepts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {!canSaveRel && <div className="pt-field-error">Pick two different concepts.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveRel} onClick={() => { upsertRelationship(relDraft); setShowRelForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// Specialized editor for section 04 — same block shape as SectionEditor,
// extended with links to articles, framework concepts and methodology
// notes, plus a free-text gap note and a derived support-level pill.
function ResearchQuestionsEditor({ ctx, blocks, onChange }) {
  const { thesis, literature, notify } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);
  const concepts = thesis.sections.framework.concepts;
  const methodBlocks = thesis.sections.methodology.blocks;

  function blank() { return { id: null, label: "", text: "", linkedArticleIds: [], linkedConceptIds: [], linkedMethodologyBlockIds: [], gapNote: "" }; }
  function upsert(b) {
    const isNew = !blocks.some((x) => x.id === b.id);
    const next = isNew
      ? [...blocks, { ...b, id: uid(), createdAt: todayISO() }]
      : blocks.map((x) => (x.id === b.id ? { ...x, ...b, updatedAt: todayISO() } : x));
    onChange(next);
    notify(isNew ? "Research question added" : "Research question updated");
  }
  function remove(id) {
    const prevBlocks = blocks;
    onChange(blocks.filter((b) => b.id !== id));
    notify("Research question removed", () => onChange(prevBlocks));
  }
  const canSave = !!(draft && draft.text.trim());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setDraft(blank()); setShowForm(true); }}><Plus size={14} /> Add research question</button>
      </div>
      {blocks.length === 0 ? <EmptyState text="No research questions yet. Add RQ1 to start." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {blocks.map((b) => {
            const linkedArticles = literature.articles.filter((a) => (b.linkedArticleIds || []).includes(a.id));
            const linkedConcepts = concepts.filter((c) => (b.linkedConceptIds || []).includes(c.id));
            const linkedMethods = methodBlocks.filter((m) => (b.linkedMethodologyBlockIds || []).includes(m.id));
            return (
              <div key={b.id} className="pt-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{b.label || "Untitled"}</div>
                    <StatusPill status={supportLevelForRQ(b)} />
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setDraft({ ...blank(), ...b }); setShowForm(true); }}><Edit3 size={14} /></button>
                    <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(b.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ink-soft)", marginBottom: 10 }}>{b.text}</div>
                {(linkedArticles.length > 0 || linkedConcepts.length > 0 || linkedMethods.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {linkedArticles.map((a) => <span key={a.id} className="pt-chip">{a.title || "(untitled)"}</span>)}
                    {linkedConcepts.map((c) => <span key={c.id} className="pt-chip" style={{ background: "var(--thesis-soft)", color: "var(--thesis)" }}>{c.name}</span>)}
                    {linkedMethods.length > 0 && <span className="pt-chip">{linkedMethods.length} methodology note{linkedMethods.length > 1 ? "s" : ""}</span>}
                  </div>
                )}
                {b.gapNote && <div style={{ fontSize: 12, color: "var(--behind)", marginTop: 8 }}>Gap: {b.gapNote}</div>}
              </div>
            );
          })}
        </div>
      )}
      {showForm && (
        <Modal title={draft.id ? "Edit research question" : "Add research question"} onClose={() => setShowForm(false)} wide>
          <Field label="Label (e.g. 'RQ1')"><input className="pt-input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
          <Field label="Question text"><textarea className="pt-textarea" style={{ minHeight: 100 }} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></Field>
          <Field label="Linked articles">
            <CheckboxList items={literature.articles} selectedIds={draft.linkedArticleIds} onChange={(ids) => setDraft({ ...draft, linkedArticleIds: ids })} getLabel={(a) => `${a.title || "(untitled)"}${a.year ? ` (${a.year})` : ""}`} emptyText="No articles in the library yet." />
          </Field>
          <Field label="Linked framework concepts">
            <CheckboxList items={concepts} selectedIds={draft.linkedConceptIds} onChange={(ids) => setDraft({ ...draft, linkedConceptIds: ids })} getLabel={(c) => c.name} emptyText="No concepts defined yet — add some in 03 Conceptual Framework." />
          </Field>
          <Field label="Linked methodology notes">
            <CheckboxList items={methodBlocks} selectedIds={draft.linkedMethodologyBlockIds} onChange={(ids) => setDraft({ ...draft, linkedMethodologyBlockIds: ids })} getLabel={(m) => m.label || "Untitled"} emptyText="No methodology notes written yet — add some in 05 Methodology." />
          </Field>
          <Field label="Research gap (free text)"><textarea className="pt-textarea" value={draft.gapNote} onChange={(e) => setDraft({ ...draft, gapNote: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Question text is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert(draft); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="pt-card pt-card-tight">
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* =========================================================================
   LITERATURE — library + matrix views, Supabase Storage file attachments.
   ========================================================================= */
const LITERATURE_BUCKET = "literature-files";

async function uploadLiteratureFile(articleId, file) {
  const path = `${articleId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(LITERATURE_BUCKET).upload(path, file);
  if (error) throw error;
  return { filePath: path, fileName: file.name, fileType: file.type, fileSize: file.size, uploadedAt: todayISO() };
}
async function removeLiteratureFile(filePath) {
  if (!filePath) return;
  const { error } = await supabase.storage.from(LITERATURE_BUCKET).remove([filePath]);
  if (error) throw error;
}
async function fetchStoredLiteratureFile(filePath) {
  const { data, error } = await supabase.storage.from(LITERATURE_BUCKET).createSignedUrl(filePath, 600);
  if (error) throw error;
  const res = await fetch(data.signedUrl);
  if (!res.ok) throw new Error("Couldn't download the attached file.");
  return await res.blob();
}

// Client-side text extraction for "Analyze with AI" — PDF and plain text
// only. Returns null (not an error) for unsupported types like .docx, so
// the caller can say clearly "can't read this file" instead of guessing.
async function extractArticleText(blob, fileName, fileType) {
  const type = (fileType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (type === "text/plain" || name.endsWith(".txt")) {
    return (await blob.text()).trim();
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
    const buf = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text.trim();
  }
  return null;
}

async function openLiteratureFile(filePath) {
  const { data, error } = await supabase.storage.from(LITERATURE_BUCKET).createSignedUrl(filePath, 600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

function LiteratureScreen({ ctx }) {
  const { literature, saveLiterature, thesis, notify } = ctx;
  const [view, setView] = useState("library");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [usedFilter, setUsedFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const articles = literature.articles;

  function upsert(article) {
    const isNew = !articles.some((a) => a.id === article.id);
    saveLiterature((prev) => ({ ...prev, articles: isNew ? [article, ...prev.articles] : prev.articles.map((a) => (a.id === article.id ? article : a)) }));
    notify(isNew ? "Article added" : "Article updated");
  }

  async function confirmDelete() {
    const article = articles.find((a) => a.id === confirmDeleteId);
    setConfirmDeleteId(null);
    if (article.filePath) { try { await removeLiteratureFile(article.filePath); } catch (e) { /* article record still gets removed */ } }
    saveLiterature((prev) => ({ ...prev, articles: prev.articles.filter((a) => a.id !== article.id) }));
    notify("Article deleted");
  }

  const filtered = useMemo(() => {
    let list = articles;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => [a.title, a.authors, a.keywords, a.topic].some((f) => (f || "").toLowerCase().includes(q)));
    }
    if (statusFilter !== "ALL") list = list.filter((a) => a.status === statusFilter);
    if (usedFilter !== "ALL") list = list.filter((a) => (usedFilter === "USED" ? a.usedInThesis : !a.usedInThesis));
    const sorted = [...list];
    if (sortBy === "year") sorted.sort((a, b) => (b.year || "").localeCompare(a.year || ""));
    else if (sortBy === "title") sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "author") sorted.sort((a, b) => (a.authors || "").localeCompare(b.authors || ""));
    return sorted;
  }, [articles, search, statusFilter, usedFilter, sortBy]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="pt-btn pt-btn-sm" style={{ background: view === "library" ? "var(--thesis-soft)" : undefined, color: view === "library" ? "var(--thesis)" : undefined }} onClick={() => setView("library")}><LayoutList size={13} /> Library</button>
          <button className="pt-btn pt-btn-sm" style={{ background: view === "matrix" ? "var(--thesis-soft)" : undefined, color: view === "matrix" ? "var(--thesis)" : undefined }} onClick={() => setView("matrix")}><Table2 size={13} /> Matrix</button>
          <button className="pt-btn pt-btn-sm" style={{ background: view === "gaps" ? "var(--thesis-soft)" : undefined, color: view === "gaps" ? "var(--thesis)" : undefined }} onClick={() => setView("gaps")}><Sparkles size={13} /> Gaps</button>
        </div>
        <button className="pt-btn pt-btn-primary" onClick={() => { setEditItem(blankLiteratureArticle()); setShowForm(true); }}><Plus size={14} /> Add article</button>
      </div>

      {view === "gaps" ? (
        <LiteratureGapsPanel ctx={ctx} />
      ) : (
        <>
          <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
              <input className="pt-input" style={{ paddingLeft: 30 }} placeholder="Search title, authors, keywords, topic…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="pt-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              {["UNREAD", "READING", "ANALYSED"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="pt-select" style={{ width: 160 }} value={usedFilter} onChange={(e) => setUsedFilter(e.target.value)}>
              <option value="ALL">Used or not</option>
              <option value="USED">Used in thesis</option>
              <option value="NOT_USED">Not used yet</option>
            </select>
            <select className="pt-select" style={{ width: 170 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Sort: recently added</option>
              <option value="year">Sort: year</option>
              <option value="title">Sort: title</option>
              <option value="author">Sort: author</option>
            </select>
          </div>

          {articles.length === 0 ? (
            <EmptyState text="No articles yet. Add your first source to begin the literature review." />
          ) : filtered.length === 0 ? (
            <EmptyState text="No articles match your search or filters." />
          ) : view === "library" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((a) => (
                <LiteratureCard key={a.id} article={a} thesis={thesis} notify={notify} onEdit={() => { setEditItem(a); setShowForm(true); }} onDelete={() => setConfirmDeleteId(a.id)} />
              ))}
            </div>
          ) : (
            <LiteratureMatrix articles={filtered} onChange={(id, patch) => saveLiterature((prev) => ({ ...prev, articles: prev.articles.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))} />
          )}
        </>
      )}

      {showForm && (
        <LiteratureForm item={editItem} thesis={thesis} notify={notify} onClose={() => setShowForm(false)} onSave={(a) => { upsert(a); setShowForm(false); }} />
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete article?"
          message="This removes the article and its attached file (if any) permanently. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

const MIN_GAP_ARTICLES = 3;
const GAP_STATUS_META = {
  pending: { color: "var(--gold)", label: "Potential research gap — requires verification" },
  confirmed: { color: "var(--ontrack)", label: "Confirmed gap" },
  rejected: { color: "var(--ink-faint)", label: "Rejected" },
};

// Articles with nothing extracted yet (no topic/keyConcepts/findings, e.g.
// added manually and never analyzed) contribute nothing to gap detection —
// excluded here rather than sent as empty noise.
function literatureGapsUsableArticles(articles) {
  return articles.filter((a) => (a.topic || "").trim() || (a.keyConcepts || "").trim() || (a.findings || "").trim());
}

// Corpus-wide gap detection — manual trigger only (never runs on its own,
// to avoid burning the free GLM quota on every edit). Rejecting a gap sets
// an explicit status rather than removing it from the list, and a fresh
// detection run is deduped against every gap already on file regardless of
// status — the same "explicit flag, not an empty-list condition" fix as
// the Phase 2 framework-concepts reseeding bug, so a rejected gap can't
// silently reappear just because the list looked short.
function LiteratureGapsPanel({ ctx }) {
  const { literature, saveLiterature, thesis, notify } = ctx;
  const gaps = literature.researchGaps;
  const usableArticles = useMemo(() => literatureGapsUsableArticles(literature.articles), [literature.articles]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const canDetect = usableArticles.length >= MIN_GAP_ARTICLES;

  async function handleDetect() {
    setDetecting(true); setDetectError("");
    try {
      const fw = thesis.sections.framework;
      const thesisParts = [];
      if (fw.concepts && fw.concepts.length) thesisParts.push(`Conceptual framework: ${fw.concepts.map((c) => c.name).join(" → ")}`);
      const rqBlocks = (thesis.sections.researchQuestions && thesis.sections.researchQuestions.blocks) || [];
      if (rqBlocks[0] && rqBlocks[0].text) thesisParts.push(`Main research question: ${rqBlocks[0].text}`);

      const res = await fetch("/.netlify/functions/detect-research-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: usableArticles.map((a) => ({ title: a.title, year: a.year, topic: a.topic, keyConcepts: a.keyConcepts, findings: a.findings })),
          thesisContext: thesisParts.join(" · "),
          existingGaps: gaps.map((g) => g.text),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Detection failed (${res.status}).`);

      // Belt-and-suspenders dedup on top of the prompt-level instruction —
      // checked against ALL existing gaps (pending/confirmed/rejected
      // alike), never just the visible ones.
      const existingTexts = new Set(gaps.map((g) => g.text.trim().toLowerCase()));
      const fresh = (data.gaps || []).filter((t) => t && !existingTexts.has(t.trim().toLowerCase()));
      if (fresh.length === 0) {
        notify("No new gaps found beyond what's already listed.");
      } else {
        saveLiterature((prev) => ({ ...prev, researchGaps: [...fresh.map((t) => blankResearchGap(t)), ...prev.researchGaps] }));
        notify(`${fresh.length} potential gap${fresh.length === 1 ? "" : "s"} found — review below.`);
      }
    } catch (e) {
      setDetectError(String(e.message || e));
    } finally {
      setDetecting(false);
    }
  }

  function setStatus(id, status) {
    saveLiterature((prev) => ({ ...prev, researchGaps: prev.researchGaps.map((g) => (g.id === id ? { ...g, status } : g)) }));
  }
  function editText(id, text) {
    saveLiterature((prev) => ({ ...prev, researchGaps: prev.researchGaps.map((g) => (g.id === id ? { ...g, text } : g)) }));
  }
  function editNote(id, note) {
    saveLiterature((prev) => ({ ...prev, researchGaps: prev.researchGaps.map((g) => (g.id === id ? { ...g, note } : g)) }));
  }
  function removeGap(id) {
    const removed = gaps.find((g) => g.id === id);
    saveLiterature((prev) => ({ ...prev, researchGaps: prev.researchGaps.filter((g) => g.id !== id) }));
    notify("Gap removed", () => saveLiterature((prev) => (prev.researchGaps.some((g) => g.id === id) ? prev : { ...prev, researchGaps: [removed, ...prev.researchGaps] })));
  }

  const filtered = statusFilter === "ALL" ? gaps : gaps.filter((g) => g.status === statusFilter);

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Research Gap Map</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
            {canDetect
              ? `${usableArticles.length} article${usableArticles.length === 1 ? "" : "s"} with extracted content available.`
              : `Needs at least ${MIN_GAP_ARTICLES} articles with Topic, Key concepts, or Findings filled in (manually or via Analyze with AI) — you have ${usableArticles.length}.`}
          </div>
        </div>
        <button className="pt-btn pt-btn-primary" disabled={!canDetect || detecting} onClick={handleDetect}>
          {detecting ? <Loader2 size={13} className="pt-spin" /> : <Sparkles size={13} />} {detecting ? "Detecting…" : "Detect gaps"}
        </button>
      </div>

      {detectError && <div className="pt-field-error" style={{ marginBottom: 16 }}>{detectError}</div>}

      {gaps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <select className="pt-select" style={{ width: 190 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All gaps ({gaps.length})</option>
            <option value="pending">Pending review</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {gaps.length === 0 ? (
        <EmptyState text="No gaps detected yet. Run detection once you have a few analyzed articles." />
      ) : filtered.length === 0 ? (
        <EmptyState text="No gaps match this filter." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((g) => (
            <ResearchGapCard key={g.id} gap={g} onStatus={(s) => setStatus(g.id, s)} onEditText={(t) => editText(g.id, t)} onEditNote={(n) => editNote(g.id, n)} onRemove={() => removeGap(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchGapCard({ gap, onStatus, onEditText, onEditNote, onRemove }) {
  const [editingText, setEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState(gap.text);
  const meta = GAP_STATUS_META[gap.status] || GAP_STATUS_META.pending;

  return (
    <div className="pt-card pt-card-tight" style={{ opacity: gap.status === "rejected" ? 0.6 : 1 }}>
      <span className="pt-chip" style={{ background: meta.color, color: "#fff", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        <Sparkles size={11} /> {meta.label}
      </span>

      {editingText ? (
        <div style={{ marginBottom: 10 }}>
          <textarea className="pt-textarea" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => { onEditText(textDraft); setEditingText(false); }}>Save</button>
            <button className="pt-btn pt-btn-sm" onClick={() => { setTextDraft(gap.text); setEditingText(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, marginBottom: 10 }}>{gap.text}</div>
      )}

      <Field label="Your notes (optional)"><textarea className="pt-textarea" value={gap.note} onChange={(e) => onEditNote(e.target.value)} /></Field>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {gap.status !== "confirmed" && <button className="pt-btn pt-btn-sm" onClick={() => onStatus("confirmed")}><Check size={12} /> Confirm</button>}
        {gap.status !== "rejected" && <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => onStatus("rejected")}><X size={12} /> Reject</button>}
        {gap.status !== "pending" && <button className="pt-btn pt-btn-sm" onClick={() => onStatus("pending")}>Mark pending</button>}
        {!editingText && <button className="pt-btn pt-btn-sm pt-btn-ghost" onClick={() => setEditingText(true)}><Edit3 size={12} /> Edit text</button>}
        <button className="pt-btn pt-btn-sm pt-btn-ghost pt-btn-danger" onClick={onRemove}><Trash2 size={12} /> Delete</button>
      </div>
    </div>
  );
}

function LiteratureCard({ article, thesis, notify, onEdit, onDelete }) {
  const allConcepts = thesis.sections.framework.concepts;
  const conceptName = (id) => allConcepts.find((c) => c.id === id)?.name || "—";
  const concepts = allConcepts.filter((c) => (article.linkedConceptIds || []).includes(c.id));
  const relationships = thesis.sections.framework.relationships.filter((r) => (article.linkedRelationshipIds || []).includes(r.id));
  const rqs = rqBlocksForArticle(thesis, article.id);
  const claims = claimsForArticle(thesis, article.id);
  const contradictions = contradictionsForArticle(thesis, article.id);
  const hasConnections = concepts.length || relationships.length || rqs.length || claims.length || contradictions.length;

  return (
    <div className="pt-card" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{article.title || "(untitled)"}</div>
          <StatusPill status={article.status} />
          {article.usedInThesis && <span className="pt-chip">Used in thesis</span>}
          {article.filePath && <span className="pt-chip"><Paperclip size={10} style={{ marginRight: 3, verticalAlign: "-1px" }} />{article.fileName || "file"}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
          {article.authors}{article.year ? `, ${article.year}` : ""}{article.journal ? ` · ${article.journal}` : ""}
        </div>
        {article.relevanceToThesis && <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 6 }}>{article.relevanceToThesis}</div>}
        {hasConnections > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {concepts.map((c) => <span key={c.id} className="pt-chip" style={{ background: "var(--thesis-soft)", color: "var(--thesis)" }}>{c.name}</span>)}
            {relationships.map((r) => <span key={r.id} className="pt-chip" style={{ background: "var(--thesis-soft)", color: "var(--thesis)" }}>{conceptName(r.fromConceptId)} → {conceptName(r.toConceptId)}</span>)}
            {rqs.length > 0 && <span className="pt-chip">{rqs.length} RQ{rqs.length > 1 ? "s" : ""}</span>}
            {claims.length > 0 && <span className="pt-chip">{claims.length} claim{claims.length > 1 ? "s" : ""}</span>}
            {contradictions.length > 0 && <span className="pt-chip">{contradictions.length} contradiction{contradictions.length > 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {article.filePath && <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => openLiteratureFile(article.filePath).catch((e) => notify("Couldn't open file: " + String(e.message || e)))}><ExternalLink size={14} /></button>}
        <button className="pt-btn pt-btn-ghost pt-tap" onClick={onEdit}><Edit3 size={14} /></button>
        <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={onDelete}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

const LITERATURE_RELEVANCE_FLAGS = [
  ["relevantEmotion", "Emotion"],
  ["relevantBehavior", "Behavior"],
  ["relevantSpace", "Space"],
  ["relevantInformalLearning", "Informal learning"],
];

// Field set the AI analysis fills — the matrix's textual analysis fields
// only. Boolean judgment calls (relevance flags, usedInThesis) stay manual.
const LITERATURE_ANALYSIS_FIELDS = [
  ["topic", "Topic"],
  ["researchQuestion", "Research question"],
  ["method", "Method"],
  ["sample", "Sample"],
  ["context", "Context"],
  ["keyConcepts", "Key concepts"],
  ["findings", "Findings"],
  ["limitations", "Limitations"],
  ["relevanceToThesis", "Relevance to thesis"],
  ["potentialGap", "Potential gap"],
];

function LiteratureForm({ item, thesis, notify, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...blankLiteratureArticle(), ...item });
  const fw = thesis.sections.framework;
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemoveFile, setConfirmRemoveFile] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const canSave = draft.title.trim().length > 0;

  async function handleAnalyze() {
    setAnalyzing(true); setAnalyzeError(""); setAiSuggestion(null);
    try {
      let blob = file;
      let fileName = file ? file.name : draft.fileName;
      let fileType = file ? file.type : draft.fileType;
      if (!blob) {
        if (!draft.filePath) throw new Error("Attach a file first — there's nothing to analyze yet.");
        blob = await fetchStoredLiteratureFile(draft.filePath);
      }
      const text = await extractArticleText(blob, fileName, fileType);
      if (text === null) throw new Error(`Can't extract text from "${fileName || "this file"}" — only PDF and TXT files are supported for AI analysis right now.`);
      if (!text) throw new Error("Couldn't extract any text from this file — it may be a scanned/image-only PDF. Try a text-based file instead.");

      const thesisParts = [];
      if (fw.concepts && fw.concepts.length) thesisParts.push(`Conceptual framework: ${fw.concepts.map((c) => c.name).join(" → ")}`);
      const rqBlocks = (thesis.sections.researchQuestions && thesis.sections.researchQuestions.blocks) || [];
      if (rqBlocks[0] && rqBlocks[0].text) thesisParts.push(`Main research question: ${rqBlocks[0].text}`);

      const res = await fetch("/.netlify/functions/analyze-literature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, thesisContext: thesisParts.join(" · ") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status}).`);
      setAiSuggestion(data);
    } catch (e) {
      setAnalyzeError(String(e.message || e));
    } finally {
      setAnalyzing(false);
    }
  }

  function applySuggestion() {
    setDraft((d) => ({ ...d, ...aiSuggestion }));
    setAiSuggestion(null);
    notify("AI suggestions applied — review before saving.");
  }

  async function handleSave() {
    if (!canSave) return;
    setUploading(true); setError("");
    const id = draft.id || uid();
    try {
      let fileFields = {};
      if (file) {
        if (draft.filePath) { try { await removeLiteratureFile(draft.filePath); } catch (e) { /* upload the new one regardless */ } }
        fileFields = await uploadLiteratureFile(id, file);
      }
      onSave({ ...draft, id, ...fileFields });
    } catch (e) {
      setError("File upload failed: " + String(e.message || e));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveFile() {
    if (draft.filePath) { try { await removeLiteratureFile(draft.filePath); } catch (e) { /* proceed */ } }
    setDraft({ ...draft, filePath: "", fileName: "", fileType: "", fileSize: 0, uploadedAt: null });
    setConfirmRemoveFile(false);
    setFile(null);
  }

  return (
    <Modal title={draft.id ? "Edit article" : "Add article"} onClose={onClose} wide>
      <div className="pt-label" style={{ marginBottom: 8 }}>Source file (optional)</div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {draft.filePath && !file && (
          <>
            <Paperclip size={14} color="var(--ink-soft)" />
            <span style={{ fontSize: 12.5 }}>{draft.fileName}</span>
            <button className="pt-btn pt-btn-sm" onClick={() => openLiteratureFile(draft.filePath).catch((e) => notify("Couldn't open file: " + String(e.message || e)))}>View</button>
            <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => setConfirmRemoveFile(true)}>Remove</button>
          </>
        )}
        {file && <span style={{ fontSize: 12.5 }}>Will upload: {file.name}</span>}
        <label className="pt-btn pt-btn-sm" style={{ cursor: "pointer" }}>
          <Paperclip size={12} /> {draft.filePath || file ? "Replace file" : "Attach file"}
          <input type="file" accept=".pdf,.txt,.docx,.doc" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
        </label>
      </div>

      <div className="pt-grid2">
        <Field label="Authors"><input className="pt-input" value={draft.authors} onChange={(e) => setDraft({ ...draft, authors: e.target.value })} /></Field>
        <Field label="Year"><input className="pt-input" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} /></Field>
      </div>
      <Field label="Title"><input className="pt-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
      <div className="pt-grid2">
        <Field label="Journal"><input className="pt-input" value={draft.journal} onChange={(e) => setDraft({ ...draft, journal: e.target.value })} /></Field>
        <Field label="DOI"><input className="pt-input" value={draft.doi} onChange={(e) => setDraft({ ...draft, doi: e.target.value })} /></Field>
      </div>
      <Field label="Keywords (comma-separated)"><input className="pt-input" value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} /></Field>
      <Field label="Status">
        <select className="pt-select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          {["UNREAD", "READING", "ANALYSED"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <div className="pt-card pt-card-tight" style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div className="pt-label" style={{ margin: 0 }}>Matrix fields</div>
          <button className="pt-btn pt-btn-sm" disabled={analyzing} onClick={handleAnalyze}>
            {analyzing ? <Loader2 size={11} className="pt-spin" /> : <Sparkles size={11} />} {analyzing ? "Analyzing…" : "Analyze with AI"}
          </button>
        </div>
        {analyzeError && <div className="pt-field-error" style={{ marginBottom: 12 }}>{analyzeError}</div>}
        {aiSuggestion && (
          <div className="pt-card pt-card-tight" style={{ marginBottom: 16, borderColor: "var(--gold)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="pt-chip" style={{ background: "var(--gold)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={11} /> AI Suggested
              </span>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Review before applying — nothing changes until you accept.</span>
            </div>
            {LITERATURE_ANALYSIS_FIELDS.map(([key, label]) => (aiSuggestion[key] ? (
              <div key={key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{label}</div>
                <div style={{ fontSize: 12.5 }}>{aiSuggestion[key]}</div>
              </div>
            ) : null))}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={applySuggestion}><Check size={12} /> Apply to form</button>
              <button className="pt-btn pt-btn-sm" onClick={() => setAiSuggestion(null)}>Discard</button>
            </div>
          </div>
        )}
        <div className="pt-grid2">
          <Field label="Topic"><input className="pt-input" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} /></Field>
          <Field label="Research question"><input className="pt-input" value={draft.researchQuestion} onChange={(e) => setDraft({ ...draft, researchQuestion: e.target.value })} /></Field>
        </div>
        <div className="pt-grid3">
          <Field label="Method"><input className="pt-input" value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value })} /></Field>
          <Field label="Sample"><input className="pt-input" value={draft.sample} onChange={(e) => setDraft({ ...draft, sample: e.target.value })} /></Field>
          <Field label="Context"><input className="pt-input" value={draft.context} onChange={(e) => setDraft({ ...draft, context: e.target.value })} /></Field>
        </div>
        <Field label="Key concepts"><input className="pt-input" value={draft.keyConcepts} onChange={(e) => setDraft({ ...draft, keyConcepts: e.target.value })} /></Field>
        <Field label="Findings"><textarea className="pt-textarea" value={draft.findings} onChange={(e) => setDraft({ ...draft, findings: e.target.value })} /></Field>
        <Field label="Limitations"><textarea className="pt-textarea" value={draft.limitations} onChange={(e) => setDraft({ ...draft, limitations: e.target.value })} /></Field>
        <div className="pt-label" style={{ marginBottom: 8 }}>Relevant to…</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          {LITERATURE_RELEVANCE_FLAGS.map(([k, l]) => (
            <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })} /> {l}
            </label>
          ))}
        </div>
        <Field label="Relevance to thesis"><textarea className="pt-textarea" value={draft.relevanceToThesis} onChange={(e) => setDraft({ ...draft, relevanceToThesis: e.target.value })} /></Field>
        <Field label="Potential gap"><textarea className="pt-textarea" value={draft.potentialGap} onChange={(e) => setDraft({ ...draft, potentialGap: e.target.value })} /></Field>
        <div className="pt-grid2">
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, marginBottom: 12 }}>
            <input type="checkbox" checked={draft.usedInThesis} onChange={(e) => setDraft({ ...draft, usedInThesis: e.target.checked })} /> Used in thesis
          </label>
          <Field label="Chapter"><input className="pt-input" value={draft.chapter} onChange={(e) => setDraft({ ...draft, chapter: e.target.value })} /></Field>
        </div>
      </div>

      <div className="pt-card pt-card-tight" style={{ marginBottom: 16 }}>
        <div className="pt-label" style={{ marginBottom: 12 }}>Framework links</div>
        <Field label="Concepts this article supports">
          <CheckboxList items={fw.concepts} selectedIds={draft.linkedConceptIds} onChange={(ids) => setDraft({ ...draft, linkedConceptIds: ids })} getLabel={(c) => c.name} emptyText="No concepts defined yet — add some in 03 Conceptual Framework." />
        </Field>
        <Field label="Relationships this article supports">
          <CheckboxList
            items={fw.relationships}
            selectedIds={draft.linkedRelationshipIds}
            onChange={(ids) => setDraft({ ...draft, linkedRelationshipIds: ids })}
            getLabel={(r) => `${fw.concepts.find((c) => c.id === r.fromConceptId)?.name || "—"} → ${fw.concepts.find((c) => c.id === r.toConceptId)?.name || "—"}`}
            emptyText="No relationships defined yet — add some in 03 Conceptual Framework."
          />
        </Field>
      </div>

      <Field label="Notes"><textarea className="pt-textarea" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>

      {error && <div className="pt-field-error">{error}</div>}
      {!canSave && <div className="pt-field-error">Title is required.</div>}
      <button className="pt-btn pt-btn-primary" disabled={!canSave || uploading} onClick={handleSave}>
        {uploading ? <Loader2 size={14} className="pt-spin" /> : <Check size={14} />} {uploading ? "Saving…" : "Save article"}
      </button>

      {confirmRemoveFile && (
        <ConfirmDialog
          title="Remove file?"
          message="This deletes the attached file from storage. The rest of the article stays."
          confirmLabel="Remove"
          danger
          onConfirm={handleRemoveFile}
          onCancel={() => setConfirmRemoveFile(false)}
        />
      )}
    </Modal>
  );
}

function LiteratureMatrix({ articles, onChange }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const sorted = useMemo(() => {
    if (!sortKey) return articles;
    return [...articles].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "boolean" || typeof bv === "boolean") return ((av === bv ? 0 : av ? 1 : -1)) * sortDir;
      return String(av || "").localeCompare(String(bv || "")) * sortDir;
    });
  }, [articles, sortKey, sortDir]);
  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(1); }
  }
  return (
    <div className="pt-table-wrap">
      <table className="pt-table">
        <thead>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "var(--paper-raised)", minWidth: 180 }}>Title</th>
            {LITERATURE_MATRIX_FIELDS.map((f) => (
              <th key={f.key} style={{ cursor: "pointer", minWidth: f.width }} onClick={() => toggleSort(f.key)}>
                {f.label}{sortKey === f.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id}>
              <td style={{ fontWeight: 600, minWidth: 180, position: "sticky", left: 0, background: "var(--paper-raised)" }}>{a.title || "(untitled)"}</td>
              {LITERATURE_MATRIX_FIELDS.map((f) => (
                <td key={f.key}>
                  {f.type === "bool" ? (
                    <input type="checkbox" checked={!!a[f.key]} onChange={(e) => onChange(a.id, { [f.key]: e.target.checked })} />
                  ) : (
                    <input className="pt-input" style={{ minWidth: f.width, border: "none", background: "none", padding: "4px 2px" }} value={a[f.key] || ""} onChange={(e) => onChange(a.id, { [f.key]: e.target.value })} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function blankClaim() { return { id: null, text: "", evidenceArticleIds: [], contradictingArticleIds: [], interpretation: "" }; }

// "Research Claims" — a claim, the literature that backs or contradicts
// it, and a free-text interpretation. Same list/modal/undo pattern as
// every other thesis sub-panel.
function ClaimsTab({ ctx }) {
  const { thesis, saveThesis, literature, notify } = ctx;
  const claims = thesis.claims;
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);

  function upsert(c) {
    const isNew = !claims.some((x) => x.id === c.id);
    saveThesis((prev) => ({ ...prev, claims: isNew ? [{ ...c, id: uid() }, ...prev.claims] : prev.claims.map((x) => (x.id === c.id ? c : x)) }));
    notify(isNew ? "Claim added" : "Claim updated");
  }
  function remove(id) {
    const removed = claims.find((c) => c.id === id);
    saveThesis((prev) => ({ ...prev, claims: prev.claims.filter((c) => c.id !== id) }));
    notify("Claim removed", () => saveThesis((prev) => (prev.claims.some((c) => c.id === id) ? prev : { ...prev, claims: [removed, ...prev.claims] })));
  }
  const canSave = !!(draft && draft.text.trim());
  function articleTitle(id) { return literature.articles.find((a) => a.id === id)?.title || "(untitled)"; }

  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 16 }}>Research claims you're building, with the literature that supports or contradicts each one.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setDraft(blankClaim()); setShowForm(true); }}><Plus size={14} /> Add claim</button>
      </div>
      {claims.length === 0 ? <EmptyState text="No claims yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {claims.map((c) => (
            <div key={c.id} className="pt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.text}</div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setDraft(c); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="pt-grid2">
                <div>
                  <div className="pt-label" style={{ marginBottom: 6 }}>Evidence ({c.evidenceArticleIds.length})</div>
                  {c.evidenceArticleIds.length === 0 ? <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>None yet.</div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      {c.evidenceArticleIds.map((id) => <span key={id} className="pt-chip">{articleTitle(id)}</span>)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="pt-label" style={{ marginBottom: 6 }}>Contradicting ({c.contradictingArticleIds.length})</div>
                  {c.contradictingArticleIds.length === 0 ? <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>None yet.</div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      {c.contradictingArticleIds.map((id) => <span key={id} className="pt-chip" style={{ background: "#F7E7E2", color: "var(--behind)" }}>{articleTitle(id)}</span>)}
                    </div>
                  )}
                </div>
              </div>
              {c.interpretation && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                  <div className="pt-label" style={{ marginBottom: 4 }}>My interpretation</div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{c.interpretation}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={draft.id ? "Edit claim" : "Add claim"} onClose={() => setShowForm(false)} wide>
          <Field label="Claim"><textarea className="pt-textarea" style={{ minHeight: 80 }} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></Field>
          <div className="pt-grid2">
            <Field label="Evidence (supporting articles)">
              <CheckboxList items={literature.articles} selectedIds={draft.evidenceArticleIds} onChange={(ids) => setDraft({ ...draft, evidenceArticleIds: ids })} getLabel={(a) => a.title || "(untitled)"} emptyText="No articles in the library yet." />
            </Field>
            <Field label="Contradicting articles">
              <CheckboxList items={literature.articles} selectedIds={draft.contradictingArticleIds} onChange={(ids) => setDraft({ ...draft, contradictingArticleIds: ids })} getLabel={(a) => a.title || "(untitled)"} emptyText="No articles in the library yet." />
            </Field>
          </div>
          <Field label="My interpretation"><textarea className="pt-textarea" value={draft.interpretation} onChange={(e) => setDraft({ ...draft, interpretation: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Claim text is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert(draft); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

function blankContradiction() { return { id: null, articleAId: "", articleBId: "", note: "" }; }

// Direct disagreements between two specific sources — kept as its own
// consultable list rather than buried inside each article's edit form.
function ContradictionsTab({ ctx }) {
  const { thesis, saveThesis, literature, notify } = ctx;
  const contradictions = thesis.contradictions;
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(null);

  function upsert(c) {
    const isNew = !contradictions.some((x) => x.id === c.id);
    saveThesis((prev) => ({ ...prev, contradictions: isNew ? [{ ...c, id: uid() }, ...prev.contradictions] : prev.contradictions.map((x) => (x.id === c.id ? c : x)) }));
    notify(isNew ? "Contradiction added" : "Contradiction updated");
  }
  function remove(id) {
    const removed = contradictions.find((c) => c.id === id);
    saveThesis((prev) => ({ ...prev, contradictions: prev.contradictions.filter((c) => c.id !== id) }));
    notify("Contradiction removed", () => saveThesis((prev) => (prev.contradictions.some((c) => c.id === id) ? prev : { ...prev, contradictions: [removed, ...prev.contradictions] })));
  }
  const canSave = !!(draft && draft.articleAId && draft.articleBId && draft.articleAId !== draft.articleBId && draft.note.trim());
  function articleTitle(id) { return literature.articles.find((a) => a.id === id)?.title || "(untitled)"; }

  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 16 }}>Direct disagreements between two specific sources — e.g. one finds an effect, the other doesn't.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" disabled={literature.articles.length < 2} onClick={() => { setDraft(blankContradiction()); setShowForm(true); }}><Plus size={14} /> Add contradiction</button>
      </div>
      {literature.articles.length < 2 ? (
        <EmptyState text="Add at least two articles to the library first." />
      ) : contradictions.length === 0 ? (
        <EmptyState text="No contradictions logged yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contradictions.map((c) => (
            <div key={c.id} className="pt-card pt-card-tight">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{articleTitle(c.articleAId)} ↔ {articleTitle(c.articleBId)}</div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setDraft(c); setShowForm(true); }}><Edit3 size={13} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8 }}>{c.note}</div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={draft.id ? "Edit contradiction" : "Add contradiction"} onClose={() => setShowForm(false)}>
          <Field label="Article A">
            <select className="pt-select" value={draft.articleAId} onChange={(e) => setDraft({ ...draft, articleAId: e.target.value })}>
              <option value="">Select an article…</option>
              {literature.articles.map((a) => <option key={a.id} value={a.id}>{a.title || "(untitled)"}</option>)}
            </select>
          </Field>
          <Field label="Article B">
            <select className="pt-select" value={draft.articleBId} onChange={(e) => setDraft({ ...draft, articleBId: e.target.value })}>
              <option value="">Select an article…</option>
              {literature.articles.map((a) => <option key={a.id} value={a.id}>{a.title || "(untitled)"}</option>)}
            </select>
          </Field>
          <Field label="Nature of the disagreement"><textarea className="pt-textarea" placeholder="e.g. Paper A finds a positive effect, Paper B finds no significant effect…" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Pick two different articles and describe the disagreement.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert(draft); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

function CaseStudiesTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  function blank() { return { id: null, university: "", location: "", spaceName: "", spaceType: "", whySelected: "", notes: "", status: "NOT STARTED" }; }
  function upsert(v) {
    const isNew = !thesis.caseStudies.some((c) => c.id === v.id);
    saveThesis((prev) => ({ ...prev, caseStudies: prev.caseStudies.some((c) => c.id === v.id) ? prev.caseStudies.map((c) => (c.id === v.id ? v : c)) : [v, ...prev.caseStudies] }));
    notify(isNew ? "Case study added" : "Case study updated");
  }
  function remove(id) {
    const removed = thesis.caseStudies.find((c) => c.id === id);
    saveThesis((prev) => ({ ...prev, caseStudies: prev.caseStudies.filter((c) => c.id !== id) }));
    notify("Case study removed", () => saveThesis((prev) => (prev.caseStudies.some((c) => c.id === id) ? prev : { ...prev, caseStudies: [removed, ...prev.caseStudies] })));
  }
  const canSaveCase = !!(item && item.spaceName.trim());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add case study</button>
      </div>
      {thesis.caseStudies.length === 0 ? <EmptyState text="No case studies yet." /> : (
        <div className="pt-grid2">
          {thesis.caseStudies.map((c) => (
            <div key={c.id} className="pt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.spaceName || "(unnamed space)"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{c.university} · {c.location}</div>
                </div>
                <StatusPill status={c.status} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "10px 0" }}>{c.whySelected}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pt-btn pt-btn-sm" onClick={() => { setItem(c); setShowForm(true); }}><Edit3 size={12} /> Edit</button>
                <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => remove(c.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title="Case study" onClose={() => setShowForm(false)}>
          <div className="pt-grid2">
            <Field label="University"><input className="pt-input" value={item.university} onChange={(e) => setItem({ ...item, university: e.target.value })} /></Field>
            <Field label="Location"><input className="pt-input" value={item.location} onChange={(e) => setItem({ ...item, location: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
            <Field label="Space name"><input className="pt-input" value={item.spaceName} onChange={(e) => setItem({ ...item, spaceName: e.target.value })} /></Field>
            <Field label="Space type"><input className="pt-input" value={item.spaceType} onChange={(e) => setItem({ ...item, spaceType: e.target.value })} /></Field>
          </div>
          <Field label="Why selected"><textarea className="pt-textarea" value={item.whySelected} onChange={(e) => setItem({ ...item, whySelected: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          <Field label="Observation status">
            <select className="pt-select" value={item.status} onChange={(e) => setItem({ ...item, status: e.target.value })}>
              {["NOT STARTED", "PLANNED", "OBSERVED", "COMPLETED"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12, display: "flex", gap: 6 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Photo upload isn't available in this environment (storage is text/JSON only) — use the Notes field to reference where photos are kept.
          </div>
          {!canSaveCase && <div className="pt-field-error">Space name is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveCase} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

const OBS_ACTIVITY_FIELDS = ["individual", "group", "socialising", "resting", "eating", "phoneUse", "other"];
function ObservationTab({ ctx }) {
  const { thesis, saveThesis, addXP, notify } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  function blank() {
    return {
      id: null, location: "", university: "", date: todayISO(), startTime: "", endTime: "", duration: "",
      conditions: "", numUsers: "", activities: Object.fromEntries(OBS_ACTIVITY_FIELDS.map((f) => [f, 0])),
      noiseLevel: "Moderate", occupancy: "", spatialConfig: "", furnitureUse: "", privacyBehaviour: "", notes: "",
    };
  }
  function upsert(v) {
    const isNew = !thesis.observations.some((o) => o.id === v.id);
    saveThesis((prev) => ({ ...prev, observations: isNew ? [v, ...prev.observations] : prev.observations.map((o) => (o.id === v.id ? v : o)) }));
    if (isNew) addXP(20, "Observation session logged");
    else notify("Observation updated");
  }
  function remove(id) {
    const removed = thesis.observations.find((o) => o.id === id);
    saveThesis((prev) => ({ ...prev, observations: prev.observations.filter((o) => o.id !== id) }));
    notify("Observation removed", () => saveThesis((prev) => (prev.observations.some((o) => o.id === id) ? prev : { ...prev, observations: [removed, ...prev.observations] })));
  }
  const canSaveObs = !!(item && item.location.trim());

  const chartData = useMemo(() => {
    const byLocation = {};
    thesis.observations.forEach((o) => {
      byLocation[o.location] = byLocation[o.location] || { name: o.location || "—", sessions: 0 };
      byLocation[o.location].sessions += 1;
    });
    return Object.values(byLocation);
  }, [thesis.observations]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> New observation session</button>
      </div>
      {thesis.observations.length > 0 && (
        <div className="pt-card" style={{ marginBottom: 20, height: 180 }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>Sessions by location</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="var(--thesis)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {thesis.observations.length === 0 ? <EmptyState text="No observation sessions recorded yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Date</th><th>Location</th><th>Duration</th><th>Users</th><th>Noise</th><th></th></tr></thead>
            <tbody>
              {thesis.observations.map((o) => (
                <tr key={o.id}>
                  <td>{fmtDate(o.date)}</td><td>{o.location}</td><td>{o.duration}</td><td>{o.numUsers}</td><td>{o.noiseLevel}</td>
                  <td><button className="pt-btn pt-btn-ghost" onClick={() => { setItem(o); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(o.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title="Observation session" onClose={() => setShowForm(false)} wide>
          <div className="pt-grid2">
            <Field label="Location"><input className="pt-input" value={item.location} onChange={(e) => setItem({ ...item, location: e.target.value })} /></Field>
            <Field label="University"><input className="pt-input" value={item.university} onChange={(e) => setItem({ ...item, university: e.target.value })} /></Field>
          </div>
          <div className="pt-grid3">
            <Field label="Date"><input type="date" className="pt-input" value={item.date} onChange={(e) => setItem({ ...item, date: e.target.value })} /></Field>
            <Field label="Start time"><input type="time" className="pt-input" value={item.startTime} onChange={(e) => setItem({ ...item, startTime: e.target.value })} /></Field>
            <Field label="End time"><input type="time" className="pt-input" value={item.endTime} onChange={(e) => setItem({ ...item, endTime: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
            <Field label="Environmental conditions"><input className="pt-input" value={item.conditions} onChange={(e) => setItem({ ...item, conditions: e.target.value })} /></Field>
            <Field label="Number of users"><input className="pt-input" type="number" value={item.numUsers} onChange={(e) => setItem({ ...item, numUsers: e.target.value })} /></Field>
          </div>
          <div className="pt-label" style={{ marginTop: 4, marginBottom: 6 }}>Activity counts</div>
          <div className="pt-grid3" style={{ marginBottom: 8 }}>
            {OBS_ACTIVITY_FIELDS.map((f) => (
              <Field key={f} label={f}><input type="number" className="pt-input" value={item.activities[f]} onChange={(e) => setItem({ ...item, activities: { ...item.activities, [f]: Number(e.target.value) } })} /></Field>
            ))}
          </div>
          <div className="pt-grid2">
            <Field label="Noise level">
              <select className="pt-select" value={item.noiseLevel} onChange={(e) => setItem({ ...item, noiseLevel: e.target.value })}>
                {["Silent", "Low", "Moderate", "High"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Occupancy"><input className="pt-input" value={item.occupancy} onChange={(e) => setItem({ ...item, occupancy: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
            <Field label="Spatial configuration"><input className="pt-input" value={item.spatialConfig} onChange={(e) => setItem({ ...item, spatialConfig: e.target.value })} /></Field>
            <Field label="Furniture use"><input className="pt-input" value={item.furnitureUse} onChange={(e) => setItem({ ...item, furnitureUse: e.target.value })} /></Field>
          </div>
          <Field label="Privacy behaviour"><input className="pt-input" value={item.privacyBehaviour} onChange={(e) => setItem({ ...item, privacyBehaviour: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          {!canSaveObs && <div className="pt-field-error">Location is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveObs} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save session</button>
        </Modal>
      )}
    </div>
  );
}

const QUESTIONNAIRE_STAGES = ["IDEA", "DRAFT", "SUPERVISOR REVIEW", "PILOT", "REVISED", "PUBLISHED", "COLLECTING RESPONSES", "CLOSED"];
function QuestionnaireTab({ ctx }) {
  const { thesis, saveThesis, addXP, notify } = ctx;
  const q = thesis.questionnaire;
  function patch(p) { saveThesis((prev) => ({ ...prev, questionnaire: { ...prev.questionnaire, ...p } })); }
  const [showQForm, setShowQForm] = useState(false);
  const [qItem, setQItem] = useState(null);

  function blankQ() { return { id: null, question: "", type: "Multiple choice", concept: "", why: "", options: "", status: "DRAFT", notes: "" }; }
  function upsertQ(v) {
    const isNew = !thesis.questionBank.some((x) => x.id === v.id);
    saveThesis((prev) => ({ ...prev, questionBank: prev.questionBank.some((x) => x.id === v.id) ? prev.questionBank.map((x) => (x.id === v.id ? v : x)) : [v, ...prev.questionBank] }));
    notify(isNew ? "Question added" : "Question updated");
  }
  function removeQ(id) {
    const removed = thesis.questionBank.find((x) => x.id === id);
    saveThesis((prev) => ({ ...prev, questionBank: prev.questionBank.filter((x) => x.id !== id) }));
    notify("Question removed", () => saveThesis((prev) => (prev.questionBank.some((x) => x.id === id) ? prev : { ...prev, questionBank: [removed, ...prev.questionBank] })));
  }
  const canSaveQ = !!(qItem && qItem.question.trim());

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Questionnaire status</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {QUESTIONNAIRE_STAGES.map((s) => (
            <div key={s} onClick={() => patch({ stage: s })} className="pt-chip" style={{ cursor: "pointer", background: q.stage === s ? "var(--thesis)" : "var(--line-soft)", color: q.stage === s ? "#fff" : "var(--ink-soft)" }}>{s}</div>
          ))}
        </div>
        <div className="pt-grid2">
          <Field label="Title"><input className="pt-input" value={q.title} onChange={(e) => patch({ title: e.target.value })} /></Field>
          <Field label="Link"><input className="pt-input" value={q.link} onChange={(e) => patch({ link: e.target.value })} /></Field>
        </div>
        <Field label="Research purpose"><textarea className="pt-textarea" value={q.purpose} onChange={(e) => patch({ purpose: e.target.value })} /></Field>
        <div className="pt-grid3">
          <Field label="Draft date"><input type="date" className="pt-input" value={q.draftDate} onChange={(e) => patch({ draftDate: e.target.value })} /></Field>
          <Field label="Supervisor review"><input type="date" className="pt-input" value={q.supervisorReviewDate} onChange={(e) => patch({ supervisorReviewDate: e.target.value })} /></Field>
          <Field label="Pilot date"><input type="date" className="pt-input" value={q.pilotDate} onChange={(e) => patch({ pilotDate: e.target.value })} /></Field>
        </div>
        <div className="pt-grid3">
          <Field label="Launch date"><input type="date" className="pt-input" value={q.launchDate} onChange={(e) => patch({ launchDate: e.target.value })} /></Field>
          <Field label="Closing date"><input type="date" className="pt-input" value={q.closingDate} onChange={(e) => patch({ closingDate: e.target.value })} /></Field>
          <Field label="Target participants (editable)"><input type="number" className="pt-input" value={q.targetParticipants} onChange={(e) => patch({ targetParticipants: Number(e.target.value) })} /></Field>
        </div>
        <Field label={`Current responses — ${q.currentResponses} / ${q.targetParticipants}`}>
          <input type="range" min="0" max={q.targetParticipants} value={q.currentResponses} onChange={(e) => patch({ currentResponses: Number(e.target.value) })} style={{ width: "100%" }} />
        </Field>
        <ProgressBar pct={(q.currentResponses / Math.max(1, q.targetParticipants)) * 100} color="var(--thesis)" />
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>Note: this target is editable and is not a claim of statistically required sample size.</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="pt-h2" style={{ fontSize: 15 }}>Question bank</div>
        <button className="pt-btn pt-btn-primary" onClick={() => { setQItem(blankQ()); setShowQForm(true); }}><Plus size={14} /> Add question</button>
      </div>
      {thesis.questionBank.length === 0 ? <EmptyState text="No questions yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Question</th><th>Type</th><th>Concept → RQ</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {thesis.questionBank.map((qb) => (
                <tr key={qb.id}>
                  <td style={{ maxWidth: 260 }}>{qb.question}</td><td>{qb.type}</td><td>{qb.concept}</td>
                  <td><StatusPill status={qb.status} /></td>
                  <td><button className="pt-btn pt-btn-ghost" onClick={() => { setQItem(qb); setShowQForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => removeQ(qb.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>This questionnaire is not claimed to be scientifically validated — use Supervisor Review and Pilot stages to validate it.</div>

      {showQForm && (
        <Modal title="Question" onClose={() => setShowQForm(false)}>
          <Field label="Question"><textarea className="pt-textarea" value={qItem.question} onChange={(e) => setQItem({ ...qItem, question: e.target.value })} /></Field>
          <div className="pt-grid2">
            <Field label="Type">
              <select className="pt-select" value={qItem.type} onChange={(e) => setQItem({ ...qItem, type: e.target.value })}>
                {["Multiple choice", "Likert scale", "Ranking", "Multiple selection", "Open-ended"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="pt-select" value={qItem.status} onChange={(e) => setQItem({ ...qItem, status: e.target.value })}>
                {["DRAFT", "REVISED", "FINAL"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Concept / variable → research question"><input className="pt-input" value={qItem.concept} onChange={(e) => setQItem({ ...qItem, concept: e.target.value })} /></Field>
          <Field label="Why this question is included"><textarea className="pt-textarea" value={qItem.why} onChange={(e) => setQItem({ ...qItem, why: e.target.value })} /></Field>
          <Field label="Response options"><input className="pt-input" value={qItem.options} onChange={(e) => setQItem({ ...qItem, options: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="pt-textarea" value={qItem.notes} onChange={(e) => setQItem({ ...qItem, notes: e.target.value })} /></Field>
          {!canSaveQ && <div className="pt-field-error">Question text is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveQ} onClick={() => { upsertQ({ ...qItem, id: qItem.id || uid() }); setShowQForm(false); }}>Save question</button>
        </Modal>
      )}
    </div>
  );
}

function SupervisorTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const sup = thesis.supervisor;
  const [meetingNotes, setMeetingNotes] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");

  function toggleChecklist(id) {
    saveThesis((prev) => ({ ...prev, supervisor: { ...prev.supervisor, checklist: prev.supervisor.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) } }));
  }
  function logMeeting() {
    if (!meetingNotes.trim()) return;
    saveThesis((prev) => ({ ...prev, supervisor: { ...prev.supervisor, meetings: [{ id: uid(), date: todayISO(), notes: meetingNotes, feedback: [] }, ...prev.supervisor.meetings] } }));
    setMeetingNotes("");
    notify("Meeting logged");
  }
  function addFeedback(meetingId) {
    if (!feedbackDraft.trim()) return;
    saveThesis((prev) => ({
      ...prev, supervisor: {
        ...prev.supervisor,
        meetings: prev.supervisor.meetings.map((m) => (m.id === meetingId ? { ...m, feedback: [...m.feedback, { id: uid(), text: feedbackDraft, convertedToTask: false }] } : m)),
      },
    }));
    setFeedbackDraft("");
    notify("Feedback added");
  }
  function convertToTask(meetingId, fbId, text, calendarSave) {
    saveThesis((prev) => ({
      ...prev, supervisor: {
        ...prev.supervisor,
        meetings: prev.supervisor.meetings.map((m) => (m.id === meetingId ? { ...m, feedback: m.feedback.map((f) => (f.id === fbId ? { ...f, convertedToTask: true } : f)) } : m)),
      },
    }));
    calendarSave((prev) => ({ ...prev, tasks: [{ id: uid(), title: text, date: todayISO(), time: "", duration: 30, category: "Thesis", priority: "High", notes: "From supervisor feedback", completed: false, recurrence: "none" }, ...prev.tasks] }));
    notify("Added to calendar");
  }

  return (
    <div>
      <div className="pt-grid2">
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Meeting preparation checklist</div>
          {sup.checklist.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => toggleChecklist(c.id)}>
                {c.done ? <CheckCircle2 size={16} color="var(--ontrack)" /> : <Circle size={16} color="var(--ink-faint)" />}
              </button>
              <span style={{ fontSize: 13.5, textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--ink-faint)" : "var(--ink)" }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Log a meeting</div>
          <textarea className="pt-textarea" placeholder="Meeting notes…" value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} style={{ minHeight: 100 }} />
          <button className="pt-btn pt-btn-primary" style={{ marginTop: 10 }} disabled={!meetingNotes.trim()} onClick={logMeeting}><Plus size={14} /> Log meeting</button>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Supervisor feedback</div>
        {sup.meetings.length === 0 ? <EmptyState text="No meetings logged yet." /> : sup.meetings.map((m) => (
          <div key={m.id} className="pt-card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>{fmtDate(m.date)}</div>
            <div style={{ fontSize: 13.5, marginBottom: 10 }}>{m.notes}</div>
            {m.feedback.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderTop: "1px solid var(--line-soft)" }}>
                <span style={{ flex: 1, fontSize: 13 }}>{f.text}</span>
                {f.convertedToTask ? <span className="pt-chip">Task added</span> :
                  <button className="pt-btn pt-btn-sm" onClick={() => convertToTask(m.id, f.id, f.text, ctx.saveCalendar)}>→ Task</button>}
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input className="pt-input" placeholder="Add feedback point…" value={feedbackDraft} onChange={(e) => setFeedbackDraft(e.target.value)} />
              <button className="pt-btn" disabled={!feedbackDraft.trim()} onClick={() => addFeedback(m.id)}><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-grid2" style={{ marginTop: 22 }}>
        <div className="pt-card"><div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Interviews</div><StatusPill status="NOT STARTED" /><p className="pt-sub" style={{ marginTop: 8 }}>Later research stage — becomes prominent after the questionnaire closes.</p></div>
        <div className="pt-card"><div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Focus Group</div><StatusPill status="NOT STARTED" /><p className="pt-sub" style={{ marginTop: 8 }}>Later research stage — becomes prominent after interviews.</p></div>
      </div>
    </div>
  );
}

const OUTPUT_STATUSES = ["IDEA", "PREPARING", "SUBMITTED", "UNDER REVIEW", "ACCEPTED", "PUBLISHED"];
function OutputsTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  function blank() { return { id: null, type: "Conference abstract", title: "", status: "IDEA", notes: "" }; }
  function upsert(v) {
    const isNew = !thesis.outputs.some((o) => o.id === v.id);
    saveThesis((prev) => ({ ...prev, outputs: prev.outputs.some((o) => o.id === v.id) ? prev.outputs.map((o) => (o.id === v.id ? v : o)) : [v, ...prev.outputs] }));
    notify(isNew ? "Output added" : "Output updated");
  }
  function remove(id) {
    const removed = thesis.outputs.find((o) => o.id === id);
    saveThesis((prev) => ({ ...prev, outputs: prev.outputs.filter((o) => o.id !== id) }));
    notify("Output removed", () => saveThesis((prev) => (prev.outputs.some((o) => o.id === id) ? prev : { ...prev, outputs: [removed, ...prev.outputs] })));
  }
  const canSaveOutput = !!(item && item.title.trim());
  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 14 }}>Goal: conference participation and/or publication-related progress by early October. Publication is not assumed — this simply tracks where things stand.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add output</button>
      </div>
      {thesis.outputs.length === 0 ? <EmptyState text="Nothing tracked yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Type</th><th>Title</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {thesis.outputs.map((o) => (
                <tr key={o.id}><td>{o.type}</td><td>{o.title}</td><td><StatusPill status={o.status} /></td>
                  <td><button className="pt-btn pt-btn-ghost" onClick={() => { setItem(o); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(o.id)}><Trash2 size={14} /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title="Research output" onClose={() => setShowForm(false)}>
          <Field label="Type">
            <select className="pt-select" value={item.type} onChange={(e) => setItem({ ...item, type: e.target.value })}>
              {["Conference abstract", "Research paper", "Publication", "Certificate", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <Field label="Status">
            <select className="pt-select" value={item.status} onChange={(e) => setItem({ ...item, status: e.target.value })}>
              {OUTPUT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          {!canSaveOutput && <div className="pt-field-error">Title is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveOutput} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

const TIME_CATEGORIES = ["Literature Review", "Framework", "Case Studies", "Observation", "Questionnaire", "Interviews", "Writing", "Supervisor", "Other"];
function TimeTrackingTab({ ctx }) {
  const { thesis, saveThesis, addXP, notify } = ctx;
  const [form, setForm] = useState({ date: todayISO(), task: "", category: TIME_CATEGORIES[0], minutes: 30, notes: "" });

  function add() {
    if (!form.task.trim()) return;
    saveThesis((prev) => ({ ...prev, timeLog: [{ id: uid(), ...form, minutes: Number(form.minutes) }, ...prev.timeLog] }));
    addXP(Math.min(30, Math.round(form.minutes / 10)), "Thesis time logged");
    setForm({ date: todayISO(), task: "", category: form.category, minutes: 30, notes: "" });
  }
  function remove(id) {
    const removed = thesis.timeLog.find((t) => t.id === id);
    saveThesis((prev) => ({ ...prev, timeLog: prev.timeLog.filter((t) => t.id !== id) }));
    notify("Time entry removed", () => saveThesis((prev) => (prev.timeLog.some((t) => t.id === id) ? prev : { ...prev, timeLog: [removed, ...prev.timeLog] })));
  }

  const weeklyTotals = useMemo(() => {
    const totals = {};
    thesis.timeLog.forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.minutes; });
    return Object.entries(totals).map(([category, minutes]) => ({ category, minutes }));
  }, [thesis.timeLog]);

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Log time</div>
        <div className="pt-grid3">
          <Field label="Date"><input type="date" className="pt-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Category">
            <select className="pt-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {TIME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Minutes spent"><input type="number" className="pt-input" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} /></Field>
        </div>
        <Field label="Task"><input className="pt-input" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} /></Field>
        <Field label="Notes"><input className="pt-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        {!form.task.trim() && <div className="pt-field-error">Task is required.</div>}
        <button className="pt-btn pt-btn-primary" disabled={!form.task.trim()} onClick={add}><Plus size={14} /> Add entry</button>
      </div>

      {weeklyTotals.length > 0 && (
        <div className="pt-card" style={{ marginBottom: 20 }}>
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 8 }}>Totals by category</div>
          {weeklyTotals.map((w) => (
            <div key={w.category} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span>{w.category}</span><span className="pt-mono" style={{ fontWeight: 700 }}>{Math.floor(w.minutes / 60)}h {w.minutes % 60}m</span>
            </div>
          ))}
        </div>
      )}

      {thesis.timeLog.length === 0 ? <EmptyState text="No time logged yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Date</th><th>Task</th><th>Category</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {thesis.timeLog.map((t) => (
                <tr key={t.id}><td>{fmtDate(t.date)}</td><td>{t.task}</td><td>{t.category}</td><td>{Math.floor(t.minutes / 60)}h {t.minutes % 60}m</td>
                  <td><button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(t.id)}><Trash2 size={14} /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   GOALS SCREEN
   ========================================================================= */
// Thin top-level wrappers — nav used to route these through a shared
// "Goals" screen with a sub-tab switcher; now each is its own page.
function FrenchScreen({ ctx }) {
  return (
    <div>
      <div className="pt-eyebrow">Language</div>
      <h1 className="pt-h1">French</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>Toward A2, {fmtDate(ctx.settings.frenchTarget)}.</p>
      <FrenchTab ctx={ctx} />
    </div>
  );
}
function ChineseScreen({ ctx }) {
  return (
    <div>
      <div className="pt-eyebrow">Language</div>
      <h1 className="pt-h1">Chinese</h1>
      <ChineseTab ctx={ctx} />
    </div>
  );
}
function InternshipScreen({ ctx }) {
  return (
    <div>
      <div className="pt-eyebrow">Career</div>
      <h1 className="pt-h1">Internship</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>{ctx.goals.internship.active ? "Active." : "Searching."}</p>
      <InternshipTab ctx={ctx} />
    </div>
  );
}
function PortfolioScreen({ ctx }) {
  return (
    <div>
      <div className="pt-eyebrow">Practice</div>
      <h1 className="pt-h1">Portfolio</h1>
      <PortfolioTab ctx={ctx} />
    </div>
  );
}

// Manual-only, matching the Literature "Coming Later" AI pattern — no
// suggestions are generated, just a place to log what's already been read.
function InternshipLearning({ ctx }) {
  const { goals, saveGoals, notify } = ctx;
  const learning = goals.internship.learning;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  function upsert(v) {
    const isNew = !learning.some((r) => r.id === v.id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, learning: isNew ? [v, ...prev.internship.learning] : prev.internship.learning.map((r) => (r.id === v.id ? v : r)) } }));
    notify(isNew ? "Resource added" : "Resource updated");
  }
  function remove(id) {
    const removed = learning.find((r) => r.id === id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, learning: prev.internship.learning.filter((r) => r.id !== id) } }));
    notify("Resource removed", () => saveGoals((prev) => (prev.internship.learning.some((r) => r.id === id) ? prev : { ...prev, internship: { ...prev.internship, learning: [removed, ...prev.internship.learning] } })));
  }
  function toggleStatus(r) {
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, learning: prev.internship.learning.map((x) => (x.id === r.id ? { ...x, status: x.status === "READ" ? "TO_READ" : "READ" } : x)) } }));
  }
  const canSave = !!(item && item.title.trim());

  // Manual trigger only — never called automatically. Suggestions are
  // ephemeral (not saved anywhere) until she explicitly adds one, so
  // "Ignore" just drops it from view rather than needing its own
  // persisted rejection state.
  async function handleSuggest() {
    setSuggesting(true); setSuggestError("");
    try {
      const res = await fetch("/.netlify/functions/suggest-internship-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingTopics: learning.map((r) => r.title) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Suggestion failed (${res.status}).`);
      setSuggestions((data.suggestions || []).map((s) => ({ ...s, _id: uid() })));
    } catch (e) {
      setSuggestError(String(e.message || e));
    } finally {
      setSuggesting(false);
    }
  }
  function addSuggestion(s) {
    upsert({ id: uid(), title: s.topic, link: "", type: "Concept", relevance: s.whyRelevant, howItHelps: s.howItHelps, status: "TO_READ" });
    setSuggestions((prev) => prev.filter((x) => x._id !== s._id));
  }
  function ignoreSuggestion(id) {
    setSuggestions((prev) => prev.filter((x) => x._id !== id));
  }

  return (
    <div className="pt-card" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Daily Professional Learning</div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Direction: Design Strategy + Spatial Strategy / Space Organization</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pt-btn pt-btn-sm" disabled={suggesting} onClick={handleSuggest}>
            {suggesting ? <Loader2 size={11} className="pt-spin" /> : <Sparkles size={11} />} {suggesting ? "Suggesting…" : "Suggest with AI"}
          </button>
          <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => { setItem(blankLearningResource()); setShowForm(true); }}><Plus size={14} /> Add resource</button>
        </div>
      </div>

      {suggestError && <div className="pt-field-error" style={{ marginTop: 12 }}>{suggestError}</div>}

      {suggestions.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {suggestions.map((s) => (
            <div key={s._id} className="pt-card pt-card-tight" style={{ borderColor: "var(--gold)" }}>
              <span className="pt-chip" style={{ background: "var(--gold)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <Sparkles size={11} /> AI Suggested
              </span>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>{s.topic}</div>
              {s.whyRelevant && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Why this is relevant</div>
                  <div style={{ fontSize: 12.5 }}>{s.whyRelevant}</div>
                </div>
              )}
              {s.howItHelps && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>How it helps me develop</div>
                  <div style={{ fontSize: 12.5 }}>{s.howItHelps}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => addSuggestion(s)}><Plus size={12} /> Add to list</button>
                <button className="pt-btn pt-btn-sm" onClick={() => ignoreSuggestion(s._id)}>Ignore</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {learning.length === 0 ? <EmptyState text="No resources added yet." /> : learning.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => toggleStatus(r)} title={r.status === "READ" ? "Mark as to-read" : "Mark as read"}>
              {r.status === "READ" ? <CheckCircle2 size={16} color="var(--ontrack)" /> : <Circle size={16} color="var(--ink-faint)" />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 600, color: r.status === "READ" ? "var(--ink-faint)" : "var(--ink)", textDecoration: r.status === "READ" ? "line-through" : "none" }}>{r.title}</a>
                ) : (
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: r.status === "READ" ? "var(--ink-faint)" : "var(--ink)", textDecoration: r.status === "READ" ? "line-through" : "none" }}>{r.title}</span>
                )}
                <span className="pt-chip">{r.type}</span>
              </div>
              {r.relevance && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{r.relevance}</div>}
              {r.howItHelps && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{r.howItHelps}</div>}
            </div>
            <button className="pt-btn-ghost pt-btn" onClick={() => { setItem(r); setShowForm(true); }}><Edit3 size={13} /></button>
            <button className="pt-btn-ghost pt-btn pt-btn-danger" onClick={() => remove(r.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      {showForm && (
        <Modal title="Learning resource" onClose={() => setShowForm(false)}>
          <Field label="Title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <Field label="Link (optional)"><input className="pt-input" value={item.link} onChange={(e) => setItem({ ...item, link: e.target.value })} /></Field>
          <Field label="Type">
            <select className="pt-select" value={item.type} onChange={(e) => setItem({ ...item, type: e.target.value })}>
              {LEARNING_RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Why this is relevant to my development"><textarea className="pt-textarea" value={item.relevance} onChange={(e) => setItem({ ...item, relevance: e.target.value })} /></Field>
          <Field label="How this helps me develop (optional)"><textarea className="pt-textarea" value={item.howItHelps || ""} onChange={(e) => setItem({ ...item, howItHelps: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Title is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

const INTERNSHIP_STATUSES = ["RESEARCHING", "CONTACTED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];
function InternshipTab({ ctx }) {
  const { goals, saveGoals, addXP, notify, saveCalendar } = ctx;
  const intern = goals.internship;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [showActivate, setShowActivate] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [actForm, setActForm] = useState({ company: "", position: "", start: "", end: "" });

  const thisWeekCount = useMemo(() => {
    const weekAgo = addDays(todayISO(), -7);
    return intern.applications.filter((a) => a.date >= weekAgo && a.status !== "RESEARCHING").length;
  }, [intern.applications]);

  function blank() { return { id: null, company: "", position: "", date: todayISO(), status: "RESEARCHING", link: "", notes: "" }; }
  function upsert(v, silent) {
    const isNew = !intern.applications.some((a) => a.id === v.id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, applications: isNew ? [v, ...prev.internship.applications] : prev.internship.applications.map((a) => (a.id === v.id ? v : a)) } }));
    if (isNew) addXP(10, "Internship application tracked");
    else if (!silent) notify("Application updated");
  }
  function remove(id) {
    const removed = intern.applications.find((a) => a.id === id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, applications: prev.internship.applications.filter((a) => a.id !== id) } }));
    notify("Application removed", () => saveGoals((prev) => (prev.internship.applications.some((a) => a.id === id) ? prev : { ...prev, internship: { ...prev.internship, applications: [removed, ...prev.internship.applications] } })));
  }
  function sendAppToCalendar(a) {
    sendToCalendar(saveCalendar, notify, {
      title: `Follow up: ${a.company}${a.position ? ` (${a.position})` : ""}`, category: "Internship", type: "Appointment",
      linkedType: "Internship application", linkedId: a.id, notes: a.notes || "",
    });
  }
  const canSaveApp = !!(item && item.company.trim());
  const canActivate = actForm.company.trim().length > 0;

  function activate() {
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...actForm, hours: [], projects: [], learned: [], skills: [], deliverables: [], notes: [], weeklyReflections: [] } } }));
    setConfirmActivate(false);
    setShowActivate(false);
    addXP(75, "Internship activated!");
  }

  if (intern.active) {
    const a = intern.active;
    return <ActiveInternship internship={a} ctx={ctx} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <MiniStat label="Applications this week" value={thisWeekCount} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pt-btn" onClick={() => setShowActivate(true)}><Briefcase size={14} /> I found an internship</button>
          <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add application</button>
        </div>
      </div>
      {intern.applications.length === 0 ? <EmptyState text="No applications tracked yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Company</th><th>Position</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {intern.applications.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.company}</td><td>{a.position}</td><td>{fmtDate(a.date)}</td>
                  <td>
                    <select className="pt-select" style={{ width: 130 }} value={a.status} onChange={(e) => upsert({ ...a, status: e.target.value }, true)}>
                      {INTERNSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="pt-btn pt-btn-ghost" title="Add to calendar" onClick={() => sendAppToCalendar(a)}><CalendarIcon size={14} /></button>
                  <button className="pt-btn pt-btn-ghost" onClick={() => { setItem(a); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(a.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <InternshipLearning ctx={ctx} />
      {showForm && (
        <Modal title="Internship application" onClose={() => setShowForm(false)}>
          <div className="pt-grid2">
            <Field label="Company"><input className="pt-input" value={item.company} onChange={(e) => setItem({ ...item, company: e.target.value })} /></Field>
            <Field label="Position"><input className="pt-input" value={item.position} onChange={(e) => setItem({ ...item, position: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
            <Field label="Date"><input type="date" className="pt-input" value={item.date} onChange={(e) => setItem({ ...item, date: e.target.value })} /></Field>
            <Field label="Status">
              <select className="pt-select" value={item.status} onChange={(e) => setItem({ ...item, status: e.target.value })}>
                {INTERNSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Link"><input className="pt-input" value={item.link} onChange={(e) => setItem({ ...item, link: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          {!canSaveApp && <div className="pt-field-error">Company is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSaveApp} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
      {showActivate && (
        <Modal title="I found an internship" onClose={() => setShowActivate(false)}>
          <Field label="Company"><input className="pt-input" value={actForm.company} onChange={(e) => setActForm({ ...actForm, company: e.target.value })} /></Field>
          <Field label="Position"><input className="pt-input" value={actForm.position} onChange={(e) => setActForm({ ...actForm, position: e.target.value })} /></Field>
          <div className="pt-grid2">
            <Field label="Start date"><input type="date" className="pt-input" value={actForm.start} onChange={(e) => setActForm({ ...actForm, start: e.target.value })} /></Field>
            <Field label="End date"><input type="date" className="pt-input" value={actForm.end} onChange={(e) => setActForm({ ...actForm, end: e.target.value })} /></Field>
          </div>
          {!canActivate && <div className="pt-field-error">Company is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canActivate} onClick={() => setConfirmActivate(true)}>Switch to My Internship</button>
        </Modal>
      )}
      {confirmActivate && (
        <ConfirmDialog
          title="Switch to active internship tracking?"
          message="This replaces the applications tracker above with day-to-day internship logging (hours, projects, what you learned, skills, deliverables, notes) and a weekly reflection. This can't be switched back from here."
          confirmLabel="Switch"
          onConfirm={activate}
          onCancel={() => setConfirmActivate(false)}
        />
      )}
    </div>
  );
}

// Simple Internship Experience Tracker, on purpose: a quick log split into
// a handful of named buckets, plus one short weekly reflection. No hours
// arithmetic, no attendance calendar, no separate CRUD screens per bucket.
function ActiveInternship({ internship, ctx }) {
  const { saveGoals, notify } = ctx;
  const [entry, setEntry] = useState("");
  const [kind, setKind] = useState("notes");
  const kinds = { hours: "Hours / Days", projects: "Projects", learned: "What I learned", skills: "Skills learned", deliverables: "Deliverables", notes: "Notes" };
  const [reflection, setReflection] = useState("");

  function addEntry() {
    if (!entry.trim()) return;
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...prev.internship.active, [kind]: [...prev.internship.active[kind], { id: uid(), text: entry, date: todayISO() }] } } }));
    setEntry("");
    notify(`${kinds[kind]} entry added`);
  }

  function saveReflection() {
    if (!reflection.trim()) return;
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...prev.internship.active, weeklyReflections: [{ id: uid(), date: todayISO(), text: reflection }, ...prev.internship.active.weeklyReflections] } } }));
    setReflection("");
    notify("Reflection saved");
  }
  function removeReflection(id) {
    const removed = internship.weeklyReflections.find((r) => r.id === id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...prev.internship.active, weeklyReflections: prev.internship.active.weeklyReflections.filter((r) => r.id !== id) } } }));
    notify("Reflection removed", () => saveGoals((prev) => (prev.internship.active.weeklyReflections.some((r) => r.id === id) ? prev : { ...prev, internship: { ...prev.internship, active: { ...prev.internship.active, weeklyReflections: [removed, ...prev.internship.active.weeklyReflections] } } })));
  }

  return (
    <div>
      <div className="pt-card pt-hero" style={{ background: "linear-gradient(135deg, var(--internship), #3E4750)", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{internship.company}</div>
        <div style={{ opacity: 0.85 }}>{internship.position} · {fmtDate(internship.start)} – {fmtDate(internship.end)}</div>
      </div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="pt-select" style={{ width: 200 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(kinds).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input className="pt-input" placeholder="Add entry…" value={entry} onChange={(e) => setEntry(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && entry.trim()) addEntry(); }} />
          <button className="pt-btn pt-btn-primary" disabled={!entry.trim()} onClick={addEntry}><Plus size={14} /></button>
        </div>
      </div>
      <div className="pt-grid2">
        {Object.entries(kinds).map(([k, l]) => (
          <div key={k} className="pt-card">
            <div className="pt-label" style={{ marginBottom: 8 }}>{l}</div>
            {internship[k].length === 0 ? <EmptyState text="Nothing logged yet." /> : internship[k].map((e) => (
              <div key={e.id} style={{ fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>{e.text} <span style={{ color: "var(--ink-faint)", fontSize: 11 }}> · {fmtDate(e.date)}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div className="pt-card" style={{ marginTop: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Weekly reflection</div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>What did I learn this week?</div>
        <textarea className="pt-textarea" value={reflection} onChange={(e) => setReflection(e.target.value)} />
        <button className="pt-btn pt-btn-primary" style={{ marginTop: 10 }} disabled={!reflection.trim()} onClick={saveReflection}>Save reflection</button>
        {internship.weeklyReflections.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {internship.weeklyReflections.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 3 }}>{fmtDate(r.date)}</div>
                  <div style={{ fontSize: 13 }}>{r.text}</div>
                </div>
                <button className="pt-btn-ghost pt-btn pt-btn-danger" onClick={() => removeReflection(r.id)}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FrenchTab({ ctx }) {
  const [sub, setSub] = useState("today");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[["today", "Today's Lesson"], ["history", "Lesson History"], ["curriculum", "Curriculum"], ["vocab", "Vocabulary Bank"], ["progress", "Progress"], ["certification", "Certification"]].map(([k, l]) => (
          <button key={k} className="pt-btn pt-btn-sm" style={{ background: sub === k ? "var(--french-soft)" : undefined, color: sub === k ? "var(--french)" : undefined, borderColor: sub === k ? "var(--french)" : undefined }} onClick={() => setSub(k)}>{l}</button>
        ))}
      </div>
      {sub === "today" && <FrenchToday ctx={ctx} />}
      {sub === "history" && <FrenchHistory ctx={ctx} />}
      {sub === "curriculum" && <FrenchCurriculum ctx={ctx} />}
      {sub === "vocab" && <FrenchVocab ctx={ctx} />}
      {sub === "progress" && <FrenchProgress ctx={ctx} />}
      {sub === "certification" && <FrenchCertification ctx={ctx} />}
    </div>
  );
}

function FrenchToday({ ctx }) {
  const { goals, saveGoals, addXP, notify, saveCalendar } = ctx;
  const french = goals.french;
  const lesson = french.lessons.find((l) => l.status !== "COMPLETED") || french.lessons[french.lessons.length - 1];
  const [minutes, setMinutes] = useState(lesson?.minutesSpent || 0);

  function sendLessonToCalendar() {
    sendToCalendar(saveCalendar, notify, {
      title: `French: ${lesson.title}`, category: "French", type: "Task",
      linkedType: "French lesson", linkedId: lesson.id, notes: `Day ${lesson.dayNumber} · ${lesson.moduleTitle}`,
    });
  }

  function markComplete() {
    const prevFrench = french;
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const wasCompleted = prev.french.lessons[idx].status === "COMPLETED";
      const nextLessons = [...prev.french.lessons];
      nextLessons[idx] = { ...nextLessons[idx], status: "COMPLETED", minutesSpent: Number(minutes) };
      const streak = wasCompleted ? prev.french.streak : (prev.french.streak || 0) + 1;
      return { ...prev, french: { ...prev.french, lessons: nextLessons, streak, daysStudied: (prev.french.daysStudied || 0) + (wasCompleted ? 0 : 1), totalMinutes: (prev.french.totalMinutes || 0) + Number(minutes) } };
    });
    addXP(25, "French lesson completed", () => saveGoals((prev) => ({ ...prev, french: prevFrench })));
  }
  function missedToday() {
    const prevFrench = french;
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const nextLessons = [...prev.french.lessons];
      // shift this and all subsequent pending lessons forward by 1 day, preserving sequence
      for (let i = idx; i < nextLessons.length; i++) {
        if (nextLessons[i].status !== "COMPLETED") nextLessons[i] = { ...nextLessons[i], date: addDays(nextLessons[i].date, 1) };
      }
      return { ...prev, french: { ...prev.french, lessons: nextLessons, streak: 0 } };
    });
    notify("Schedule pushed forward, streak reset", () => saveGoals((prev) => ({ ...prev, french: prevFrench })));
  }

  if (!lesson) return <EmptyState text="Curriculum complete." />;

  const daysBehind = Math.max(0, daysBetween(lesson.date, todayISO()));

  return (
    <div>
      {daysBehind > 0 && (
        <div className="pt-card" style={{ marginBottom: 16, borderColor: "var(--atrisk)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13 }}><AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} color="var(--atrisk)" />You're {daysBehind} day{daysBehind > 1 ? "s" : ""} behind schedule.</span>
          <button className="pt-btn pt-btn-sm" onClick={missedToday}>I missed today — push forward</button>
        </div>
      )}
      <div className="pt-card">
        <LessonContent lesson={lesson} />

        <div className="pt-grid2" style={{ marginTop: 16, alignItems: "end" }}>
          <Field label="Minutes completed today"><input type="number" className="pt-input" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          <button className="pt-btn pt-btn-primary" onClick={markComplete}><Check size={14} /> Mark lesson complete</button>
        </div>
        <button className="pt-btn pt-btn-ghost pt-tap" style={{ marginTop: 10 }} onClick={sendLessonToCalendar}><CalendarIcon size={14} /> Add to calendar</button>
      </div>
    </div>
  );
}

// Shared lesson-body renderer — used by "Today's Lesson" and by the
// Lesson History detail view so re-opening a past lesson shows exactly
// the same content instead of a stripped-down summary.
function LessonContent({ lesson }) {
  return (
    <div>
      <div className="pt-eyebrow">Day {lesson.dayNumber} · {lesson.moduleTitle} {lesson.isReview && "· Review Day"}</div>
      <div className="pt-h2" style={{ marginTop: 4, marginBottom: 16 }}>{lesson.title}</div>

      <LessonSection title="Grammar" items={lesson.grammar} icon={BookOpen} />
      {lesson.vocabulary.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>Vocabulary</div>
          <div className="pt-grid3">
            {lesson.vocabulary.map((v, i) => (
              <div key={i} className="pt-card pt-card-tight">
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{v.fr}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{v.en}</div>
                <div className="pt-chip" style={{ marginTop: 6 }}>{v.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {lesson.vocabulary.length === 0 && lesson.vocabTheme && (
        <div style={{ marginBottom: 16, fontSize: 12.5, color: "var(--ink-soft)" }}>
          Vocabulary theme: <strong>{lesson.vocabTheme}</strong> (10–20 words). Add words to the Vocabulary Bank as you learn them.
        </div>
      )}
      {lesson.phrases.length > 0 && <LessonSection title="Useful Phrases" items={lesson.phrases} icon={MessageSquare} />}
      <div className="pt-grid2">
        <LessonBlock title="Listening" icon={Mic} text={lesson.listening} />
        <LessonBlock title="Speaking" icon={Users} text={lesson.speaking} />
        <LessonBlock title="Reading" icon={FileText} text={lesson.reading} />
        <LessonBlock title="Writing" icon={Edit3} text={lesson.writing} />
      </div>
      <LessonBlock title="Review" icon={ClipboardList} text={lesson.review} />
    </div>
  );
}
function LessonSection({ title, items, icon: Icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="pt-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Icon size={13} /> {title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
function LessonBlock({ title, text, icon: Icon }) {
  return (
    <div className="pt-card pt-card-tight" style={{ marginBottom: 12 }}>
      <div className="pt-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon size={13} /> {title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function lessonSearchHaystack(lesson) {
  return [
    lesson.title, lesson.moduleTitle, lesson.vocabTheme,
    ...(lesson.grammar || []), ...(lesson.phrases || []),
    ...(lesson.vocabulary || []).flatMap((v) => [v.fr, v.en]),
    lesson.listening, lesson.speaking, lesson.reading, lesson.writing, lesson.review,
  ].filter(Boolean).join(" ").toLowerCase();
}

// Every generated lesson, browsable and reopenable — not just the current
// one. Marking complete/incomplete here corrects daysStudied/totalMinutes
// but deliberately leaves the streak and XP untouched: streak is a
// today-relative concept owned by the "Today" flow, and retroactive
// corrections shouldn't be a source of XP.
function FrenchHistory({ ctx }) {
  const { goals, saveGoals, notify } = ctx;
  const french = goals.french;
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    let list = french.lessons;
    if (moduleFilter !== "ALL") list = list.filter((l) => l.moduleId === moduleFilter);
    if (statusFilter !== "ALL") list = list.filter((l) => (statusFilter === "COMPLETED" ? l.status === "COMPLETED" : l.status !== "COMPLETED"));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => lessonSearchHaystack(l).includes(q));
    }
    return list;
  }, [french.lessons, search, moduleFilter, statusFilter]);

  const selectedIndex = selectedId ? french.lessons.findIndex((l) => l.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? french.lessons[selectedIndex] : null;

  function toggleComplete(lesson) {
    const prevFrench = french;
    const willComplete = lesson.status !== "COMPLETED";
    const minutesUsed = lesson.minutesSpent || lesson.targetMinutes || 0;
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const nextLessons = [...prev.french.lessons];
      nextLessons[idx] = { ...nextLessons[idx], status: willComplete ? "COMPLETED" : "PENDING", minutesSpent: willComplete ? (nextLessons[idx].minutesSpent || nextLessons[idx].targetMinutes || 0) : nextLessons[idx].minutesSpent };
      return {
        ...prev,
        french: {
          ...prev.french,
          lessons: nextLessons,
          daysStudied: Math.max(0, (prev.french.daysStudied || 0) + (willComplete ? 1 : -1)),
          totalMinutes: Math.max(0, (prev.french.totalMinutes || 0) + (willComplete ? minutesUsed : -minutesUsed)),
        },
      };
    });
    notify(willComplete ? "Lesson marked complete" : "Lesson marked incomplete", () => saveGoals((prev) => ({ ...prev, french: prevFrench })));
  }

  if (selected) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <button className="pt-btn pt-btn-sm" onClick={() => setSelectedId(null)}><ChevronLeft size={13} /> Back to history</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex <= 0} onClick={() => setSelectedId(french.lessons[selectedIndex - 1].id)}><ChevronLeft size={13} /> Previous lesson</button>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex >= french.lessons.length - 1} onClick={() => setSelectedId(french.lessons[selectedIndex + 1].id)}>Next lesson <ChevronRight size={13} /></button>
          </div>
        </div>
        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{fmtDate(selected.date)}</div>
            <StatusPill status={selected.status} />
          </div>
          <LessonContent lesson={selected} />
          <button className="pt-btn pt-btn-primary" style={{ marginTop: 16 }} onClick={() => toggleComplete(selected)}>
            <Check size={14} /> {selected.status === "COMPLETED" ? "Mark as not complete" : "Mark lesson complete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input className="pt-input" style={{ paddingLeft: 30 }} placeholder="Search title, grammar, vocabulary…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="pt-select" style={{ width: 200 }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          <option value="ALL">All modules</option>
          {french.modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <select className="pt-select" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Not completed</option>
        </select>
      </div>
      {filtered.length === 0 ? <EmptyState text="No lessons match your search or filters." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Day</th><th>Title</th><th>Module</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(l.id)}>
                  <td>{l.dayNumber}</td>
                  <td style={{ fontWeight: 600, maxWidth: 260 }}>{l.title}</td>
                  <td>{l.moduleTitle}</td>
                  <td>{fmtDate(l.date)}</td>
                  <td><StatusPill status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FrenchCurriculum({ ctx }) {
  const { goals } = ctx;
  const french = goals.french;
  return (
    <div>
      {french.modules.map((m) => {
        const modLessons = french.lessons.filter((l) => l.moduleId === m.id);
        const done = modLessons.filter((l) => l.status === "COMPLETED").length;
        return (
          <div key={m.id} className="pt-card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="pt-chip">{m.level}</div>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 6 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{done} / {modLessons.length} lessons</div>
            </div>
            <ProgressBar pct={(done / Math.max(1, modLessons.length)) * 100} color="var(--french)" />
            <div className="pt-grid2" style={{ marginTop: 12 }}>
              <div>
                <div className="pt-label" style={{ marginBottom: 4 }}>Grammar focus</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{m.grammar.join(" · ")}</div>
              </div>
              <div>
                <div className="pt-label" style={{ marginBottom: 4 }}>Vocabulary themes</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{m.vocabThemes.join(" · ")}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FrenchVocab({ ctx }) {
  const { goals, saveGoals, notify } = ctx;
  const french = goals.french;
  const [form, setForm] = useState({ fr: "", en: "", pronunciation: "", example: "", category: "" });

  function add() {
    if (!form.fr.trim()) return;
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: [{ id: uid(), ...form, status: "NEW", addedDate: todayISO(), lastReviewed: null }, ...prev.french.vocabBank] } }));
    setForm({ fr: "", en: "", pronunciation: "", example: "", category: "" });
    notify("Word added to bank");
  }
  function cycleStatus(id) {
    const order = ["NEW", "LEARNING", "KNOWN", "NEEDS REVIEW"];
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: prev.french.vocabBank.map((v) => v.id === id ? { ...v, status: order[(order.indexOf(v.status) + 1) % order.length], lastReviewed: todayISO() } : v) } }));
  }
  function remove(id) {
    const removed = french.vocabBank.find((v) => v.id === id);
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: prev.french.vocabBank.filter((v) => v.id !== id) } }));
    notify("Word removed", () => saveGoals((prev) => (prev.french.vocabBank.some((v) => v.id === id) ? prev : { ...prev, french: { ...prev.french, vocabBank: [removed, ...prev.french.vocabBank] } })));
  }

  // simple spaced repetition surfacing: words not reviewed in 4+ days, or NEW
  const dueForReview = french.vocabBank.filter((v) => v.status !== "KNOWN" && (!v.lastReviewed || daysBetween(v.lastReviewed, todayISO()) >= 4));

  return (
    <div>
      {dueForReview.length > 0 && (
        <div className="pt-card" style={{ marginBottom: 16, borderColor: "var(--french)" }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>Due for review ({dueForReview.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {dueForReview.slice(0, 12).map((v) => (
              <span key={v.id} className="pt-chip" style={{ cursor: "pointer" }} onClick={() => cycleStatus(v.id)}>{v.fr}</span>
            ))}
          </div>
        </div>
      )}
      <div className="pt-card" style={{ marginBottom: 16 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Add word</div>
        <div className="pt-grid3">
          <Field label="French"><input className="pt-input" value={form.fr} onChange={(e) => setForm({ ...form, fr: e.target.value })} /></Field>
          <Field label="English"><input className="pt-input" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} /></Field>
          <Field label="Category"><input className="pt-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        </div>
        <div className="pt-grid2">
          <Field label="Pronunciation"><input className="pt-input" value={form.pronunciation} onChange={(e) => setForm({ ...form, pronunciation: e.target.value })} /></Field>
          <Field label="Example sentence"><input className="pt-input" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} /></Field>
        </div>
        {!form.fr.trim() && <div className="pt-field-error">French word is required.</div>}
        <button className="pt-btn pt-btn-primary" disabled={!form.fr.trim()} onClick={add}><Plus size={14} /> Add to bank</button>
      </div>
      {french.vocabBank.length === 0 ? <EmptyState text="No vocabulary logged yet." /> : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>French</th><th>English</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {french.vocabBank.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.fr}</td><td>{v.en}</td><td>{v.category}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => cycleStatus(v.id)}><StatusPill status={v.status} /></td>
                  <td><button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(v.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FrenchProgress({ ctx }) {
  const { goals, settings, saveSettings } = ctx;
  const french = goals.french;
  const total = french.lessons.length;
  const completedLessons = french.lessons.filter((l) => l.status === "COMPLETED");
  const completed = completedLessons.length;
  const level = completed < total * 0.15 ? "A0" : completed < total * 0.55 ? "A1" : "A2";
  const totalVocabTarget = total * 15;
  const vocabKnown = french.vocabBank.filter((v) => v.status === "KNOWN").length;

  const grammarCovered = useMemo(() => {
    const seen = new Set();
    completedLessons.forEach((l) => (l.grammar || []).forEach((g) => seen.add(g)));
    return Array.from(seen);
  }, [completedLessons]);

  const chartData = useMemo(() => {
    return french.lessons.filter((l) => l.status === "COMPLETED").slice(-14).map((l) => ({ day: `D${l.dayNumber}`, minutes: l.minutesSpent }));
  }, [french.lessons]);

  return (
    <div>
      <div className="pt-grid5" style={{ marginBottom: 20 }}>
        <MiniStat label="Level" value={level} />
        <MiniStat label="Curriculum" value={`${completed} / ${total}`} />
        <MiniStat label="Vocabulary known" value={`${vocabKnown} / ${french.vocabBank.length}`} />
        <MiniStat label="Vocabulary logged" value={`${french.vocabBank.length} / ~${totalVocabTarget}`} />
        <MiniStat label="Grammar topics covered" value={grammarCovered.length} />
        <MiniStat label="Days studied" value={french.daysStudied || 0} />
        <MiniStat label="Current streak" value={`${french.streak || 0} days`} />
      </div>
      {grammarCovered.length > 0 && (
        <Collapsible title="Grammar topics covered" subtitle={`${grammarCovered.length} topics from completed lessons`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {grammarCovered.map((g) => <span key={g} className="pt-chip">{g}</span>)}
          </div>
        </Collapsible>
      )}
      <div className="pt-grid2" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>A0 → A1 → A2</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["A0", "A1", "A2"].map((l) => (
              <div key={l} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 8, background: level === l ? "var(--french-soft)" : "var(--line-soft)", color: level === l ? "var(--french)" : "var(--ink-faint)", fontWeight: 700, fontSize: 13 }}>{l}</div>
            ))}
          </div>
        </div>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Daily target</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" className="pt-input" value={settings.dailyFrenchMinutes} onChange={(e) => saveSettings((prev) => ({ ...prev, dailyFrenchMinutes: Number(e.target.value) }))} />
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>minutes / day</span>
          </div>
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="pt-card" style={{ height: 200 }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>Minutes studied — last 14 completed lessons</div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="minutes" stroke="var(--french)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const FRENCH_CERT_OPTIONS = ["DELF A2", "TCF", "TEF", "Other"];

// Nothing presumed: no certification is pre-selected and no dates are
// pre-filled — every field starts blank/TBC until Karina sets it herself.
function FrenchCertification({ ctx }) {
  const { goals, saveGoals } = ctx;
  const cert = goals.french.certification || blankFrenchCertification();

  function patch(p) {
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, certification: { ...(prev.french.certification || blankFrenchCertification()), ...p } } }));
  }

  return (
    <div>
      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Certification</div>
        {!cert.chosenCert && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} color="var(--atrisk)" />
            Choose certification — pick which French certificate you're aiming for so the exam timeline can be tracked.
          </div>
        )}
        <Field label="Certification">
          <select className="pt-select" value={cert.chosenCert} onChange={(e) => patch({ chosenCert: e.target.value })}>
            <option value="">Choose certification…</option>
            {FRENCH_CERT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        {cert.chosenCert === "Other" && (
          <Field label="Certification name"><input className="pt-input" value={cert.customCertName} onChange={(e) => patch({ customCertName: e.target.value })} /></Field>
        )}
        <div className="pt-grid3">
          <Field label="Registration date"><input type="date" className="pt-input" value={cert.registrationDate} onChange={(e) => patch({ registrationDate: e.target.value })} /></Field>
          <Field label="Exam date"><input type="date" className="pt-input" value={cert.examDate} onChange={(e) => patch({ examDate: e.target.value })} /></Field>
          <Field label="Results date"><input type="date" className="pt-input" value={cert.resultsDate} onChange={(e) => patch({ resultsDate: e.target.value })} /></Field>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4 }}>All dates optional — leave blank until confirmed (TBC).</div>
      </div>
    </div>
  );
}

/* =========================================================================
   CHINESE — daily flashcards, permanent history, progress, HSK exam.
   ========================================================================= */

// Web Speech API only — no paid TTS service. Feature-detected throughout;
// the speak button simply doesn't render if no zh voice is available.
function speakChinese(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("zh"));
  utter.lang = zhVoice ? zhVoice.lang : "zh-CN";
  if (zhVoice) utter.voice = zhVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
function useChineseVoiceAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    function check() {
      const voices = window.speechSynthesis.getVoices();
      setAvailable(voices.some((v) => v.lang && v.lang.toLowerCase().startsWith("zh")));
    }
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);
  return available;
}
function SpeakButton({ text, size }) {
  const available = useChineseVoiceAvailable();
  if (!available) return null;
  return (
    <button className="pt-btn pt-btn-ghost pt-tap" onClick={(e) => { e.stopPropagation(); speakChinese(text); }} title="Play pronunciation">
      <Volume2 size={size || 14} />
    </button>
  );
}

const CHINESE_STATUS_LABELS = { NEW: "New", DIFFICULT: "Difficult", NEED_REVIEW: "Need Review", LEARNED: "Learned", MASTERED: "Mastered" };

function ensureTodayChineseCards(chinese, dailyCount) {
  const today = todayISO();
  const alreadyToday = chinese.flashcards.filter((c) => c.addedDate === today && !c.isCustom).length;
  const need = dailyCount - alreadyToday;
  if (need <= 0) return chinese.flashcards;
  const existingHanzi = new Set(chinese.flashcards.map((c) => c.hanzi));
  const available = CHINESE_SEED_VOCAB.filter((w) => !existingHanzi.has(w.hanzi));
  if (available.length === 0) return chinese.flashcards;
  const toAdd = available.slice(0, need).map((w) => ({ ...blankChineseFlashcard(), ...w, id: uid(), addedDate: today }));
  return [...chinese.flashcards, ...toAdd];
}
function dueChineseCards(chinese) {
  const today = todayISO();
  return chinese.flashcards.filter((c) => c.status === "NEW" || !c.nextReviewDate || c.nextReviewDate <= today);
}
function effectiveChineseStreak(chinese) {
  if (!chinese.lastStudyDate) return 0;
  return daysBetween(chinese.lastStudyDate, todayISO()) > 1 ? 0 : (chinese.streak || 0);
}

function ChineseTab({ ctx }) {
  const [sub, setSub] = useState("today");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[["today", "Today's Review"], ["history", "Flashcard History"], ["progress", "Progress"], ["exam", "HSK Exam"]].map(([k, l]) => (
          <button key={k} className="pt-btn pt-btn-sm" style={{ background: sub === k ? "var(--chinese-soft)" : undefined, color: sub === k ? "var(--chinese)" : undefined, borderColor: sub === k ? "var(--chinese)" : undefined }} onClick={() => setSub(k)}>{l}</button>
        ))}
      </div>
      {sub === "today" && <ChineseToday ctx={ctx} />}
      {sub === "history" && <ChineseHistory ctx={ctx} />}
      {sub === "progress" && <ChineseProgress ctx={ctx} />}
      {sub === "exam" && <ChineseExam ctx={ctx} />}
    </div>
  );
}

function ChineseToday({ ctx }) {
  const { goals, saveGoals, settings, addXP, notify, saveCalendar } = ctx;
  const chinese = goals.chinese;
  const dailyCount = settings.dailyChineseWords || 5;
  const [revealedId, setRevealedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const today = todayISO();
    const alreadyToday = chinese.flashcards.filter((c) => c.addedDate === today && !c.isCustom).length;
    if (alreadyToday >= dailyCount) return;
    saveGoals((prev) => {
      const nextCards = ensureTodayChineseCards(prev.chinese, dailyCount);
      return nextCards === prev.chinese.flashcards ? prev : { ...prev, chinese: { ...prev.chinese, flashcards: nextCards } };
    });
    // eslint-disable-next-line
  }, [chinese.flashcards.length, dailyCount]);

  const due = useMemo(() => dueChineseCards(chinese), [chinese.flashcards]);

  function sendSessionToCalendar() {
    sendToCalendar(saveCalendar, notify, {
      title: "Chinese review session", category: "Chinese", type: "Task",
      linkedType: "Chinese session", linkedId: todayISO(), notes: `${due.length} card${due.length === 1 ? "" : "s"} due today`,
    });
  }

  function reviewCard(card, status) {
    const prevChinese = chinese;
    const isFirstToday = chinese.lastStudyDate !== todayISO();
    saveGoals((prev) => {
      const idx = prev.chinese.flashcards.findIndex((c) => c.id === card.id);
      const nextCards = [...prev.chinese.flashcards];
      const days = CHINESE_REVIEW_INTERVALS[status];
      nextCards[idx] = { ...nextCards[idx], status, lastReviewedDate: todayISO(), nextReviewDate: addDays(todayISO(), days) };
      return {
        ...prev,
        chinese: {
          ...prev.chinese,
          flashcards: nextCards,
          streak: isFirstToday ? effectiveChineseStreak(prev.chinese) + 1 : prev.chinese.streak,
          daysStudied: isFirstToday ? (prev.chinese.daysStudied || 0) + 1 : prev.chinese.daysStudied,
          lastStudyDate: todayISO(),
        },
      };
    });
    setRevealedId(null);
    notify(`Marked ${CHINESE_STATUS_LABELS[status]}`, () => saveGoals((prev) => ({ ...prev, chinese: prevChinese })));
    if (isFirstToday) addXP(10, "Chinese flashcards reviewed");
  }

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Due for review</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 14 }}>{dailyCount} new words/day, configurable in Settings.</div>
          </div>
          {due.length > 0 && <button className="pt-btn pt-btn-ghost pt-btn-sm pt-tap" onClick={sendSessionToCalendar}><CalendarIcon size={13} /> Add to calendar</button>}
        </div>
        {due.length === 0 ? <EmptyState text="Nothing due right now — check back tomorrow, or add your own words." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {due.map((card) => (
              <ChineseCardRow key={card.id} card={card} revealed={revealedId === card.id} onReveal={() => setRevealedId(card.id)} onReview={(status) => reviewCard(card, status)} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="pt-btn" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add your own word</button>
      </div>
      <ChineseSessionLog ctx={ctx} />
      {showAddForm && (
        <ChineseCardForm
          item={blankChineseFlashcard()}
          onClose={() => setShowAddForm(false)}
          onSave={(c) => {
            saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, flashcards: [{ ...c, isCustom: true }, ...prev.chinese.flashcards] } }));
            notify("Word added");
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

function ChineseCardRow({ card, revealed, onReveal, onReview }) {
  return (
    <div className="pt-card pt-card-tight">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{card.hanzi}</span>
          <SpeakButton text={card.hanzi} />
        </div>
        {!revealed && <button className="pt-btn pt-btn-sm" onClick={onReveal}>Show answer</button>}
      </div>
      {revealed && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{card.pinyin} — {card.meaning}</div>
          {card.exampleSentence && (
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 6 }}>
              {card.exampleSentence}<br />{card.exampleTranslation}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => onReview("DIFFICULT")}>Difficult</button>
            <button className="pt-btn pt-btn-sm" onClick={() => onReview("NEED_REVIEW")}>Need Review</button>
            <button className="pt-btn pt-btn-sm" onClick={() => onReview("LEARNED")}>Learned</button>
            <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => onReview("MASTERED")}>Mastered</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Kept separate from flashcard review — time spent listening/reading/class
// time doesn't map to any one card, so it stays a simple session log.
function ChineseSessionLog({ ctx }) {
  const { goals, saveGoals, addXP } = ctx;
  const chinese = goals.chinese;
  const [form, setForm] = useState({ words: 20, minutes: 30, notes: "" });

  function logToday() {
    saveGoals((prev) => ({
      ...prev, chinese: {
        ...prev.chinese,
        logs: [{ id: uid(), date: todayISO(), wordsLearned: Number(form.words), minutesSpent: Number(form.minutes), notes: form.notes }, ...prev.chinese.logs],
        vocabCount: prev.chinese.vocabCount + Number(form.words),
        totalMinutes: prev.chinese.totalMinutes + Number(form.minutes),
      },
    }));
    addXP(15, "Chinese study logged");
    setForm({ words: 20, minutes: 30, notes: "" });
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Log a study session</div>
      <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>For time spent beyond flashcards — listening, reading, class time…</div>
      <div className="pt-grid3">
        <Field label="Words"><input type="number" className="pt-input" value={form.words} onChange={(e) => setForm({ ...form, words: e.target.value })} /></Field>
        <Field label="Minutes spent"><input type="number" className="pt-input" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} /></Field>
        <Field label="Notes"><input className="pt-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
      <button className="pt-btn pt-btn-primary" onClick={logToday}><Plus size={14} /> Log session</button>
    </div>
  );
}

function ChineseCardForm({ item, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...blankChineseFlashcard(), ...item });
  const canSave = draft.hanzi.trim().length > 0;
  return (
    <Modal title={draft.id ? "Edit word" : "Add word"} onClose={onClose}>
      <Field label="Chinese characters"><input className="pt-input" value={draft.hanzi} onChange={(e) => setDraft({ ...draft, hanzi: e.target.value })} /></Field>
      <div className="pt-grid2">
        <Field label="Pinyin"><input className="pt-input" value={draft.pinyin} onChange={(e) => setDraft({ ...draft, pinyin: e.target.value })} /></Field>
        <Field label="Meaning"><input className="pt-input" value={draft.meaning} onChange={(e) => setDraft({ ...draft, meaning: e.target.value })} /></Field>
      </div>
      <Field label="Example sentence"><input className="pt-input" value={draft.exampleSentence} onChange={(e) => setDraft({ ...draft, exampleSentence: e.target.value })} /></Field>
      <Field label="Example translation"><input className="pt-input" value={draft.exampleTranslation} onChange={(e) => setDraft({ ...draft, exampleTranslation: e.target.value })} /></Field>
      <Field label="Status">
        <select className="pt-select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          {Object.keys(CHINESE_STATUS_LABELS).map((s) => <option key={s} value={s}>{CHINESE_STATUS_LABELS[s]}</option>)}
        </select>
      </Field>
      {!canSave && <div className="pt-field-error">Chinese characters are required.</div>}
      <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => onSave({ ...draft, id: draft.id || uid() })}>Save</button>
    </Modal>
  );
}

function chineseCardSearchHaystack(card) {
  return [card.hanzi, card.pinyin, card.meaning, card.exampleSentence, card.exampleTranslation].filter(Boolean).join(" ").toLowerCase();
}

// Every flashcard ever generated or added, permanently browsable — same
// pattern as French's Lesson History (search/filter/detail/prev-next).
function ChineseHistory({ ctx }) {
  const { goals, saveGoals, notify } = ctx;
  const chinese = goals.chinese;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const filtered = useMemo(() => {
    let list = chinese.flashcards;
    if (statusFilter !== "ALL") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => chineseCardSearchHaystack(c).includes(q));
    }
    return list;
  }, [chinese.flashcards, search, statusFilter]);

  const selectedIndex = selectedId ? chinese.flashcards.findIndex((c) => c.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? chinese.flashcards[selectedIndex] : null;

  function upsert(card) {
    const isNew = !chinese.flashcards.some((c) => c.id === card.id);
    saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, flashcards: isNew ? [card, ...prev.chinese.flashcards] : prev.chinese.flashcards.map((c) => (c.id === card.id ? card : c)) } }));
    notify(isNew ? "Word added" : "Word updated");
  }
  function remove(id) {
    const removed = chinese.flashcards.find((c) => c.id === id);
    saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, flashcards: prev.chinese.flashcards.filter((c) => c.id !== id) } }));
    notify("Word removed", () => saveGoals((prev) => (prev.chinese.flashcards.some((c) => c.id === id) ? prev : { ...prev, chinese: { ...prev.chinese, flashcards: [removed, ...prev.chinese.flashcards] } })));
    setSelectedId(null);
  }
  function setStatus(card, status) {
    saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, flashcards: prev.chinese.flashcards.map((c) => (c.id === card.id ? { ...c, status, lastReviewedDate: todayISO(), nextReviewDate: addDays(todayISO(), CHINESE_REVIEW_INTERVALS[status] ?? 0) } : c)) } }));
    notify(`Marked ${CHINESE_STATUS_LABELS[status]}`);
  }

  if (selected) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <button className="pt-btn pt-btn-sm" onClick={() => setSelectedId(null)}><ChevronLeft size={13} /> Back to history</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex <= 0} onClick={() => setSelectedId(chinese.flashcards[selectedIndex - 1].id)}><ChevronLeft size={13} /> Previous</button>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex >= chinese.flashcards.length - 1} onClick={() => setSelectedId(chinese.flashcards[selectedIndex + 1].id)}>Next <ChevronRight size={13} /></button>
          </div>
        </div>
        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 700 }}>{selected.hanzi}</span>
              <SpeakButton text={selected.hanzi} size={16} />
            </div>
            <StatusPill status={selected.status} />
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>{selected.pinyin} — {selected.meaning}</div>
          {selected.exampleSentence && (
            <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 10 }}>{selected.exampleSentence}<br />{selected.exampleTranslation}</div>
          )}
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 10 }}>
            Added {fmtDate(selected.addedDate)}{selected.lastReviewedDate ? ` · Last reviewed ${fmtDate(selected.lastReviewedDate)}` : ""}{selected.nextReviewDate ? ` · Next review ${fmtDate(selected.nextReviewDate)}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {["DIFFICULT", "NEED_REVIEW", "LEARNED", "MASTERED"].map((s) => (
              <button key={s} className={`pt-btn pt-btn-sm ${selected.status === s ? "pt-btn-primary" : ""}`} onClick={() => setStatus(selected, s)}>{CHINESE_STATUS_LABELS[s]}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="pt-btn pt-btn-sm" onClick={() => { setEditItem(selected); setShowForm(true); }}><Edit3 size={13} /> Edit</button>
            <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => remove(selected.id)}><Trash2 size={13} /> Delete</button>
          </div>
        </div>
        {showForm && <ChineseCardForm item={editItem} onClose={() => setShowForm(false)} onSave={(c) => { upsert(c); setShowForm(false); }} />}
      </div>
    );
  }

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input className="pt-input" style={{ paddingLeft: 30 }} placeholder="Search characters, pinyin, meaning…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="pt-select" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {Object.keys(CHINESE_STATUS_LABELS).map((s) => <option key={s} value={s}>{CHINESE_STATUS_LABELS[s]}</option>)}
        </select>
        <button className="pt-btn pt-btn-primary" onClick={() => { setEditItem(blankChineseFlashcard()); setShowForm(true); }}><Plus size={14} /> Add word</button>
      </div>
      {chinese.flashcards.length === 0 ? (
        <EmptyState text="No words yet — they'll appear here once generated or added." />
      ) : filtered.length === 0 ? (
        <EmptyState text="No words match your search or filters." />
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Characters</th><th>Pinyin</th><th>Meaning</th><th>Added</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(c.id)}>
                  <td style={{ fontWeight: 700, fontSize: 15 }}>{c.hanzi}</td>
                  <td>{c.pinyin}</td>
                  <td>{c.meaning}</td>
                  <td>{fmtDate(c.addedDate)}</td>
                  <td><StatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && <ChineseCardForm item={editItem} onClose={() => setShowForm(false)} onSave={(c) => { upsert(c); setShowForm(false); }} />}
    </div>
  );
}

function ChineseProgress({ ctx }) {
  const { goals, settings } = ctx;
  const chinese = goals.chinese;
  const daysLeft = daysBetween(todayISO(), settings.chineseTarget);
  const progress = computeChineseProgress(chinese, settings);
  const reviewed = chinese.flashcards.filter((c) => c.lastReviewedDate).length;
  const mastered = chinese.flashcards.filter((c) => c.status === "MASTERED").length;
  const streak = effectiveChineseStreak(chinese);
  const weekAgo = addDays(todayISO(), -7);
  const weeklyMinutes = chinese.logs.filter((l) => l.date >= weekAgo).reduce((s, l) => s + l.minutesSpent, 0);

  return (
    <div>
      <div className="pt-hero" style={{ background: "linear-gradient(135deg, var(--chinese), #7C3F2C)", marginBottom: 20 }}>
        <div className="pt-hero-label">HSK 3 Target · {fmtDate(settings.chineseTarget)}</div>
        <div className="pt-hero-count">{daysLeft >= 0 ? daysLeft : 0}</div>
        <div className="pt-hero-days">days left · editable in Settings</div>
      </div>
      <div className="pt-grid5" style={{ marginBottom: 16 }}>
        <MiniStat label="Words reviewed" value={reviewed} />
        <MiniStat label="Words mastered" value={mastered} />
        <MiniStat label="HSK3 progress" value={`${progress.pct}%`} />
        <MiniStat label="Days studied" value={chinese.daysStudied || 0} />
        <MiniStat label="Current streak" value={`${streak} days`} />
      </div>
      <div className="pt-grid2" style={{ marginBottom: 20 }}>
        <MiniStat label="Total study time" value={`${Math.floor(chinese.totalMinutes / 60)}h ${chinese.totalMinutes % 60}m`} />
        <MiniStat label="Study time this week" value={`${Math.floor(weeklyMinutes / 60)}h ${weeklyMinutes % 60}m`} />
      </div>
      {chinese.logs.length > 0 && (
        <Collapsible title="Study session log" subtitle={`${chinese.logs.length} sessions logged`}>
          <div className="pt-table-wrap" style={{ marginTop: 4 }}>
            <table className="pt-table">
              <thead><tr><th>Date</th><th>Words</th><th>Time</th><th>Notes</th></tr></thead>
              <tbody>
                {chinese.logs.map((l) => (<tr key={l.id}><td>{fmtDate(l.date)}</td><td>{l.wordsLearned}</td><td>{l.minutesSpent}m</td><td>{l.notes}</td></tr>))}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

function ChineseExam({ ctx }) {
  const { goals, saveGoals } = ctx;
  const exam = goals.chinese.exam;

  function patch(p) {
    saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, exam: { ...(prev.chinese.exam || blankChineseExam()), ...p, confirmed: true } } }));
  }
  function markConfirmed() {
    saveGoals((prev) => ({ ...prev, chinese: { ...prev.chinese, exam: { ...(prev.chinese.exam || blankChineseExam()), confirmed: true } } }));
  }

  return (
    <div>
      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>HSK Exam</div>
        {!exam.confirmed && (
          <div className="pt-card pt-card-tight" style={{ borderColor: "var(--atrisk)", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} color="var(--atrisk)" />
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <strong>Non officiel — à vérifier sur chinesetest.cn.</strong> These dates come from HSK prep sites, not the official source: registration closing around Dec 3, exam session Dec 13, 2026. Confirm on{" "}
              <a className="pt-link" href="http://www.chinesetest.cn/index.do" target="_blank" rel="noopener noreferrer">chinesetest.cn</a>, then edit the fields below or mark them confirmed.
              <div style={{ marginTop: 8 }}>
                <button className="pt-btn pt-btn-sm" onClick={markConfirmed}><Check size={12} /> Mark as confirmed</button>
              </div>
            </div>
          </div>
        )}
        <div className="pt-grid3">
          <Field label="Registration date"><input type="date" className="pt-input" value={exam.registrationDate} onChange={(e) => patch({ registrationDate: e.target.value })} /></Field>
          <Field label="Exam date"><input type="date" className="pt-input" value={exam.examDate} onChange={(e) => patch({ examDate: e.target.value })} /></Field>
          <Field label="Results date"><input type="date" className="pt-input" value={exam.resultsDate} onChange={(e) => patch({ resultsDate: e.target.value })} /></Field>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4 }}>
          Official registration: <a className="pt-link" href="http://www.chinesetest.cn/index.do" target="_blank" rel="noopener noreferrer">chinesetest.cn</a>
        </div>
      </div>
    </div>
  );
}

// Deliberately light: 5 stages, one percentage, a handful of connection
// fields. No daily tasks, no long checklist, no XP/gamification here —
// this screen exists so a single case study doesn't get lost among the
// daily-productivity tracks, not to become another one of them.
function PortfolioTab({ ctx }) {
  const { goals, saveGoals, settings, literature } = ctx;
  const project = goals.portfolio.projects[0];
  const idx = PORTFOLIO_STAGES.indexOf(project.stage);
  const pct = Math.round(((idx + 1) / PORTFOLIO_STAGES.length) * 100);
  const daysLeft = daysBetween(todayISO(), settings.portfolioTarget);

  function patch(v) {
    saveGoals((prev) => {
      const projects = [...prev.portfolio.projects];
      projects[0] = { ...projects[0], ...v };
      return { ...prev, portfolio: { ...prev.portfolio, projects } };
    });
  }

  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 16 }}>Priority: one strong case study, not many unfinished ones. Target: {fmtDate(settings.portfolioTarget)} ({daysLeft} days left).</p>

      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Urbanism Portfolio Project — {pct}%</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
          {PORTFOLIO_STAGES.map((s, i) => (
            <div
              key={s}
              className="pt-chip"
              onClick={i <= idx ? () => patch({ stage: s }) : undefined}
              style={{ background: i <= idx ? "var(--urbanism)" : "var(--line-soft)", color: i <= idx ? "#fff" : "var(--ink-soft)", cursor: i <= idx ? "pointer" : "default" }}
            >{s}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 10 }}>Tap an earlier stage to go back to it.</div>
        <ProgressBar pct={pct} color="var(--urbanism)" />
        {idx < PORTFOLIO_STAGES.length - 1 && (
          <button className="pt-btn pt-btn-primary" style={{ marginTop: 14 }} onClick={() => patch({ stage: PORTFOLIO_STAGES[idx + 1] })}>
            Advance to: {PORTFOLIO_STAGES[idx + 1]} <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="pt-card" style={{ marginBottom: 20 }}>
        <Field label="Project title"><input className="pt-input" value={project.title} onChange={(e) => patch({ title: e.target.value })} /></Field>
      </div>

      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Connections</div>
        <div className="pt-grid2">
          <Field label="Competition (optional)"><input className="pt-input" placeholder="Competition name" value={project.competition.name} onChange={(e) => patch({ competition: { ...project.competition, name: e.target.value } })} /></Field>
          <Field label="Competition deadline (optional)"><input type="date" className="pt-input" value={project.competition.deadline} onChange={(e) => patch({ competition: { ...project.competition, deadline: e.target.value } })} /></Field>
        </div>
        <Field label="Related literature (optional)">
          <select className="pt-select" value={project.research.literatureId || ""} onChange={(e) => patch({ research: { ...project.research, literatureId: e.target.value || null } })}>
            <option value="">— none —</option>
            {literature.articles.map((a) => <option key={a.id} value={a.id}>{a.title || a.authors || "Untitled"}</option>)}
          </select>
        </Field>
        <Field label="Research notes"><textarea className="pt-textarea" value={project.research.notes} onChange={(e) => patch({ research: { ...project.research, notes: e.target.value } })} /></Field>
        <Field label="Related thesis section (optional)">
          <select className="pt-select" value={project.thesisSectionKey || ""} onChange={(e) => patch({ thesisSectionKey: e.target.value })}>
            <option value="">— none —</option>
            {THESIS_SECTIONS_META.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
          </select>
        </Field>
        <Field label="CV note / link"><input className="pt-input" placeholder="e.g. a link, or a short note on where this fits your CV" value={project.cvNote} onChange={(e) => patch({ cvNote: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/* =========================================================================
   CALENDAR SCREEN
   ========================================================================= */
const TASK_CATEGORIES = ["Thesis", "Internship", "French", "Chinese", "Portfolio", "Personal", "Other"];
const CALENDAR_ENTRY_TYPES = ["Task", "Appointment", "Deadline", "Reminder"];

// Simple, bounded recurrence — not an RRULE engine. Generates concrete,
// independently editable/completable instances up front rather than
// computing virtual occurrences at render time, matching how French
// lessons and Chinese flashcards are already pre-generated in this app.
const RECURRENCE_HORIZON = { daily: 30, weekly: 12, monthly: 6 };
function generateRecurringTasks(base) {
  if (!base.recurrence || base.recurrence === "none") return [base];
  const count = RECURRENCE_HORIZON[base.recurrence] || 1;
  const groupId = uid();
  const instances = [];
  for (let i = 0; i < count; i++) {
    let date = base.date;
    if (base.recurrence === "daily") date = addDays(base.date, i);
    else if (base.recurrence === "weekly") date = addDays(base.date, i * 7);
    else if (base.recurrence === "monthly") {
      const d = parseISO(base.date);
      date = toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, d.getUTCDate())));
    }
    instances.push({ ...base, id: i === 0 ? base.id : uid(), date, recurrenceGroupId: groupId, recurrenceIndex: i });
  }
  return instances;
}

// Shared "send to calendar" used from Thesis/French/Chinese/Internship —
// links back to the source record instead of duplicating its data; the
// calendar entry is a pointer, the source stays the single source of truth.
function sendToCalendar(saveCalendar, notify, entry) {
  const task = {
    id: uid(), title: entry.title, date: entry.date || todayISO(), time: entry.time || "", duration: entry.duration || 30,
    type: entry.type || "Task", category: entry.category || "Personal", priority: entry.priority || "Medium",
    notes: entry.notes || "", completed: false, recurrence: "none",
    linkedType: entry.linkedType || null, linkedId: entry.linkedId || null,
  };
  saveCalendar((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
  notify("Added to calendar");
}

function CalendarScreen({ ctx }) {
  const { calendar, saveCalendar, addXP, notify } = ctx;
  const [view, setView] = useState("agenda");
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => { const d = parseISO(todayISO()); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); });

  function blank() { return { id: null, title: "", date: todayISO(), time: "", duration: 30, type: "Task", category: "Personal", priority: "Medium", notes: "", completed: false, recurrence: "none" }; }
  function upsert(v, silent) {
    const isNew = !calendar.tasks.some((t) => t.id === v.id);
    if (isNew && v.recurrence && v.recurrence !== "none") {
      const instances = generateRecurringTasks(v);
      saveCalendar((prev) => ({ ...prev, tasks: [...instances, ...prev.tasks] }));
      if (!silent) notify(`${instances.length} tasks added (repeats ${v.recurrence})`);
      return;
    }
    saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.some((t) => t.id === v.id) ? prev.tasks.map((t) => (t.id === v.id ? v : t)) : [v, ...prev.tasks] }));
    if (!silent) notify(isNew ? "Task added" : "Task updated");
  }
  function remove(id) {
    const removed = calendar.tasks.find((t) => t.id === id);
    saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    notify("Task removed", () => saveCalendar((prev) => (prev.tasks.some((t) => t.id === id) ? prev : { ...prev, tasks: [removed, ...prev.tasks] })));
  }
  function removeSeries(groupId) {
    const removedBatch = calendar.tasks.filter((t) => t.recurrenceGroupId === groupId);
    saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.recurrenceGroupId !== groupId) }));
    notify(`${removedBatch.length} tasks removed`, () => saveCalendar((prev) => ({ ...prev, tasks: [...removedBatch, ...prev.tasks] })));
  }
  function toggleComplete(t) {
    const willComplete = !t.completed;
    upsert({ ...t, completed: willComplete }, true);
    if (willComplete) addXP(10, "Task completed", () => upsert({ ...t, completed: false }, true));
    else notify("Task marked incomplete", () => upsert({ ...t, completed: true }, true));
  }
  const canSaveTask = !!(item && item.title.trim());

  const sorted = [...calendar.tasks].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div>
      <div className="pt-eyebrow">Calendar</div>
      <h1 className="pt-h1">Everything in one place</h1>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0" }}>
        <div className="pt-tabs" style={{ marginBottom: 0, border: "none" }}>
          {["month", "week", "day", "agenda"].map((v) => (
            <div key={v} className={`pt-tab ${view === v ? "active" : ""}`} onClick={() => setView(v)} style={{ textTransform: "capitalize" }}>{v}</div>
          ))}
        </div>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add task</button>
      </div>

      {view === "month" && <MonthView tasks={calendar.tasks} cursor={monthCursor} setCursor={setMonthCursor} onSelect={(t) => { setItem(t); setShowForm(true); }} />}
      {view === "week" && <WeekView tasks={calendar.tasks} onToggle={toggleComplete} onSelect={(t) => { setItem(t); setShowForm(true); }} />}
      {view === "day" && <DayView tasks={calendar.tasks} onToggle={toggleComplete} onSelect={(t) => { setItem(t); setShowForm(true); }} />}
      {view === "agenda" && (
        sorted.length === 0 ? <EmptyState text="No tasks yet." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((t) => (
              <div key={t.id} className="pt-card pt-card-tight" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => toggleComplete(t)}>
                  {t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
                </button>
                <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => { setItem(t); setShowForm(true); }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                    {fmtDate(t.date)} {t.time && `· ${t.time}`} · {t.category}{t.type && t.type !== "Task" ? ` · ${t.type}` : ""}{t.linkedType ? ` · linked` : ""}
                  </div>
                </div>
                <span className="pt-chip">{t.priority}</span>
                <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <Modal title="Task" onClose={() => setShowForm(false)}>
          <Field label="Title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <div className="pt-grid3">
            <Field label="Date">
              <input type="date" className="pt-input" value={item.date} onChange={(e) => setItem({ ...item, date: e.target.value })} />
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button type="button" className="pt-btn pt-btn-sm" onClick={() => setItem({ ...item, date: addDays(item.date, 1) })}>+1 day</button>
                <button type="button" className="pt-btn pt-btn-sm" onClick={() => setItem({ ...item, date: addDays(item.date, 7) })}>+1 week</button>
              </div>
            </Field>
            <Field label="Time"><input type="time" className="pt-input" value={item.time} onChange={(e) => setItem({ ...item, time: e.target.value })} /></Field>
            <Field label="Duration (min)"><input type="number" className="pt-input" value={item.duration} onChange={(e) => setItem({ ...item, duration: e.target.value })} /></Field>
          </div>
          <div className="pt-grid3">
            <Field label="Type">
              <select className="pt-select" value={item.type || "Task"} onChange={(e) => setItem({ ...item, type: e.target.value })}>
                {CALENDAR_ENTRY_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className="pt-select" value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })}>
                {TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="pt-select" value={item.priority} onChange={(e) => setItem({ ...item, priority: e.target.value })}>
                {["Low", "Medium", "High"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          {item.linkedType && (
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Linked from {item.linkedType} — editing here only changes the calendar entry.
            </div>
          )}
          {item.id ? (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 12 }}>
              {item.recurrenceGroupId ? "Part of a repeating series." : "Recurrence can only be set when first creating a task."}
            </div>
          ) : (
            <Field label="Repeat">
              <select className="pt-select" value={item.recurrence} onChange={(e) => setItem({ ...item, recurrence: e.target.value })}>
                {["none", "daily", "weekly", "monthly"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          {!canSaveTask && <div className="pt-field-error">Title is required.</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="pt-btn pt-btn-primary" disabled={!canSaveTask} onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save task</button>
            {item.id && <button className="pt-btn pt-btn-danger" onClick={() => { remove(item.id); setShowForm(false); }}>Delete</button>}
            {item.recurrenceGroupId && <button className="pt-btn pt-btn-danger" onClick={() => { removeSeries(item.recurrenceGroupId); setShowForm(false); }}>Delete entire series</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function MonthView({ tasks, cursor, setCursor, onSelect }) {
  const year = cursor.getUTCFullYear(), month = cursor.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const byDate = {};
  tasks.forEach((t) => { byDate[t.date] = byDate[t.date] || []; byDate[t.date].push(t); });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="pt-btn pt-btn-ghost" onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}><ChevronLeft size={16} /></button>
        <div style={{ fontWeight: 700 }}>{first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</div>
        <button className="pt-btn pt-btn-ghost" onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 700, textAlign: "center" }}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(new Date(Date.UTC(year, month, d)));
          const dayTasks = byDate[iso] || [];
          return (
            <div key={i} className="pt-card pt-card-tight" style={{ minHeight: 70, padding: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: iso === todayISO() ? "var(--thesis)" : "var(--ink-faint)" }}>{d}</div>
              {dayTasks.slice(0, 3).map((t) => (
                <div key={t.id} onClick={() => onSelect(t)} style={{ fontSize: 10, background: "var(--thesis-soft)", color: "var(--thesis)", borderRadius: 4, padding: "1px 4px", marginTop: 3, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function WeekView({ tasks, onToggle, onSelect }) {
  const today = todayISO();
  const start = addDays(today, -parseISO(today).getUTCDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
      {days.map((iso) => {
        const dayTasks = tasks.filter((t) => t.date === iso);
        return (
          <div key={iso} className="pt-card pt-card-tight">
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: iso === today ? "var(--thesis)" : "var(--ink-faint)" }}>{parseISO(iso).toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" })}</div>
            {dayTasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 0" }}>
                <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none", padding: 2, minWidth: 24, minHeight: 24 }} onClick={() => onToggle(t)}>
                  {t.completed ? <CheckCircle2 size={12} color="var(--ontrack)" /> : <Circle size={12} color="var(--ink-faint)" />}
                </button>
                <span onClick={() => onSelect(t)} style={{ fontSize: 11.5, cursor: "pointer", textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</span>
              </div>
            ))}
            {dayTasks.length === 0 && <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>—</div>}
          </div>
        );
      })}
    </div>
  );
}
function DayView({ tasks, onToggle, onSelect }) {
  const today = todayISO();
  const dayTasks = tasks.filter((t) => t.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>{fmtDate(today)}</div>
      {dayTasks.length === 0 ? <EmptyState text="Nothing scheduled today." /> : dayTasks.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
          <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => onToggle(t)}>{t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}</button>
          <span style={{ width: 50, fontSize: 12, color: "var(--ink-faint)" }}>{t.time || "—"}</span>
          <span style={{ flex: 1, cursor: "pointer", fontSize: 13.5 }} onClick={() => onSelect(t)}>{t.title}</span>
          <span className="pt-chip">{t.category}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   SETTINGS SCREEN
   ========================================================================= */
function SettingsScreen({ ctx }) {
  const { settings, saveSettings, thesis, saveThesis, goals, saveGoals, calendar, saveCalendar, meta, saveMeta, literature, saveLiterature, onSignOut, notify } = ctx;
  const [importError, setImportError] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);
  const dailyChineseWords = settings.dailyChineseWords || 5; // defensive: predates this setting for existing accounts

  function exportData() {
    const bundle = { exportedAt: new Date().toISOString(), settings, thesis, goals, calendar, meta, literature };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `productivity-tracker-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Export downloaded");
  }

  function pickImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result);
        setPendingImport(bundle);
      } catch (err) {
        setImportError("Import failed: file is not a valid backup.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    const bundle = pendingImport;
    if (bundle.settings) saveSettings(bundle.settings);
    if (bundle.thesis) saveThesis(bundle.thesis);
    if (bundle.goals) saveGoals(bundle.goals);
    if (bundle.calendar) saveCalendar(bundle.calendar);
    if (bundle.meta) saveMeta(bundle.meta);
    if (bundle.literature) saveLiterature(bundle.literature);
    setPendingImport(null);
    notify("Import complete");
  }

  return (
    <div>
      <div className="pt-eyebrow">Settings</div>
      <h1 className="pt-h1">Dates, targets & backup</h1>

      <div className="pt-card" style={{ margin: "22px 0" }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Important dates</div>
        <div className="pt-grid2">
          <Field label="Tracker start"><input type="date" className="pt-input" value={settings.trackerStart} onChange={(e) => saveSettings((p) => ({ ...p, trackerStart: e.target.value }))} /></Field>
          <Field label="Thesis midterm deadline"><input type="date" className="pt-input" value={settings.thesisMidterm} onChange={(e) => saveSettings((p) => ({ ...p, thesisMidterm: e.target.value }))} /></Field>
        </div>
        <div className="pt-grid2">
          <Field label="French A2 target"><input type="date" className="pt-input" value={settings.frenchTarget} onChange={(e) => saveSettings((p) => ({ ...p, frenchTarget: e.target.value }))} /></Field>
          <Field label="Chinese HSK3 exam date"><input type="date" className="pt-input" value={settings.chineseTarget} onChange={(e) => saveSettings((p) => ({ ...p, chineseTarget: e.target.value }))} /></Field>
        </div>
        <Field label="Urbanism portfolio target"><input type="date" className="pt-input" value={settings.portfolioTarget} onChange={(e) => saveSettings((p) => ({ ...p, portfolioTarget: e.target.value }))} /></Field>
      </div>

      <div className="pt-card" style={{ marginBottom: 22 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Study targets</div>
        <Field label="New Chinese words per day">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                className="pt-btn pt-btn-sm"
                style={{ background: dailyChineseWords === n ? "var(--chinese-soft)" : undefined, color: dailyChineseWords === n ? "var(--chinese)" : undefined, borderColor: dailyChineseWords === n ? "var(--chinese)" : undefined }}
                onClick={() => saveSettings((p) => ({ ...p, dailyChineseWords: n }))}
              >{n}</button>
            ))}
            <button
              className="pt-btn pt-btn-sm"
              style={{ background: ![5, 10, 15].includes(dailyChineseWords) ? "var(--chinese-soft)" : undefined, color: ![5, 10, 15].includes(dailyChineseWords) ? "var(--chinese)" : undefined, borderColor: ![5, 10, 15].includes(dailyChineseWords) ? "var(--chinese)" : undefined }}
              onClick={() => saveSettings((p) => ({ ...p, dailyChineseWords: [5, 10, 15].includes(dailyChineseWords) ? 20 : dailyChineseWords }))}
            >Custom</button>
            {![5, 10, 15].includes(dailyChineseWords) && (
              <input type="number" min="1" className="pt-input" style={{ width: 80 }} value={dailyChineseWords} onChange={(e) => saveSettings((p) => ({ ...p, dailyChineseWords: Number(e.target.value) }))} />
            )}
          </div>
        </Field>
      </div>

      <div className="pt-card" style={{ marginBottom: 22 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Backup</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="pt-btn pt-btn-primary" onClick={exportData}><Download size={14} /> Export data (JSON)</button>
          <label className="pt-btn" style={{ cursor: "pointer" }}>
            <Upload size={14} /> Import data
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={pickImportFile} />
          </label>
        </div>
        {importError && <div className="pt-field-error" style={{ marginTop: 10, marginBottom: 0 }}>{importError}</div>}
      </div>

      <div className="pt-card" style={{ marginBottom: 22 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 10 }}>How your data is stored</div>
        <p className="pt-sub">
          Everything is saved to your private Supabase database as soon as you make a change. It survives page refreshes, closing the browser, and logging back in later — on any device where you're signed in. Only your authenticated account can read or write it.
        </p>
      </div>

      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 10 }}>Account</div>
        <button className="pt-btn" onClick={onSignOut}><LogOut size={14} /> Sign out</button>
      </div>

      {pendingImport && (
        <ConfirmDialog
          title="Overwrite all current data?"
          message="Importing this file replaces settings, thesis, goals, calendar, progress and the literature library with the contents of the backup. Your current data will be lost. This can't be undone. Attached files in Storage are not affected."
          confirmLabel="Import and overwrite"
          danger
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
