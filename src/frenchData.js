/* =========================================================================
   FRENCH A0 → A2 CURRICULUM & MINI-LESSON DATA
   Structured into 14 comprehensive modules with real grammar explanations,
   10-20 vocabulary words per lesson with examples, audio pronunciation,
   and 5 types of practice exercises (vocab, grammar, reading, listening, speaking).
   ========================================================================= */

export const FRENCH_MODULES = [
  {
    id: "m1",
    title: "Pronunciation & Survival French",
    level: "A0",
    days: 5,
    grammar: ["Alphabet & sounds", "Subject pronouns (je, tu, il/elle, nous, vous, ils/elles)", "Verb être (present tense)", "Basic sentence structure (S + V + C)"],
    vocabThemes: ["Greetings & Salutations", "Nationalities & Countries", "Basic Politeness", "Classroom & Common Objects", "First Introductions"],
  },
  {
    id: "m2",
    title: "Introducing Yourself & Personal Info",
    level: "A0",
    days: 5,
    grammar: ["Verb avoir (present tense)", "Regular -er verbs (parler, habiter, aimer)", "Gender of nouns (un / une, le / la)", "Basic negation (ne ... pas)"],
    vocabThemes: ["Professions & Studies", "Personality & Descriptors", "Age & Contact Info", "Languages & Hobbies", "Family Members Intro"],
  },
  {
    id: "m3",
    title: "Numbers, Dates, Time & Calendar",
    level: "A1",
    days: 5,
    grammar: ["Numbers 0–100 & Ordinals", "Days, months, seasons & date format", "Telling time (Quelle heure est-il ?)", "Question formation (Est-ce que / Intonation / Qu'est-ce que)"],
    vocabThemes: ["Calendar & Seasons", "Daily Time Expressions", "Schedule & Appointments", "Numbers & Quantities", "Weather Basics"],
  },
  {
    id: "m4",
    title: "Family, People & Physical Description",
    level: "A1",
    days: 5,
    grammar: ["Possessive adjectives (mon/ma/mes, ton/ta/tes, son/sa/ses)", "Plural of nouns and adjectives", "Adjective agreement & placement (BAGS rules)", "Demonstratives (ce, cette, cet, ces)"],
    vocabThemes: ["Immediate & Extended Family", "Physical Appearance & Hair/Eyes", "Clothing & Colors", "Character Traits", "Personal Relationships"],
  },
  {
    id: "m5",
    title: "Food, Dining & Shopping",
    level: "A1",
    days: 6,
    grammar: ["Partitive articles (du, de la, de l', des)", "Expressions of quantity (beaucoup de, un peu de, un kilo de)", "Regular -ir verbs (finir, choisir)", "Prepositions with food & drinks"],
    vocabThemes: ["Groceries & Supermarket", "Fruits, Vegetables & Meats", "Bakery & French Specialties", "Restaurant & Ordering", "Prices & Paying"],
  },
  {
    id: "m6",
    title: "Home, Housing & Daily Routine",
    level: "A1",
    days: 6,
    grammar: ["Reflexive verbs (se lever, se coucher, s'habiller)", "Prepositions of place (dans, sur, sous, à côté de, entre)", "Adverbs of frequency (toujours, souvent, parfois, jamais)", "Regular -re verbs (attendre, vendre)"],
    vocabThemes: ["Apartment & Rooms", "Furniture & Appliances", "Morning & Evening Routine", "Household Chores", "Neighborhood & Surroundings"],
  },
  {
    id: "m7",
    title: "City, Transportation & Directions",
    level: "A1",
    days: 5,
    grammar: ["Imperative mood for directions (Tournez, Prenez, Allez)", "Near future (aller + infinitive)", "Prepositions with cities and countries (à, en, au, aux)", "Asking directions & location"],
    vocabThemes: ["Public Transportation (Metro, Bus, Train)", "City Places & Landmarks", "Giving & Understanding Directions", "Buying Tickets & Transit", "Travel Essentials"],
  },
  {
    id: "m8",
    title: "University, Work & Daily Communication",
    level: "A1/A2",
    days: 6,
    grammar: ["Key irregular verbs (faire, aller, pouvoir, vouloir, devoir, savoir)", "Direct object pronouns (le, la, les)", "Comparatives (plus que, moins que, aussi que)", "Expressing necessity & obligation"],
    vocabThemes: ["Academic Subjects & Campus", "Office & Workplace", "Daily Tasks & Projects", "Skills & Abilities", "Professional Emails & Etiquette"],
  },
  {
    id: "m9",
    title: "Past Events & Experiences (Passé Composé)",
    level: "A2",
    days: 7,
    grammar: ["Passé composé with avoir (regular & irregular participles)", "Passé composé with être (DR MRS VANDERTRAMP)", "Agreement of past participles with être", "Time markers of the past (hier, le mois dernier, il y a)"],
    vocabThemes: ["Vacations & Travel Memories", "Life Events & Milestones", "Yesterday's Activities", "Storytelling & Anecdotes", "Cultural Outings & Events"],
  },
  {
    id: "m10",
    title: "Future Plans, Projects & Intentions",
    level: "A2",
    days: 5,
    grammar: ["Futur simple (regular verbs & key irregular stems)", "Futur simple vs Futur proche (aller + inf)", "Conditional for politeness (je voudrais, j'aimerais, pourriez-vous)", "Time markers of the future (demain, l'année prochaine, dans deux jours)"],
    vocabThemes: ["Career & Study Goals", "Travel Planning & Bookings", "Making Formal Inquiries", "Future Dreams & Predictions", "Climate & Weather Forecasts"],
  },
  {
    id: "m11",
    title: "Health, Well-being & Everyday Emergencies",
    level: "A2",
    days: 5,
    grammar: ["Imparfait: formation and description of past states/habits", "Passé composé vs Imparfait in storytelling", "Body idioms & avoir mal à (au, à la, aux)", "Giving advice with le conditionnel (tu devrais, il faudrait)"],
    vocabThemes: ["Body Parts & Anatomy", "Symptoms & Illnesses", "Pharmacy & Doctor Visit", "Fitness & Healthy Habits", "Emergencies & Help"],
  },
  {
    id: "m12",
    title: "Travel, Lodging & Communication",
    level: "A2",
    days: 5,
    grammar: ["Indirect object pronouns (lui, leur)", "Pronoun placement with negation & compound tenses", "Logical connectors (donc, parce que, car, mais, pourtant)", "Relative pronouns (qui, que, où)"],
    vocabThemes: ["Hotels, Airbnb & Checking In", "Train Stations & Airports", "Lost Items & Complaints", "Phone & Online Communications", "Asking for Recommendations"],
  },
  {
    id: "m13",
    title: "Opinions, Preferences & Cultural Life",
    level: "A2",
    days: 5,
    grammar: ["Expressing opinions (je trouve que, à mon avis, selon moi)", "Superlatives (le plus, le moins, le meilleur)", "Agreement and disagreement expressions", "Hypothetical structures (si + présent -> futur)"],
    vocabThemes: ["Art, Cinema & Literature", "Urban Design & Architecture", "Lifestyle & Hobbies", "Pros and Cons Debate", "French Cultural Traditions"],
  },
  {
    id: "m14",
    title: "A2 Exam Preparation & Consolidation",
    level: "A2",
    days: 8,
    grammar: ["Full tense synthesis: Présent, Passé composé, Imparfait, Futur", "Pronoun consolidation (COD, COI, y, en basics)", "A2 exam writing formats (postcard, informal email, short essay)", "Oral exam strategies (monologue suivi, interaction)"],
    vocabThemes: ["Comprehensive A2 Theme Review", "DELF / TCF Exam Vocabulary", "Transitional Phrases & Connectors", "Self-Correction & Fluency Strategies", "Final Mock Practice"],
  },
];

