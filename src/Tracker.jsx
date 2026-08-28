import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Home, Calendar as CalendarIcon, Settings as SettingsIcon,
  BookOpen, FlaskConical, Users, ClipboardList, MessageSquare, Mic, FileText, Clock,
  Plus, X, Check, ChevronRight, ChevronLeft, ChevronDown, Download, Upload, Sparkles,
  AlertTriangle, CheckCircle2, Circle, Languages, Building2,
  Loader2, Edit3, Trash2, Info, LogOut, Search, Paperclip, ExternalLink,
  Table2, LayoutList, Volume2, HelpCircle, ArrowRight
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TOKENS, FontLoader } from "./theme";
import { supabase } from "./lib/supabaseClient";
import { useStore } from "./lib/useStore";
import { FRENCH_MODULES, generateFrenchLessons } from "./frenchData";
import {
  THESIS_COMPONENTS_META, THESIS_PHASES, DEFAULT_COMPONENT_ACTIONS, computeThesisPhases
} from "./thesisData";
import {
  CHINESE_SEED_VOCAB, CHINESE_STATUS_LABELS, CHINESE_REVIEW_INTERVALS,
  blankChineseFlashcard, blankChineseExam, getDailyChineseSessionCards
} from "./chineseData";

/* =========================================================================
   DATE HELPERS
   ========================================================================= */
const DAY_MS = 86400000;
function toISO(d) { return d.toISOString().slice(0, 10); }
function parseISO(s) { const [y, m, d] = (s || "2026-08-15").split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / DAY_MS); }
function todayISO() { return toISO(new Date()); }
function fmtDate(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function addDays(iso, n) { return toISO(new Date(parseISO(iso).getTime() + n * DAY_MS)); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

/* =========================================================================
   SPEECH SYNTHESIS HELPERS (Web Speech API)
   ========================================================================= */
export function speakFrench(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
  utter.lang = frVoice ? frVoice.lang : "fr-FR";
  if (frVoice) utter.voice = frVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function useFrenchVoiceAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    function check() {
      const voices = window.speechSynthesis.getVoices();
      setAvailable(voices.some((v) => v.lang && v.lang.toLowerCase().startsWith("fr")));
    }
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);
  return available;
}

export function FrenchSpeakButton({ text, size }) {
  const available = useFrenchVoiceAvailable();
  if (!available) return null;
  return (
    <button
      className="pt-btn pt-btn-ghost pt-tap"
      style={{ padding: 4, minWidth: 28, minHeight: 28, color: "var(--french)" }}
      onClick={(e) => { e.stopPropagation(); speakFrench(text); }}
      title="Écouter la prononciation"
    >
      <Volume2 size={size || 14} />
    </button>
  );
}

export function speakChinese(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("zh"));
  utter.lang = zhVoice ? zhVoice.lang : "zh-CN";
  if (zhVoice) utter.voice = zhVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function useChineseVoiceAvailable() {
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

export function ChineseSpeakButton({ text, size }) {
  const available = useChineseVoiceAvailable();
  if (!available) return null;
  return (
    <button
      className="pt-btn pt-btn-ghost pt-tap"
      style={{ padding: 4, minWidth: 28, minHeight: 28, color: "var(--chinese)" }}
      onClick={(e) => { e.stopPropagation(); speakChinese(text); }}
      title="Play pronunciation"
    >
      <Volume2 size={size || 14} />
    </button>
  );
}

/* =========================================================================
   INITIAL DATA & STORAGE SCHEMAS
   ========================================================================= */
function initSettings() {
  return {
    trackerStart: "2026-08-15",
    thesisMidterm: "2026-10-01", // Default: Early October 2026
    frenchTarget: "2026-11-30",   // Target: A2 by November 2026
    chineseTarget: "2027-01-15",  // Target: HSK3 Exam January 2027 (TBC)
    portfolioTarget: "2026-10-31",// Working deadline: Oct 31, 2026
    dailyFrenchMinutes: 60,
    dailyChineseWords: 5,        // Default: 5 new words/day
    dailyChineseMaxReviews: 10,  // Controlled review queue to avoid card explosion
    loveNote: "Thinking of you so much this week my love. Give everything for your thesis, I am so proud of you and everything you do. Big kisses from France! ❤️",
    hugMessage: "Titouan is thinking of you right at this very moment. He is always by your side to encourage and support you. I love you more than anything in the world! ❤️",
    loveNoteAuthor: "Titouan",
    loveNoteUpdatedAt: todayISO(),
  };
}

function initThesisSections() {
  const base = Object.fromEntries(THESIS_COMPONENTS_META.map((s) => [s.key, { blocks: [] }]));
  base.framework = { blocks: [], concepts: [], relationships: [], conceptsSeeded: false };
  return base;
}

function seedFrameworkConcepts() {
  const spatial = { id: uid(), name: "Spatial Characteristics", description: "Physical layout, lighting, furniture, boundaries, noise level" };
  const emotional = { id: uid(), name: "Emotional Experience", description: "Sense of belonging, comfort, psychological safety, restoration" };
  const behavioral = { id: uid(), name: "Behavioral Patterns", description: "Study duration, collaboration, spatial appropriation, movement" };
  return {
    concepts: [spatial, emotional, behavioral],
    relationships: [
      { id: uid(), fromConceptId: spatial.id, toConceptId: emotional.id, label: "shapes" },
      { id: uid(), fromConceptId: emotional.id, toConceptId: behavioral.id, label: "influences" },
    ],
  };
}

function initThesisComponents() {
  return THESIS_COMPONENTS_META.map((meta) => {
    const defaults = DEFAULT_COMPONENT_ACTIONS[meta.key] || [];
    return {
      id: uid(),
      key: meta.key,
      name: meta.title,
      short: meta.short,
      number: meta.number,
      phaseIndex: meta.phaseIndex,
      preMidterm: meta.preMidterm,
      actions: defaults.map((a) => ({
        id: uid(),
        text: a.text,
        status: a.status || "NOT_STARTED",
        done: a.status === "COMPLETED",
        createdAt: todayISO(),
      })),
    };
  });
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
      title: "Informal Learning Space Perception & Emotional Experience Survey",
      purpose: "Investigating student spatial experiences in Shanghai university informal spaces",
      link: "", draftDate: "", supervisorReviewDate: "", pilotDate: "",
      launchDate: "", closingDate: "", targetParticipants: 200, currentResponses: 0, stage: "IDEA",
    },
    questionBank: [],
    caseStudies: [],
    observations: [],
    supervisor: {
      checklist: [
        "Thesis topic & scope approval", "Research questions finalized", "Literature review progress",
        "Initial conceptual framework", "Proposed methodology", "Case study site selection in Shanghai",
        "Observation protocol draft", "Questionnaire draft review", "Midterm slide deck draft review",
      ].map((label) => ({ id: uid(), label, done: false })),
      meetings: [],
    },
    outputs: [],
    timeLog: [],
  };
}

function migrateThesis(raw) {
  if (!raw) return initThesis();
  const fresh = initThesis();
  const existingSections = raw.sections || {};
  const mergedSections = { ...fresh.sections, ...existingSections };

  // Ensure framework concepts exist
  const fw = mergedSections.framework || { blocks: [] };
  if (!fw.conceptsSeeded || !Array.isArray(fw.concepts) || fw.concepts.length === 0) {
    const seed = seedFrameworkConcepts();
    mergedSections.framework = { ...fw, concepts: seed.concepts, relationships: seed.relationships, conceptsSeeded: true };
  }

  // Ensure 16 components exist and actions have status field
  let components = Array.isArray(raw.components) && raw.components.length > 0 ? raw.components : fresh.components;
  const existingKeys = new Set(components.map((c) => c.key || c.name));

  // Add any missing 16 components
  fresh.components.forEach((freshComp) => {
    if (!existingKeys.has(freshComp.key) && !existingKeys.has(freshComp.name)) {
      components.push(freshComp);
    }
  });

  // Normalize action statuses
  components = components.map((c) => {
    const meta = THESIS_COMPONENTS_META.find((m) => m.key === c.key || m.title === c.name) || {};
    return {
      ...c,
      key: c.key || meta.key || "foundation",
      name: c.name || meta.title || "Section",
      number: c.number || meta.number || "01",
      short: c.short || meta.short || c.name,
      phaseIndex: meta.phaseIndex != null ? meta.phaseIndex : 0,
      preMidterm: meta.preMidterm != null ? meta.preMidterm : true,
      actions: (c.actions || []).map((a) => ({
        ...a,
        status: a.status || (a.done ? "COMPLETED" : "NOT_STARTED"),
        done: a.status === "COMPLETED" || !!a.done,
      })),
    };
  });

  return {
    ...raw,
    sections: mergedSections,
    components,
    claims: Array.isArray(raw.claims) ? raw.claims : [],
    contradictions: Array.isArray(raw.contradictions) ? raw.contradictions : [],
    questionnaire: raw.questionnaire || fresh.questionnaire,
    questionBank: Array.isArray(raw.questionBank) ? raw.questionBank : [],
    caseStudies: Array.isArray(raw.caseStudies) ? raw.caseStudies : [],
    observations: Array.isArray(raw.observations) ? raw.observations : [],
    supervisor: raw.supervisor || fresh.supervisor,
    outputs: Array.isArray(raw.outputs) ? raw.outputs : [],
    timeLog: Array.isArray(raw.timeLog) ? raw.timeLog : [],
  };
}

function initLiterature() {
  return { articles: [], researchGaps: [] };
}

