/* =========================================================================
   THESIS 16-COMPONENT METADATA & BACKWARD ROADMAP SCHEDULER
   Matches the 16 established academic components from the specification:
   1. Research Foundation
   2. Literature Review
   3. Research Gap
   4. Research Aim
   5. Research Questions
   6. Conceptual Framework
   7. Methodology
   8. Case Study / Site Selection
   9. Data Collection
   10. Questionnaire / Research Instruments
   11. Data Analysis
   12. Findings
   13. Discussion
   14. Design Implications
   15. Conclusion
   16. Midterm Presentation / Examination
   ========================================================================= */

export const THESIS_COMPONENTS_META = [
  {
    key: "foundation",
    number: "01",
    title: "Research Foundation",
    short: "Foundation",
    phaseIndex: 0,
    preMidterm: true,
    description: "Topic, motivation, background context on informal learning spaces in Shanghai universities, and problem statement."
  },
  {
    key: "literatureReview",
    number: "02",
    title: "Literature Review",
    short: "Lit. Review",
    phaseIndex: 0,
    preMidterm: true,
    description: "Comprehensive synthesis of existing literature — environmental psychology, campus design, informal learning spaces, and student behavior."
  },
  {
    key: "researchGap",
    number: "03",
    title: "Research Gap",
    short: "Research Gap",
    phaseIndex: 0,
    preMidterm: true,
    description: "Identification of explicit gaps in current literature regarding spatial characteristics, emotional experience, and behavior in Chinese higher education."
  },
  {
    key: "researchAim",
    number: "04",
    title: "Research Aim",
    short: "Research Aim",
    phaseIndex: 0,
    preMidterm: true,
    description: "Clear articulation of primary academic objectives, expected contributions, and boundaries of the research."
  },
  {
    key: "researchQuestions",
    number: "05",
    title: "Research Questions",
    short: "Research Qs",
    phaseIndex: 0,
    preMidterm: true,
    description: "Drafts of primary and secondary research questions (RQ1: Spatial factors, RQ2: Emotional states, RQ3: Learning behavioral patterns)."
  },
  {
    key: "framework",
    number: "06",
    title: "Conceptual Framework",
    short: "Framework",
    phaseIndex: 1,
    preMidterm: true,
    description: "Conceptual mapping: Spatial Characteristics (independent) → Emotional Experience (mediating) → Behavioral Patterns (dependent)."
  },
  {
    key: "methodology",
    number: "07",
    title: "Methodology",
    short: "Methodology",
    phaseIndex: 1,
    preMidterm: true,
    description: "Mixed-methods research design combining empirical surveys, behavioral mapping/observation, and comparative case analysis."
  },
  {
    key: "siteSelection",
    number: "08",
    title: "Case Study / Site Selection",
    short: "Site Selection",
    phaseIndex: 1,
    preMidterm: true,
    description: "Selection criteria and profiling of target campus informal learning spaces across selected Shanghai universities."
  },
  {
    key: "questionnaire",
    number: "09",
    title: "Questionnaire / Research Instruments",
    short: "Instruments",
    phaseIndex: 1,
    preMidterm: true,
    description: "Survey structure, Likert measurement scales, question bank, supervisor review, and pilot testing protocol."
  },
  {
    key: "dataCollection",
    number: "10",
    title: "Data Collection",
    short: "Data Collection",
    phaseIndex: 2,
    preMidterm: true,
    description: "Execution of fieldwork, structured observations, survey deployment, response tracking, and photographic documentation."
  },
  {
    key: "dataAnalysis",
    number: "11",
    title: "Data Analysis",
    short: "Analysis",
    phaseIndex: 2,
    preMidterm: true,
    description: "Statistical analysis of survey data (SPSS/R) and qualitative thematic coding of spatial observation logs."
  },
  {
    key: "findings",
    number: "12",
    title: "Findings",
    short: "Findings",
    phaseIndex: 2,
    preMidterm: true,
    description: "Preliminary empirical findings for the midterm examination highlighting key emotional and behavioral trends."
  },
  {
    key: "discussion",
    number: "13",
    title: "Discussion",
    short: "Discussion",
    phaseIndex: 3,
    preMidterm: false,
    description: "Theoretical contextualization: interpreting empirical findings against existing theories and research questions."
  },
  {
    key: "designImplications",
    number: "14",
    title: "Design Implications",
    short: "Design Impl.",
    phaseIndex: 3,
    preMidterm: false,
    description: "Spatial and urban design guidelines for optimizing university informal learning environments."
  },
  {
    key: "conclusion",
    number: "15",
    title: "Conclusion",
    short: "Conclusion",
    phaseIndex: 3,
    preMidterm: false,
    description: "Final synthesis, academic contributions, research limitations, and recommendations for future investigations."
  },
  {
    key: "midtermExam",
    number: "16",
    title: "Midterm Presentation / Examination",
    short: "Midterm Exam",
    phaseIndex: 2,
    preMidterm: true,
    description: "Midterm slide deck, executive summary report, timed rehearsal, supervisor feedback integration, and defense readiness."
  },
];

