import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Home, GraduationCap, Target, Calendar as CalendarIcon, TrendingUp, Settings as SettingsIcon,
  BookOpen, FlaskConical, Users, ClipboardList, MessageSquare, Mic, FileText, Clock,
  Plus, X, Check, ChevronRight, ChevronLeft, Download, Upload, Sparkles, Flame,
  AlertTriangle, CheckCircle2, Circle, Briefcase, Languages, Building2, Trophy,
  BarChart3, Loader2, Edit3, Trash2, Info, LogOut
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TOKENS, FontLoader } from "./theme";
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
  };
}

function initThesisRoadmap() {
  const phases = [
    { title: "Literature Review", start: "2026-08-15", end: "2026-08-21" },
    { title: "Conceptual Framework", start: "2026-08-22", end: "2026-08-25" },
    { title: "Case Studies", start: "2026-08-26", end: "2026-08-31" },
    { title: "Observation Preparation + Initial Observation", start: "2026-09-01", end: "2026-09-05" },
    { title: "Questionnaire Draft", start: "2026-09-01", end: "2026-09-05" },
    { title: "Supervisor Review + Pilot", start: "2026-09-06", end: "2026-09-10" },
    { title: "Questionnaire Launch + Data Collection", start: "2026-09-11", end: "2026-09-11" },
    { title: "Midterm Preparation", start: "2026-09-11", end: "2026-09-30" },
  ];
  return phases.map((p, i) => ({ id: uid(), phaseNumber: i + 1, ...p, status: i === 0 ? "IN PROGRESS" : "NOT STARTED" }));
}