function ensureLiteratureShape(raw) {
  if (!raw) return initLiterature();
  return {
    articles: Array.isArray(raw.articles) ? raw.articles : [],
    researchGaps: Array.isArray(raw.researchGaps) ? raw.researchGaps : [],
  };
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

function blankFrenchCertification() {
  return { chosenCert: "DELF A2", customCertName: "", registrationDate: "", examDate: "", resultsDate: "" };
}

function ensureChineseShape(chinese) {
  const c = chinese || {};
  return {
    logs: Array.isArray(c.logs) ? c.logs : [],
    vocabCount: c.vocabCount || 0,
    totalMinutes: c.totalMinutes || 0,
    flashcards: Array.isArray(c.flashcards) && c.flashcards.length > 0
      ? c.flashcards
      : CHINESE_SEED_VOCAB.slice(0, 15).map((w) => ({ ...blankChineseFlashcard(), ...w, id: uid() })),
    streak: c.streak || 0,
    daysStudied: c.daysStudied || 0,
    lastStudyDate: c.lastStudyDate || null,
    exam: c.exam || blankChineseExam(),
  };
}

function ensurePortfolioShape(rawPortfolio) {
  const p = (rawPortfolio && rawPortfolio.project) || (rawPortfolio && rawPortfolio.projects && rawPortfolio.projects[0]) || {};
  return {
    project: {
      title: p.title || "Urbanism Portfolio Project",
      status: p.status || (p.stage === "Portfolio integration" || p.done ? "COMPLETED" : (p.stage && p.stage !== "Project idea" ? "IN_PROGRESS" : "NOT_STARTED")),
      deadline: p.deadline || "2026-10-31",
      notes: p.notes || (p.research && p.research.notes) || "",
      link: p.link || "",
      completedAt: p.completedAt || null,
    },
    projects: [
      {
        id: "urbanism-main",
        title: p.title || "Urbanism Portfolio Project",
        status: p.status || "NOT_STARTED",
        deadline: p.deadline || "2026-10-31",
        notes: p.notes || "",
        link: p.link || "",
      }
    ]
  };
}

function ensureFrenchShape(rawFrench, settings) {
  const generated = generateFrenchLessons(
    (settings && settings.trackerStart) || "2026-08-15",
    (settings && settings.frenchTarget) || "2026-11-30"
  );

  if (!rawFrench || !Array.isArray(rawFrench.lessons) || rawFrench.lessons.length === 0) {
    return {
      modules: FRENCH_MODULES,
      lessons: generated,
      vocabBank: (rawFrench && rawFrench.vocabBank) || [],
      currentDayIndex: 0,
      streak: (rawFrench && rawFrench.streak) || 0,
      daysStudied: (rawFrench && rawFrench.daysStudied) || 0,
      totalMinutes: (rawFrench && rawFrench.totalMinutes) || 0,
      certification: (rawFrench && rawFrench.certification) || blankFrenchCertification(),
    };
  }

  // Merge the rich generated lesson data (grammar, vocabulary with examples, pronunciation, selfStudyGuide)
  // while preserving completed status and logged study minutes!
  const mergedLessons = generated.map((gen, idx) => {
    const existing = rawFrench.lessons[idx] || rawFrench.lessons.find((l) => l.dayNumber === gen.dayNumber || l.date === gen.date);
    if (!existing) return gen;
    return {
      ...gen,
      status: existing.status || "PENDING",
      minutesSpent: existing.minutesSpent || 0,
      id: existing.id || gen.id,
    };
  });

  return {
    modules: FRENCH_MODULES,
    lessons: mergedLessons,
    vocabBank: rawFrench.vocabBank || [],
    currentDayIndex: rawFrench.currentDayIndex || 0,
    streak: rawFrench.streak || 0,
    daysStudied: rawFrench.daysStudied || 0,
    totalMinutes: rawFrench.totalMinutes || 0,
    certification: rawFrench.certification || blankFrenchCertification(),
  };
}

function initGoals() {
  return {
    french: ensureFrenchShape(null, initSettings()),
    chinese: {
      logs: [], vocabCount: 0, totalMinutes: 0,
      flashcards: CHINESE_SEED_VOCAB.slice(0, 15).map((w) => ({ ...blankChineseFlashcard(), ...w, id: uid() })),
      streak: 0, daysStudied: 0, lastStudyDate: null,
      exam: blankChineseExam(),
    },
    portfolio: ensurePortfolioShape(null),
  };
}

function normalizeGoals(raw, settings) {
  if (!raw) return initGoals();
  const { internship, ...rest } = raw; // Remove internship completely
  return {
    ...rest,
    french: ensureFrenchShape(raw.french, settings),
    chinese: ensureChineseShape(raw.chinese),
    portfolio: ensurePortfolioShape(raw.portfolio),
  };
}

function initCalendar() {
  const start = "2026-08-15";
  return {
    tasks: [
      { id: uid(), title: "Thesis: Supervisor meeting & kickoff", date: addDays(start, 6), time: "14:00", duration: 60, category: "Thesis", priority: "High", notes: "Bring preparation checklist.", completed: false, recurrence: "none" },
      { id: uid(), title: "Thesis: Literature matrix review", date: start, time: "09:00", duration: 120, category: "Thesis", priority: "High", notes: "Extract key concepts from 2 papers.", completed: false, recurrence: "none" },
      { id: uid(), title: "Chinese: HSK 3 Registration Window Opens", date: "2026-12-01", time: "09:00", duration: 30, category: "Chinese", priority: "High", notes: "Check official registration dates on chinesetest.cn", completed: false, recurrence: "none" },
      { id: uid(), title: "Portfolio: Finalize Urbanism Case Study", date: "2026-10-31", time: "17:00", duration: 60, category: "Portfolio", priority: "Medium", notes: "Urbanism portfolio project target deadline.", completed: false, recurrence: "none" },
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
    "COMPLETED": "pt-pill-completed", "NOT STARTED": "pt-pill-neutral", "NOT_STARTED": "pt-pill-neutral",
    "IN PROGRESS": "pt-pill-atrisk", "IN_PROGRESS": "pt-pill-atrisk",
    "PLANNED": "pt-pill-neutral", "OBSERVED": "pt-pill-ontrack",
    "UNREAD": "pt-pill-neutral", "READING": "pt-pill-atrisk", "ANALYSED": "pt-pill-ontrack",
    "IDEA": "pt-pill-neutral", "DRAFT": "pt-pill-neutral", "SUPERVISOR REVIEW": "pt-pill-atrisk",
    "PILOT": "pt-pill-atrisk", "REVISED": "pt-pill-atrisk", "PUBLISHED": "pt-pill-ontrack",
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

function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }) {
  return (
    <div className="pt-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pt-modal" style={{ maxWidth: 420 }}>
        <h3 className="pt-h2" style={{ marginBottom: 10 }}>{title}</h3>
        <p className="pt-sub" style={{ marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="pt-btn" onClick={onCancel}>Cancel</button>
          <button className={`pt-btn ${danger ? "pt-btn-danger" : "pt-btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

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

function MiniStat({ label, value }) {
  return (
    <div className="pt-card pt-card-tight">
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>{value}</div>
    </div>
  );
}

/* =========================================================================
   ROOT APP COMPONENT
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

  const thesis = useMemo(() => migrateThesis(thesisRaw), [thesisRaw]);
  const goals = useMemo(() => normalizeGoals(goalsRaw, settings), [goalsRaw, settings]);
  const literature = useMemo(() => ensureLiteratureShape(literatureRaw), [literatureRaw]);

  // One-time automatic schema upgrade
  useEffect(() => {
    if (!allLoaded || migratedRef.current) return;
    migratedRef.current = true;
    const needsThesisUpgrade = !(thesisRaw && Array.isArray(thesisRaw.components) && thesisRaw.components.length >= 16);
    if (needsThesisUpgrade) saveThesis(migrateThesis(thesisRaw));
    const needsGoalsUpgrade = goalsRaw && (goalsRaw.internship || !goalsRaw.french?.lessons?.[0]?.selfStudyGuide || !goalsRaw.french?.lessons?.[0]?.vocabulary?.length);
    if (needsGoalsUpgrade) saveGoals(normalizeGoals(goalsRaw, settings));
    // eslint-disable-next-line
  }, [allLoaded]);

  const showToast = useCallback((data, duration) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(data);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const notify = useCallback((message, undo) => {
    showToast({ message, undo }, undo ? 6000 : 3000);
  }, [showToast]);

  const addXP = useCallback((amount, reason, undo) => {
    saveMeta((prev) => ({
      ...prev,
      xp: (prev.xp || 0) + amount,
      xpLog: [{ id: uid(), date: todayISO(), amount, reason }, ...(prev.xpLog || [])].slice(0, 200)
    }));
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
      </div>
    );
  }

  const ctx = {
    settings, saveSettings, thesis, saveThesis, goals, saveGoals,
    calendar, saveCalendar, meta, saveMeta, literature, saveLiterature,
    addXP, notify, nav, setNav, onSignOut
  };

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
        {nav === "portfolio" && <PortfolioScreen ctx={ctx} />}
        {nav === "calendar" && <CalendarScreen ctx={ctx} />}
        {nav === "settings" && <SettingsScreen ctx={ctx} />}
      </main>
      <AppToast toast={toast} onDismiss={() => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); setToast(null); }} />
    </div>
  );
}

/* =========================================================================
   SIDEBAR NAVIGATION
   ========================================================================= */
function Sidebar({ ctx }) {
  const { nav, setNav, onSignOut } = ctx;
  const items = [
    { key: "home", label: "Dashboard", icon: Home },
    { key: "thesis", label: "Thesis", icon: FlaskConical },
    { key: "french", label: "French", icon: Languages },
    { key: "chinese", label: "Chinese", icon: BookOpen },
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
   PROGRESS COMPUTATIONS FOR THE 4 PRIORITY GOALS
   ========================================================================= */
function computeThesisProgress(thesis, settings) {
  const phaseInfo = computeThesisPhases(settings, todayISO());
  const allActions = thesis.components.flatMap((c) => c.actions || []);
  const completed = allActions.filter((a) => a.status === "COMPLETED" || a.done).length;
  const pct = allActions.length > 0 ? Math.round((completed / allActions.length) * 100) : 0;
  const timePct = Math.min(100, Math.round((phaseInfo.daysElapsed / phaseInfo.totalDays) * 100));

  let status = "ON TRACK";
  if (pct < timePct - 20) status = "BEHIND";
  else if (pct < timePct - 8) status = "AT RISK";
  if (phaseInfo.daysLeft === 0 && pct >= 100) status = "COMPLETED";

  // Find next actionable task
  const nextTask = allActions.find((a) => a.status !== "COMPLETED" && !a.done);

  return {
    pct,
    current: `${completed}/${allActions.length} actions complete`,
    next: nextTask ? nextTask.text : "Midterm preparation",
    daysLeft: phaseInfo.daysLeft,
    status,
    phaseInfo,
  };
}

function computeFrenchProgress(french) {
  const lessons = french.lessons || [];
  const completed = lessons.filter((l) => l.status === "COMPLETED").length;
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => l.status !== "COMPLETED");
  const status = pct >= 100 ? "COMPLETED" : "ON TRACK";
  return {
    pct,
    current: nextLesson ? `Day ${nextLesson.dayNumber} · ${nextLesson.moduleTitle}` : "Curriculum complete",
    next: nextLesson ? nextLesson.title : "A2 consolidation",
    status,
  };
}

function computeChineseProgress(chinese, settings) {
  const session = getDailyChineseSessionCards(chinese, settings, todayISO());
  const wordsLearned = (chinese.flashcards || []).filter((c) => c.status === "MASTERED" || c.status === "LEARNED").length;
  const wordTarget = 600; // HSK 3 active vocabulary benchmark
  const pct = Math.min(100, Math.round((wordsLearned / wordTarget) * 100));
  const examDays = daysBetween(todayISO(), settings.chineseTarget || "2027-01-15");

  return {
    pct,
    current: `${wordsLearned} words learned · ${session.newCards.length} new + ${session.dueReviews.length} reviews today`,
    next: "Daily flashcard session",
    daysLeft: examDays,
    status: "ON TRACK",
    session,
  };
}

function computePortfolioProgress(portfolio) {
  const project = portfolio.project || {};
  const status = project.status || "NOT_STARTED";
  let pct = 0;
  if (status === "COMPLETED") pct = 100;
  else if (status === "IN_PROGRESS") pct = 50;

  return {
    pct,
    current: status === "COMPLETED" ? "✓ Project Completed" : (status === "IN_PROGRESS" ? "In Progress" : "Urbanism project needed"),
    next: status === "COMPLETED" ? "Ready for review" : "Develop case study",
    status: status === "COMPLETED" ? "COMPLETED" : (status === "IN_PROGRESS" ? "IN PROGRESS" : "NOT STARTED"),
  };
}

const GOAL_META = {
  thesis: { priority: "Priority 1", label: "Thesis", icon: FlaskConical, color: "var(--thesis)", soft: "var(--thesis-soft)", nav: "thesis" },
  french: { priority: "Priority 2", label: "French A2", icon: Languages, color: "var(--french)", soft: "var(--french-soft)", nav: "french" },
  chinese: { priority: "Priority 3", label: "Chinese HSK3", icon: BookOpen, color: "var(--chinese)", soft: "var(--chinese-soft)", nav: "chinese" },
  portfolio: { priority: "Priority 4", label: "Portfolio", icon: Building2, color: "var(--urbanism)", soft: "var(--urbanism-soft)", nav: "portfolio" },
};

/* =========================================================================
   DUAL TIMEZONE HOOK & ROMANTIC LOVE BANNER
   ========================================================================= */
function useDualTime() {
  const [time, setTime] = useState({ paris: "", shanghai: "" });

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime({
        paris: now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }),
        shanghai: now.toLocaleTimeString("fr-FR", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" }),
      });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

function LoveNoteBanner({ ctx }) {
  const { settings, meta, saveMeta, addXP } = ctx;
  const { paris, shanghai } = useDualTime();
  const [hearts, setHearts] = useState([]);
  const [showHugModal, setShowHugModal] = useState(false);

  const note = settings.loveNote || "Thinking of you so much this week my love. Give everything for your thesis, I am so proud of you and everything you do. Big kisses from France! ❤️";
  const hugMsg = settings.hugMessage || "Titouan is thinking of you right at this very moment. He is always by your side to encourage and support you. I love you more than anything in the world! ❤️";
  const author = settings.loveNoteAuthor || "Titouan";
  const hugsCount = meta.hugsCount || 0;

  function triggerHug() {
    // Spawn floating heart particles
    const newHearts = Array.from({ length: 14 }).map((_, i) => ({
      id: uid(),
      left: Math.floor(Math.random() * 80) + 10,
      top: Math.floor(Math.random() * 30) + 50,
      emoji: ["❤️", "💖", "💕", "✨", "🥰", "💌"][i % 6],
      delay: Math.random() * 0.4,
    }));
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 2400);

    saveMeta((prev) => ({
      ...prev,
      hugsCount: (prev.hugsCount || 0) + 1,
    }));
    addXP(10, "Big hug received ❤️");
    setShowHugModal(true);
  }

  return (
    <div className="pt-love-card" style={{ marginBottom: 24 }}>
      {/* Floating Hearts Container */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="pt-floating-heart"
          style={{ left: `${h.left}%`, top: `${h.top}%`, animationDelay: `${h.delay}s` }}
        >
          {h.emoji}
        </span>
      ))}

      {/* Top row: Clocks & Origin Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div className="pt-dual-clock">
          <span>🇫🇷 Paris <strong style={{ color: "#E05670" }}>{paris || "—:—"}</strong></span>
          <span className="pt-clock-dot" />
          <span>🇨🇳 Shanghai <strong>{shanghai || "—:—"}</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)", fontWeight: 600 }}>
            From Titouan with Love 💕
          </span>
        </div>
      </div>

      {/* Love Note Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 15, fontStyle: "italic", fontFamily: "'Fraunces', Georgia, serif", color: "#2D2628", lineHeight: 1.6, marginBottom: 8 }}>
          « {note} »
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#E05670" }}>
            — With all my love, {author}
          </div>
          <button className="pt-hug-btn pt-tap" onClick={triggerHug}>
            <span>❤️</span> Send a big hug {hugsCount > 0 && `(${hugsCount})`}
          </button>
        </div>
      </div>

      {/* Hug Modal */}
      {showHugModal && (
        <Modal title="Big Hug Received! 🥰" onClose={() => setShowHugModal(false)}>
          <div style={{ textAlign: "center", padding: "12px 6px" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💌 ❤️ 🇫🇷 ✈️ 🇨🇳</div>
            <h3 className="pt-h2" style={{ color: "#E05670", marginBottom: 8 }}>
              Hug sent all the way from France!
            </h3>
            <p className="pt-sub" style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 18, color: "var(--ink)" }}>
              {hugMsg}
            </p>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 16 }}>
              Total hugs shared: <strong>{hugsCount}</strong>
            </div>
            <button className="pt-btn pt-btn-primary" style={{ background: "#E05670", borderColor: "#E05670" }} onClick={() => setShowHugModal(false)}>
              Thank you my love ❤️
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   HOME / DASHBOARD SCREEN
   ========================================================================= */
function HomeScreen({ ctx }) {
  const { settings, thesis, goals, calendar, meta, saveMeta, saveCalendar, saveThesis, setNav, addXP, notify } = ctx;
  const today = todayISO();
  const daysLeftMidterm = Math.max(0, daysBetween(today, settings.thesisMidterm));

  const thesisP = computeThesisProgress(thesis, settings);
  const frenchP = computeFrenchProgress(goals.french);
  const chineseP = computeChineseProgress(goals.chinese, settings);
  const portfolioP = computePortfolioProgress(goals.portfolio);

  const cards = [
    { key: "thesis", ...thesisP, deadline: `Midterm: ${fmtDate(settings.thesisMidterm)}` },
    { key: "french", ...frenchP, deadline: `Target: A2 (${fmtDate(settings.frenchTarget)})` },
    { key: "chinese", ...chineseP, deadline: `Exam: Jan 2027 (TBC)` },
    { key: "portfolio", ...portfolioP, deadline: `Deadline: ${fmtDate(settings.portfolioTarget)}` },
  ];

  const todaysTasks = useMemo(
    () => calendar.tasks.filter((t) => t.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [calendar.tasks, today]
  );
  const tasksCompletedToday = todaysTasks.filter((t) => t.completed).length;

  const priorities = meta.topPriorities[today] || [];
  const [newPriority, setNewPriority] = useState("");

  function togglePriority(id) {
    saveMeta((prev) => {
      const list = prev.topPriorities[today] || [];
      return { ...prev, topPriorities: { ...prev.topPriorities, [today]: list.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) } };
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
    saveMeta((prev) => ({
      ...prev,
      topPriorities: { ...prev.topPriorities, [today]: (prev.topPriorities[today] || []).filter((p) => p.id !== id) }
    }));
  }

  function toggleCalendarTask(t) {
    saveCalendar((prev) => ({
      ...prev,
      tasks: prev.tasks.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x))
    }));
    if (!t.completed) addXP(10, "Task completed");
  }

  // Active thesis tasks for today
  const activeThesisTasks = useMemo(() => {
    return thesis.components.flatMap((c) => (c.actions || []).map((a) => ({ ...a, componentName: c.name, componentKey: c.key })))
      .filter((a) => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED")
      .slice(0, 3);
  }, [thesis.components]);

  function cycleThesisTaskStatus(task) {
    const nextStatus = task.status === "NOT_STARTED" ? "IN_PROGRESS" : (task.status === "IN_PROGRESS" ? "COMPLETED" : "NOT_STARTED");
    saveThesis((prev) => ({
      ...prev,
      components: prev.components.map((c) => ({
        ...c,
        actions: c.actions.map((a) => (a.id === task.id ? { ...a, status: nextStatus, done: nextStatus === "COMPLETED" } : a))
      }))
    }));
    if (nextStatus === "COMPLETED") addXP(15, "Thesis task completed");
    notify(`Status: ${nextStatus.replace("_", " ")}`);
  }

  return (
    <div>
      <div className="pt-eyebrow">Dashboard · Current Priorities</div>
      <h1 className="pt-h1">Overview</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>What I am working toward today.</p>

      {/* Romantic Paris ⇄ Shanghai Love Note & Dual Clock */}
      <LoveNoteBanner ctx={ctx} />

      {/* Prominent Midterm Hero */}
      <div className="pt-hero" style={{ marginBottom: 24 }}>
        <div className="pt-hero-label">Priority 1 · Thesis Midterm Examination — Early October 2026</div>
        <div className="pt-hero-count">{daysLeftMidterm}</div>
        <div className="pt-hero-days">days remaining until October 1, 2026 ({fmtDate(settings.thesisMidterm)})</div>
      </div>

      {/* The 4 Goals Grid */}
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Core Goals (In Priority Order)</div>
      <div className="pt-grid4" style={{ marginBottom: 24 }}>
        {cards.map((c) => {
          const m = GOAL_META[c.key];
          return (
            <div key={c.key} className="pt-goalcard" onClick={() => setNav(m.nav)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="pt-goalcard-icon" style={{ background: m.soft, margin: 0 }}>
                  <m.icon size={16} color={m.color} />
                </div>
                <span className="pt-chip" style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: m.soft }}>
                  {m.priority}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 8 }}>{c.deadline}</div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8 }}>{c.pct}%</div>
              <ProgressBar pct={c.pct} color={m.color} />
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.4 }}>{c.current}</div>
              <div style={{ marginTop: 8 }}><StatusPill status={c.status} /></div>
            </div>
          );
        })}
      </div>

      {/* Today Section */}
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Today's Focus</div>
      <div className="pt-grid2" style={{ marginBottom: 24 }}>
        {/* Today's Thesis Actions */}
        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="pt-h2" style={{ fontSize: 14, margin: 0 }}>🎓 Today's Thesis Tasks</div>
            <button className="pt-btn pt-btn-sm pt-btn-ghost" onClick={() => setNav("thesis")}>
              View roadmap <ChevronRight size={12} />
            </button>
          </div>
          {activeThesisTasks.length === 0 ? (
            <EmptyState text="All current thesis tasks completed! Great work." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeThesisTasks.map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <button
                    className="pt-btn-ghost pt-btn pt-tap"
                    style={{ border: "none", padding: 0 }}
                    onClick={() => cycleThesisTaskStatus(task)}
                    title="Click to cycle status"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 size={18} color="var(--ontrack)" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <Circle size={18} color="var(--atrisk)" style={{ fill: "var(--atrisk)", fillOpacity: 0.3 }} />
                    ) : (
                      <Circle size={18} color="var(--ink-faint)" />
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{task.text}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{task.componentName}</div>
                  </div>
                  <button className="pt-btn pt-btn-sm" style={{ fontSize: 11 }} onClick={() => cycleThesisTaskStatus(task)}>
                    <StatusPill status={task.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Today & Top Priorities */}
        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="pt-h2" style={{ fontSize: 14, margin: 0 }}>📅 Calendar & Priorities</div>
            <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{tasksCompletedToday} / {todaysTasks.length} scheduled</span>
          </div>

          {/* Daily Top 3 Priorities */}
          <div style={{ marginBottom: 14 }}>
            <div className="pt-label" style={{ marginBottom: 6 }}>Top 3 Priorities for Today</div>
            {priorities.length === 0 && <div style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>No top priorities set yet.</div>}
            {priorities.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none", padding: 0 }} onClick={() => togglePriority(p.id)}>
                  {p.done ? <CheckCircle2 size={15} color="var(--ontrack)" /> : <Circle size={15} color="var(--ink-faint)" />}
                </button>
                <span style={{ flex: 1, fontSize: 13, textDecoration: p.done ? "line-through" : "none", color: p.done ? "var(--ink-faint)" : "var(--ink)" }}>{p.text}</span>
                <button className="pt-btn-ghost pt-btn" onClick={() => removePriority(p.id)}><X size={12} /></button>
              </div>
            ))}
            {priorities.length < 3 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input
                  className="pt-input"
                  style={{ padding: "5px 8px", fontSize: 12.5 }}
                  placeholder="Add a priority…"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newPriority.trim()) { addPriority(newPriority); setNewPriority(""); } }}
                />
                <button className="pt-btn pt-btn-sm pt-btn-primary" disabled={!newPriority.trim()} onClick={() => { addPriority(newPriority); setNewPriority(""); }}><Plus size={12} /></button>
              </div>
            )}
          </div>

          <div className="pt-nav-divider" style={{ margin: "10px 0" }} />

          {/* Calendar items */}
          <div className="pt-label" style={{ marginBottom: 6 }}>Scheduled Today</div>
          {todaysTasks.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Nothing scheduled on the calendar for today.</div>
          ) : (
            todaysTasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none", padding: 0 }} onClick={() => toggleCalendarTask(t)}>
                  {t.completed ? <CheckCircle2 size={15} color="var(--ontrack)" /> : <Circle size={15} color="var(--ink-faint)" />}
                </button>
                <span style={{ flex: 1, fontSize: 13, textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>{t.title}</span>
                <span className="pt-chip">{t.category}</span>
              </div>
            ))
          )}
          <button className="pt-btn pt-btn-sm" style={{ marginTop: 12 }} onClick={() => setNav("calendar")}>
            Open full calendar <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   THESIS SCREEN & ROADMAP
   ========================================================================= */
function ThesisScreen({ ctx }) {
  const [tab, setTab] = useState("roadmap");
  const { settings, thesis, saveThesis, saveCalendar, notify, addXP } = ctx;
  const phaseInfo = computeThesisPhases(settings, todayISO());
  const daysLeft = phaseInfo.daysLeft;

  const tabs = [
    { key: "roadmap", label: "Roadmap & Plan" },
    { key: "components", label: "16 Components" },
    { key: "matrix", label: "Literature Matrix" },
    { key: "framework", label: "Conceptual Framework" },
    { key: "claims", label: "Claims & Gaps" },
    { key: "contradictions", label: "Contradictions" },
    { key: "questionnaire", label: "Questionnaire" },
    { key: "fieldwork", label: "Case Studies & Observation" },
  ];

  return (
    <div>
      <div className="pt-eyebrow">Priority 1 · Highest-Priority Academic Goal</div>
      <h1 className="pt-h1">Thesis & Research</h1>
      <p className="pt-sub" style={{ marginBottom: 12 }}>
        Informal Learning Spaces in Shanghai Universities: Emotional Experience and Learning Behavior
      </p>

      {/* Prominent Midterm Examination Banner */}
      <div className="pt-hero" style={{ marginBottom: 24 }}>
        <div className="pt-hero-label">THESIS MIDTERM EXAMINATION — EARLY OCTOBER 2026</div>
        <div className="pt-hero-count">{daysLeft}</div>
        <div className="pt-hero-days">
          DAYS LEFT until October 1, 2026 ({fmtDate(settings.thesisMidterm)}) · {phaseInfo.currentPhase.title}
        </div>
      </div>

      <div className="pt-tabs">
        {tabs.map((t) => (
          <div key={t.key} className={`pt-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === "roadmap" && <ThesisRoadmapTab ctx={ctx} phaseInfo={phaseInfo} />}
      {tab === "components" && <ThesisComponentsListTab ctx={ctx} />}
      {tab === "matrix" && <LiteratureMatrixTab ctx={ctx} />}
      {tab === "framework" && <FrameworkConceptsPanel ctx={ctx} />}
      {tab === "claims" && <ClaimsTab ctx={ctx} />}
      {tab === "contradictions" && <ContradictionsTab ctx={ctx} />}
      {tab === "questionnaire" && <QuestionnaireTab ctx={ctx} />}
      {tab === "fieldwork" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <CaseStudiesTab ctx={ctx} />
          <ObservationTab ctx={ctx} />
        </div>
      )}

      {/* Secondary workspace drawers */}
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="pt-label" style={{ marginBottom: -4 }}>More Academic Workspace Tools</div>
        <Collapsible title="Supervisor Meetings & Checklist"><SupervisorTab ctx={ctx} /></Collapsible>
        <Collapsible title="Research Outputs & Presentations"><OutputsTab ctx={ctx} /></Collapsible>
        <Collapsible title="Thesis Study Time Tracking"><TimeTrackingTab ctx={ctx} /></Collapsible>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   THESIS ROADMAP TAB: Where I am -> What I need to complete -> Today -> Days left
   ------------------------------------------------------------------------- */
function ThesisRoadmapTab({ ctx, phaseInfo }) {
  const { settings, thesis, saveThesis, saveCalendar, notify, addXP } = ctx;
  const today = todayISO();

  function cycleActionStatus(componentKey, actionId) {
    const comp = thesis.components.find((c) => c.key === componentKey);
    if (!comp) return;
    const action = comp.actions.find((a) => a.id === actionId);
    if (!action) return;

    const nextStatus = action.status === "NOT_STARTED" ? "IN_PROGRESS" : (action.status === "IN_PROGRESS" ? "COMPLETED" : "NOT_STARTED");

    saveThesis((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.key === componentKey ? {
        ...c,
        actions: c.actions.map((a) => (a.id === actionId ? { ...a, status: nextStatus, done: nextStatus === "COMPLETED" } : a))
      } : c))
    }));

    if (nextStatus === "COMPLETED") addXP(15, "Thesis task completed");
    notify(`Task marked ${nextStatus.replace("_", " ")}`, () => {
      saveThesis((prev) => ({
        ...prev,
        components: prev.components.map((c) => (c.key === componentKey ? {
          ...c,
          actions: c.actions.map((a) => (a.id === actionId ? action : a))
        } : c))
      }));
    });
  }

  function addActionToComponent(componentKey, text) {
    if (!text.trim()) return;
    saveThesis((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.key === componentKey ? {
        ...c,
        actions: [...c.actions, { id: uid(), text: text.trim(), status: "NOT_STARTED", done: false, createdAt: todayISO() }]
      } : c))
    }));
    notify("Action added to component");
  }

  function removeAction(componentKey, actionId) {
    const comp = thesis.components.find((c) => c.key === componentKey);
    const removed = comp?.actions.find((a) => a.id === actionId);
    saveThesis((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.key === componentKey ? {
        ...c,
        actions: c.actions.filter((a) => a.id !== actionId)
      } : c))
    }));
    if (removed) {
      notify("Action removed", () => {
        saveThesis((prev) => ({
          ...prev,
          components: prev.components.map((c) => (c.key === componentKey ? {
            ...c,
            actions: [...c.actions, removed]
          } : c))
        }));
      });
    }
  }

  function sendTaskToCalendar(action, componentName) {
    const task = {
      id: uid(),
      title: `Thesis: ${action.text}`,
      date: todayISO(),
      time: "09:00",
      duration: 60,
      type: "Task",
      category: "Thesis",
      priority: "High",
      notes: `From component: ${componentName}`,
      completed: false,
      recurrence: "none",
    };
    saveCalendar((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    notify("Task added to calendar");
  }

  // Pre-midterm phases (Phases 1, 2, 3)
  const preMidtermPhases = phaseInfo.phases.slice(0, 3);
  const currentPhaseIndex = phaseInfo.currentIndex;

  // Active / This week tasks
  const thisWeekTasks = useMemo(() => {
    const currentPhaseCompKeys = new Set(phaseInfo.currentPhase.componentKeys || []);
    return thesis.components
      .filter((c) => currentPhaseCompKeys.has(c.key))
      .flatMap((c) => (c.actions || []).map((a) => ({ ...a, componentName: c.name, componentKey: c.key })));
  }, [thesis.components, phaseInfo.currentPhase]);

  const todayTasks = thisWeekTasks.filter((a) => a.status !== "COMPLETED");

  return (
    <div>
      {/* 1. WHERE I AM */}
      <div className="pt-card" style={{ marginBottom: 20, borderColor: "var(--thesis)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="pt-eyebrow" style={{ color: "var(--thesis)" }}>Where I am right now</div>
            <h3 className="pt-h2" style={{ marginTop: 2 }}>{phaseInfo.currentPhase.title}</h3>
            <p className="pt-sub" style={{ maxWidth: 640 }}>{phaseInfo.currentPhase.subtitle}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Phase Timeline</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(phaseInfo.currentPhase.start)} – {fmtDate(phaseInfo.currentPhase.end)}</div>
            <div style={{ marginTop: 6 }}><StatusPill status="IN PROGRESS" /></div>
          </div>
        </div>
      </div>

      {/* 2. TODAY & THIS WEEK ACTION CENTER */}
      <div className="pt-grid2" style={{ marginBottom: 24 }}>
        {/* TODAY'S ACTIONS */}
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>🎯 Today's Thesis Actions</div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>
            Concrete things to complete today toward the midterm.
          </div>
          {todayTasks.length === 0 ? (
            <EmptyState text="No pending actions for today! You are all caught up on this phase." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <button
                    className="pt-btn-ghost pt-btn pt-tap"
                    style={{ border: "none", padding: 0 }}
                    onClick={() => cycleActionStatus(task.componentKey, task.id)}
                    title="Cycle: Not started -> In progress -> Completed"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 size={17} color="var(--ontrack)" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <Circle size={17} color="var(--atrisk)" style={{ fill: "var(--atrisk)", fillOpacity: 0.3 }} />
                    ) : (
                      <Circle size={17} color="var(--ink-faint)" />
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>
                      {task.text}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>{task.componentName}</div>
                  </div>
                  <button
                    className="pt-btn pt-btn-ghost pt-tap"
                    style={{ border: "none" }}
                    title="Send to calendar"
                    onClick={() => sendTaskToCalendar(task, task.componentName)}
                  >
                    <CalendarIcon size={14} color="var(--ink-faint)" />
                  </button>
                  <button className="pt-btn pt-btn-sm" onClick={() => cycleActionStatus(task.componentKey, task.id)}>
                    <StatusPill status={task.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* THIS WEEK OVERVIEW */}
        <div className="pt-card">
          <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>📅 This Week's Focus</div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>
            Components scheduled in the current phase ({thisWeekTasks.filter((t) => t.status === "COMPLETED").length}/{thisWeekTasks.length} tasks done).
          </div>
          <ProgressBar
            pct={thisWeekTasks.length > 0 ? (thisWeekTasks.filter((t) => t.status === "COMPLETED").length / thisWeekTasks.length) * 100 : 0}
            color="var(--thesis)"
          />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {phaseInfo.currentPhase.componentKeys.map((key) => {
              const comp = thesis.components.find((c) => c.key === key);
              if (!comp) return null;
              const doneCount = comp.actions.filter((a) => a.status === "COMPLETED" || a.done).length;
              return (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "4px 0" }}>
                  <span style={{ fontWeight: 600 }}>{comp.number}. {comp.name}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{doneCount} / {comp.actions.length} done</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. CHRONOLOGICAL ROADMAP TOWARD MIDTERM */}
      <div className="pt-card" style={{ marginBottom: 24 }}>
        <div className="pt-h2" style={{ fontSize: 16, marginBottom: 4 }}>Structured Roadmap to Midterm (Early October 2026)</div>
        <p className="pt-sub" style={{ marginBottom: 18 }}>
          Generated schedule from the October 1 deadline backwards. Click on any phase to review components and actionable tasks.
        </p>

        <div className="pt-timeline">
          {preMidtermPhases.map((phase, pIdx) => {
            const phaseComps = thesis.components.filter((c) => phase.componentKeys.includes(c.key));
            const totalActions = phaseComps.flatMap((c) => c.actions);
            const doneActions = totalActions.filter((a) => a.status === "COMPLETED" || a.done).length;
            const phasePct = totalActions.length > 0 ? Math.round((doneActions / totalActions.length) * 100) : 0;
            const isCurrent = pIdx === currentPhaseIndex;

            return (
              <div className="pt-tl-row" key={phase.key}>
                <div className="pt-tl-rail">
                  <div className={`pt-tl-dot ${pIdx <= currentPhaseIndex ? "done" : ""}`} />
                  {pIdx < preMidtermPhases.length - 1 && <div className="pt-tl-line" />}
                </div>
                <div className="pt-tl-content">
                  <div className="pt-card pt-card-tight" style={{ borderColor: isCurrent ? "var(--thesis)" : "var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{phase.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{fmtDate(phase.start)} – {fmtDate(phase.end)}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 4 }}>{phase.subtitle}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{phasePct}%</span>
                        {isCurrent ? <StatusPill status="IN PROGRESS" /> : (phasePct === 100 ? <StatusPill status="COMPLETED" /> : <StatusPill status="PLANNED" />)}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <ProgressBar pct={phasePct} color="var(--thesis)" />
                    </div>

                    {/* Components in this phase */}
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      {phaseComps.map((comp) => (
                        <ComponentActionCard
                          key={comp.key}
                          component={comp}
                          onToggle={(actionId) => cycleActionStatus(comp.key, actionId)}
                          onAdd={(text) => addActionToComponent(comp.key, text)}
                          onRemove={(actionId) => removeAction(comp.key, actionId)}
                          onSendToCalendar={(action) => sendTaskToCalendar(action, comp.name)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComponentActionCard({ component, onToggle, onAdd, onRemove, onSendToCalendar }) {
  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const done = component.actions.filter((a) => a.status === "COMPLETED" || a.done).length;
  const pct = component.actions.length > 0 ? (done / component.actions.length) * 100 : 0;

  return (
    <div className="pt-card pt-card-tight" style={{ background: "var(--paper)" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="pt-chip" style={{ fontWeight: 700 }}>{component.number}</span>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{component.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{done} / {component.actions.length}</span>
          <ChevronDown size={14} color="var(--ink-faint)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
        </div>
      </div>

      <div style={{ marginTop: 6 }}>
        <ProgressBar pct={pct} color="var(--thesis)" />
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          {component.actions.length === 0 ? (
            <EmptyState text="No specific actions added yet." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {component.actions.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <button
                    className="pt-btn-ghost pt-btn pt-tap"
                    style={{ border: "none", padding: 0 }}
                    onClick={() => onToggle(a.id)}
                    title="Click to cycle status"
                  >
                    {a.status === "COMPLETED" ? (
                      <CheckCircle2 size={16} color="var(--ontrack)" />
                    ) : a.status === "IN_PROGRESS" ? (
                      <Circle size={16} color="var(--atrisk)" style={{ fill: "var(--atrisk)", fillOpacity: 0.3 }} />
                    ) : (
                      <Circle size={16} color="var(--ink-faint)" />
                    )}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, textDecoration: a.status === "COMPLETED" ? "line-through" : "none", color: a.status === "COMPLETED" ? "var(--ink-faint)" : "var(--ink)" }}>
                    {a.text}
                  </span>
                  {onSendToCalendar && (
                    <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} title="Add to calendar" onClick={() => onSendToCalendar(a)}>
                      <CalendarIcon size={13} color="var(--ink-faint)" />
                    </button>
                  )}
                  <button className="pt-btn pt-btn-sm" style={{ padding: "3px 8px" }} onClick={() => onToggle(a.id)}>
                    <StatusPill status={a.status || "NOT_STARTED"} />
                  </button>
                  <button className="pt-btn-ghost pt-btn pt-btn-danger pt-tap" onClick={() => onRemove(a.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input
              className="pt-input"
              style={{ fontSize: 12.5, padding: "6px 8px" }}
              placeholder="Add concrete action (e.g. Read 2 papers, Extract key concepts)…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newText.trim()) { onAdd(newText); setNewText(""); } }}
            />
            <button className="pt-btn pt-btn-sm pt-btn-primary" disabled={!newText.trim()} onClick={() => { onAdd(newText); setNewText(""); }}>
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   THESIS 16 COMPONENTS ACCORDION TAB
   ------------------------------------------------------------------------- */
function ThesisComponentsListTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [selectedKey, setSelectedKey] = useState("foundation");
  const meta = THESIS_COMPONENTS_META.find((s) => s.key === selectedKey) || THESIS_COMPONENTS_META[0];
  const section = thesis.sections[selectedKey] || { blocks: [] };

  function setBlocks(blocks) {
    saveThesis((prev) => ({
      ...prev,
      sections: { ...prev.sections, [selectedKey]: { ...(prev.sections[selectedKey] || {}), blocks } }
    }));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {THESIS_COMPONENTS_META.map((comp) => (
          <button
            key={comp.key}
            className={`pt-btn pt-btn-sm ${selectedKey === comp.key ? "pt-btn-primary" : ""}`}
            onClick={() => setSelectedKey(comp.key)}
          >
            {comp.number}. {comp.short}
          </button>
        ))}
      </div>

      <div className="pt-card">
        <div className="pt-eyebrow">Component {meta.number}</div>
        <h2 className="pt-h2" style={{ marginBottom: 4 }}>{meta.title}</h2>
        <p className="pt-sub" style={{ marginBottom: 18 }}>{meta.description}</p>

        {selectedKey === "researchQuestions" ? (
          <ResearchQuestionsEditor ctx={ctx} blocks={section.blocks} onChange={setBlocks} />
        ) : (
          <SectionEditor blocks={section.blocks} onChange={setBlocks} notify={notify} />
        )}
      </div>
    </div>
  );
}

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
      {blocks.length === 0 ? <EmptyState text="Nothing written yet. Add a block to start drafting this section." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {blocks.map((b) => (
            <div key={b.id} className="pt-card pt-card-tight">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{b.label || "Untitled Draft"}</div>
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
          <Field label="Label (e.g. 'Draft v1', 'Core arguments')"><input className="pt-input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
          <Field label="Text content"><textarea className="pt-textarea" style={{ minHeight: 160 }} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></Field>
          {!canSave && <div className="pt-field-error">Text is required.</div>}
          <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => { upsert(draft); setShowForm(false); }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
   FRENCH SCREEN: MINI-LESSONS & HISTORY
   ========================================================================= */
function FrenchScreen({ ctx }) {
  const [sub, setSub] = useState("today");
  return (
    <div>
      <div className="pt-eyebrow">Priority 2 · Language Goal</div>
      <h1 className="pt-h1">French A2</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>Daily curriculum structured toward A2 by November 2026.</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          ["today", "Today's Mini-Lesson"],
          ["history", "Lesson History"],
          ["curriculum", "14 Modules Curriculum"],
          ["vocab", "Vocabulary Bank"],
          ["progress", "Progress & Metrics"],
          ["certification", "Certification"],
        ].map(([k, l]) => (
          <button
            key={k}
            className="pt-btn pt-btn-sm"
            style={{
              background: sub === k ? "var(--french-soft)" : undefined,
              color: sub === k ? "var(--french)" : undefined,
              borderColor: sub === k ? "var(--french)" : undefined
            }}
            onClick={() => setSub(k)}
          >
            {l}
          </button>
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
  const [minutes, setMinutes] = useState(lesson?.minutesSpent || 60);

  function markComplete() {
    const prevFrench = french;
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const wasCompleted = prev.french.lessons[idx].status === "COMPLETED";
      const nextLessons = [...prev.french.lessons];
      nextLessons[idx] = { ...nextLessons[idx], status: "COMPLETED", minutesSpent: Number(minutes) };
      const streak = wasCompleted ? prev.french.streak : (prev.french.streak || 0) + 1;
      return {
        ...prev,
        french: {
          ...prev.french,
          lessons: nextLessons,
          streak,
          daysStudied: (prev.french.daysStudied || 0) + (wasCompleted ? 0 : 1),
          totalMinutes: (prev.french.totalMinutes || 0) + Number(minutes)
        }
      };
    });
    addXP(25, "French mini-lesson completed", () => saveGoals((prev) => ({ ...prev, french: prevFrench })));
  }

  function sendLessonToCalendar() {
    const task = {
      id: uid(),
      title: `French: Day ${lesson.dayNumber} — ${lesson.title}`,
      date: todayISO(),
      time: "08:30",
      duration: Number(minutes) || 60,
      type: "Task",
      category: "French",
      priority: "Medium",
      notes: `Module: ${lesson.moduleTitle}`,
      completed: false,
      recurrence: "none",
    };
    saveCalendar((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    notify("Lesson added to calendar");
  }

  if (!lesson) return <EmptyState text="Curriculum complete." />;

  return (
    <div>
      <div className="pt-card">
        <FrenchMiniLessonView lesson={lesson} />

        <div className="pt-grid2" style={{ marginTop: 24, alignItems: "end" }}>
          <Field label="Minutes completed today">
            <input type="number" className="pt-input" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
          <button className="pt-btn pt-btn-primary" onClick={markComplete}>
            <Check size={14} /> Mark mini-lesson completed (+25 XP)
          </button>
        </div>
        <button className="pt-btn pt-btn-ghost pt-tap" style={{ marginTop: 10 }} onClick={sendLessonToCalendar}>
          <CalendarIcon size={14} /> Add to calendar
        </button>
      </div>
    </div>
  );
}

function FrenchMiniLessonView({ lesson }) {
  const grammarPoint = lesson.grammarPoint || {
    topic: (lesson.grammar && lesson.grammar[0]) || "Grammar of the Day",
    summary: "Study and apply the daily grammatical pattern.",
    rules: lesson.grammar || []
  };

  const vocabulary = lesson.vocabulary || [];
  const examples = lesson.examples || [];
  const guide = lesson.selfStudyGuide || {};

  return (
    <div>
      <div className="pt-eyebrow">
        Day {lesson.dayNumber} · {lesson.moduleTitle} · {lesson.level || "A1"}
      </div>
      <h2 className="pt-h2" style={{ marginTop: 4, marginBottom: 18 }}>{lesson.title}</h2>

      {/* 1. GRAMMAR OF THE DAY */}
      <div className="pt-card pt-card-tight" style={{ marginBottom: 18, background: "var(--french-soft)", borderColor: "var(--french)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <BookOpen size={16} color="var(--french)" />
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--french)" }}>
            GRAMMAR OF THE DAY: {grammarPoint.topic}
          </div>
        </div>
        {grammarPoint.summary && (
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5, marginBottom: 8 }}>
            {grammarPoint.summary}
          </div>
        )}
        {grammarPoint.rules && grammarPoint.rules.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
            {grammarPoint.rules.map((rule, idx) => <li key={idx}>{rule}</li>)}
          </ul>
        )}
      </div>

      {/* 2. VOCABULARY OF THE DAY (WITH AUDIO PRONUNCIATION) */}
      <div style={{ marginBottom: 20 }}>
        <div className="pt-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <MessageSquare size={14} /> VOCABULARY OF THE DAY ({vocabulary.length} words with pronunciation)
        </div>
        <div className="pt-grid3">
          {vocabulary.map((v, i) => (
            <div key={i} className="pt-card pt-card-tight" style={{ background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{v.fr}</span>
                <FrenchSpeakButton text={v.fr} size={15} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{v.en}</div>
              {v.exampleFr && (
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6, fontStyle: "italic", lineHeight: 1.3 }}>
                  "{v.exampleFr}"
                  {v.exampleEn && <div style={{ fontStyle: "normal", color: "var(--ink-faint)", marginTop: 1 }}>{v.exampleEn}</div>}
                </div>
              )}
              {v.category && <span className="pt-chip" style={{ marginTop: 6 }}>{v.category}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 3. PRACTICAL EXAMPLES & USAGE WITH AUDIO */}
      {examples.length > 0 && (
        <div className="pt-card pt-card-tight" style={{ marginBottom: 18 }}>
          <div className="pt-label" style={{ marginBottom: 8 }}>PRACTICAL EXAMPLES & USAGE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {examples.map((ex, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{ex.fr}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{ex.en}</div>
                </div>
                <FrenchSpeakButton text={ex.fr} size={14} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SELF-DIRECTED STUDY & PRACTICE GUIDANCE */}
      {guide && (
        <div className="pt-card" style={{ background: "var(--paper-raised)" }}>
          <div className="pt-label" style={{ marginBottom: 12 }}>SELF-DIRECTED PRACTICE & STUDY GUIDANCE</div>
          <div className="pt-grid2">
            {guide.listening && (
              <div className="pt-card pt-card-tight">
                <div className="pt-label" style={{ marginBottom: 4 }}>🎧 Listening & Pronunciation</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>
                  {guide.listening}
                </div>
                {vocabulary[0] && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <FrenchSpeakButton text={vocabulary.map((v) => v.fr).slice(0, 4).join(". ")} size={16} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--french)" }}>Play sample word audio</span>
                  </div>
                )}
              </div>
            )}
            {guide.speaking && (
              <div className="pt-card pt-card-tight">
                <div className="pt-label" style={{ marginBottom: 4 }}>🗣️ Speaking Out Loud</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>
                  {guide.speaking}
                </div>
              </div>
            )}
            {guide.reading && (
              <div className="pt-card pt-card-tight">
                <div className="pt-label" style={{ marginBottom: 4 }}>📖 Reading Practice</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>
                  {guide.reading}
                </div>
              </div>
            )}
            {guide.writing && (
              <div className="pt-card pt-card-tight">
                <div className="pt-label" style={{ marginBottom: 4 }}>✍️ Notebook Writing Exercise</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>
                  {guide.writing}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
      list = list.filter((l) =>
        (l.title || "").toLowerCase().includes(q) ||
        (l.moduleTitle || "").toLowerCase().includes(q) ||
        (l.vocabulary || []).some((v) => v.fr.toLowerCase().includes(q) || v.en.toLowerCase().includes(q))
      );
    }
    return list;
  }, [french.lessons, search, moduleFilter, statusFilter]);

  const selectedIndex = selectedId ? french.lessons.findIndex((l) => l.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? french.lessons[selectedIndex] : null;

  function toggleLessonComplete(lesson) {
    const willComplete = lesson.status !== "COMPLETED";
    saveGoals((prev) => {
      const idx = prev.french.lessons.findIndex((l) => l.id === lesson.id);
      const nextLessons = [...prev.french.lessons];
      nextLessons[idx] = { ...nextLessons[idx], status: willComplete ? "COMPLETED" : "PENDING" };
      return {
        ...prev,
        french: {
          ...prev.french,
          lessons: nextLessons,
          daysStudied: Math.max(0, (prev.french.daysStudied || 0) + (willComplete ? 1 : -1)),
        }
      };
    });
    notify(willComplete ? "Lesson marked completed" : "Lesson marked incomplete");
  }

  if (selected) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <button className="pt-btn pt-btn-sm" onClick={() => setSelectedId(null)}>
            <ChevronLeft size={13} /> Back to lesson history
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex <= 0} onClick={() => setSelectedId(french.lessons[selectedIndex - 1].id)}>
              <ChevronLeft size={13} /> Yesterday's / Previous lesson
            </button>
            <button className="pt-btn pt-btn-sm" disabled={selectedIndex >= french.lessons.length - 1} onClick={() => setSelectedId(french.lessons[selectedIndex + 1].id)}>
              Next lesson <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="pt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{fmtDate(selected.date)}</span>
            <StatusPill status={selected.status} />
          </div>
          <FrenchMiniLessonView lesson={selected} />
          <div style={{ marginTop: 20 }}>
            <button className="pt-btn pt-btn-primary" onClick={() => toggleLessonComplete(selected)}>
              <Check size={14} /> {selected.status === "COMPLETED" ? "Mark as not completed" : "Mark lesson completed"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input
            className="pt-input"
            style={{ paddingLeft: 30 }}
            placeholder="Search lessons, vocabulary, grammar rules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="pt-select" style={{ width: 200 }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          <option value="ALL">All 14 Modules</option>
          {french.modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <select className="pt-select" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Not completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No lessons match your search or filters." />
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr><th>Day</th><th>Mini-Lesson Title</th><th>Module</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(l.id)}>
                  <td style={{ fontWeight: 700 }}>Day {l.dayNumber}</td>
                  <td style={{ fontWeight: 600 }}>{l.title}</td>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {french.modules.map((m) => {
        const modLessons = french.lessons.filter((l) => l.moduleId === m.id);
        const done = modLessons.filter((l) => l.status === "COMPLETED").length;
        const pct = modLessons.length > 0 ? (done / modLessons.length) * 100 : 0;
        return (
          <div key={m.id} className="pt-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="pt-chip">{m.level}</span>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{done} / {modLessons.length} mini-lessons</div>
            </div>
            <div style={{ marginTop: 8 }}><ProgressBar pct={pct} color="var(--french)" /></div>
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
    saveGoals((prev) => ({
      ...prev,
      french: {
        ...prev.french,
        vocabBank: [{ id: uid(), ...form, status: "NEW", addedDate: todayISO(), lastReviewed: null }, ...(prev.french.vocabBank || [])]
      }
    }));
    setForm({ fr: "", en: "", pronunciation: "", example: "", category: "" });
    notify("Word added to French vocabulary bank");
  }

  function remove(id) {
    saveGoals((prev) => ({
      ...prev,
      french: { ...prev.french, vocabBank: prev.french.vocabBank.filter((v) => v.id !== id) }
    }));
    notify("Word removed");
  }

  return (
    <div>
      <div className="pt-card" style={{ marginBottom: 16 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Add Vocabulary to Bank</div>
        <div className="pt-grid3">
          <Field label="French word"><input className="pt-input" value={form.fr} onChange={(e) => setForm({ ...form, fr: e.target.value })} /></Field>
          <Field label="English translation"><input className="pt-input" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} /></Field>
          <Field label="Category / Theme"><input className="pt-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        </div>
        <Field label="Example sentence in French"><input className="pt-input" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} /></Field>
        <button className="pt-btn pt-btn-primary" disabled={!form.fr.trim()} onClick={add}>
          <Plus size={14} /> Add word
        </button>
      </div>

      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr><th>French</th><th>English</th><th>Category</th><th>Example</th><th>Audio</th><th></th></tr>
          </thead>
          <tbody>
            {(french.vocabBank || []).map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700 }}>{v.fr}</td>
                <td>{v.en}</td>
                <td><span className="pt-chip">{v.category || "General"}</span></td>
                <td style={{ fontStyle: "italic", fontSize: 12 }}>{v.example || "—"}</td>
                <td><FrenchSpeakButton text={v.fr} size={14} /></td>
                <td><button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(v.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FrenchProgress({ ctx }) {
  const { goals } = ctx;
  const french = goals.french;
  const total = french.lessons.length;
  const completed = french.lessons.filter((l) => l.status === "COMPLETED").length;
  const level = completed < total * 0.2 ? "A0" : completed < total * 0.6 ? "A1" : "A2";

  return (
    <div>
      <div className="pt-grid4" style={{ marginBottom: 20 }}>
        <MiniStat label="Current Level" value={level} />
        <MiniStat label="Completed Mini-Lessons" value={`${completed} / ${total}`} />
        <MiniStat label="Days Studied" value={french.daysStudied || 0} />
        <MiniStat label="Current Streak" value={`${french.streak || 0} days`} />
      </div>
    </div>
  );
}

function FrenchCertification({ ctx }) {
  const { goals, saveGoals } = ctx;
  const cert = goals.french.certification || blankFrenchCertification();

  function patch(p) {
    saveGoals((prev) => ({
      ...prev,
      french: { ...prev.french, certification: { ...(prev.french.certification || blankFrenchCertification()), ...p } }
    }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>DELF / TCF French Certification</div>
      <p className="pt-sub" style={{ marginBottom: 14 }}>Targeting A2 diploma by November 2026.</p>
      <div className="pt-grid3">
        <Field label="Registration date"><input type="date" className="pt-input" value={cert.registrationDate || ""} onChange={(e) => patch({ registrationDate: e.target.value })} /></Field>
        <Field label="Exam date"><input type="date" className="pt-input" value={cert.examDate || ""} onChange={(e) => patch({ examDate: e.target.value })} /></Field>
        <Field label="Results date"><input type="date" className="pt-input" value={cert.resultsDate || ""} onChange={(e) => patch({ resultsDate: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/* =========================================================================
   CHINESE SCREEN: CONTROLLED WORKLOAD & CARD LIBRARY
   ========================================================================= */
function ChineseScreen({ ctx }) {
  const [sub, setSub] = useState("today");
  return (
    <div>
      <div className="pt-eyebrow">Priority 3 · Language Goal</div>
      <h1 className="pt-h1">Chinese HSK 3</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>
        Exam timeline: Registration in December 2026 · Exam in January 2027 (TBC).
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          ["today", "Today's Review (Controlled Load)"],
          ["library", "Card Library (All Words)"],
          ["progress", "Progress & Metrics"],
          ["exam", "HSK 3 Exam & Registration"],
        ].map(([k, l]) => (
          <button
            key={k}
            className="pt-btn pt-btn-sm"
            style={{
              background: sub === k ? "var(--chinese-soft)" : undefined,
              color: sub === k ? "var(--chinese)" : undefined,
              borderColor: sub === k ? "var(--chinese)" : undefined
            }}
            onClick={() => setSub(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {sub === "today" && <ChineseToday ctx={ctx} />}
      {sub === "library" && <ChineseLibrary ctx={ctx} />}
      {sub === "progress" && <ChineseProgress ctx={ctx} />}
      {sub === "exam" && <ChineseExam ctx={ctx} />}
    </div>
  );
}

function ChineseToday({ ctx }) {
  const { goals, saveGoals, settings, addXP, notify, saveCalendar } = ctx;
  const chinese = goals.chinese;
  const [revealedId, setRevealedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const session = useMemo(
    () => getDailyChineseSessionCards(chinese, settings, todayISO()),
    [chinese.flashcards, settings.dailyChineseWords, settings.dailyChineseMaxReviews]
  );

  const { newCards, dueReviews, allSessionCards, maxNew, maxReviews } = session;

  function reviewCard(card, status) {
    const isFirstToday = chinese.lastStudyDate !== todayISO();
    const days = CHINESE_REVIEW_INTERVALS[status] || 2;

    saveGoals((prev) => {
      const idx = prev.chinese.flashcards.findIndex((c) => c.id === card.id);
      const nextCards = [...prev.chinese.flashcards];
      nextCards[idx] = {
        ...nextCards[idx],
        status,
        lastReviewedDate: todayISO(),
        nextReviewDate: addDays(todayISO(), days),
      };
      return {
        ...prev,
        chinese: {
          ...prev.chinese,
          flashcards: nextCards,
          streak: isFirstToday ? (prev.chinese.streak || 0) + 1 : prev.chinese.streak,
          daysStudied: isFirstToday ? (prev.chinese.daysStudied || 0) + 1 : prev.chinese.daysStudied,
          lastStudyDate: todayISO(),
        }
      };
    });

    setRevealedId(null);
    notify(`Marked ${CHINESE_STATUS_LABELS[status]}`);
    if (isFirstToday) addXP(10, "Chinese flashcards studied");
  }

  return (
    <div>
      {/* Controlled Daily Workload Summary */}
      <div className="pt-card" style={{ marginBottom: 20, borderColor: "var(--chinese)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="pt-eyebrow" style={{ color: "var(--chinese)" }}>Controlled Daily Workload</div>
            <div className="pt-h2" style={{ fontSize: 16, marginTop: 2 }}>
              Today's Session: {newCards.length} New Words + {dueReviews.length} Due Reviews
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              Cap: {maxNew} new/day + max {maxReviews} reviews/day (avoids card explosion). Configurable in Settings.
            </div>
          </div>
          <button className="pt-btn pt-btn-sm" onClick={() => setShowAddForm(true)}>
            <Plus size={13} /> Add custom word
          </button>
        </div>

        {allSessionCards.length === 0 ? (
          <EmptyState text="All caught up for today! No flashcards due right now." />
        ) : (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {allSessionCards.map((card) => {
              const isRevealed = revealedId === card.id;
              return (
                <div key={card.id} className="pt-card pt-card-tight" style={{ background: "var(--paper)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{card.hanzi}</span>
                      <ChineseSpeakButton text={card.hanzi} size={16} />
                      <span className="pt-chip" style={{ fontSize: 11 }}>{card.status === "NEW" ? "New Card" : "Review"}</span>
                    </div>
                    {!isRevealed && (
                      <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => setRevealedId(card.id)}>
                        Show answer
                      </button>
                    )}
                  </div>

                  {isRevealed && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                        <strong style={{ color: "var(--ink)" }}>{card.pinyin}</strong> — {card.meaning}
                      </div>
                      {card.exampleSentence && (
                        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.4 }}>
                          {card.exampleSentence}<br />{card.exampleTranslation}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                        <button className="pt-btn pt-btn-sm pt-btn-danger" onClick={() => reviewCard(card, "DIFFICULT")}>
                          Difficult (Review soon)
                        </button>
                        <button className="pt-btn pt-btn-sm" onClick={() => reviewCard(card, "NEED_REVIEW")}>
                          Need Review
                        </button>
                        <button className="pt-btn pt-btn-sm" onClick={() => reviewCard(card, "LEARNED")}>
                          Learned
                        </button>
                        <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={() => reviewCard(card, "MASTERED")}>
                          Mastered
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddForm && (
        <ChineseCardForm
          item={blankChineseFlashcard()}
          onClose={() => setShowAddForm(false)}
          onSave={(c) => {
            saveGoals((prev) => ({
              ...prev,
              chinese: { ...prev.chinese, flashcards: [{ ...c, isCustom: true }, ...prev.chinese.flashcards] }
            }));
            notify("Word added");
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

function ChineseLibrary({ ctx }) {
  const { goals, saveGoals, notify } = ctx;
  const chinese = goals.chinese;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = useMemo(() => {
    let list = chinese.flashcards || [];
    if (statusFilter !== "ALL") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        (c.hanzi || "").toLowerCase().includes(q) ||
        (c.pinyin || "").toLowerCase().includes(q) ||
        (c.meaning || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [chinese.flashcards, search, statusFilter]);

  function remove(id) {
    saveGoals((prev) => ({
      ...prev,
      chinese: { ...prev.chinese, flashcards: prev.chinese.flashcards.filter((c) => c.id !== id) }
    }));
    notify("Word removed");
  }

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input
            className="pt-input"
            style={{ paddingLeft: 30 }}
            placeholder="Search hanzi, pinyin, meaning…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="pt-select" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {Object.keys(CHINESE_STATUS_LABELS).map((s) => <option key={s} value={s}>{CHINESE_STATUS_LABELS[s]}</option>)}
        </select>
        <button className="pt-btn pt-btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={14} /> Add word
        </button>
      </div>

      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr><th>Hanzi</th><th>Pinyin</th><th>Meaning</th><th>Audio</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontSize: 18, fontWeight: 700 }}>{c.hanzi}</td>
                <td>{c.pinyin}</td>
                <td>{c.meaning}</td>
                <td><ChineseSpeakButton text={c.hanzi} size={14} /></td>
                <td><StatusPill status={c.status} /></td>
                <td><button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(c.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <ChineseCardForm
          item={blankChineseFlashcard()}
          onClose={() => setShowAddForm(false)}
          onSave={(c) => {
            saveGoals((prev) => ({
              ...prev,
              chinese: { ...prev.chinese, flashcards: [{ ...c, isCustom: true }, ...prev.chinese.flashcards] }
            }));
            notify("Word added");
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

function ChineseCardForm({ item, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...blankChineseFlashcard(), ...item });
  const canSave = draft.hanzi.trim().length > 0;
  return (
    <Modal title={draft.id ? "Edit word" : "Add Chinese word"} onClose={onClose}>
      <Field label="Chinese characters (Hanzi)"><input className="pt-input" value={draft.hanzi} onChange={(e) => setDraft({ ...draft, hanzi: e.target.value })} /></Field>
      <div className="pt-grid2">
        <Field label="Pinyin"><input className="pt-input" value={draft.pinyin} onChange={(e) => setDraft({ ...draft, pinyin: e.target.value })} /></Field>
        <Field label="English meaning"><input className="pt-input" value={draft.meaning} onChange={(e) => setDraft({ ...draft, meaning: e.target.value })} /></Field>
      </div>
      <Field label="Example sentence (optional)"><input className="pt-input" value={draft.exampleSentence} onChange={(e) => setDraft({ ...draft, exampleSentence: e.target.value })} /></Field>
      <Field label="Example translation (optional)"><input className="pt-input" value={draft.exampleTranslation} onChange={(e) => setDraft({ ...draft, exampleTranslation: e.target.value })} /></Field>
      {!canSave && <div className="pt-field-error">Hanzi is required.</div>}
      <button className="pt-btn pt-btn-primary" disabled={!canSave} onClick={() => onSave({ ...draft, id: draft.id || uid() })}>Save</button>
    </Modal>
  );
}

function ChineseProgress({ ctx }) {
  const { goals } = ctx;
  const chinese = goals.chinese;
  const mastered = (chinese.flashcards || []).filter((c) => c.status === "MASTERED").length;
  const learned = (chinese.flashcards || []).filter((c) => c.status === "LEARNED").length;

  return (
    <div>
      <div className="pt-grid4" style={{ marginBottom: 20 }}>
        <MiniStat label="Words Mastered" value={mastered} />
        <MiniStat label="Words Learned" value={learned} />
        <MiniStat label="Total in Pool" value={(chinese.flashcards || []).length} />
        <MiniStat label="Current Streak" value={`${chinese.streak || 0} days`} />
      </div>
    </div>
  );
}

function ChineseExam({ ctx }) {
  const { goals, saveGoals, saveCalendar, notify } = ctx;
  const exam = goals.chinese.exam || blankChineseExam();

  function patch(p) {
    saveGoals((prev) => ({
      ...prev,
      chinese: { ...prev.chinese, exam: { ...(prev.chinese.exam || blankChineseExam()), ...p } }
    }));
  }

  function addRegistrationReminderToCalendar() {
    const task = {
      id: uid(),
      title: "Chinese: HSK 3 Registration Window Opens",
      date: exam.registrationDate || "2026-12-01",
      time: "09:00",
      duration: 30,
      type: "Deadline",
      category: "Chinese",
      priority: "High",
      notes: "Register for HSK 3 exam on chinesetest.cn",
      completed: false,
      recurrence: "none",
    };
    saveCalendar((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    notify("Registration reminder added to calendar");
  }

  return (
    <div>
      {/* Registration Reminder Alert */}
      <div className="pt-card" style={{ marginBottom: 18, borderColor: "var(--chinese)", background: "var(--chinese-soft)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--chinese)" }}>
              📅 HSK 3 REGISTRATION — DECEMBER 2026
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>
              Official registration opens in December 2026. Target exam date in January 2027 (TBC).
            </div>
          </div>
          <button className="pt-btn pt-btn-sm pt-btn-primary" onClick={addRegistrationReminderToCalendar}>
            Add calendar reminder
          </button>
        </div>
      </div>

      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>HSK 3 Timeline & Official Dates</div>
        <p className="pt-sub" style={{ marginBottom: 14 }}>
          Dates will be confirmed once official schedules on chinesetest.cn are published.
        </p>

        <div className="pt-grid3">
          <Field label="Registration opening (Dec 2026)">
            <input type="date" className="pt-input" value={exam.registrationDate || "2026-12-01"} onChange={(e) => patch({ registrationDate: e.target.value })} />
          </Field>
          <Field label="Exam date (Jan 2027 TBC)">
            <input type="date" className="pt-input" value={exam.examDate || "2027-01-15"} onChange={(e) => patch({ examDate: e.target.value })} />
          </Field>
          <Field label="Results date (optional)">
            <input type="date" className="pt-input" value={exam.resultsDate || ""} onChange={(e) => patch({ resultsDate: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PORTFOLIO SCREEN (SIMPLIFIED)
   ========================================================================= */
function PortfolioScreen({ ctx }) {
  const { goals, saveGoals, settings, notify, addXP } = ctx;
  const project = (goals.portfolio && goals.portfolio.project) || { title: "Urbanism Portfolio Project", status: "NOT_STARTED" };
  const status = project.status || "NOT_STARTED";
  const daysLeft = Math.max(0, daysBetween(todayISO(), settings.portfolioTarget));

  function setProjectStatus(newStatus) {
    saveGoals((prev) => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        project: {
          ...(prev.portfolio?.project || {}),
          status: newStatus,
          completedAt: newStatus === "COMPLETED" ? todayISO() : null,
        }
      }
    }));
    if (newStatus === "COMPLETED") addXP(50, "Urbanism Portfolio Project completed");
    notify(`Portfolio marked ${newStatus.replace("_", " ")}`);
  }

  function patchProject(p) {
    saveGoals((prev) => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        project: { ...(prev.portfolio?.project || {}), ...p }
      }
    }));
  }

  return (
    <div>
      <div className="pt-eyebrow">Priority 4 · Secondary Milestone</div>
      <h1 className="pt-h1">Urbanism Portfolio Project</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>
        Working deadline: October 31, 2026 ({daysLeft} days remaining). Kept as a simple, focused milestone.
      </p>

      {/* Main Single Status Card */}
      <div className="pt-card" style={{ marginBottom: 20, borderColor: status === "COMPLETED" ? "var(--ontrack)" : "var(--urbanism)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--urbanism)" }}>Current State</div>
            <div className="pt-h2" style={{ marginTop: 2, fontSize: 20 }}>
              {status === "COMPLETED" ? "✓ Done — Urbanism Portfolio Project Completed" : (status === "IN_PROGRESS" ? "In Progress — Working on Urbanism Project" : "Urbanism project needed")}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
              Target deadline: {fmtDate(settings.portfolioTarget)}
            </div>
          </div>
          <StatusPill status={status} />
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`pt-btn ${status === "NOT_STARTED" ? "pt-btn-primary" : ""}`}
            onClick={() => setProjectStatus("NOT_STARTED")}
          >
            Not started
          </button>
          <button
            className={`pt-btn ${status === "IN_PROGRESS" ? "pt-btn-primary" : ""}`}
            onClick={() => setProjectStatus("IN_PROGRESS")}
          >
            In progress
          </button>
          <button
            className={`pt-btn ${status === "COMPLETED" ? "pt-btn-primary" : ""}`}
            style={{ background: status === "COMPLETED" ? "var(--ontrack)" : undefined, color: status === "COMPLETED" ? "#fff" : undefined }}
            onClick={() => setProjectStatus("COMPLETED")}
          >
            <Check size={14} /> ✓ DONE
          </button>
        </div>
      </div>

      {/* Project Notes & Links */}
      <div className="pt-card">
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Project Notes & Reference</div>
        <Field label="Project title">
          <input
            className="pt-input"
            value={project.title || "Urbanism Portfolio Project"}
            onChange={(e) => patchProject({ title: e.target.value })}
          />
        </Field>
        <Field label="Portfolio project notes & description">
          <textarea
            className="pt-textarea"
            placeholder="Key concepts, site data, or ideas for the portfolio case study…"
            value={project.notes || ""}
            onChange={(e) => patchProject({ notes: e.target.value })}
          />
        </Field>
        <Field label="Project link (Figma / Drive / Website)">
          <input
            className="pt-input"
            placeholder="https://…"
            value={project.link || ""}
            onChange={(e) => patchProject({ link: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

/* =========================================================================
   CALENDAR SCREEN
   ========================================================================= */
const TASK_CATEGORIES = ["Thesis", "French", "Chinese", "Portfolio", "Personal", "Other"];
const CALENDAR_ENTRY_TYPES = ["Task", "Appointment", "Deadline", "Reminder"];

function CalendarScreen({ ctx }) {
  const { calendar, saveCalendar, addXP, notify } = ctx;
  const [view, setView] = useState("agenda");
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = parseISO(todayISO());
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });

  function blank() {
    return {
      id: null, title: "", date: todayISO(), time: "", duration: 30,
      type: "Task", category: "Thesis", priority: "Medium", notes: "", completed: false, recurrence: "none"
    };
  }

  function upsert(v) {
    const isNew = !calendar.tasks.some((t) => t.id === v.id);
    saveCalendar((prev) => ({
      ...prev,
      tasks: prev.tasks.some((t) => t.id === v.id)
        ? prev.tasks.map((t) => (t.id === v.id ? v : t))
        : [{ ...v, id: v.id || uid() }, ...prev.tasks]
    }));
    notify(isNew ? "Task added" : "Task updated");
  }

  function remove(id) {
    saveCalendar((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    notify("Task removed");
  }

  function toggleComplete(t) {
    const willComplete = !t.completed;
    saveCalendar((prev) => ({
      ...prev,
      tasks: prev.tasks.map((x) => (x.id === t.id ? { ...x, completed: willComplete } : x))
    }));
    if (willComplete) addXP(10, "Task completed");
    else notify("Task marked incomplete");
  }

  const sorted = [...calendar.tasks].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));

  return (
    <div>
      <div className="pt-eyebrow">Calendar & Schedules</div>
      <h1 className="pt-h1">Everyday Planning</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>
        Integrated schedules for Thesis, French lessons, Chinese study, and deadlines.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0" }}>
        <div className="pt-tabs" style={{ marginBottom: 0, border: "none" }}>
          {["month", "agenda"].map((v) => (
            <div key={v} className={`pt-tab ${view === v ? "active" : ""}`} onClick={() => setView(v)} style={{ textTransform: "capitalize" }}>
              {v} view
            </div>
          ))}
        </div>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blank()); setShowForm(true); }}>
          <Plus size={14} /> Add task / event
        </button>
      </div>

      {view === "month" && (
        <MonthView tasks={calendar.tasks} cursor={monthCursor} setCursor={setMonthCursor} onSelect={(t) => { setItem(t); setShowForm(true); }} />
      )}

      {view === "agenda" && (
        sorted.length === 0 ? <EmptyState text="No scheduled tasks." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((t) => (
              <div key={t.id} className="pt-card pt-card-tight" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="pt-btn-ghost pt-btn pt-tap" style={{ border: "none" }} onClick={() => toggleComplete(t)}>
                  {t.completed ? <CheckCircle2 size={17} color="var(--ontrack)" /> : <Circle size={17} color="var(--ink-faint)" />}
                </button>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setItem(t); setShowForm(true); }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--ink-faint)" : "var(--ink)" }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                    {fmtDate(t.date)} {t.time && `· ${t.time}`} · {t.category} · {t.type}
                  </div>
                </div>
                <span className="pt-chip">{t.priority}</span>
                <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => remove(t.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <Modal title="Task / Event" onClose={() => setShowForm(false)}>
          <Field label="Title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <div className="pt-grid3">
            <Field label="Date"><input type="date" className="pt-input" value={item.date} onChange={(e) => setItem({ ...item, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" className="pt-input" value={item.time} onChange={(e) => setItem({ ...item, time: e.target.value })} /></Field>
            <Field label="Duration (min)"><input type="number" className="pt-input" value={item.duration} onChange={(e) => setItem({ ...item, duration: e.target.value })} /></Field>
          </div>
          <div className="pt-grid3">
            <Field label="Category">
              <select className="pt-select" value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })}>
                {TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className="pt-select" value={item.type} onChange={(e) => setItem({ ...item, type: e.target.value })}>
                {CALENDAR_ENTRY_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="pt-select" value={item.priority} onChange={(e) => setItem({ ...item, priority: e.target.value })}>
                {["Low", "Medium", "High"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea className="pt-textarea" value={item.notes} onChange={(e) => setItem({ ...item, notes: e.target.value })} /></Field>
          <button className="pt-btn pt-btn-primary" disabled={!item.title.trim()} onClick={() => { upsert(item); setShowForm(false); }}>
            Save
          </button>
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

/* =========================================================================
   SETTINGS SCREEN
   ========================================================================= */
function SettingsScreen({ ctx }) {
  const { settings, saveSettings, thesis, saveThesis, goals, saveGoals, calendar, saveCalendar, meta, saveMeta, literature, saveLiterature, onSignOut, notify } = ctx;
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  function exportData() {
    const bundle = { exportedAt: new Date().toISOString(), settings, thesis, goals, calendar, meta, literature };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karinas-tracker-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Export downloaded successfully");
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
        setImportError("Import failed: file is not a valid JSON backup.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  const [showSecretEditor, setShowSecretEditor] = useState(false);
  const [secretDraft, setSecretDraft] = useState({
    loveNote: settings.loveNote || "Thinking of you so much this week my love. Give everything for your thesis, I am so proud of you and everything you do. Big kisses from France! ❤️",
    hugMessage: settings.hugMessage || "Titouan is thinking of you right at this very moment. He is always by your side to encourage and support you. I love you more than anything in the world! ❤️",
    loveNoteAuthor: settings.loveNoteAuthor || "Titouan",
  });

  function confirmImport() {
    const bundle = pendingImport;
    if (bundle.settings) saveSettings(bundle.settings);
    if (bundle.thesis) saveThesis(bundle.thesis);
    if (bundle.goals) saveGoals(bundle.goals);
    if (bundle.calendar) saveCalendar(bundle.calendar);
    if (bundle.meta) saveMeta(bundle.meta);
    if (bundle.literature) saveLiterature(bundle.literature);
    setPendingImport(null);
    notify("Backup imported successfully");
  }

  function saveSecretNotes() {
    saveSettings((p) => ({
      ...p,
      ...secretDraft,
      loveNoteUpdatedAt: todayISO(),
    }));
    setShowSecretEditor(false);
    notify("Secret love notes updated! ❤️");
  }

  return (
    <div>
      <div className="pt-eyebrow">Configuration</div>
      <h1 className="pt-h1">Settings & Dates</h1>
      <p className="pt-sub" style={{ marginBottom: 20 }}>
        Customize working deadlines, daily workload caps, and export backups.
      </p>

      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Core Deadlines & Target Dates</div>
        <div className="pt-grid2">
          <Field label="Tracker Start Date">
            <input type="date" className="pt-input" value={settings.trackerStart} onChange={(e) => saveSettings((p) => ({ ...p, trackerStart: e.target.value }))} />
          </Field>
          <Field label="🎓 Thesis Midterm Examination Deadline (Default: Early Oct 2026)">
            <input type="date" className="pt-input" value={settings.thesisMidterm} onChange={(e) => saveSettings((p) => ({ ...p, thesisMidterm: e.target.value }))} />
          </Field>
        </div>
        <div className="pt-grid3" style={{ marginTop: 10 }}>
          <Field label="🇫🇷 French A2 Target (Nov 2026)">
            <input type="date" className="pt-input" value={settings.frenchTarget} onChange={(e) => saveSettings((p) => ({ ...p, frenchTarget: e.target.value }))} />
          </Field>
          <Field label="🇨🇳 Chinese HSK 3 Exam Date (Jan 2027 TBC)">
            <input type="date" className="pt-input" value={settings.chineseTarget} onChange={(e) => saveSettings((p) => ({ ...p, chineseTarget: e.target.value }))} />
          </Field>
          <Field label="🏙️ Urbanism Portfolio Deadline (Oct 31, 2026)">
            <input type="date" className="pt-input" value={settings.portfolioTarget} onChange={(e) => saveSettings((p) => ({ ...p, portfolioTarget: e.target.value }))} />
          </Field>
        </div>
      </div>

      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Study Workload Limits</div>
        <div className="pt-grid2">
          <Field label="New Chinese cards per day">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  className={`pt-btn pt-btn-sm ${Number(settings.dailyChineseWords) === n ? "pt-btn-primary" : ""}`}
                  onClick={() => saveSettings((p) => ({ ...p, dailyChineseWords: n }))}
                >
                  {n} words
                </button>
              ))}
            </div>
          </Field>
          <Field label="Max Chinese reviews per day (Anti-Explosion Cap)">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[10, 15, 20, 30].map((n) => (
                <button
                  key={n}
                  className={`pt-btn pt-btn-sm ${Number(settings.dailyChineseMaxReviews) === n ? "pt-btn-primary" : ""}`}
                  onClick={() => saveSettings((p) => ({ ...p, dailyChineseMaxReviews: n }))}
                >
                  {n} cards max
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <div className="pt-card" style={{ marginBottom: 20 }}>
        <div className="pt-h2" style={{ fontSize: 15, marginBottom: 14 }}>Data Backup & Cloud Sync</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="pt-btn pt-btn-primary" onClick={exportData}><Download size={14} /> Export JSON backup</button>
          <label className="pt-btn" style={{ cursor: "pointer" }}>
            <Upload size={14} /> Import backup
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={pickImportFile} />
          </label>
        </div>
        {importError && <div className="pt-field-error" style={{ marginTop: 10 }}>{importError}</div>}
      </div>

      <div className="pt-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="pt-h2" style={{ fontSize: 15, margin: 0 }}>Account</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>Private workspace account</div>
          </div>
          <button className="pt-btn" onClick={onSignOut}><LogOut size={14} /> Sign out</button>
        </div>
      </div>

      {/* Discreet secret trigger for Titouan */}
      <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" }}>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
          Field Notes Tracker · Build v2.5
        </div>
        <button
          className="pt-btn pt-btn-ghost pt-tap"
          style={{ padding: "4px 8px", fontSize: 11.5, color: "var(--ink-faint)", opacity: 0.6 }}
          onClick={() => {
            setSecretDraft({
              loveNote: settings.loveNote || "Thinking of you so much this week my love. Give everything for your thesis, I am so proud of you and everything you do. Big kisses from France! ❤️",
              hugMessage: settings.hugMessage || "Titouan is thinking of you right at this very moment. He is always by your side to encourage and support you. I love you more than anything in the world! ❤️",
              loveNoteAuthor: settings.loveNoteAuthor || "Titouan",
            });
            setShowSecretEditor(true);
          }}
          title="System Personalization"
        >
          ❤️
        </button>
      </div>

      {/* Secret Love Note Editor Modal */}
      {showSecretEditor && (
        <Modal title="💌 Titouan's Secret Love Note Vault" wide onClose={() => setShowSecretEditor(false)}>
          <p className="pt-sub" style={{ marginBottom: 16 }}>
            Customize the sweet messages that appear on Karina's dashboard and in the hug popup.
          </p>

          <Field label="1. Main Dashboard Love Note (Weekly message)">
            <textarea
              className="pt-textarea"
              style={{ minHeight: 90 }}
              value={secretDraft.loveNote}
              onChange={(e) => setSecretDraft({ ...secretDraft, loveNote: e.target.value })}
              placeholder="Write your sweet weekly message for Karina (in English)…"
            />
          </Field>

          <Field label="2. Hug Popup Message (Shown when she clicks 'Send a big hug')">
            <textarea
              className="pt-textarea"
              style={{ minHeight: 90 }}
              value={secretDraft.hugMessage}
              onChange={(e) => setSecretDraft({ ...secretDraft, hugMessage: e.target.value })}
              placeholder="Write what she sees when she presses the hug button (in English)…"
            />
          </Field>

          <Field label="Signature / Author Name">
            <input
              className="pt-input"
              value={secretDraft.loveNoteAuthor}
              onChange={(e) => setSecretDraft({ ...secretDraft, loveNoteAuthor: e.target.value })}
              placeholder="Titouan"
            />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <button className="pt-btn" onClick={() => setShowSecretEditor(false)}>Cancel</button>
            <button className="pt-btn pt-btn-primary" style={{ background: "#E05670", borderColor: "#E05670" }} onClick={saveSecretNotes}>
              Save Secret Notes ❤️
            </button>
          </div>
        </Modal>
      )}

      {pendingImport && (
        <ConfirmDialog
          title="Import and overwrite data?"
          message="This will replace all settings, thesis tasks, French progress, and Chinese cards with the backup file."
          confirmLabel="Overwrite and Import"
          danger
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   LITERATURE MATRIX, FRAMEWORK, CLAIMS & SECONDARY WORKSPACE PANELS
   ========================================================================= */
function LiteratureMatrixTab({ ctx }) {
  const { literature, saveLiterature, notify } = ctx;
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [item, setItem] = useState(null);

  const filtered = useMemo(() => {
    let list = literature.articles || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.authors || "").toLowerCase().includes(q) ||
        (a.topic || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [literature.articles, search]);

  function upsertArticle(a) {
    const isNew = !literature.articles.some((x) => x.id === a.id);
    saveLiterature((prev) => ({
      ...prev,
      articles: isNew ? [{ ...a, id: uid() }, ...prev.articles] : prev.articles.map((x) => (x.id === a.id ? a : x))
    }));
    notify(isNew ? "Article added to matrix" : "Article updated");
  }

  function removeArticle(id) {
    saveLiterature((prev) => ({ ...prev, articles: prev.articles.filter((x) => x.id !== id) }));
    notify("Article removed");
  }

  return (
    <div>
      <div className="pt-card pt-card-tight" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input className="pt-input" style={{ paddingLeft: 30 }} placeholder="Search literature matrix…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="pt-btn pt-btn-primary" onClick={() => { setItem(blankLiteratureArticle()); setShowAddForm(true); }}>
          <Plus size={14} /> Add paper to matrix
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No papers in matrix yet. Click 'Add paper to matrix' to populate your literature review." />
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Author(s)</th><th>Year</th><th>Title / Topic</th><th>Key Concepts</th><th>Findings</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.authors || "—"}</td>
                  <td>{a.year || "—"}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.title || "Untitled"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{a.topic}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{a.keyConcepts || "—"}</td>
                  <td style={{ fontSize: 12 }}>{a.findings || "—"}</td>
                  <td><StatusPill status={a.status || "UNREAD"} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="pt-btn pt-btn-ghost pt-tap" onClick={() => { setItem(a); setShowAddForm(true); }}><Edit3 size={13} /></button>
                      <button className="pt-btn pt-btn-ghost pt-btn-danger pt-tap" onClick={() => removeArticle(a.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <Modal title={item.id ? "Edit Paper in Matrix" : "Add Paper to Matrix"} wide onClose={() => setShowAddForm(false)}>
          <div className="pt-grid3">
            <Field label="Author(s)"><input className="pt-input" value={item.authors} onChange={(e) => setItem({ ...item, authors: e.target.value })} /></Field>
            <Field label="Year"><input className="pt-input" value={item.year} onChange={(e) => setItem({ ...item, year: e.target.value })} /></Field>
            <Field label="Topic"><input className="pt-input" value={item.topic} onChange={(e) => setItem({ ...item, topic: e.target.value })} /></Field>
          </div>
          <Field label="Paper title"><input className="pt-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></Field>
          <div className="pt-grid2">
            <Field label="Key concepts"><textarea className="pt-textarea" value={item.keyConcepts} onChange={(e) => setItem({ ...item, keyConcepts: e.target.value })} /></Field>
            <Field label="Findings & relevance"><textarea className="pt-textarea" value={item.findings} onChange={(e) => setItem({ ...item, findings: e.target.value })} /></Field>
          </div>
          <button className="pt-btn pt-btn-primary" onClick={() => { upsertArticle(item); setShowAddForm(false); }}>
            Save to Matrix
          </button>
        </Modal>
      )}
    </div>
  );
}

function FrameworkConceptsPanel({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const fw = thesis.sections.framework || { concepts: [], relationships: [] };
  const [newConcept, setNewConcept] = useState("");

  function addConcept() {
    if (!newConcept.trim()) return;
    saveThesis((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        framework: {
          ...prev.sections.framework,
          concepts: [...(prev.sections.framework.concepts || []), { id: uid(), name: newConcept.trim(), description: "" }]
        }
      }
    }));
    setNewConcept("");
    notify("Concept added to framework");
  }

  function removeConcept(id) {
    saveThesis((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        framework: {
          ...prev.sections.framework,
          concepts: prev.sections.framework.concepts.filter((c) => c.id !== id)
        }
      }
    }));
    notify("Concept removed");
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Conceptual Framework Variables & Links</div>
      <p className="pt-sub" style={{ marginBottom: 14 }}>
        Spatial Characteristics → Emotional Experience → Behavioral Patterns
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {(fw.concepts || []).map((c) => (
          <div key={c.id} className="pt-card pt-card-tight" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper)" }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
            <button className="pt-btn-ghost pt-btn" onClick={() => removeConcept(c.id)}><X size={12} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <input className="pt-input" placeholder="Add variable / concept…" value={newConcept} onChange={(e) => setNewConcept(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!newConcept.trim()} onClick={addConcept}><Plus size={14} /> Add</button>
      </div>
    </div>
  );
}

function ClaimsTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [draft, setDraft] = useState("");
  const claims = thesis.claims || [];

  function add() {
    if (!draft.trim()) return;
    saveThesis((prev) => ({ ...prev, claims: [{ id: uid(), text: draft.trim(), createdAt: todayISO() }, ...(prev.claims || [])] }));
    setDraft("");
    notify("Claim added");
  }
  function remove(id) {
    saveThesis((prev) => ({ ...prev, claims: prev.claims.filter((c) => c.id !== id) }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Claims & Supported Evidence</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input className="pt-input" placeholder="Add academic claim…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!draft.trim()} onClick={add}><Plus size={14} /> Add</button>
      </div>
      {claims.length === 0 ? <EmptyState text="No claims formulated yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {claims.map((c) => (
            <div key={c.id} className="pt-card pt-card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5 }}>{c.text}</span>
              <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContradictionsTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [draft, setDraft] = useState("");
  const contradictions = thesis.contradictions || [];

  function add() {
    if (!draft.trim()) return;
    saveThesis((prev) => ({ ...prev, contradictions: [{ id: uid(), text: draft.trim(), createdAt: todayISO() }, ...(prev.contradictions || [])] }));
    setDraft("");
    notify("Contradiction noted");
  }
  function remove(id) {
    saveThesis((prev) => ({ ...prev, contradictions: prev.contradictions.filter((c) => c.id !== id) }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Contradictions in Literature</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input className="pt-input" placeholder="Note contradiction between studies…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!draft.trim()} onClick={add}><Plus size={14} /> Add</button>
      </div>
      {contradictions.length === 0 ? <EmptyState text="No contradictions logged yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {contradictions.map((c) => (
            <div key={c.id} className="pt-card pt-card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5 }}>{c.text}</span>
              <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchQuestionsEditor({ ctx, blocks, onChange }) {
  return <SectionEditor blocks={blocks} onChange={onChange} notify={ctx.notify} />;
}

function QuestionnaireTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const q = thesis.questionnaire || {};

  function patch(p) {
    saveThesis((prev) => ({ ...prev, questionnaire: { ...(prev.questionnaire || {}), ...p } }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 12 }}>Questionnaire & Survey Instrument</div>
      <div className="pt-grid2">
        <Field label="Survey Title"><input className="pt-input" value={q.title || ""} onChange={(e) => patch({ title: e.target.value })} /></Field>
        <Field label="Online Survey Link"><input className="pt-input" placeholder="https://..." value={q.link || ""} onChange={(e) => patch({ link: e.target.value })} /></Field>
      </div>
      <div className="pt-grid3">
        <Field label="Target Respondents"><input type="number" className="pt-input" value={q.targetParticipants || 200} onChange={(e) => patch({ targetParticipants: Number(e.target.value) })} /></Field>
        <Field label="Current Responses"><input type="number" className="pt-input" value={q.currentResponses || 0} onChange={(e) => patch({ currentResponses: Number(e.target.value) })} /></Field>
        <Field label="Stage">
          <select className="pt-select" value={q.stage || "IDEA"} onChange={(e) => patch({ stage: e.target.value })}>
            {["IDEA", "DRAFT", "SUPERVISOR REVIEW", "PILOT", "PUBLISHED", "CLOSED"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function CaseStudiesTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const list = thesis.caseStudies || [];
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    saveThesis((prev) => ({ ...prev, caseStudies: [{ id: uid(), name: draft.trim(), notes: "" }, ...(prev.caseStudies || [])] }));
    setDraft("");
    notify("Site added");
  }
  function remove(id) {
    saveThesis((prev) => ({ ...prev, caseStudies: prev.caseStudies.filter((x) => x.id !== id) }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Case Study Sites (Shanghai Campuses)</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input className="pt-input" placeholder="e.g. Tongji University Library Atrium…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!draft.trim()} onClick={add}><Plus size={14} /> Add site</button>
      </div>
      {list.length === 0 ? <EmptyState text="No sites added yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((s) => (
            <div key={s.id} className="pt-card pt-card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(s.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ObservationTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const list = thesis.observations || [];
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    saveThesis((prev) => ({ ...prev, observations: [{ id: uid(), date: todayISO(), notes: draft.trim() }, ...(prev.observations || [])] }));
    setDraft("");
    notify("Observation logged");
  }
  function remove(id) {
    saveThesis((prev) => ({ ...prev, observations: prev.observations.filter((x) => x.id !== id) }));
  }

  return (
    <div className="pt-card">
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Spatial Behavioral Observations Log</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input className="pt-input" placeholder="Log spatial observation session notes…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!draft.trim()} onClick={add}><Plus size={14} /> Log</button>
      </div>
      {list.length === 0 ? <EmptyState text="No observations logged yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((s) => (
            <div key={s.id} className="pt-card pt-card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)", marginRight: 8 }}>{fmtDate(s.date)}</span>
                <span>{s.notes}</span>
              </div>
              <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(s.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupervisorTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const checklist = (thesis.supervisor && thesis.supervisor.checklist) || [];

  function toggleCheck(id) {
    saveThesis((prev) => ({
      ...prev,
      supervisor: {
        ...prev.supervisor,
        checklist: (prev.supervisor.checklist || []).map((c) => (c.id === id ? { ...c, done: !c.done } : c))
      }
    }));
  }

  return (
    <div>
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 8 }}>Supervisor Meeting Readiness Checklist</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checklist.map((item) => (
          <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} />
            <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--ink-faint)" : "var(--ink)" }}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function OutputsTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [draft, setDraft] = useState("");
  const outputs = thesis.outputs || [];

  function add() {
    if (!draft.trim()) return;
    saveThesis((prev) => ({ ...prev, outputs: [{ id: uid(), title: draft.trim(), date: todayISO() }, ...(prev.outputs || [])] }));
    setDraft("");
    notify("Output added");
  }
  function remove(id) {
    saveThesis((prev) => ({ ...prev, outputs: prev.outputs.filter((x) => x.id !== id) }));
  }

  return (
    <div>
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 8 }}>Drafts, Slides & Research Deliverables</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input className="pt-input" placeholder="e.g. Midterm slide deck v1, Chapter 1 manuscript…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="pt-btn pt-btn-primary" disabled={!draft.trim()} onClick={add}><Plus size={14} /> Add output</button>
      </div>
      {outputs.map((o) => (
        <div key={o.id} className="pt-card pt-card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span>{o.title}</span>
          <button className="pt-btn pt-btn-ghost pt-btn-danger" onClick={() => remove(o.id)}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function TimeTrackingTab({ ctx }) {
  const { thesis, saveThesis, notify } = ctx;
  const [minutes, setMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const logs = thesis.timeLog || [];

  function add() {
    saveThesis((prev) => ({
      ...prev,
      timeLog: [{ id: uid(), date: todayISO(), minutes: Number(minutes), notes }, ...(prev.timeLog || [])]
    }));
    setNotes("");
    notify("Time logged");
  }

  const totalMin = logs.reduce((s, l) => s + (Number(l.minutes) || 0), 0);

  return (
    <div>
      <div className="pt-h2" style={{ fontSize: 15, marginBottom: 4 }}>Thesis Research Hours</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12 }}>Total logged: {Math.floor(totalMin / 60)}h {totalMin % 60}m</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="number" style={{ width: 90 }} className="pt-input" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <input className="pt-input" placeholder="Focus / notes (e.g. writing lit review)…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="pt-btn pt-btn-primary" onClick={add}><Plus size={14} /> Log session</button>
      </div>
    </div>
  );
}