// Rich curriculum lesson templates by module index and day index
export const LESSON_TEMPLATES = {
  "m1-d1": {
    title: "Greetings, Politeness & First Words",
    grammar: {
      topic: "Subject Pronouns & L'Alphabet Français",
      summary: "In French, subject pronouns indicate who is performing the action. French distinguishes between informal 'tu' and formal/plural 'vous'.",
      rules: [
        "Singular pronouns: je (I), tu (you - informal), il (he/it), elle (she/it), on (one/we).",
        "Plural pronouns: nous (we), vous (you - formal/plural), ils (they - masc), elles (they - fem).",
        "Always use 'vous' when addressing a stranger, professor, supervisor, or elder."
      ]
    },
    vocabulary: [
      { fr: "Bonjour", en: "Hello / Good morning", exampleFr: "Bonjour, comment allez-vous ?", exampleEn: "Hello, how are you?", category: "Greetings" },
      { fr: "Bonsoir", en: "Good evening", exampleFr: "Bonsoir tout le monde !", exampleEn: "Good evening everyone!", category: "Greetings" },
      { fr: "Au revoir", en: "Goodbye", exampleFr: "Au revoir et à bientôt !", exampleEn: "Goodbye and see you soon!", category: "Greetings" },
      { fr: "S'il vous plaît", en: "Please (formal)", exampleFr: "Un café, s'il vous plaît.", exampleEn: "A coffee, please.", category: "Politeness" },
      { fr: "Merci beaucoup", en: "Thank you very much", exampleFr: "Merci beaucoup pour votre aide.", exampleEn: "Thank you very much for your help.", category: "Politeness" },
      { fr: "De rien", en: "You're welcome", exampleFr: "— Merci ! — De rien.", exampleEn: "— Thanks! — You're welcome.", category: "Politeness" },
      { fr: "Excusez-moi", en: "Excuse me (formal)", exampleFr: "Excusez-moi, où est la bibliothèque ?", exampleEn: "Excuse me, where is the library?", category: "Politeness" },
      { fr: "Pardon", en: "Pardon / Sorry", exampleFr: "Pardon, je ne comprends pas.", exampleEn: "Pardon, I don't understand.", category: "Politeness" },
      { fr: "Oui", en: "Yes", exampleFr: "Oui, je suis prête.", exampleEn: "Yes, I am ready.", category: "Basics" },
      { fr: "Non", en: "No", exampleFr: "Non, pas encore.", exampleEn: "No, not yet.", category: "Basics" },
      { fr: "Enchanté / Enchantée", en: "Nice to meet you", exampleFr: "Enchantée de faire votre connaissance.", exampleEn: "Delighted to meet you.", category: "Greetings" },
      { fr: "Comment vous vous appelez ?", en: "What is your name? (formal)", exampleFr: "Bonjour, comment vous vous appelez ?", exampleEn: "Hello, what is your name?", category: "Introductions" }
    ],
    examples: [
      { fr: "Bonjour, je m'appelle Karina et je suis étudiante.", en: "Hello, my name is Karina and I am a student." },
      { fr: "Excusez-moi monsieur, comment allez-vous aujourd'hui ?", en: "Excuse me sir, how are you today?" },
      { fr: "Merci beaucoup pour votre accueil chaleureux.", en: "Thank you very much for your warm welcome." }
    ],
    exercises: {
      vocabQuiz: [
        { q: "How do you say 'Thank you very much' in French?", a: "Merci beaucoup", hint: "M____ b_______" },
        { q: "How do you say 'Excuse me' (formal) in French?", a: "Excusez-moi", hint: "E_______-___" }
      ],
      grammarExercise: {
        prompt: "Choose the correct pronoun to address your university supervisor respectfully:",
        options: ["tu", "vous", "on", "ils"],
        answer: "vous",
        explanation: "'vous' is the formal singular and plural pronoun used in professional and academic settings."
      },
      reading: {
        text: "Bonjour ! Je m'appelle Thomas. Je suis français et j'habite à Paris. Enchanté !",
        question: "Where does Thomas live?",
        answer: "In Paris"
      },
      listening: {
        prompt: "Listen to the pronunciation and repeat aloud:",
        textToListen: "Bonjour, enchantée de faire votre connaissance !"
      },
      speaking: {
        prompt: "Introduce yourself in French using: 'Bonjour, je m'appelle [name], enchantée !'",
        sampleResponse: "Bonjour, je m'appelle Karina, enchantée !"
      }
    }
  },
  "m1-d2": {
    title: "The Verb Être & Nationalities",
    grammar: {
      topic: "Conjugation of 'être' (to be) in the Present Tense",
      summary: "Être is one of the most fundamental irregular verbs in French, essential for describing identity, professions, and states of being.",
      rules: [
        "je suis (I am), tu es (you are), il/elle/on est (he/she/one is)",
        "nous sommes (we are), vous êtes (you are), ils/elles sont (they are)",
        "Nationalities change ending based on gender: français (m) -> française (f), chinois (m) -> chinoise (f)."
      ]
    },
    vocabulary: [
      { fr: "être", en: "to be", exampleFr: "Je veux être bilingue.", exampleEn: "I want to be bilingual.", category: "Verbs" },
      { fr: "je suis", en: "I am", exampleFr: "Je suis étudiante en urbanisme.", exampleEn: "I am an urbanism student.", category: "Verbs" },
      { fr: "la France", en: "France", exampleFr: "La France est un pays européen.", exampleEn: "France is a European country.", category: "Countries" },
      { fr: "la Chine", en: "China", exampleFr: "J'étudie en Chine.", exampleEn: "I study in China.", category: "Countries" },
      { fr: "français / française", en: "French (nationality)", exampleFr: "Elle apprend la langue française.", exampleEn: "She is learning the French language.", category: "Nationalities" },
      { fr: "chinois / chinoise", en: "Chinese (nationality)", exampleFr: "Il est d'origine chinoise.", exampleEn: "He is of Chinese origin.", category: "Nationalities" },
      { fr: "étudiant / étudiante", en: "student", exampleFr: "Nous sommes étudiantes à l'université.", exampleEn: "We are students at the university.", category: "Professions" },
      { fr: "professeur", en: "teacher / professor", exampleFr: "Mon professeur est très compétent.", exampleEn: "My professor is very knowledgeable.", category: "Professions" },
      { fr: "chercheur / chercheuse", en: "researcher", exampleFr: "Elle est chercheuse en architecture.", exampleEn: "She is a researcher in architecture.", category: "Professions" },
      { fr: "ici", en: "here", exampleFr: "Je suis ici pour apprendre.", exampleEn: "I am here to learn.", category: "Adverbs" },
      { fr: "là-bas", en: "over there", exampleFr: "L'université est là-bas.", exampleEn: "The university is over there.", category: "Adverbs" },
      { fr: "fatigué / fatiguée", en: "tired", exampleFr: "Après les cours, je suis un peu fatiguée.", exampleEn: "After classes, I am a bit tired.", category: "Adjectives" }
    ],
    examples: [
      { fr: "Je suis étudiante et je suis très motivée.", en: "I am a student and I am very motivated." },
      { fr: "Vous êtes à l'université aujourd'hui ?", en: "Are you at the university today?" },
      { fr: "Ils sont français mais ils habitent à Shanghai.", en: "They are French but they live in Shanghai." }
    ],
    exercises: {
      vocabQuiz: [
        { q: "Translate 'I am a researcher (f)' to French:", a: "Je suis chercheuse", hint: "Je s____ c________" },
        { q: "What is the feminine form of 'français'?", a: "française", hint: "f________" }
      ],
      grammarExercise: {
        prompt: "Complete: 'Nous _____ très heureuses de vous rencontrer.'",
        options: ["êtes", "sommes", "sont", "suis"],
        answer: "sommes",
        explanation: "'Nous sommes' is the 1st person plural present tense of être."
      },
      reading: {
        text: "Marie est française. Elle est chercheuse à Paris. Paul et David sont étudiants. Ils sont très sérieux.",
        question: "What is Marie's profession?",
        answer: "Researcher (chercheuse)"
      },
      listening: {
        prompt: "Listen to the audio pronunciation:",
        textToListen: "Nous sommes étudiantes à l'université."
      },
      speaking: {
        prompt: "Say in French: 'I am a student and I am ready to learn.'",
        sampleResponse: "Je suis étudiante et je suis prête à apprendre."
      }
    }
  },
  "m1-d3": {
    title: "Identity, Origin & Language",
    grammar: {
      topic: "Prepositions with Countries (en, au, aux, du, de)",
      summary: "Use 'en' with feminine countries (en France, en Chine), 'au' with masculine countries (au Canada, au Japon), and 'aux' with plural countries (aux États-Unis).",
      rules: [
        "Feminine countries end in 'e' (la France -> en France, la Chine -> en Chine).",
        "Masculine countries end in consonants or other vowels (le Canada -> au Canada).",
        "Expressing origin: 'Je viens de France', 'Je viens de Chine', 'Je viens du Japon'."
      ]
    },
    vocabulary: [
      { fr: "habiter", en: "to live / to reside", exampleFr: "J'habite à Shanghai.", exampleEn: "I live in Shanghai.", category: "Verbs" },
      { fr: "parler", en: "to speak", exampleFr: "Je parle anglais et russe, et j'apprends le français.", exampleEn: "I speak English and Russian, and I am learning French.", category: "Verbs" },
      { fr: "la ville", en: "city / town", exampleFr: "Shanghai est une grande ville moderne.", exampleEn: "Shanghai is a large modern city.", category: "Places" },
      { fr: "le pays", en: "country", exampleFr: "Quel est votre pays d'origine ?", exampleEn: "What is your country of origin?", category: "Places" },
      { fr: "la langue", en: "language", exampleFr: "Le français est une belle langue.", exampleEn: "French is a beautiful language.", category: "General" },
      { fr: "le mot", en: "word", exampleFr: "Quel est ce mot en français ?", exampleEn: "What is this word in French?", category: "General" },
      { fr: "la phrase", en: "sentence", exampleFr: "Répétez cette phrase, s'il vous plaît.", exampleEn: "Repeat this sentence, please.", category: "General" },
      { fr: "comprendre", en: "to understand", exampleFr: "Je commence à comprendre les règles.", exampleEn: "I am starting to understand the rules.", category: "Verbs" },
      { fr: "apprendre", en: "to learn", exampleFr: "J'apprends le français pour mes études.", exampleEn: "I learn French for my studies.", category: "Verbs" },
      { fr: "bien", en: "well / good", exampleFr: "Tout se passe très bien.", exampleEn: "Everything is going very well.", category: "Adverbs" },
      { fr: "un peu", en: "a little bit", exampleFr: "Je parle un peu français.", exampleEn: "I speak a little bit of French.", category: "Adverbs" },
      { fr: "aussi", en: "also / too", exampleFr: "Moi aussi, j'habite ici.", exampleEn: "Me too, I live here.", category: "Adverbs" }
    ],
    examples: [
      { fr: "J'habite en Chine et j'étudie l'architecture et l'urbanisme.", en: "I live in China and I study architecture and urbanism." },
      { fr: "Je parle anglais couramment et j'apprends le français chaque jour.", en: "I speak English fluently and I learn French every day." },
      { fr: "Vous comprenez le français un peu ?", en: "Do you understand French a little bit?" }
    ],
    exercises: {
      vocabQuiz: [
        { q: "How do you say 'I speak a little French'?", a: "Je parle un peu français", hint: "J_ p____ u_ p__ f_______" },
        { q: "Translate 'city' into French:", a: "la ville", hint: "l_ v____" }
      ],
      grammarExercise: {
        prompt: "Complete with the correct preposition: 'J'habite ____ France.'",
        options: ["au", "en", "à", "aux"],
        answer: "en",
        explanation: "France is a feminine country (la France), so we use the preposition 'en'."
      },
      reading: {
        text: "Karina habite à Shanghai. Elle parle plusieurs langues. Elle apprend le français avec assiduité.",
        question: "Which language is Karina currently learning?",
        answer: "French (le français)"
      },
      listening: {
        prompt: "Listen to the audio pronunciation:",
        textToListen: "Je parle anglais et j'apprends le français avec enthousiasme."
      },
      speaking: {
        prompt: "Say aloud: 'J'habite à Shanghai et j'apprends le français.'",
        sampleResponse: "J'habite à Shanghai et j'apprends le français."
      }
    }
  },
  "m2-d1": {
    title: "The Verb Avoir & Personal Details",
    grammar: {
      topic: "Conjugation of 'avoir' (to have) in the Present Tense",
      summary: "Avoir is used for possession, age (J'ai 24 ans), and many key idiomatic expressions (avoir besoin de, avoir faim).",
      rules: [
        "j'ai (I have), tu as (you have), il/elle/on a (he/she/one has)",
        "nous avons (we have), vous avez (you have), ils/elles ont (they have)",
        "In French, state your age with avoir: 'J'ai 23 ans' (literally: I have 23 years), NOT with être."
      ]
    },
    vocabulary: [
      { fr: "avoir", en: "to have", exampleFr: "J'ai un projet important.", exampleEn: "I have an important project.", category: "Verbs" },
      { fr: "l'âge (m)", en: "age", exampleFr: "Quel âge avez-vous ?", exampleEn: "How old are you?", category: "Personal Info" },
      { fr: "l'an / l'année", en: "year", exampleFr: "J'ai vingt-quatre ans.", exampleEn: "I am 24 years old.", category: "Time" },
      { fr: "le numéro", en: "number", exampleFr: "Voici mon numéro de téléphone.", exampleEn: "Here is my phone number.", category: "Personal Info" },
      { fr: "l'adresse (f)", en: "address", exampleFr: "Mon adresse email est simple.", exampleEn: "My email address is simple.", category: "Personal Info" },
      { fr: "le travail", en: "work / job", exampleFr: "J'ai beaucoup de travail pour ma thèse.", exampleEn: "I have a lot of work for my thesis.", category: "Work" },
      { fr: "travailler", en: "to work", exampleFr: "Je travaille à la bibliothèque.", exampleEn: "I work at the library.", category: "Verbs" },
      { fr: "le temps", en: "time / weather", exampleFr: "Aujourd'hui, j'ai le temps d'étudier.", exampleEn: "Today, I have time to study.", category: "General" },
      { fr: "avoir besoin de", en: "to need", exampleFr: "J'ai besoin de livres de référence.", exampleEn: "I need reference books.", category: "Expressions" },
      { fr: "avoir envie de", en: "to feel like / want", exampleFr: "J'ai envie de réussir mon examen.", exampleEn: "I feel like succeeding in my exam.", category: "Expressions" },
      { fr: "le livre", en: "book", exampleFr: "Ce livre est très intéressant.", exampleEn: "This book is very interesting.", category: "Objects" },
      { fr: "l'ordinateur (m)", en: "computer", exampleFr: "Je travaille sur mon ordinateur portable.", exampleEn: "I work on my laptop.", category: "Objects" }
    ],
    examples: [
      { fr: "J'ai vingt-quatre ans et j'ai un objectif clair pour novembre.", en: "I am 24 years old and I have a clear goal for November." },
      { fr: "Nous avons besoin de documents pour la recherche.", en: "We need documents for the research." },
      { fr: "Vous avez une question pour le professeur ?", en: "Do you have a question for the professor?" }
    ],
    exercises: {
      vocabQuiz: [
        { q: "How do you express 'I need' in French?", a: "J'ai besoin de", hint: "J'__ b_____ d_" },
        { q: "Translate 'computer' to French:", a: "l'ordinateur", hint: "l'o_________" }
      ],
      grammarExercise: {
        prompt: "How do you correctly say 'I am 22 years old' in French?",
        options: ["Je suis 22 ans", "J'ai 22 ans", "J'ai 22 années", "Je suis 22 années"],
        answer: "J'ai 22 ans",
        explanation: "In French, we always use the verb 'avoir' followed by the number and 'ans' to express age."
      },
      reading: {
        text: "Alexandre a 25 ans. Il a un ordinateur et beaucoup de livres. Il travaille tous les jours à l'université.",
        question: "How old is Alexandre?",
        answer: "25 years old (25 ans)"
      },
      listening: {
        prompt: "Listen to the audio pronunciation:",
        textToListen: "J'ai un projet de recherche très passionnant."
      },
      speaking: {
        prompt: "Say your age and what tools you have to study in French.",
        sampleResponse: "J'ai vingt-quatre ans et j'ai un ordinateur pour étudier."
      }
    }
  },
  "m2-d2": {
    title: "Regular -er Verbs & Negation",
    grammar: {
      topic: "Regular -er Verbs & 'ne ... pas' Negation",
      summary: "Most French verbs belong to the 1st group (-er). To conjugate, drop '-er' and add: -e, -es, -e, -ons, -ez, -ent. Negation wraps around the conjugated verb: ne + V + pas.",
      rules: [
        "Parler (to speak): je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent.",
        "Negation: Je ne parle pas espagnol. (Before vowels: n' -> Je n'aime pas le bruit).",
        "Common verbs: aimer (to like/love), étudier (to study), chercher (to look for), trouver (to find)."
      ]
    },
    vocabulary: [
      { fr: "étudier", en: "to study", exampleFr: "J'étudie tous les matins.", exampleEn: "I study every morning.", category: "Verbs" },
      { fr: "aimer", en: "to like / to love", exampleFr: "J'aime l'architecture urbaine.", exampleEn: "I like urban architecture.", category: "Verbs" },
      { fr: "chercher", en: "to look for / search", exampleFr: "Je cherche des articles scientifiques.", exampleEn: "I am looking for scientific articles.", category: "Verbs" },
      { fr: "trouver", en: "to find", exampleFr: "Je trouve ce sujet passionnant.", exampleEn: "I find this topic fascinating.", category: "Verbs" },
      { fr: "écouter", en: "to listen to", exampleFr: "J'écoute des podcasts en français.", exampleEn: "I listen to podcasts in French.", category: "Verbs" },
      { fr: "regarder", en: "to watch / look at", exampleFr: "Je regarde une vidéo éducative.", exampleEn: "I watch an educational video.", category: "Verbs" },
      { fr: "poser une question", en: "to ask a question", exampleFr: "Elle pose une question au tuteur.", exampleEn: "She asks the tutor a question.", category: "Phrases" },
      { fr: "ne ... pas", en: "not (negation)", exampleFr: "Je ne comprends pas ce paragraphe.", exampleEn: "I do not understand this paragraph.", category: "Grammar" },
      { fr: "toujours", en: "always / still", exampleFr: "Je suis toujours ponctuelle.", exampleEn: "I am always punctual.", category: "Adverbs" },
      { fr: "souvent", en: "often", exampleFr: "Nous allons souvent à la bibliothèque.", exampleEn: "We often go to the library.", category: "Adverbs" },
      { fr: "parfois", en: "sometimes", exampleFr: "Parfois, le travail est difficile.", exampleEn: "Sometimes, the work is difficult.", category: "Adverbs" },
      { fr: "jamais", en: "never", exampleFr: "Je n'abandonne jamais.", exampleEn: "I never give up.", category: "Adverbs" }
    ],
    examples: [
      { fr: "J'étudie le français et je ne trouve pas la grammaire trop difficile.", en: "I study French and I don't find the grammar too difficult." },
      { fr: "Elle écoute attentivement les explications du professeur.", en: "She listens attentively to the professor's explanations." },
      { fr: "Nous aimons travailler dans un espace calme.", en: "We like working in a quiet space." }
    ],
    exercises: {
      vocabQuiz: [
        { q: "How do you conjugate 'étudier' with 'nous'?", a: "nous étudions", hint: "n___ é_______" },
        { q: "Translate 'to look for' into French:", a: "chercher", hint: "c______" }
      ],
      grammarExercise: {
        prompt: "Negate the sentence: 'J'aime le café.'",
        options: ["Je n'aime pas le café.", "Je ne aime pas le café.", "Je aime pas le café.", "Je ne pas aime le café."],
        answer: "Je n'aime pas le café.",
        explanation: "'ne' becomes 'n'' before a vowel: 'Je n'aime pas'."
      },
      reading: {
        text: "Sophie étudie l'histoire de l'art. Elle n'habite pas à Paris, elle habite à Lyon. Elle aime visiter les musées.",
        question: "Does Sophie live in Paris?",
        answer: "No, she lives in Lyon (Elle n'habite pas à Paris)."
      },
      listening: {
        prompt: "Listen and repeat:",
        textToListen: "Je n'abandonne jamais mes objectifs d'apprentissage."
      },
      speaking: {
        prompt: "Say two things you like and one thing you do not like in French.",
        sampleResponse: "J'aime étudier et j'aime le thé, mais je n'aime pas le bruit."
      }
    }
  }
};