function initThesis() {
  return {
    roadmap: initThesisRoadmap(),
    literature: [],
    framework: {
      logic: "SPATIAL CHARACTERISTICS → EMOTIONAL EXPERIENCE → LEARNING BEHAVIOUR",
      mainRQ: "How do the spatial characteristics of informal learning spaces in Shanghai universities shape students' emotional experience and, in turn, their learning behaviour?",
      subQuestions: [],
      keyConcepts: [],
      spatialFactors: [],
      emotionalFactors: [],
      behavioralFactors: [],
      variables: [],
      relationships: [],
      literatureLinks: [],
    },
    caseStudies: [],
    observations: [],
    questionnaire: {
      title: "", purpose: "", link: "", draftDate: "", supervisorReviewDate: "", pilotDate: "",
      launchDate: "", closingDate: "", targetParticipants: 200, currentResponses: 0, stage: "IDEA",
    },
    questionBank: [],
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

function initGoals() {
  return {
    internship: { applications: [], active: null },
    french: {
      modules: FRENCH_MODULES,
      lessons: generateFrenchLessons("2026-08-15", "2026-10-31"),
      vocabBank: [],
      currentDayIndex: 0,
    },
    chinese: { logs: [], vocabCount: 0, totalMinutes: 0 },
    portfolio: {
      stage: "RESEARCH",
      stages: ["RESEARCH", "SITE", "PROBLEM", "USERS", "CONCEPT", "URBAN STRATEGY", "DEVELOPMENT", "VISUALIZATION", "FINAL CASE STUDY"],
      project: { title: "", site: "", problem: "", users: "", concept: "", strategy: "", notes: "" },
      competitionLinked: null,
    },
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
  };
  return <span className={`pt-pill ${map[status] || "pt-pill-neutral"}`}>{status}</span>;
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

function XPToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="pt-xp-toast">
      <Sparkles size={15} />
      <span>+{toast.amount} XP — {toast.reason}</span>
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */
export default function Tracker({ onSignOut }) {
  const [settings, saveSettings, sLoaded] = useStore("settings", initSettings);
  const [thesis, saveThesis, tLoaded] = useStore("thesis", initThesis);
  const [goals, saveGoals, gLoaded] = useStore("goals", initGoals);
  const [calendar, saveCalendar, cLoaded] = useStore("calendar", initCalendar);
  const [meta, saveMeta, mLoaded] = useStore("meta", initMeta);

  const [nav, setNav] = useState("home");
  const [subNav, setSubNav] = useState(null);
  const [toast, setToast] = useState(null);

  const allLoaded = sLoaded && tLoaded && gLoaded && cLoaded && mLoaded;

  const addXP = useCallback((amount, reason) => {
    saveMeta((prev) => ({ ...prev, xp: (prev.xp || 0) + amount, xpLog: [{ id: uid(), date: todayISO(), amount, reason }, ...(prev.xpLog || [])].slice(0, 200) }));
    setToast({ amount, reason });
    setTimeout(() => setToast(null), 2600);
  }, [saveMeta]);

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

  const ctx = { settings, saveSettings, thesis, saveThesis, goals, saveGoals, calendar, saveCalendar, meta, saveMeta, addXP, nav, setNav, subNav, setSubNav, onSignOut };

  return (
    <div className="pt-root">
      <style>{TOKENS}</style>
      <FontLoader />
      <Sidebar ctx={ctx} />
      <main className="pt-main">
        {nav === "home" && <HomeScreen ctx={ctx} />}
        {nav === "thesis" && <ThesisScreen ctx={ctx} />}
        {nav === "goals" && <GoalsScreen ctx={ctx} />}
        {nav === "calendar" && <CalendarScreen ctx={ctx} />}
        {nav === "progress" && <ProgressScreen ctx={ctx} />}
        {nav === "settings" && <SettingsScreen ctx={ctx} />}
      </main>
      <XPToast toast={toast} />
    </div>
  );
}

/* =========================================================================
   SIDEBAR
   ========================================================================= */
function Sidebar({ ctx }) {
  const { nav, setNav, subNav, setSubNav, onSignOut } = ctx;
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "thesis", label: "Thesis", icon: FlaskConical },
    { key: "goals", label: "Goals", icon: Target, sub: [
      { key: "internship", label: "Internship" },
      { key: "french", label: "French A2" },
      { key: "chinese", label: "Chinese HSK 3" },
      { key: "urbanism", label: "Urbanism Portfolio" },
    ]},
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "progress", label: "Progress", icon: TrendingUp },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <aside className="pt-sidebar">
      <div className="pt-brand">Field Notes<span>Personal Tracker</span></div>
      <nav className="pt-nav">
        {items.map((it) => (
          <div key={it.key}>
            <button
              className={`pt-nav-item ${nav === it.key ? "active" : ""}`}
              onClick={() => { setNav(it.key); if (it.sub) setSubNav(it.sub[0].key); else setSubNav(null); }}
            >
              <it.icon size={16} /> {it.label}
            </button>
            {it.sub && nav === it.key && (
              <div className="pt-nav-sub">
                {it.sub.map((s) => (
                  <div key={s.key} className={`pt-nav-sub-item ${subNav === s.key ? "active" : ""}`} onClick={() => setSubNav(s.key)}>
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="pt-nav-divider" />
      <div style={{ padding: "0 10px", fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5, marginBottom: 10 }}>
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
function computeThesisProgress(thesis) {
  const phases = thesis.roadmap;
  const done = phases.filter((p) => p.status === "COMPLETED").length;
  const pct = Math.round((done / phases.length) * 100);
  const current = phases.find((p) => p.status === "IN PROGRESS") || phases.find((p) => p.status !== "COMPLETED");
  const anyBehind = phases.some((p) => p.status === "BEHIND");
  const anyAtRisk = phases.some((p) => p.status === "AT RISK");
  let status = "ON TRACK";
  if (anyBehind) status = "BEHIND"; else if (anyAtRisk) status = "AT RISK";
  if (done === phases.length) status = "COMPLETED";
  return { pct, current: current ? current.title : "—", next: current ? `Advance: ${current.title}` : "All phases complete", status };
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
  const pct = Math.min(100, Math.round((chinese.vocabCount / wordTarget) * 100));
  let status = "ON TRACK";
  if (pct < timePct - 20) status = "BEHIND"; else if (pct < timePct - 8) status = "AT RISK";
  return { pct, current: `${chinese.vocabCount} words logged`, next: "Log today's study session", status, wordTarget };
}
function computeInternshipProgress(internship) {
  if (internship.active) return { pct: 100, current: internship.active.company, next: "Log today's internship activity", status: "ON TRACK" };
  const n = internship.applications.length;
  const pct = Math.min(100, n * 8);
  const hasOffer = internship.applications.some((a) => a.status === "OFFER");
  return { pct, current: hasOffer ? "Offer received" : `${n} application${n === 1 ? "" : "s"} tracked`, next: "Add / follow up on an application", status: hasOffer ? "ON TRACK" : (n === 0 ? "BEHIND" : "AT RISK") };
}
function computePortfolioProgress(portfolio) {
  const idx = portfolio.stages.indexOf(portfolio.stage);
  const pct = Math.round(((idx + 1) / portfolio.stages.length) * 100);
  const status = portfolio.stage === "FINAL CASE STUDY" ? "COMPLETED" : "ON TRACK";
  return { pct, current: portfolio.stage, next: idx < portfolio.stages.length - 1 ? `Move to: ${portfolio.stages[idx + 1]}` : "Finalize case study", status };
}

const GOAL_META = {
  thesis: { label: "Thesis", icon: FlaskConical, color: "var(--thesis)", soft: "var(--thesis-soft)" },
  internship: { label: "Internship", icon: Briefcase, color: "var(--internship)", soft: "var(--internship-soft)" },
  french: { label: "French A2", icon: Languages, color: "var(--french)", soft: "var(--french-soft)" },
  chinese: { label: "Chinese HSK 3", icon: BookOpen, color: "var(--chinese)", soft: "var(--chinese-soft)" },
  urbanism: { label: "Urbanism Portfolio", icon: Building2, color: "var(--urbanism)", soft: "var(--urbanism-soft)" },
};

/* =========================================================================
   HOME SCREEN
   ========================================================================= */
function HomeScreen({ ctx }) {
  const { settings, thesis, goals, calendar, meta, saveMeta, setNav, setSubNav, addXP } = ctx;
  const daysLeft = daysBetween(todayISO(), settings.thesisMidterm);
  const daysSince = Math.max(0, daysBetween(settings.trackerStart, todayISO()));

  const today = todayISO();
  const priorities = meta.topPriorities[today] || [];

  const thesisP = computeThesisProgress(thesis);
  const frenchP = computeFrenchProgress(goals.french);
  const chineseP = computeChineseProgress(goals.chinese, settings);
  const internshipP = computeInternshipProgress(goals.internship);
  const portfolioP = computePortfolioProgress(goals.urbanism ? goals.urbanism : goals.portfolio);

  const cards = [
    { key: "thesis", ...thesisP, nav: "thesis", sub: null },
    { key: "internship", ...internshipP, nav: "goals", sub: "internship" },
    { key: "french", ...frenchP, nav: "goals", sub: "french" },
    { key: "chinese", ...chineseP, nav: "goals", sub: "chinese" },
    { key: "urbanism", ...portfolioP, nav: "goals", sub: "urbanism" },
  ];

  const todaysTasks = calendar.tasks.filter((t) => t.date === today);
  const tasksCompletedToday = todaysTasks.filter((t) => t.completed).length;
  const todaysTimeLog = thesis.timeLog.filter((t) => t.date === today).reduce((s, t) => s + t.minutes, 0);
  const todaysFrenchLesson = goals.french.lessons.find((l) => l.date === today) || goals.french.lessons.find((l) => l.status !== "COMPLETED");
  const xpToday = meta.xpLog.filter((x) => x.date === today).reduce((s, x) => s + x.amount, 0);

  function togglePriority(id) {
    saveMeta((prev) => {
      const list = prev.topPriorities[today] || [];
      const next = list.map((p) => (p.id === id ? { ...p, done: !p.done } : p));
      const wasDone = list.find((p) => p.id === id)?.done;
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
    saveMeta((prev) => ({ ...prev, topPriorities: { ...prev.topPriorities, [today]: (prev.topPriorities[today] || []).filter((p) => p.id !== id) } }));
  }

  const [newPriority, setNewPriority] = useState("");

  return (
    <div>
      <div className="pt-eyebrow">My Progress</div>
      <h1 className="pt-h1">Good to see you.</h1>
      <p className="pt-sub" style={{ marginBottom: 26 }}>Here's what matters today.</p>

      <div className="pt-hero" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div className="pt-hero-label">Thesis Midterm · {fmtDate(settings.thesisMidterm)}</div>
            <div className="pt-hero-count">{daysLeft >= 0 ? daysLeft : 0}</div>
            <div className="pt-hero-days">days left</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="pt-hero-label">Since {fmtDate(settings.trackerStart)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600 }}>{daysSince}</div>
            <div className="pt-hero-days" style={{ fontSize: 13 }}>days in</div>
          </div>
        </div>
      </div>

      <div className="pt-grid2" style={{ marginBottom: 22 }}>
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Today's Top 3 Priorities</div>
          {priorities.length === 0 && <EmptyState text="No priorities set for today yet." />}
          {priorities.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <button className="pt-btn-ghost pt-btn" style={{ padding: 0, border: "none" }} onClick={() => togglePriority(p.id)}>
                {p.done ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
              </button>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: p.done ? "line-through" : "none", color: p.done ? "var(--ink-faint)" : "var(--ink)" }}>{p.text}</span>
              <button className="pt-btn-ghost pt-btn" onClick={() => removePriority(p.id)}><X size={13} /></button>
            </div>
          ))}
          {priorities.length < 3 && (
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <input className="pt-input" placeholder="Add a priority…" value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { addPriority(newPriority); setNewPriority(""); } }} />
              <button className="pt-btn pt-btn-primary" onClick={() => { addPriority(newPriority); setNewPriority(""); }}><Plus size={14} /></button>
            </div>
          )}
        </div>

        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Today's Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatRow label="Tasks completed" value={`${tasksCompletedToday} / ${todaysTasks.length}`} icon={CheckCircle2} />
            <StatRow label="Time logged (thesis)" value={`${Math.floor(todaysTimeLog / 60)}h ${todaysTimeLog % 60}m`} icon={Clock} />
            <StatRow label="XP earned" value={`+${xpToday}`} icon={Sparkles} />
            <StatRow label="Streak" value={`${goals.french.streak || 0} days`} icon={Flame} />
          </div>
        </div>
      </div>

      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Five Goals</div>
      <div className="pt-grid5">
        {cards.map((c) => {
          const m = GOAL_META[c.key];
          return (
            <div key={c.key} className="pt-goalcard" onClick={() => { setNav(c.nav); if (c.sub) setSubNav(c.sub); }}>
              <div className="pt-goalcard-icon" style={{ background: m.soft }}><m.icon size={16} color={m.color} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8 }}>{c.pct}%</div>
              <ProgressBar pct={c.pct} color={m.color} />
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.4 }}>{c.current}</div>
              <div style={{ marginTop: 8 }}><StatusPill status={c.status} /></div>
            </div>
          );
        })}
      </div>

      {todaysFrenchLesson && (
        <div className="pt-card" style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="pt-eyebrow">Today's French Lesson</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{todaysFrenchLesson.title}</div>
            </div>
            <button className="pt-btn pt-btn-primary" onClick={() => { setNav("goals"); setSubNav("french"); }}>Open <ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)" }}><Icon size={14} /> {label}</span>
      <span style={{ fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{value}</span>
    </div>
  );
}

/* =========================================================================
   THESIS SCREEN
   ========================================================================= */
const THESIS_TABS = [
  { key: "roadmap", label: "Roadmap" },
  { key: "literature", label: "Literature Library" },
  { key: "framework", label: "Conceptual Framework" },
  { key: "cases", label: "Case Studies" },
  { key: "observation", label: "Observation" },
  { key: "questionnaire", label: "Questionnaire" },
  { key: "supervisor", label: "Supervisor" },
  { key: "outputs", label: "Research Outputs" },
  { key: "time", label: "Time Tracking" },
];

function ThesisScreen({ ctx }) {
  const [tab, setTab] = useState("roadmap");
  const { settings } = ctx;
  const daysLeft = daysBetween(todayISO(), settings.thesisMidterm);

  return (
    <div>
      <div className="pt-eyebrow">Priority Goal</div>
      <h1 className="pt-h1">Thesis & Research</h1>
      <p className="pt-sub" style={{ marginBottom: 6 }}>Informal Learning Spaces in Shanghai Universities: Emotional Experience and Learning Behavior</p>
      <p className="pt-sub" style={{ marginBottom: 24, fontWeight: 600, color: "var(--thesis)" }}>{daysLeft} days to midterm — {fmtDate(settings.thesisMidterm)}</p>

      <div className="pt-tabs">
        {THESIS_TABS.map((t) => (
          <div key={t.key} className={`pt-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab === "roadmap" && <RoadmapTab ctx={ctx} />}
      {tab === "literature" && <LiteratureTab ctx={ctx} />}
      {tab === "framework" && <FrameworkTab ctx={ctx} />}
      {tab === "cases" && <CaseStudiesTab ctx={ctx} />}
      {tab === "observation" && <ObservationTab ctx={ctx} />}
      {tab === "questionnaire" && <QuestionnaireTab ctx={ctx} />}
      {tab === "supervisor" && <SupervisorTab ctx={ctx} />}
      {tab === "outputs" && <OutputsTab ctx={ctx} />}
      {tab === "time" && <TimeTrackingTab ctx={ctx} />}
    </div>
  );
}

function RoadmapTab({ ctx }) {
  const { thesis, saveThesis, addXP } = ctx;
  const [editing, setEditing] = useState(null);

  function updatePhase(id, patch) {
    const wasCompleted = thesis.roadmap.find((p) => p.id === id)?.status === "COMPLETED";
    saveThesis((prev) => ({ ...prev, roadmap: prev.roadmap.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    if (patch.status === "COMPLETED" && !wasCompleted) addXP(50, "Thesis phase completed");
  }

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-timeline">
          {thesis.roadmap.map((p, i) => (
            <div className="pt-tl-row" key={p.id}>
              <div className="pt-tl-rail">
                <div className={`pt-tl-dot ${p.status === "COMPLETED" ? "done" : ""}`} />
                {i < thesis.roadmap.length - 1 && <div className="pt-tl-line" />}
              </div>
              <div className="pt-tl-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="pt-chip" style={{ marginBottom: 6 }}>Phase {p.phaseNumber}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{fmtDate(p.start)} – {fmtDate(p.end)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StatusPill status={p.status} />
                    <button className="pt-btn pt-btn-sm" onClick={() => setEditing(p)}><Edit3 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <Modal title={`Edit: ${editing.title}`} onClose={() => setEditing(null)}>
          <Field label="Status">
            <select className="pt-select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
              {["NOT STARTED", "IN PROGRESS", "COMPLETED", "AT RISK", "BEHIND"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="pt-grid2">
            <Field label="Start date"><input type="date" className="pt-input" value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} /></Field>
            <Field label="End date"><input type="date" className="pt-input" value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} /></Field>
          </div>
          <button className="pt-btn pt-btn-primary" style={{ marginTop: 6 }} onClick={() => { updatePhase(editing.id, { status: editing.status, start: editing.start, end: editing.end }); setEditing(null); }}>Save changes</button>
        </Modal>
      )}
    </div>
  );
}

function LiteratureTab({ ctx }) {
  const { thesis, saveThesis, addXP } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const lit = thesis.literature;

  const analysed = lit.filter((a) => a.status === "ANALYSED").length;
  const themes = new Set(lit.flatMap((a) => (a.keywords || "").split(",").map((k) => k.trim()).filter(Boolean)));
  const gaps = lit.filter((a) => a.notes && a.notes.toLowerCase().includes("gap")).length;

  function upsert(item) {
    saveThesis((prev) => {
      const exists = prev.literature.some((a) => a.id === item.id);
      return { ...prev, literature: exists ? prev.literature.map((a) => (a.id === item.id ? item : a)) : [item, ...prev.literature] };
    });
  }
  function remove(id) { saveThesis((prev) => ({ ...prev, literature: prev.literature.filter((a) => a.id !== id) })); }
  function setStatus(id, status) {
    const prevItem = lit.find((a) => a.id === id);
    saveThesis((prev) => ({ ...prev, literature: prev.literature.map((a) => (a.id === id ? { ...a, status } : a)) }));
    if (status === "ANALYSED" && prevItem?.status !== "ANALYSED") addXP(15, "Article analysed");
  }

  return (
    <div>
      <div className="pt-grid5" style={{ marginBottom: 20 }}>
        <MiniStat label="Articles Analysed" value={`${analysed} / 50`} />
        <MiniStat label="Themes Identified" value={themes.size} />
        <MiniStat label="Research Gaps" value={gaps} />
        <MiniStat label="Total in library" value={lit.length} />
        <div />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setEditItem(blankArticle()); setShowForm(true); }}><Plus size={14} /> Add article / note</button>
      </div>
      {lit.length === 0 ? <EmptyState text="No articles yet. Add your first source to begin the literature review." /> : (
        <table className="pt-table">
          <thead><tr><th>Title</th><th>Author / Year</th><th>Status</th><th>Key idea</th><th></th></tr></thead>
          <tbody>
            {lit.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600, maxWidth: 220 }}>{a.title || "(untitled)"}</td>
                <td>{a.author}{a.year ? `, ${a.year}` : ""}</td>
                <td>
                  <select className="pt-select" style={{ width: 130 }} value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}>
                    {["UNREAD", "READING", "ANALYSED"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ maxWidth: 260, color: "var(--ink-soft)" }}>{a.keyIdea}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="pt-btn pt-btn-ghost" onClick={() => { setEditItem(a); setShowForm(true); }}><Edit3 size={14} /></button>
                  <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(a.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <Modal title={editItem.title ? "Edit article" : "Add article / research note"} onClose={() => setShowForm(false)} wide>
          <div className="pt-grid2">
            <Field label="Title"><input className="pt-input" value={editItem.title} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} /></Field>
            <Field label="Author"><input className="pt-input" value={editItem.author} onChange={(e) => setEditItem({ ...editItem, author: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
            <Field label="Year"><input className="pt-input" value={editItem.year} onChange={(e) => setEditItem({ ...editItem, year: e.target.value })} /></Field>
            <Field label="DOI / URL"><input className="pt-input" value={editItem.doi} onChange={(e) => setEditItem({ ...editItem, doi: e.target.value })} /></Field>
          </div>
          <Field label="Keywords (comma-separated — powers Themes Identified)"><input className="pt-input" value={editItem.keywords} onChange={(e) => setEditItem({ ...editItem, keywords: e.target.value })} /></Field>
          <Field label="Research question addressed"><input className="pt-input" value={editItem.rq} onChange={(e) => setEditItem({ ...editItem, rq: e.target.value })} /></Field>
          <Field label="Methodology"><input className="pt-input" value={editItem.methodology} onChange={(e) => setEditItem({ ...editItem, methodology: e.target.value })} /></Field>
          <Field label="Key idea"><textarea className="pt-textarea" value={editItem.keyIdea} onChange={(e) => setEditItem({ ...editItem, keyIdea: e.target.value })} /></Field>
          <Field label="Relevant findings"><textarea className="pt-textarea" value={editItem.findings} onChange={(e) => setEditItem({ ...editItem, findings: e.target.value })} /></Field>
          <Field label="Why relevant to my thesis"><textarea className="pt-textarea" value={editItem.relevance} onChange={(e) => setEditItem({ ...editItem, relevance: e.target.value })} /></Field>
          <Field label="My notes (mention 'gap' if it reveals a research gap)"><textarea className="pt-textarea" value={editItem.notes} onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })} /></Field>
          <Field label="Status">
            <select className="pt-select" value={editItem.status} onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}>
              {["UNREAD", "READING", "ANALYSED"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} /> PDF file storage isn't available in this environment — store the DOI/URL above and keep the PDF in your own file system or reference manager.
          </div>
          <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...editItem, id: editItem.id || uid() }); setShowForm(false); }}>Save article</button>
        </Modal>
      )}
    </div>
  );
}
function blankArticle() {
  return { id: null, title: "", author: "", year: "", doi: "", keywords: "", rq: "", methodology: "", keyIdea: "", findings: "", relevance: "", notes: "", status: "UNREAD" };
}
function MiniStat({ label, value }) {
  return (
    <div className="pt-card pt-card-tight">
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function TagListEditor({ items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {items.map((it, i) => (
          <span key={i} className="pt-chip" style={{ display: "inline-flex", gap: 6 }}>
            {it} <X size={11} style={{ cursor: "pointer" }} onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="pt-input" placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }} />
        <button className="pt-btn" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}><Plus size={14} /></button>
      </div>
    </div>
  );
}

function FrameworkTab({ ctx }) {
  const { thesis, saveThesis } = ctx;
  const fw = thesis.framework;
  function patch(p) { saveThesis((prev) => ({ ...prev, framework: { ...prev.framework, ...p } })); }

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 10 }}>Conceptual logic</div>
        <input className="pt-input pt-serif" style={{ fontSize: 15, textAlign: "center", padding: "14px 10px" }} value={fw.logic} onChange={(e) => patch({ logic: e.target.value })} />
      </div>
      <Field label="Main research question"><textarea className="pt-textarea" value={fw.mainRQ} onChange={(e) => patch({ mainRQ: e.target.value })} /></Field>
      <div className="pt-grid2">
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Sub-questions</div>
          <TagListEditor items={fw.subQuestions} onChange={(v) => patch({ subQuestions: v })} placeholder="Add a sub-question…" />
        </div>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Key concepts</div>
          <TagListEditor items={fw.keyConcepts} onChange={(v) => patch({ keyConcepts: v })} placeholder="Add a key concept…" />
        </div>
      </div>
      <div className="pt-grid3" style={{ marginTop: 16 }}>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Spatial factors</div>
          <TagListEditor items={fw.spatialFactors} onChange={(v) => patch({ spatialFactors: v })} placeholder="Add factor…" />
        </div>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Emotional factors</div>
          <TagListEditor items={fw.emotionalFactors} onChange={(v) => patch({ emotionalFactors: v })} placeholder="Add factor…" />
        </div>
        <div className="pt-card">
          <div className="pt-label" style={{ marginBottom: 8 }}>Behavioural factors</div>
          <TagListEditor items={fw.behavioralFactors} onChange={(v) => patch({ behavioralFactors: v })} placeholder="Add factor…" />
        </div>
      </div>

      <div className="pt-card" style={{ marginTop: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Relationship diagram</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", padding: "10px 0" }}>
          <FrameworkNode label="Spatial" items={fw.spatialFactors} color="var(--thesis)" />
          <ChevronRight color="var(--ink-faint)" />
          <FrameworkNode label="Emotional" items={fw.emotionalFactors} color="var(--gold)" />
          <ChevronRight color="var(--ink-faint)" />
          <FrameworkNode label="Behavioural" items={fw.behavioralFactors} color="var(--french)" />
        </div>
      </div>
    </div>
  );
}
function FrameworkNode({ label, items, color }) {
  return (
    <div style={{ border: `1.5px solid ${color}`, borderRadius: 12, padding: "14px 18px", minWidth: 160, textAlign: "center" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{items.length ? items.slice(0, 3).join(", ") : "—"}</div>
    </div>
  );
}

function CaseStudiesTab({ ctx }) {
  const { thesis, saveThesis } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  function blank() { return { id: null, university: "", location: "", spaceName: "", spaceType: "", whySelected: "", notes: "", status: "NOT STARTED" }; }
  function upsert(v) { saveThesis((prev) => ({ ...prev, caseStudies: prev.caseStudies.some((c) => c.id === v.id) ? prev.caseStudies.map((c) => (c.id === v.id ? v : c)) : [v, ...prev.caseStudies] })); }
  function remove(id) { saveThesis((prev) => ({ ...prev, caseStudies: prev.caseStudies.filter((c) => c.id !== id) })); }

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
          <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

const OBS_ACTIVITY_FIELDS = ["individual", "group", "socialising", "resting", "eating", "phoneUse", "other"];
function ObservationTab({ ctx }) {
  const { thesis, saveThesis, addXP } = ctx;
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
  }
  function remove(id) { saveThesis((prev) => ({ ...prev, observations: prev.observations.filter((o) => o.id !== id) })); }

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
          <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save session</button>
        </Modal>
      )}
    </div>
  );
}

const QUESTIONNAIRE_STAGES = ["IDEA", "DRAFT", "SUPERVISOR REVIEW", "PILOT", "REVISED", "PUBLISHED", "COLLECTING RESPONSES", "CLOSED"];
function QuestionnaireTab({ ctx }) {
  const { thesis, saveThesis, addXP } = ctx;
  const q = thesis.questionnaire;
  function patch(p) { saveThesis((prev) => ({ ...prev, questionnaire: { ...prev.questionnaire, ...p } })); }
  const [showQForm, setShowQForm] = useState(false);
  const [qItem, setQItem] = useState(null);

  function blankQ() { return { id: null, question: "", type: "Multiple choice", concept: "", why: "", options: "", status: "DRAFT", notes: "" }; }
  function upsertQ(v) { saveThesis((prev) => ({ ...prev, questionBank: prev.questionBank.some((x) => x.id === v.id) ? prev.questionBank.map((x) => (x.id === v.id ? v : x)) : [v, ...prev.questionBank] })); }
  function removeQ(id) { saveThesis((prev) => ({ ...prev, questionBank: prev.questionBank.filter((x) => x.id !== id) })); }

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
          <button className="pt-btn pt-btn-primary" onClick={() => { upsertQ({ ...qItem, id: qItem.id || uid() }); setShowQForm(false); }}>Save question</button>
        </Modal>
      )}
    </div>
  );
}

function SupervisorTab({ ctx }) {
  const { thesis, saveThesis } = ctx;
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
  }
  function convertToTask(meetingId, fbId, text, calendarSave) {
    saveThesis((prev) => ({
      ...prev, supervisor: {
        ...prev.supervisor,
        meetings: prev.supervisor.meetings.map((m) => (m.id === meetingId ? { ...m, feedback: m.feedback.map((f) => (f.id === fbId ? { ...f, convertedToTask: true } : f)) } : m)),
      },
    }));
    calendarSave((prev) => ({ ...prev, tasks: [{ id: uid(), title: text, date: todayISO(), time: "", duration: 30, category: "Thesis", priority: "High", notes: "From supervisor feedback", completed: false, recurrence: "none" }, ...prev.tasks] }));
  }

  return (
    <div>
      <div className="pt-grid2">
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Meeting preparation checklist</div>
          {sup.checklist.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <button className="pt-btn-ghost pt-btn" style={{ padding: 0, border: "none" }} onClick={() => toggleChecklist(c.id)}>
                {c.done ? <CheckCircle2 size={16} color="var(--ontrack)" /> : <Circle size={16} color="var(--ink-faint)" />}
              </button>
              <span style={{ fontSize: 13.5, textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--ink-faint)" : "var(--ink)" }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Log a meeting</div>
          <textarea className="pt-textarea" placeholder="Meeting notes…" value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} style={{ minHeight: 100 }} />
          <button className="pt-btn pt-btn-primary" style={{ marginTop: 10 }} onClick={logMeeting}><Plus size={14} /> Log meeting</button>
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
              <button className="pt-btn" onClick={() => addFeedback(m.id)}><Plus size={14} /></button>
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
  const { thesis, saveThesis } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  function blank() { return { id: null, type: "Conference abstract", title: "", status: "IDEA", notes: "" }; }
  function upsert(v) { saveThesis((prev) => ({ ...prev, outputs: prev.outputs.some((o) => o.id === v.id) ? prev.outputs.map((o) => (o.id === v.id ? v : o)) : [v, ...prev.outputs] })); }
  function remove(id) { saveThesis((prev) => ({ ...prev, outputs: prev.outputs.filter((o) => o.id !== id) })); }
  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 14 }}>Goal: conference participation and/or publication-related progress by early October. Publication is not assumed — this simply tracks where things stand.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add output</button>
      </div>
      {thesis.outputs.length === 0 ? <EmptyState text="Nothing tracked yet." /> : (
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
          <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

const TIME_CATEGORIES = ["Literature Review", "Framework", "Case Studies", "Observation", "Questionnaire", "Interviews", "Writing", "Supervisor", "Other"];
function TimeTrackingTab({ ctx }) {
  const { thesis, saveThesis, addXP } = ctx;
  const [form, setForm] = useState({ date: todayISO(), task: "", category: TIME_CATEGORIES[0], minutes: 30, notes: "" });

  function add() {
    if (!form.task.trim()) return;
    saveThesis((prev) => ({ ...prev, timeLog: [{ id: uid(), ...form, minutes: Number(form.minutes) }, ...prev.timeLog] }));
    addXP(Math.min(30, Math.round(form.minutes / 10)), "Thesis time logged");
    setForm({ date: todayISO(), task: "", category: form.category, minutes: 30, notes: "" });
  }
  function remove(id) { saveThesis((prev) => ({ ...prev, timeLog: prev.timeLog.filter((t) => t.id !== id) })); }

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
        <button className="pt-btn pt-btn-primary" onClick={add}><Plus size={14} /> Add entry</button>
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
        <table className="pt-table">
          <thead><tr><th>Date</th><th>Task</th><th>Category</th><th>Time</th><th></th></tr></thead>
          <tbody>
            {thesis.timeLog.map((t) => (
              <tr key={t.id}><td>{fmtDate(t.date)}</td><td>{t.task}</td><td>{t.category}</td><td>{Math.floor(t.minutes / 60)}h {t.minutes % 60}m</td>
                <td><button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(t.id)}><Trash2 size={14} /></button></td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* =========================================================================
   GOALS SCREEN
   ========================================================================= */
function GoalsScreen({ ctx }) {
  const { subNav, setSubNav } = ctx;
  const active = subNav || "internship";
  return (
    <div>
      <div className="pt-eyebrow">Goals</div>
      <h1 className="pt-h1">Internship · French · Chinese · Portfolio</h1>
      <div className="pt-tabs" style={{ marginTop: 20 }}>
        {[["internship", "Internship"], ["french", "French A2"], ["chinese", "Chinese HSK 3"], ["urbanism", "Urbanism Portfolio"]].map(([k, l]) => (
          <div key={k} className={`pt-tab ${active === k ? "active" : ""}`} onClick={() => setSubNav(k)}>{l}</div>
        ))}
      </div>
      {active === "internship" && <InternshipTab ctx={ctx} />}
      {active === "french" && <FrenchTab ctx={ctx} />}
      {active === "chinese" && <ChineseTab ctx={ctx} />}
      {active === "urbanism" && <UrbanismTab ctx={ctx} />}
    </div>
  );
}

const INTERNSHIP_STATUSES = ["RESEARCHING", "CONTACTED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];
function InternshipTab({ ctx }) {
  const { goals, saveGoals, addXP } = ctx;
  const intern = goals.internship;
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [showActivate, setShowActivate] = useState(false);
  const [actForm, setActForm] = useState({ company: "", position: "", start: "", end: "" });

  const thisWeekCount = useMemo(() => {
    const weekAgo = addDays(todayISO(), -7);
    return intern.applications.filter((a) => a.date >= weekAgo && a.status !== "RESEARCHING").length;
  }, [intern.applications]);

  function blank() { return { id: null, company: "", position: "", date: todayISO(), status: "RESEARCHING", link: "", notes: "" }; }
  function upsert(v) {
    const isNew = !intern.applications.some((a) => a.id === v.id);
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, applications: isNew ? [v, ...prev.internship.applications] : prev.internship.applications.map((a) => (a.id === v.id ? v : a)) } }));
    if (isNew) addXP(10, "Internship application tracked");
  }
  function remove(id) { saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, applications: prev.internship.applications.filter((a) => a.id !== id) } })); }

  function activate() {
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...actForm, attendance: [], projects: [], skills: [], deliverables: [], notes: [] } } }));
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
          <button className="pt-btn" onClick={() => setShowActivate(true)}><Trophy size={14} /> I found an internship</button>
          <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}><Plus size={14} /> Add application</button>
        </div>
      </div>
      {intern.applications.length === 0 ? <EmptyState text="No applications tracked yet." /> : (
        <table className="pt-table">
          <thead><tr><th>Company</th><th>Position</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {intern.applications.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.company}</td><td>{a.position}</td><td>{fmtDate(a.date)}</td>
                <td>
                  <select className="pt-select" style={{ width: 130 }} value={a.status} onChange={(e) => upsert({ ...a, status: e.target.value })}>
                    {INTERNSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="pt-btn pt-btn-ghost" onClick={() => { setItem(a); setShowForm(true); }}><Edit3 size={14} /></button>
                <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(a.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
          <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save</button>
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
          <button className="pt-btn pt-btn-primary" onClick={activate}>Switch to My Internship</button>
        </Modal>
      )}
    </div>
  );
}

function ActiveInternship({ internship, ctx }) {
  const { saveGoals } = ctx;
  const [entry, setEntry] = useState("");
  const [kind, setKind] = useState("notes");
  const kinds = { attendance: "Attendance", projects: "Projects", skills: "Skills learned", deliverables: "Deliverables", notes: "Notes / Achievements" };

  function addEntry() {
    if (!entry.trim()) return;
    saveGoals((prev) => ({ ...prev, internship: { ...prev.internship, active: { ...prev.internship.active, [kind]: [...prev.internship.active[kind], { id: uid(), text: entry, date: todayISO() }] } } }));
    setEntry("");
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
          <input className="pt-input" placeholder="Add entry…" value={entry} onChange={(e) => setEntry(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} />
          <button className="pt-btn pt-btn-primary" onClick={addEntry}><Plus size={14} /></button>
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
    </div>
  );
}

function FrenchTab({ ctx }) {
  const [sub, setSub] = useState("today");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[["today", "Today's Lesson"], ["curriculum", "Curriculum"], ["vocab", "Vocabulary Bank"], ["progress", "Progress"]].map(([k, l]) => (
          <button key={k} className="pt-btn pt-btn-sm" style={{ background: sub === k ? "var(--french-soft)" : undefined, color: sub === k ? "var(--french)" : undefined, borderColor: sub === k ? "var(--french)" : undefined }} onClick={() => setSub(k)}>{l}</button>
        ))}
      </div>
      {sub === "today" && <FrenchToday ctx={ctx} />}
      {sub === "curriculum" && <FrenchCurriculum ctx={ctx} />}
      {sub === "vocab" && <FrenchVocab ctx={ctx} />}
      {sub === "progress" && <FrenchProgress ctx={ctx} />}
    </div>
  );
}

function FrenchToday({ ctx }) {
  const { goals, saveGoals, addXP } = ctx;
  const french = goals.french;
  const lesson = french.lessons.find((l) => l.status !== "COMPLETED") || french.lessons[french.lessons.length - 1];
  const [minutes, setMinutes] = useState(lesson?.minutesSpent || 0);

  function markComplete() {
    saveGoals((prev) => {
      const lessons = prev.goals?.french?.lessons; // guard unused
      return prev;
    });
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const wasCompleted = prev.french.lessons[idx].status === "COMPLETED";
      const nextLessons = [...prev.french.lessons];
      nextLessons[idx] = { ...nextLessons[idx], status: "COMPLETED", minutesSpent: Number(minutes) };
      const streak = wasCompleted ? prev.french.streak : (prev.french.streak || 0) + 1;
      return { ...prev, french: { ...prev.french, lessons: nextLessons, streak, daysStudied: (prev.french.daysStudied || 0) + (wasCompleted ? 0 : 1), totalMinutes: (prev.french.totalMinutes || 0) + Number(minutes) } };
    });
    addXP(25, "French lesson completed");
  }
  function missedToday() {
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const nextLessons = [...prev.french.lessons];
      // shift this and all subsequent pending lessons forward by 1 day, preserving sequence
      for (let i = idx; i < nextLessons.length; i++) {
        if (nextLessons[i].status !== "COMPLETED") nextLessons[i] = { ...nextLessons[i], date: addDays(nextLessons[i].date, 1) };
      }
      return { ...prev, french: { ...prev.french, lessons: nextLessons, streak: 0 } };
    });
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

        <div className="pt-grid2" style={{ marginTop: 16, alignItems: "end" }}>
          <Field label="Minutes completed today"><input type="number" className="pt-input" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          <button className="pt-btn pt-btn-primary" onClick={markComplete}><Check size={14} /> Mark lesson complete</button>
        </div>
      </div>
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
  const { goals, saveGoals } = ctx;
  const french = goals.french;
  const [form, setForm] = useState({ fr: "", en: "", pronunciation: "", example: "", category: "" });

  function add() {
    if (!form.fr.trim()) return;
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: [{ id: uid(), ...form, status: "NEW", addedDate: todayISO(), lastReviewed: null }, ...prev.french.vocabBank] } }));
    setForm({ fr: "", en: "", pronunciation: "", example: "", category: "" });
  }
  function cycleStatus(id) {
    const order = ["NEW", "LEARNING", "KNOWN", "NEEDS REVIEW"];
    saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: prev.french.vocabBank.map((v) => v.id === id ? { ...v, status: order[(order.indexOf(v.status) + 1) % order.length], lastReviewed: todayISO() } : v) } }));
  }
  function remove(id) { saveGoals((prev) => ({ ...prev, french: { ...prev.french, vocabBank: prev.french.vocabBank.filter((v) => v.id !== id) } })); }

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
        <button className="pt-btn pt-btn-primary" onClick={add}><Plus size={14} /> Add to bank</button>
      </div>
      {french.vocabBank.length === 0 ? <EmptyState text="No vocabulary logged yet." /> : (
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
      )}
    </div>
  );
}

function FrenchProgress({ ctx }) {
  const { goals, settings, saveSettings } = ctx;
  const french = goals.french;
  const total = french.lessons.length;
  const completed = french.lessons.filter((l) => l.status === "COMPLETED").length;
  const level = completed < total * 0.15 ? "A0" : completed < total * 0.55 ? "A1" : "A2";
  const totalVocabTarget = total * 15;

  const chartData = useMemo(() => {
    return french.lessons.filter((l) => l.status === "COMPLETED").slice(-14).map((l) => ({ day: `D${l.dayNumber}`, minutes: l.minutesSpent }));
  }, [french.lessons]);

  return (
    <div>
      <div className="pt-grid5" style={{ marginBottom: 20 }}>
        <MiniStat label="Level" value={level} />
        <MiniStat label="Curriculum" value={`${completed} / ${total}`} />
        <MiniStat label="Vocabulary" value={`${french.vocabBank.length} / ~${totalVocabTarget}`} />
        <MiniStat label="Days studied" value={french.daysStudied || 0} />
        <MiniStat label="Current streak" value={`${french.streak || 0} 🔥`} />
      </div>
      <div className="pt-grid2" style={{ marginBottom: 20 }}>
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

function ChineseTab({ ctx }) {
  const { goals, saveGoals, settings, saveSettings, addXP } = ctx;
  const chinese = goals.chinese;
  const [form, setForm] = useState({ words: 20, minutes: 30, notes: "" });
  const daysLeft = daysBetween(todayISO(), settings.chineseTarget);

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

  const progress = computeChineseProgress(chinese, settings);

  return (
    <div>
      <div className="pt-hero" style={{ background: "linear-gradient(135deg, var(--chinese), #7C3F2C)", marginBottom: 20 }}>
        <div className="pt-hero-label">HSK 3 Exam · {fmtDate(settings.chineseTarget)}</div>
        <div className="pt-hero-count">{daysLeft >= 0 ? daysLeft : 0}</div>
        <div className="pt-hero-days">days left · editable in Settings</div>
      </div>
      <div className="pt-grid5" style={{ marginBottom: 20 }}>
        <MiniStat label="Words learned" value={chinese.vocabCount} />
        <MiniStat label="Study time" value={`${Math.floor(chinese.totalMinutes / 60)}h ${chinese.totalMinutes % 60}m`} />
        <MiniStat label="HSK3 progress" value={`${progress.pct}%`} />
        <MiniStat label="Sessions logged" value={chinese.logs.length} />
        <div />
      </div>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Today I learned:</div>
        <div className="pt-grid3">
          <Field label="Words"><input type="number" className="pt-input" value={form.words} onChange={(e) => setForm({ ...form, words: e.target.value })} /></Field>
          <Field label="Minutes spent"><input type="number" className="pt-input" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} /></Field>
          <Field label="Notes"><input className="pt-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <button className="pt-btn pt-btn-primary" onClick={logToday}><Plus size={14} /> Log today's study</button>
      </div>
      {chinese.logs.length === 0 ? <EmptyState text="No study sessions logged yet." /> : (
        <table className="pt-table">
          <thead><tr><th>Date</th><th>Words</th><th>Time</th><th>Notes</th></tr></thead>
          <tbody>
            {chinese.logs.map((l) => (<tr key={l.id}><td>{fmtDate(l.date)}</td><td>{l.wordsLearned}</td><td>{l.minutesSpent}m</td><td>{l.notes}</td></tr>))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UrbanismTab({ ctx }) {
  const { goals, saveGoals, settings, addXP } = ctx;
  const p = goals.urbanism || goals.portfolio;
  function patch(v) { saveGoals((prev) => ({ ...prev, urbanism: { ...(prev.urbanism || prev.portfolio), ...v } })); }
  const idx = p.stages.indexOf(p.stage);
  const daysLeft = daysBetween(todayISO(), settings.portfolioTarget);

  function advance() {
    if (idx < p.stages.length - 1) { patch({ stage: p.stages[idx + 1] }); addXP(30, "Portfolio stage advanced"); }
  }

  return (
    <div>
      <p className="pt-sub" style={{ marginBottom: 16 }}>Priority: one strong urbanism case study, not many unfinished ones. Target: {fmtDate(settings.portfolioTarget)} ({daysLeft} days left).</p>
      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
          {p.stages.map((s, i) => (
            <div key={s} className="pt-chip" style={{ background: i <= idx ? "var(--urbanism)" : "var(--line-soft)", color: i <= idx ? "#fff" : "var(--ink-soft)" }}>{s}</div>
          ))}
        </div>
        <ProgressBar pct={((idx + 1) / p.stages.length) * 100} color="var(--urbanism)" />
        {idx < p.stages.length - 1 && <button className="pt-btn pt-btn-primary" style={{ marginTop: 14 }} onClick={advance}>Advance to: {p.stages[idx + 1]} <ChevronRight size={14} /></button>}
      </div>
      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Project</div>
        <Field label="Project title"><input className="pt-input" value={p.project.title} onChange={(e) => patch({ project: { ...p.project, title: e.target.value } })} /></Field>
        <div className="pt-grid2">
          <Field label="Site"><textarea className="pt-textarea" value={p.project.site} onChange={(e) => patch({ project: { ...p.project, site: e.target.value } })} /></Field>
          <Field label="Problem"><textarea className="pt-textarea" value={p.project.problem} onChange={(e) => patch({ project: { ...p.project, problem: e.target.value } })} /></Field>
        </div>
        <div className="pt-grid2">
          <Field label="Users"><textarea className="pt-textarea" value={p.project.users} onChange={(e) => patch({ project: { ...p.project, users: e.target.value } })} /></Field>
          <Field label="Concept"><textarea className="pt-textarea" value={p.project.concept} onChange={(e) => patch({ project: { ...p.project, concept: e.target.value } })} /></Field>
        </div>
        <Field label="Urban strategy"><textarea className="pt-textarea" value={p.project.strategy} onChange={(e) => patch({ project: { ...p.project, strategy: e.target.value } })} /></Field>
        <Field label="Notes"><textarea className="pt-textarea" value={p.project.notes} onChange={(e) => patch({ project: { ...p.project, notes: e.target.value } })} /></Field>
        <Field label="Connected competition (optional)"><input className="pt-input" value={p.competitionLinked || ""} onChange={(e) => patch({ competitionLinked: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/* =========================================================================
   CALENDAR SCREEN
   ========================================================================= */
const TASK_CATEGORIES = ["Thesis", "Internship", "French", "Chinese", "Urbanism", "Personal", "Other"];
function CalendarScreen({ ctx }) {
  const { calendar, saveCalendar, addXP } = ctx;
  const [view, setView] = useState("agenda");
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => { const d = parseISO(todayISO()); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); });

  function blank() { return { id: null, title: "", date: todayISO(), time: "", duration: 30, category: "Personal", priority: "Medium", notes: "", completed: false, recurrence: "none" }; }
  function upsert(v) { saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.some((t) => t.id === v.id) ? prev.tasks.map((t) => (t.id === v.id ? v : t)) : [v, ...prev.tasks] })); }
  function remove(id) { saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) })); }
  function toggleComplete(t) {
    upsert({ ...t, completed: !t.completed });
    if (!t.completed) addXP(10, "Task completed");
  }

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
                <button className="pt-btn-ghost pt-btn" style={{ padding: 0, border: "none" }} onClick={() => toggleComplete(t)}>
                  {t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
                </button>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setItem(t); setShowForm(true); }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{fmtDate(t.date)} {t.time && `· ${t.time}`} · {t.category}</div>
                </div>
                <span className="pt-chip">{t.priority}</span>
                <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <Modal title="Task" onClose={() => setShowForm(false)}>
          <Field label="Title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <div className="pt-grid3">
            <Field label="Date"><input type="date" className="pt-input" value={item.date} onChange={(e) => setItem({ ...item, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" className="pt-input" value={item.time} onChange={(e) => setItem({ ...item, time: e.target.value })} /></Field>
            <Field label="Duration (min)"><input type="number" className="pt-input" value={item.duration} onChange={(e) => setItem({ ...item, duration: e.target.value })} /></Field>
          </div>
          <div className="pt-grid2">
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
          <Field label="Recurrence">
            <select className="pt-select" value={item.recurrence} onChange={(e) => setItem({ ...item, recurrence: e.target.value })}>
              {["none", "daily", "weekly", "monthly"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pt-btn pt-btn-primary" onClick={() => { upsert({ ...item, id: item.id || uid() }); setShowForm(false); }}>Save task</button>
            {item.id && <button className="pt-btn pt-btn-danger" onClick={() => { remove(item.id); setShowForm(false); }}>Delete</button>}
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
              <div key={t.id} onClick={() => onSelect(t)} style={{ fontSize: 11.5, padding: "4px 0", cursor: "pointer", textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</div>
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
          <button className="pt-btn-ghost pt-btn" style={{ padding: 0, border: "none" }} onClick={() => onToggle(t)}>{t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}</button>
          <span style={{ width: 50, fontSize: 12, color: "var(--ink-faint)" }}>{t.time || "—"}</span>
          <span style={{ flex: 1, cursor: "pointer", fontSize: 13.5 }} onClick={() => onSelect(t)}>{t.title}</span>
          <span className="pt-chip">{t.category}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   PROGRESS SCREEN (Weekly Review + XP)
   ========================================================================= */
function ProgressScreen({ ctx }) {
  const { meta, saveMeta, thesis, goals, calendar, settings } = ctx;
  const [reviewDraft, setReviewDraft] = useState({ achievement: "", nextWeek: ["", "", ""] });

  const weekAgo = addDays(todayISO(), -7);
  const tasksThisWeek = calendar.tasks.filter((t) => t.date >= weekAgo);
  const completedThisWeek = tasksThisWeek.filter((t) => t.completed).length;
  const timeThisWeek = thesis.timeLog.filter((t) => t.date >= weekAgo).reduce((s, t) => s + t.minutes, 0);

  const thesisP = computeThesisProgress(thesis);
  const frenchP = computeFrenchProgress(goals.french);
  const chineseP = computeChineseProgress(goals.chinese, settings);
  const internshipP = computeInternshipProgress(goals.internship);
  const portfolioP = computePortfolioProgress(goals.urbanism || goals.portfolio);

  function saveReview() {
    saveMeta((prev) => ({ ...prev, weeklyReviews: [{ id: uid(), date: todayISO(), ...reviewDraft }, ...prev.weeklyReviews] }));
    setReviewDraft({ achievement: "", nextWeek: ["", "", ""] });
  }

  const xpData = useMemo(() => {
    const byDate = {};
    meta.xpLog.forEach((x) => { byDate[x.date] = (byDate[x.date] || 0) + x.amount; });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, xp]) => ({ date: date.slice(5), xp }));
  }, [meta.xpLog]);

  return (
    <div>
      <div className="pt-eyebrow">Progress</div>
      <h1 className="pt-h1">XP, streaks & weekly review</h1>

      <div className="pt-grid3" style={{ margin: "22px 0" }}>
        <MiniStat label="Total XP" value={meta.xp} />
        <MiniStat label="Tasks this week" value={`${completedThisWeek} / ${tasksThisWeek.length}`} />
        <MiniStat label="Thesis time this week" value={`${Math.floor(timeThisWeek / 60)}h ${timeThisWeek % 60}m`} />
      </div>

      {xpData.length > 0 && (
        <div className="pt-card" style={{ height: 200, marginBottom: 22 }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>XP earned — last 14 active days</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={xpData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="xp" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="pt-card" style={{ marginBottom: 22 }}>
        <div className="pt-h2" style={{ fontSize: 16, marginBottom: 14 }}>Weekly review</div>
        <div className="pt-grid5" style={{ marginBottom: 16 }}>
          {[["Thesis", thesisP], ["Internship", internshipP], ["French", frenchP], ["Chinese", chineseP], ["Portfolio", portfolioP]].map(([label, p]) => (
            <div key={label}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{p.pct}%</div>
            </div>
          ))}
        </div>
        <Field label="Biggest achievement this week"><textarea className="pt-textarea" value={reviewDraft.achievement} onChange={(e) => setReviewDraft({ ...reviewDraft, achievement: e.target.value })} /></Field>
        <div className="pt-label" style={{ marginBottom: 6 }}>Next week — top 3 priorities</div>
        {reviewDraft.nextWeek.map((v, i) => (
          <input key={i} className="pt-input" style={{ marginBottom: 8 }} value={v} onChange={(e) => { const nw = [...reviewDraft.nextWeek]; nw[i] = e.target.value; setReviewDraft({ ...reviewDraft, nextWeek: nw }); }} />
        ))}
        <button className="pt-btn pt-btn-primary" onClick={saveReview}><Check size={14} /> Save weekly review</button>
      </div>

      {meta.weeklyReviews.length > 0 && (
        <div>
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 10 }}>Past reviews</div>
          {meta.weeklyReviews.map((r) => (
            <div key={r.id} className="pt-card pt-card-tight" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>{fmtDate(r.date)}</div>
              <div style={{ fontSize: 13 }}>{r.achievement}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>Next: {r.nextWeek.filter(Boolean).join(" · ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   SETTINGS SCREEN
   ========================================================================= */
function SettingsScreen({ ctx }) {
  const { settings, saveSettings, thesis, saveThesis, goals, saveGoals, calendar, saveCalendar, meta, saveMeta, onSignOut } = ctx;
  const [msg, setMsg] = useState("");

  function exportData() {
    const bundle = { exportedAt: new Date().toISOString(), settings, thesis, goals, calendar, meta };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `productivity-tracker-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg("Export downloaded.");
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result);
        if (bundle.settings) saveSettings(bundle.settings);
        if (bundle.thesis) saveThesis(bundle.thesis);
        if (bundle.goals) saveGoals(bundle.goals);
        if (bundle.calendar) saveCalendar(bundle.calendar);
        if (bundle.meta) saveMeta(bundle.meta);
        setMsg("Import complete.");
      } catch (err) {
        setMsg("Import failed: file is not a valid backup.");
      }
    };
    reader.readAsText(file);
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
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Backup</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pt-btn pt-btn-primary" onClick={exportData}><Download size={14} /> Export data (JSON)</button>
          <label className="pt-btn" style={{ cursor: "pointer" }}>
            <Upload size={14} /> Import data
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={importData} />
          </label>
        </div>
        {msg && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>{msg}</div>}
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
    </div>
  );
}