// 4 Main Chronological Phases leading to the Midterm Examination
export const THESIS_PHASES = [
  {
    key: "phase1",
    title: "Phase 1: Foundation, Literature & Research Gap",
    subtitle: "Grounding the thesis problem, surveying literature, and crystallizing research questions",
    componentKeys: ["foundation", "literatureReview", "researchGap", "researchAim", "researchQuestions"],
    priorityForMidterm: "High",
  },
  {
    key: "phase2",
    title: "Phase 2: Conceptual Framework & Research Instruments",
    subtitle: "Building the conceptual chain, designing questionnaire, and selecting case study sites",
    componentKeys: ["framework", "methodology", "siteSelection", "questionnaire"],
    priorityForMidterm: "High",
  },
  {
    key: "phase3",
    title: "Phase 3: Data Collection, Early Findings & Midterm Defense Prep",
    subtitle: "Conducting initial fieldwork, preliminary analysis, and creating midterm presentation slides",
    componentKeys: ["dataCollection", "dataAnalysis", "findings", "midtermExam"],
    priorityForMidterm: "Highest",
  },
  {
    key: "phase4",
    title: "Phase 4: Post-Midterm Synthesis & Final Dissertation",
    subtitle: "In-depth discussion, spatial design guidelines, and final manuscript conclusion",
    componentKeys: ["discussion", "designImplications", "conclusion"],
    priorityForMidterm: "Post-Midterm",
  },
];