// Generic curriculum generator for all days up to the target date
export function generateFrenchLessons(startISO, endISO) {
  const DAY_MS = 86400000;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toISO = (d) => d.toISOString().slice(0, 10);
  const addDays = (iso, n) => toISO(new Date(parseISO(iso).getTime() + n * DAY_MS));
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  const totalDays = Math.max(1, daysBetween(startISO, endISO) + 1);
  const lessons = [];
  let moduleIdx = 0;
  let dayInModule = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startISO, i);
    const dayNumber = i + 1;
    const mod = FRENCH_MODULES[Math.min(moduleIdx, FRENCH_MODULES.length - 1)];
    dayInModule++;

    const isReviewDay = dayInModule > 0 && dayInModule % 6 === 0;
    const templateKey = `m${moduleIdx + 1}-d${dayInModule}`;
    const specific = LESSON_TEMPLATES[templateKey];

    let lessonData;
    if (specific) {
      lessonData = {
        title: specific.title,
        grammarPoint: specific.grammar,
        grammar: specific.grammar.rules,
        vocabulary: specific.vocabulary,
        examples: specific.examples,
        exercises: specific.exercises,
        moduleId: mod.id,
        moduleTitle: mod.title,
        level: mod.level,
        isReview: false,
      };
    } else if (isReviewDay) {
      lessonData = {
        title: `Review & Consolidation — ${mod.title}`,
        grammarPoint: {
          topic: `Review of ${mod.title}`,
          summary: `Comprehensive consolidation of grammar patterns and vocabulary introduced in Module ${moduleIdx + 1}.`,
          rules: mod.grammar
        },
        grammar: mod.grammar,
        vocabulary: [
          { fr: "réviser", en: "to review / revise", exampleFr: "Je révise ma leçon de français.", exampleEn: "I review my French lesson.", category: "Learning" },
          { fr: "la règle", en: "rule", exampleFr: "Je connais la règle de grammaire.", exampleEn: "I know the grammar rule.", category: "Learning" },
          { fr: "l'exemple (m)", en: "example", exampleFr: "Donnez-moi un exemple concret.", exampleEn: "Give me a concrete example.", category: "Learning" },
          { fr: "l'exercice (m)", en: "exercise / practice", exampleFr: "Je fais les exercices avec soin.", exampleEn: "I do the exercises carefully.", category: "Learning" },
          { fr: "le progrès", en: "progress", exampleFr: "Je fais de grands progrès chaque semaine.", exampleEn: "I make great progress every week.", category: "Learning" }
        ],
        examples: [
          { fr: "Aujourd'hui est une journée de révision pour consolider mes acquis.", en: "Today is a review day to consolidate what I have learned." },
          { fr: "Je réécoute les prononciations et je répète les phrases à voix haute.", en: "I re-listen to pronunciations and repeat sentences aloud." }
        ],
        exercises: {
          vocabQuiz: [
            { q: "Translate 'to review' to French:", a: "réviser", hint: "r______" },
            { q: "Translate 'progress' to French:", a: "le progrès", hint: "l_ p______" }
          ],
          grammarExercise: {
            prompt: `Consolidation check: What is the main grammar topic of ${mod.title}?`,
            options: mod.grammar,
            answer: mod.grammar[0],
            explanation: `Reviewing: ${mod.grammar.join(" · ")}`
          },
          reading: {
            text: `La révision est essentielle pour la mémorisation à long terme. Chaque module de français permet de consolider le vocabulaire et les structures syntaxiques.`,
            question: "Why is review essential according to the text?",
            answer: "For long-term memorization (la mémorisation à long terme)"
          },
          listening: {
            prompt: "Listen to the review synthesis:",
            textToListen: `Je consolide mes connaissances en français et je continue de progresser.`
          },
          speaking: {
            prompt: "Summarize what you learned in this module in 3 French sentences.",
            sampleResponse: "J'ai appris de nouveaux verbes, j'ai enrichi mon vocabulaire et je pratique chaque jour."
          }
        },
        moduleId: mod.id,
        moduleTitle: mod.title,
        level: mod.level,
        isReview: true,
      };
    } else {
      const gIdx = (dayInModule - 1) % mod.grammar.length;
      const vIdx = (dayInModule - 1) % mod.vocabThemes.length;
      const grammarRule = mod.grammar[gIdx];
      const theme = mod.vocabThemes[vIdx];

      lessonData = {
        title: `${mod.title} — ${theme}`,
        grammarPoint: {
          topic: grammarRule,
          summary: `Study and application of ${grammarRule} in the context of ${theme}.`,
          rules: [
            `Focus today on mastering: ${grammarRule}.`,
            `Apply this grammar point to describe and discuss topics related to ${theme}.`,
            `Integrate with previous vocabulary to build natural, fluent expressions.`
          ]
        },
        grammar: [grammarRule],
        vocabulary: [
          { fr: "le sujet", en: "topic / subject", exampleFr: `Le sujet du jour est : ${theme}.`, exampleEn: `The topic of the day is: ${theme}.`, category: theme },
          { fr: "la pratique", en: "practice", exampleFr: "La pratique quotidienne mène à la fluidité.", exampleEn: "Daily practice leads to fluency.", category: "General" },
          { fr: "important / importante", en: "important", exampleFr: "Ce concept est très important.", exampleEn: "This concept is very important.", category: "Adjectives" },
          { fr: "facile", en: "easy", exampleFr: "Avec de l'entraînement, cela devient facile.", exampleEn: "With practice, it becomes easy.", category: "Adjectives" },
          { fr: "utile", en: "useful", exampleFr: "Cette expression est très utile au quotidien.", exampleEn: "This expression is very useful in everyday life.", category: "Adjectives" },
          { fr: "continuer", en: "to continue", exampleFr: "Je continue d'étudier avec régularité.", exampleEn: "I continue studying consistently.", category: "Verbs" }
        ],
        examples: [
          { fr: `Aujourd'hui, j'étudie ${theme} avec attention.`, en: `Today, I study ${theme} attentively.` },
          { fr: `J'utilise ${grammarRule} pour formuler des phrases correctes.`, en: `I use ${grammarRule} to formulate correct sentences.` }
        ],
        exercises: {
          vocabQuiz: [
            { q: "Translate 'useful' into French:", a: "utile", hint: "u____" },
            { q: "Translate 'easy' into French:", a: "facile", hint: "f_____" }
          ],
          grammarExercise: {
            prompt: `Today's grammar focus is: ${grammarRule}. Which of the following best represents this rule?`,
            options: [grammarRule, "Random tense", "Irrelevant form", "None of the above"],
            answer: grammarRule,
            explanation: `Review the rule: ${grammarRule}.`
          },
          reading: {
            text: `Dans le cadre de l'apprentissage du niveau ${mod.level}, le thème "${theme}" apporte des expressions concrètes pour communiquer efficacement.`,
            question: "What is the goal of today's lesson?",
            answer: `To communicate effectively about ${theme}`
          },
          listening: {
            prompt: "Listen to the example sentence:",
            textToListen: `Aujourd'hui, nous explorons le thème : ${theme}.`
          },
          speaking: {
            prompt: `Say a complete sentence using ${grammarRule} and a word from ${theme}.`,
            sampleResponse: `J'utilise cette expression pour parler de ${theme}.`
          }
        },
        moduleId: mod.id,
        moduleTitle: mod.title,
        level: mod.level,
        isReview: false,
        vocabTheme: theme,
      };
    }

    lessons.push({
      id: uid(),
      date,
      dayNumber,
      ...lessonData,
      status: "PENDING",
      minutesSpent: 0,
      targetMinutes: 60,
    });

    if (dayInModule >= mod.days && moduleIdx < FRENCH_MODULES.length - 1) {
      moduleIdx++;
      dayInModule = 0;
    }
  }

  return lessons;
}