// Concrete bite-sized default actions for each component (as requested in OCR Page 3)
export const DEFAULT_COMPONENT_ACTIONS = {
  foundation: [
    { text: "Draft thesis background & urban context in Shanghai", status: "COMPLETED" },
    { text: "Define informal learning spaces vs formal classrooms", status: "IN_PROGRESS" },
    { text: "Formulate preliminary problem statement", status: "NOT_STARTED" },
    { text: "Write 400 words on motivation and relevance", status: "NOT_STARTED" }
  ],
  literatureReview: [
    { text: "Read 2 papers on environmental psychology in educational spaces", status: "COMPLETED" },
    { text: "Extract key concepts and methodology from selected articles", status: "IN_PROGRESS" },
    { text: "Compare findings between Western and Asian campus studies", status: "NOT_STARTED" },
    { text: "Identify contradictions regarding open vs partitioned spaces", status: "NOT_STARTED" },
    { text: "Add 5 papers to the Literature Matrix", status: "NOT_STARTED" },
    { text: "Write 300 words synthesizing spatial-emotional links", status: "NOT_STARTED" }
  ],
  researchGap: [
    { text: "Identify missing variables in current literature", status: "IN_PROGRESS" },
    { text: "Document lack of empirical data on Shanghai campus informal spaces", status: "NOT_STARTED" },
    { text: "Draft explicit 200-word Research Gap statement", status: "NOT_STARTED" }
  ],
  researchAim: [
    { text: "Clarify main academic aim and secondary objectives", status: "COMPLETED" },
    { text: "Define scope and boundaries of the master's research", status: "IN_PROGRESS" }
  ],
  researchQuestions: [
    { text: "Draft Main Research Question (MRQ)", status: "COMPLETED" },
    { text: "Draft Sub-Question 1 (Spatial characteristics)", status: "COMPLETED" },
    { text: "Draft Sub-Question 2 (Emotional experience)", status: "IN_PROGRESS" },
    { text: "Draft Sub-Question 3 (Learning behavioral patterns)", status: "NOT_STARTED" },
    { text: "Validate alignment between RQs and proposed methodology", status: "NOT_STARTED" }
  ],
  framework: [
    { text: "Identify variables: Spatial Characteristics, Emotion, Behavior", status: "COMPLETED" },
    { text: "Check literature support for each conceptual link", status: "IN_PROGRESS" },
    { text: "Define directional relationships (shapes, influences)", status: "IN_PROGRESS" },
    { text: "Update framework diagram & conceptual summary", status: "NOT_STARTED" }
  ],
  methodology: [
    { text: "Define mixed-methods approach (Survey + Observation + Case Studies)", status: "IN_PROGRESS" },
    { text: "Specify sampling criteria for student participants (target: ~200)", status: "NOT_STARTED" },
    { text: "Write methodology overview chapter draft", status: "NOT_STARTED" }
  ],
  siteSelection: [
    { text: "Establish criteria for university campus site selection in Shanghai", status: "IN_PROGRESS" },
    { text: "Shortlist 3 campus informal learning spaces for observation", status: "NOT_STARTED" },
    { text: "Conduct preliminary spatial reconnaissance visits", status: "NOT_STARTED" }
  ],
  questionnaire: [
    { text: "Draft survey sections (demographics, spatial perception, emotions, behavior)", status: "IN_PROGRESS" },
    { text: "Review questionnaire draft with thesis supervisor", status: "NOT_STARTED" },
    { text: "Pilot test questionnaire with 5 student participants", status: "NOT_STARTED" },
    { text: "Finalize questionnaire instruments and prepare online link", status: "NOT_STARTED" }
  ],
  dataCollection: [
    { text: "Deploy online questionnaire to target student cohorts", status: "NOT_STARTED" },
    { text: "Conduct structured behavioral observation sessions at site 1", status: "NOT_STARTED" },
    { text: "Conduct structured behavioral observation sessions at site 2", status: "NOT_STARTED" },
    { text: "Track response count toward 200 target respondents", status: "NOT_STARTED" }
  ],
  dataAnalysis: [
    { text: "Clean and code survey dataset", status: "NOT_STARTED" },
    { text: "Run descriptive statistical analysis on spatial preferences", status: "NOT_STARTED" },
    { text: "Analyze correlation between spatial comfort and study duration", status: "NOT_STARTED" }
  ],
  findings: [
    { text: "Draft preliminary findings summary for midterm examination", status: "NOT_STARTED" },
    { text: "Create 3 summary charts/tables illustrating key patterns", status: "NOT_STARTED" }
  ],
  discussion: [
    { text: "Relate empirical findings back to theoretical literature", status: "NOT_STARTED" },
    { text: "Discuss unexpected behavioral patterns observed in informal spaces", status: "NOT_STARTED" }
  ],
  designImplications: [
    { text: "Formulate spatial layout recommendations for university planners", status: "NOT_STARTED" },
    { text: "Create illustrative diagrams of recommended informal learning zones", status: "NOT_STARTED" }
  ],
  conclusion: [
    { text: "Synthesize key academic contributions of the research", status: "NOT_STARTED" },
    { text: "Document research limitations and suggestions for future studies", status: "NOT_STARTED" }
  ],
  midtermExam: [
    { text: "Outline midterm presentation structure (15 slides)", status: "NOT_STARTED" },
    { text: "Synthesize foundation, lit review, framework & methodology into slides", status: "NOT_STARTED" },
    { text: "Prepare executive summary handout for supervisor/examiners", status: "NOT_STARTED" },
    { text: "Rehearse presentation timing (15-20 min limit)", status: "NOT_STARTED" },
    { text: "Prepare answers for anticipated examiner questions", status: "NOT_STARTED" }
  ]
};

// Retro-planning computation helper
export function computeThesisPhases(settings, todayIso) {
  const DAY_MS = 86400000;
  const parseISO = (s) => { const [y, m, d] = (s || "2026-08-15").split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toISO = (d) => d.toISOString().slice(0, 10);
  const addDays = (iso, n) => toISO(new Date(parseISO(iso).getTime() + n * DAY_MS));
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / DAY_MS);

  const start = settings.trackerStart || "2026-08-15";
  const end = settings.thesisMidterm || "2026-10-01";
  const totalDays = Math.max(1, daysBetween(start, end));
  const daysElapsed = Math.max(0, daysBetween(start, todayIso));
  const daysLeft = Math.max(0, daysBetween(todayIso, end));

  // Partition pre-midterm duration into 3 sequential phases
  const cut1 = Math.round(totalDays * 0.35);
  const cut2 = Math.round(totalDays * 0.70);
  const bounds = [0, cut1, cut2, totalDays];

  const phases = THESIS_PHASES.slice(0, 3).map((p, i) => ({
    ...p,
    start: addDays(start, bounds[i]),
    end: i === 2 ? end : addDays(start, bounds[i + 1] - 1),
  }));

  // Append Phase 4 (post-midterm)
  phases.push({
    ...THESIS_PHASES[3],
    start: addDays(end, 1),
    end: addDays(end, 60),
  });

  let currentIndex = phases.findIndex((p) => todayIso >= p.start && todayIso <= p.end);
  if (currentIndex === -1) currentIndex = todayIso > end ? 2 : 0;

  return {
    phases,
    currentIndex,
    currentPhase: phases[currentIndex],
    daysElapsed,
    daysLeft,
    totalDays,
    start,
    end,
  };
}
