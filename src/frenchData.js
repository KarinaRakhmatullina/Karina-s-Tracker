/* =========================================================================
   FRENCH A0 → A2 CURRICULUM & COMPLETE DAILY MINI-LESSONS
   Exhaustive vocabulary banks (12-18 words per topic with example sentences),
   clear grammar lessons, audio pronunciation, and self-directed study guidance.
   ========================================================================= */

export const FRENCH_MODULES = [
  {
    id: "m1",
    title: "Pronunciation & Survival French",
    level: "A0",
    days: 5,
    grammar: [
      "Alphabet, nasal sounds & silent letters",
      "Subject pronouns (je, tu, il/elle/on, nous, vous, ils/elles)",
      "The verb être (present tense)",
      "Basic sentence structure (Subject + Verb + Complement)",
      "Essential question words (qui, quoi, où)"
    ],
    vocabThemes: [
      "Greetings & Salutations",
      "Nationalities & Origin",
      "Politeness & Survival Formulas",
      "Classroom & Study Objects",
      "Basic Numbers & Essential Words"
    ],
  },
  {
    id: "m2",
    title: "Introducing Yourself & Personal Info",
    level: "A0",
    days: 5,
    grammar: [
      "The verb avoir (present tense & expressing age)",
      "Regular -er verbs conjugation (parler, habiter, aimer)",
      "Gender of nouns and articles (un/une, le/la/l'/les)",
      "Basic negation (ne ... pas / n' ... pas)",
      "Descriptive adjectives & basic agreement"
    ],
    vocabThemes: [
      "Professions & Academic Studies",
      "Personality & Personal Descriptors",
      "Personal Info, Phone & Contact",
      "Languages & Hobbies",
      "Feelings & States of Mind"
    ],
  },
  {
    id: "m3",
    title: "Numbers, Dates, Time & Calendar",
    level: "A1",
    days: 5,
    grammar: [
      "Numbers 0–100 & ordinal numbers",
      "Days of the week, months & seasons",
      "Telling time & asking the hour (Quelle heure est-il ?)",
      "Question formation (Est-ce que / Intonation / Qu'est-ce que)",
      "Frequency adverbs (toujours, souvent, parfois, jamais)"
    ],
    vocabThemes: [
      "Days, Months & Seasons",
      "Daily Schedule & Time Expressions",
      "Appointments & Deadlines",
      "Quantities & Counting",
      "Weather Basics & Seasons"
    ],
  },
  {
    id: "m4",
    title: "Family, People & Physical Description",
    level: "A1",
    days: 5,
    grammar: [
      "Possessive adjectives (mon/ma/mes, ton/ta/tes, son/sa/ses)",
      "Plural of nouns and adjectives",
      "Adjective agreement & placement (BAGS rules)",
      "Demonstrative adjectives (ce, cette, cet, ces)",
      "Comparative basics (plus ... que, moins ... que)"
    ],
    vocabThemes: [
      "Immediate & Extended Family",
      "Physical Appearance, Hair & Eyes",
      "Clothing, Colors & Style",
      "Character Traits & Temperament",
      "Friendship & Social Relations"
    ],
  },
  {
    id: "m5",
    title: "Food, Dining & Shopping",
    level: "A1",
    days: 6,
    grammar: [
      "Partitive articles (du, de la, de l', des)",
      "Expressions of quantity with 'de' (un peu de, beaucoup de, un kilo de)",
      "Regular -ir verbs (finir, choisir, réussir)",
      "Verbs of preference with definite articles (aimer le, préférer la)",
      "Ordering politely with 'Je voudrais ...'",
      "Prices, numbers & payment structures"
    ],
    vocabThemes: [
      "Supermarket & Groceries",
      "Fruits, Vegetables & Produce",
      "Bakery & French Specialties",
      "Café & Beverage Ordering",
      "Restaurant & Dining Out",
      "Cooking, Meals & Flavors"
    ],
  },
  {
    id: "m6",
    title: "Home, Housing & Daily Routine",
    level: "A1",
    days: 6,
    grammar: [
      "Reflexive verbs in the present (se lever, se coucher, s'habiller)",
      "Prepositions of spatial location (dans, sur, sous, à côté de, entre, en face de)",
      "Regular -re verbs (attendre, entendre, répondre)",
      "Temporal connectors (d'abord, ensuite, puis, enfin)",
      "Stating daily routine in chronological sequence",
      "Spatial organization & room description"
    ],
    vocabThemes: [
      "Apartment, House & Rooms",
      "Furniture & Interior Space",
      "Morning Routine & Hygiene",
      "Evening Routine & Relaxation",
      "Household Chores & Maintenance",
      "Neighborhood & Immediate Surroundings"
    ],
  },
  {
    id: "m7",
    title: "City, Transportation & Directions",
    level: "A1",
    days: 5,
    grammar: [
      "Imperative mood for giving directions (Tournez, Prenez, Allez)",
      "Near future tense (Futur proche: aller + infinitive)",
      "Prepositions with cities and countries (à Paris, en France, au Japon, aux USA)",
      "Direction indicators (à gauche, à droite, tout droit)",
      "Public transit inquiries & ticket booking"
    ],
    vocabThemes: [
      "City Places & Public Buildings",
      "Public Transportation (Metro, Bus, Train)",
      "Asking & Understanding Directions",
      "Transit Tickets, Stations & Travel",
      "Urban Spaces & Architecture Landmarks"
    ],
  },
  {
    id: "m8",
    title: "University, Work & Daily Communication",
    level: "A1/A2",
    days: 6,
    grammar: [
      "Key irregular verbs (faire, aller, pouvoir, vouloir, devoir, savoir)",
      "Direct object pronouns (le, la, l', les)",
      "Expressing obligation & necessity (il faut + inf, devoir)",
      "Comparatives & Superlatives (plus ... que, le plus ...)",
      "Email etiquette & formal formulas (Madame, Monsieur, Cordialement)",
      "Expressing ability & permissions"
    ],
    vocabThemes: [
      "University Campus, Faculty & Library",
      "Academic Research & Study Subjects",
      "Office, Workspace & Equipment",
      "Daily Work Tasks & Projects",
      "Professional Skills & Strengths",
      "Formal Email & Academic Communication"
    ],
  },
  {
    id: "m9",
    title: "Past Events & Experiences (Passé Composé)",
    level: "A2",
    days: 7,
    grammar: [
      "Passé composé with avoir (formation & regular past participles)",
      "Irregular past participles with avoir (eu, fait, pris, vu, mis, lu, écrit)",
      "Passé composé with être (movement verbs & reflexive verbs)",
      "Agreement of past participles with être (subject gender/number)",
      "Negation in passé composé (Je n'ai pas compris)",
      "Time markers of the past (hier, la semaine dernière, il y a deux mois)",
      "Recounting a complete story or travel experience"
    ],
    vocabThemes: [
      "Travel Memories & Vacation",
      "Life Milestones & Achievements",
      "Yesterday's Activities & Log",
      "Cultural Visits, Museums & Expos",
      "Anecdotes & Past Surprises",
      "Past Studies & Background",
      "Review of Past Experiences"
    ],
  },
  {
    id: "m10",
    title: "Future Plans, Projects & Intentions",
    level: "A2",
    days: 5,
    grammar: [
      "Futur simple: regular stems and endings (-ai, -as, -a, -ons, -ez, -ont)",
      "Futur simple: key irregular stems (aur-, ser-, fer-, ir-, pourr-, voudr-)",
      "Futur proche vs Futur simple (immediate vs long-term plans)",
      "Conditional for polite requests (Je voudrais, J'aimerais, Pourriez-vous)",
      "Time markers of the future (demain, l'année prochaine, dans trois ans)"
    ],
    vocabThemes: [
      "Academic & Career Ambitions",
      "Travel Planning & Itineraries",
      "Formal Inquiries & Applications",
      "Future Dreams & Lifestyle Goals",
      "Urban Future & Architectural Visions"
    ],
  },
  {
    id: "m11",
    title: "Health, Well-being & Everyday Emergencies",
    level: "A2",
    days: 5,
    grammar: [
      "L'imparfait: formation and description of past states and habits",
      "Passé composé vs Imparfait in storytelling (action vs background)",
      "Physical symptoms & 'avoir mal à' (au dos, à la tête, aux yeux)",
      "Giving advice & suggestions (Tu devrais, Il faudrait)",
      "Describing mental fatigue, rest and recovery"
    ],
    vocabThemes: [
      "Body Parts & Physical Anatomy",
      "Symptoms, Fatigue & Illnesses",
      "Pharmacy & Consulting a Doctor",
      "Wellness, Exercise & Healthy Habits",
      "Emergencies, Assistance & Help"
    ],
  },
  {
    id: "m12",
    title: "Travel, Lodging & Communication",
    level: "A2",
    days: 5,
    grammar: [
      "Indirect object pronouns (lui, leur)",
      "Pronoun placement with negation and composite tenses",
      "Logical connectors (donc, parce que, car, mais, pourtant, alors)",
      "Relative pronouns (qui, que, où)",
      "Formal phone calls and reservation handling"
    ],
    vocabThemes: [
      "Hotels, Airbnb & Checking In",
      "Train Stations, Airports & Flights",
      "Lost Property & Filing Complaints",
      "Digital Communication & Apps",
      "Recommendations & City Advice"
    ],
  },
  {
    id: "m13",
    title: "Opinions, Preferences & Cultural Life",
    level: "A2",
    days: 5,
    grammar: [
      "Expressing opinion (Je pense que, À mon avis, Selon moi, Je trouve que)",
      "Agreement and disagreement (Je suis d'accord, Pas du tout, Exactement)",
      "Superlatives (le meilleur, la plus intéressante, le moins cher)",
      "Hypothetical structures with 'Si' (Si + présent -> futur simple)",
      "Structuring a debate argument with pros and cons"
    ],
    vocabThemes: [
      "Art, Cinema, Books & Music",
      "Urban Design, Architecture & Public Space",
      "Lifestyle, Hobbies & Daily Culture",
      "Arguments, Pros & Cons Discussion",
      "French Cultural Customs & Traditions"
    ],
  },
  {
    id: "m14",
    title: "A2 Exam Preparation & Consolidation",
    level: "A2",
    days: 8,
    grammar: [
      "Synthesis of all tenses: Présent, Passé composé, Imparfait, Futur",
      "Consolidation of pronouns (COD, COI, y, en)",
      "A2 writing formats: Informal email, postcard, short opinion essay",
      "A2 oral exam strategies: Monologue suivi and interactive dialogue",
      "Essential connectors for fluency (tout d'abord, de plus, en conclusion)",
      "Self-correction and pronunciation refinement",
      "Mock oral exam simulation & defense",
      "Final A2 synthesis & confidence check"
    ],
    vocabThemes: [
      "DELF / TCF Exam Instructions & Keywords",
      "High-Yield Formal Transitional Phrases",
      "Descriptive Vocabulary for Presentations",
      "Everyday Argumentative Expressions",
      "Academic & Personal Synthesis Vocabulary",
      "Cultural & General Knowledge Topics",
      "Comprehensive A2 Grammar Review Words",
      "Final Vocabulary Mastery Pool"
    ],
  },
];

// Rich themed vocabulary pools with full translations, examples, and categories
export const THEMED_VOCAB_POOLS = {
  "Greetings & Salutations": [
    { fr: "Bonjour", en: "Hello / Good morning", exampleFr: "Bonjour, comment allez-vous aujourd'hui ?", exampleEn: "Hello, how are you today?", category: "Greetings" },
    { fr: "Bonsoir", en: "Good evening", exampleFr: "Bonsoir tout le monde, bienvenue !", exampleEn: "Good evening everyone, welcome!", category: "Greetings" },
    { fr: "Au revoir", en: "Goodbye", exampleFr: "Au revoir et à la semaine prochaine.", exampleEn: "Goodbye and see you next week.", category: "Greetings" },
    { fr: "À bientôt", en: "See you soon", exampleFr: "Merci pour tout, à bientôt !", exampleEn: "Thanks for everything, see you soon!", category: "Greetings" },
    { fr: "À demain", en: "See you tomorrow", exampleFr: "Bonne soirée et à demain.", exampleEn: "Have a good evening and see you tomorrow.", category: "Greetings" },
    { fr: "Salut", en: "Hi / Bye (informal)", exampleFr: "Salut, comment ça va ?", exampleEn: "Hi, how is it going?", category: "Greetings" },
    { fr: "Bonne journée", en: "Have a nice day", exampleFr: "Passez une très bonne journée.", exampleEn: "Have a very nice day.", category: "Politeness" },
    { fr: "Bonne soirée", en: "Have a nice evening", exampleFr: "Au revoir et bonne soirée.", exampleEn: "Goodbye and have a nice evening.", category: "Politeness" },
    { fr: "Bienvenue", en: "Welcome", exampleFr: "Bienvenue à l'université !", exampleEn: "Welcome to the university!", category: "Greetings" },
    { fr: "Enchanté / Enchantée", en: "Delighted to meet you", exampleFr: "Enchantée de faire votre connaissance.", exampleEn: "Delighted to meet you.", category: "Greetings" },
    { fr: "Comment allez-vous ?", en: "How are you? (formal)", exampleFr: "Bonjour professeur, comment allez-vous ?", exampleEn: "Hello professor, how are you?", category: "Greetings" },
    { fr: "Ça va bien", en: "I'm doing well", exampleFr: "Ça va très bien, merci !", exampleEn: "I'm doing very well, thank you!", category: "Greetings" }
  ],
  "Nationalities & Origin": [
    { fr: "la France", en: "France", exampleFr: "La France a une riche tradition architecturale.", exampleEn: "France has a rich architectural tradition.", category: "Countries" },
    { fr: "la Chine", en: "China", exampleFr: "J'étudie actuellement en Chine.", exampleEn: "I am currently studying in China.", category: "Countries" },
    { fr: "français / française", en: "French", exampleFr: "J'apprends la langue française chaque jour.", exampleEn: "I learn the French language every day.", category: "Nationalities" },
    { fr: "chinois / chinoise", en: "Chinese", exampleFr: "La culture chinoise est fascinante.", exampleEn: "Chinese culture is fascinating.", category: "Nationalities" },
    { fr: "l'origine (f)", en: "origin / background", exampleFr: "Quelle est votre ville d'origine ?", exampleEn: "What is your city of origin?", category: "General" },
    { fr: "le pays", en: "country", exampleFr: "C'est un très beau pays.", exampleEn: "It is a very beautiful country.", category: "Geography" },
    { fr: "la nationalité", en: "nationality", exampleFr: "Quelle est votre nationalité ?", exampleEn: "What is your nationality?", category: "Personal Info" },
    { fr: "venir de", en: "to come from", exampleFr: "Je viens de Shanghai.", exampleEn: "I come from Shanghai.", category: "Verbs" },
    { fr: "étranger / étrangère", en: "foreign / abroad", exampleFr: "Elle étudie les langues étrangères.", exampleEn: "She studies foreign languages.", category: "Adjectives" },
    { fr: "le monde", en: "world", exampleFr: "Des étudiants du monde entier sont ici.", exampleEn: "Students from all over the world are here.", category: "General" },
    { fr: "international / internationale", en: "international", exampleFr: "C'est un programme international.", exampleEn: "It is an international program.", category: "Adjectives" },
    { fr: "habiter", en: "to live / reside", exampleFr: "J'habite près du campus universitaire.", exampleEn: "I live near the university campus.", category: "Verbs" }
  ],
  "Professions & Academic Studies": [
    { fr: "étudiant / étudiante", en: "student", exampleFr: "Je suis étudiante en master.", exampleEn: "I am a master's student.", category: "Professions" },
    { fr: "chercheur / chercheuse", en: "researcher", exampleFr: "Elle est chercheuse en urbanisme.", exampleEn: "She is an urbanism researcher.", category: "Professions" },
    { fr: "professeur / professeure", en: "professor / teacher", exampleFr: "Mon professeur supervise ma thèse.", exampleEn: "My professor supervises my thesis.", category: "Professions" },
    { fr: "l'architecte (m/f)", en: "architect", exampleFr: "L'architecte conçoit des espaces innovants.", exampleEn: "The architect designs innovative spaces.", category: "Professions" },
    { fr: "l'urbaniste (m/f)", en: "urban planner / urbanist", exampleFr: "L'urbaniste étudie le fonctionnement de la ville.", exampleEn: "The urban planner studies how the city functions.", category: "Professions" },
    { fr: "la recherche", en: "research", exampleFr: "Ma recherche porte sur les espaces d'apprentissage.", exampleEn: "My research focuses on learning spaces.", category: "Academic" },
    { fr: "la thèse", en: "thesis / dissertation", exampleFr: "Je prépare ma soutenance de mi-parcours de thèse.", exampleEn: "I am preparing my thesis midterm defense.", category: "Academic" },
    { fr: "l'université (f)", en: "university", exampleFr: "L'université dispose d'une grande bibliothèque.", exampleEn: "The university has a large library.", category: "Academic" },
    { fr: "le master", en: "master's degree", exampleFr: "Je termine mon master cette année.", exampleEn: "I am finishing my master's degree this year.", category: "Academic" },
    { fr: "le projet", en: "project", exampleFr: "Ce projet demande beaucoup de rigueur.", exampleEn: "This project requires great rigor.", category: "Work" },
    { fr: "travailler", en: "to work", exampleFr: "Je travaille de manière autonome.", exampleEn: "I work autonomously.", category: "Verbs" },
    { fr: "étudier", en: "to study", exampleFr: "J'étudie tous les jours avec régularité.", exampleEn: "I study every day consistently.", category: "Verbs" }
  ],
  "Days, Months & Seasons": [
    { fr: "lundi", en: "Monday", exampleFr: "Le lundi, j'ai une réunion de supervision.", exampleEn: "On Monday, I have a supervisor meeting.", category: "Days" },
    { fr: "mardi", en: "Tuesday", exampleFr: "Mardi est dédié à la revue de littérature.", exampleEn: "Tuesday is dedicated to literature review.", category: "Days" },
    { fr: "mercredi", en: "Wednesday", exampleFr: "Mercredi après-midi, j'analyse les données.", exampleEn: "Wednesday afternoon, I analyze data.", category: "Days" },
    { fr: "jeudi", en: "Thursday", exampleFr: "Jeudi, je prépare mes diapositives.", exampleEn: "Thursday, I prepare my slides.", category: "Days" },
    { fr: "vendredi", en: "Friday", exampleFr: "Vendredi, je fais le bilan de la semaine.", exampleEn: "Friday, I review the week.", category: "Days" },
    { fr: "samedi", en: "Saturday", exampleFr: "Le samedi, je lis des articles au calme.", exampleEn: "On Saturday, I read articles in peace.", category: "Days" },
    { fr: "dimanche", en: "Sunday", exampleFr: "Le dimanche est une journée de repos.", exampleEn: "Sunday is a day of rest.", category: "Days" },
    { fr: "le mois", en: "month", exampleFr: "Ce mois-ci est décisif pour ma thèse.", exampleEn: "This month is decisive for my thesis.", category: "Time" },
    { fr: "l'année (f)", en: "year", exampleFr: "Cette année est très productive.", exampleEn: "This year is very productive.", category: "Time" },
    { fr: "l'automne (m)", en: "autumn / fall", exampleFr: "Mon examen aura lieu en automne.", exampleEn: "My exam will take place in autumn.", category: "Seasons" },
    { fr: "l'hiver (m)", en: "winter", exampleFr: "L'hiver approche rapidement.", exampleEn: "Winter is approaching quickly.", category: "Seasons" },
    { fr: "le calendrier", en: "calendar / schedule", exampleFr: "Je note toutes mes échéances sur le calendrier.", exampleEn: "I note all my deadlines on the calendar.", category: "Time" }
  ],
  "Supermarket & Groceries": [
    { fr: "le marché", en: "market", exampleFr: "Je fais mes courses au marché local.", exampleEn: "I do my shopping at the local market.", category: "Food" },
    { fr: "le supermarché", en: "supermarket", exampleFr: "Le supermarché est ouvert jusqu'à vingt heures.", exampleEn: "The supermarket is open until 8 PM.", category: "Shopping" },
    { fr: "l'eau (f)", en: "water", exampleFr: "Je bois une bouteille d'eau fraîche.", exampleEn: "I drink a bottle of fresh water.", category: "Drinks" },
    { fr: "le café", en: "coffee", exampleFr: "Je prends un café noir le matin.", exampleEn: "I have a black coffee in the morning.", category: "Drinks" },
    { fr: "le thé", en: "tea", exampleFr: "J'aime boire du thé vert pour étudier.", exampleEn: "I like drinking green tea to study.", category: "Drinks" },
    { fr: "le pain", en: "bread", exampleFr: "Le pain français est croustillant.", exampleEn: "French bread is crusty.", category: "Food" },
    { fr: "le fruit", en: "fruit", exampleFr: "Je mange des fruits frais chaque jour.", exampleEn: "I eat fresh fruit every day.", category: "Food" },
    { fr: "le légume", en: "vegetable", exampleFr: "Les légumes sont bons pour la santé.", exampleEn: "Vegetables are good for health.", category: "Food" },
    { fr: "le fromage", en: "cheese", exampleFr: "Il y a beaucoup de variétés de fromage en France.", exampleEn: "There are many varieties of cheese in France.", category: "Food" },
    { fr: "le repas", en: "meal", exampleFr: "Nous prenons le repas ensemble.", exampleEn: "We have the meal together.", category: "Food" },
    { fr: "acheter", en: "to buy", exampleFr: "Je vais acheter des provisions.", exampleEn: "I am going to buy groceries.", category: "Verbs" },
    { fr: "coûter", en: "to cost", exampleFr: "Combien coûte ce produit ?", exampleEn: "How much does this product cost?", category: "Verbs" }
  ],
  "Apartment, House & Rooms": [
    { fr: "l'appartement (m)", en: "apartment", exampleFr: "Mon appartement est calme et lumineux.", exampleEn: "My apartment is quiet and bright.", category: "Housing" },
    { fr: "la chambre", en: "bedroom", exampleFr: "La chambre dispose d'un grand bureau.", exampleEn: "The bedroom has a large desk.", category: "Housing" },
    { fr: "le bureau", en: "desk / office", exampleFr: "Je travaille à mon bureau tous les matins.", exampleEn: "I work at my desk every morning.", category: "Furniture" },
    { fr: "la bibliothèque", en: "library / bookcase", exampleFr: "J'étudie à la bibliothèque universitaire.", exampleEn: "I study at the university library.", category: "Places" },
    { fr: "la table", en: "table", exampleFr: "Les livres sont posés sur la table.", exampleEn: "The books are placed on the table.", category: "Furniture" },
    { fr: "la chaise", en: "chair", exampleFr: "Cette chaise ergonomique est très confortable.", exampleEn: "This ergonomic chair is very comfortable.", category: "Furniture" },
    { fr: "la fenêtre", en: "window", exampleFr: "La fenêtre donne sur un jardin paisible.", exampleEn: "The window overlooks a peaceful garden.", category: "Housing" },
    { fr: "la lumière", en: "light", exampleFr: "La lumière naturelle est idéale pour lire.", exampleEn: "Natural light is ideal for reading.", category: "Environment" },
    { fr: "l'espace (m)", en: "space", exampleFr: "Cet espace informel favorise la concentration.", exampleEn: "This informal space fosters concentration.", category: "Architecture" },
    { fr: "le calme", en: "calm / quietness", exampleFr: "J'ai besoin de calme pour écrire.", exampleEn: "I need quiet to write.", category: "Environment" },
    { fr: "confortable", en: "comfortable", exampleFr: "L'assise est très confortable.", exampleEn: "The seat is very comfortable.", category: "Adjectives" },
    { fr: "propre", en: "clean / neat", exampleFr: "L'espace de travail est propre et bien rangé.", exampleEn: "The workspace is clean and tidy.", category: "Adjectives" }
  ],
  "City Places & Public Buildings": [
    { fr: "la ville", en: "city", exampleFr: "Shanghai est une métropole dynamique.", exampleEn: "Shanghai is a dynamic metropolis.", category: "Urbanism" },
    { fr: "la rue", en: "street", exampleFr: "Cette rue piétonne est animée.", exampleEn: "This pedestrian street is lively.", category: "Urbanism" },
    { fr: "le métro", en: "subway / metro", exampleFr: "Je prends la ligne de métro pour aller au campus.", exampleEn: "I take the metro line to go to campus.", category: "Transit" },
    { fr: "la gare", en: "train station", exampleFr: "La gare centrale est très moderne.", exampleEn: "The central station is very modern.", category: "Transit" },
    { fr: "le parc", en: "park", exampleFr: "Je fais une promenade dans le parc pour me détendre.", exampleEn: "I take a walk in the park to relax.", category: "Places" },
    { fr: "le musée", en: "museum", exampleFr: "Le musée d'art contemporain propose une exposition.", exampleEn: "The contemporary art museum has an exhibition.", category: "Culture" },
    { fr: "le bâtiment", en: "building", exampleFr: "Ce bâtiment a une architecture remarquable.", exampleEn: "This building has remarkable architecture.", category: "Architecture" },
    { fr: "la place", en: "public square / plaza", exampleFr: "La place publique est un lieu de rencontre.", exampleEn: "The public plaza is a meeting place.", category: "Urbanism" },
    { fr: "le quartier", en: "neighborhood / district", exampleFr: "C'est un quartier historique charmant.", exampleEn: "It is a charming historic neighborhood.", category: "Urbanism" },
    { fr: "aller à", en: "to go to", exampleFr: "Je vais à la bibliothèque municipale.", exampleEn: "I am going to the municipal library.", category: "Verbs" },
    { fr: "tourner", en: "to turn", exampleFr: "Tournez à droite après le carrefour.", exampleEn: "Turn right after the intersection.", category: "Verbs" },
    { fr: "traverser", en: "to cross", exampleFr: "Traversez l'avenue en toute sécurité.", exampleEn: "Cross the avenue safely.", category: "Verbs" }
  ],
  "University Campus, Faculty & Library": [
    { fr: "le campus", en: "campus", exampleFr: "Le campus universitaire est vert et spacieux.", exampleEn: "The university campus is green and spacious.", category: "Campus" },
    { fr: "la faculté", en: "faculty / department", exampleFr: "La faculté d'architecture est renommée.", exampleEn: "The faculty of architecture is renowned.", category: "Academic" },
    { fr: "l'amphithéâtre (m)", en: "lecture hall", exampleFr: "La conférence se tient dans l'amphithéâtre.", exampleEn: "The lecture is held in the lecture hall.", category: "Campus" },
    { fr: "la salle d'étude", en: "study room", exampleFr: "La salle d'étude est ouverte 24h/24.", exampleEn: "The study room is open 24/7.", category: "Campus" },
    { fr: "l'article scientifique (m)", en: "academic paper", exampleFr: "Je lis un article scientifique pertinent.", exampleEn: "I am reading a relevant academic paper.", category: "Academic" },
    { fr: "la méthodologie", en: "methodology", exampleFr: "La méthodologie mixte combine enquête et observation.", exampleEn: "The mixed methodology combines survey and observation.", category: "Academic" },
    { fr: "le questionnaire", en: "survey / questionnaire", exampleFr: "Le questionnaire s'adresse aux étudiants du campus.", exampleEn: "The questionnaire targets campus students.", category: "Academic" },
    { fr: "les données (f)", en: "data", exampleFr: "Les données recueillies sont analysées avec soin.", exampleEn: "The collected data is analyzed carefully.", category: "Academic" },
    { fr: "la conclusion", en: "conclusion", exampleFr: "La conclusion résume les apports principaux.", exampleEn: "The conclusion summarizes the main contributions.", category: "Academic" },
    { fr: "présenter", en: "to present", exampleFr: "Je vais présenter mes résultats à la commission.", exampleEn: "I will present my findings to the committee.", category: "Verbs" },
    { fr: "rédiger", en: "to write / draft", exampleFr: "Je rédige le chapitre de synthèse.", exampleEn: "I am drafting the synthesis chapter.", category: "Verbs" },
    { fr: "valider", en: "to validate / approve", exampleFr: "Le superviseur a validé la structure.", exampleEn: "The supervisor approved the structure.", category: "Verbs" }
  ],
  "Travel Memories & Vacation": [
    { fr: "le voyage", en: "trip / travel", exampleFr: "Ce voyage a été une source d'inspiration.", exampleEn: "This trip was a source of inspiration.", category: "Travel" },
    { fr: "les vacances (f)", en: "vacation / holidays", exampleFr: "Pendant les vacances, j'ai visité Paris.", exampleEn: "During the vacation, I visited Paris.", category: "Travel" },
    { fr: "la découverte", en: "discovery", exampleFr: "Ce fut une magnifique découverte culturelle.", exampleEn: "It was a wonderful cultural discovery.", category: "General" },
    { fr: "le souvenir", en: "memory / souvenir", exampleFr: "J'en garde un excellent souvenir.", exampleEn: "I have an excellent memory of it.", category: "Memories" },
    { fr: "visiter", en: "to visit (a place)", exampleFr: "J'ai visité plusieurs universités européennes.", exampleEn: "I visited several European universities.", category: "Verbs" },
    { fr: "découvrir", en: "to discover", exampleFr: "J'ai découvert des méthodes de travail innovantes.", exampleEn: "I discovered innovative working methods.", category: "Verbs" },
    { fr: "partager", en: "to share", exampleFr: "J'ai partagé mes idées avec d'autres étudiants.", exampleEn: "I shared my ideas with other students.", category: "Verbs" },
    { fr: "magnifique", en: "magnificent / beautiful", exampleFr: "Le paysage urbain était magnifique.", exampleEn: "The cityscape was magnificent.", category: "Adjectives" },
    { fr: "inoubliable", en: "unforgettable", exampleFr: "Cette expérience restera inoubliable.", exampleEn: "This experience will remain unforgettable.", category: "Adjectives" },
    { fr: "hier", en: "yesterday", exampleFr: "Hier, j'ai terminé la première partie.", exampleEn: "Yesterday, I finished the first part.", category: "Time" },
    { fr: "la semaine dernière", en: "last week", exampleFr: "La semaine dernière, j'ai rencontré mon tuteur.", exampleEn: "Last week, I met my tutor.", category: "Time" },
    { fr: "il y a", en: "ago (time)", exampleFr: "J'ai commencé ce projet il y a deux mois.", exampleEn: "I started this project two months ago.", category: "Time" }
  ],
  "Academic & Career Ambitions": [
    { fr: "l'avenir (m)", en: "future", exampleFr: "Je prépare activement mon avenir professionnel.", exampleEn: "I am actively preparing my professional future.", category: "Goals" },
    { fr: "l'objectif (m)", en: "goal / objective", exampleFr: "Mon objectif principal est de réussir le diplôme A2.", exampleEn: "My main goal is to pass the A2 diploma.", category: "Goals" },
    { fr: "la réussite", en: "success / achievement", exampleFr: "La persévérance conduit à la réussite.", exampleEn: "Perseverance leads to success.", category: "Motivation" },
    { fr: "le diplôme", en: "diploma / degree", exampleFr: "L'obtention du diplôme ouvrira de nouvelles opportunités.", exampleEn: "Obtaining the degree will open new opportunities.", category: "Academic" },
    { fr: "la carrière", en: "career", exampleFr: "Je souhaite développer ma carrière dans la recherche urbaine.", exampleEn: "I wish to develop my career in urban research.", category: "Work" },
    { fr: "progresser", en: "to make progress", exampleFr: "Je progresse de jour en jour.", exampleEn: "I make progress day by day.", category: "Verbs" },
    { fr: "atteindre", en: "to reach / attain", exampleFr: "Je vais atteindre tous mes objectifs fixés.", exampleEn: "I will achieve all my set goals.", category: "Verbs" },
    { fr: "ambitieux / ambitieuse", en: "ambitious", exampleFr: "C'est un programme ambitieux mais réaliste.", exampleEn: "It is an ambitious but realistic program.", category: "Adjectives" },
    { fr: "déterminé / déterminée", en: "determined", exampleFr: "Je suis pleinement déterminée à réussir.", exampleEn: "I am fully determined to succeed.", category: "Adjectives" },
    { fr: "demain", en: "tomorrow", exampleFr: "Demain, je commencerai le nouveau chapitre.", exampleEn: "Tomorrow, I will start the new chapter.", category: "Time" },
    { fr: "bientôt", en: "soon", exampleFr: "Les résultats seront disponibles bientôt.", exampleEn: "The results will be available soon.", category: "Time" },
    { fr: "espérer", en: "to hope", exampleFr: "J'espère présenter une soutenance impeccable.", exampleEn: "I hope to deliver a flawless defense.", category: "Verbs" }
  ],
  "Body Parts & Physical Anatomy": [
    { fr: "la santé", en: "health", exampleFr: "Prendre soin de sa santé est essentiel pour étudier.", exampleEn: "Taking care of one's health is essential for studying.", category: "Health" },
    { fr: "la tête", en: "head", exampleFr: "J'ai parfois mal à la tête après de longues lectures.", exampleEn: "I sometimes have a headache after long readings.", category: "Body" },
    { fr: "les yeux (m)", en: "eyes", exampleFr: "Mes yeux ont besoin de repos loin des écrans.", exampleEn: "My eyes need rest away from screens.", category: "Body" },
    { fr: "le dos", en: "back", exampleFr: "Une bonne posture évite les douleurs au dos.", exampleEn: "Good posture prevents back pain.", category: "Body" },
    { fr: "l'énergie (f)", en: "energy", exampleFr: "J'ai fait le plein d'énergie ce matin.", exampleEn: "I got a full boost of energy this morning.", category: "Wellness" },
    { fr: "le repos", en: "rest / relaxation", exampleFr: "Le repos permet une meilleure mémorisation.", exampleEn: "Rest allows for better memorization.", category: "Wellness" },
    { fr: "se sentir", en: "to feel", exampleFr: "Je me sens très en forme et concentrée.", exampleEn: "I feel very fit and focused.", category: "Verbs" },
    { fr: "respirer", en: "to breathe", exampleFr: "Prenez le temps de respirer profondément.", exampleEn: "Take time to breathe deeply.", category: "Verbs" },
    { fr: "dormir", en: "to sleep", exampleFr: "Il est important de bien dormir huit heures.", exampleEn: "It is important to sleep well for 8 hours.", category: "Verbs" },
    { fr: "la forme", en: "fitness / shape", exampleFr: "Je suis en excellente forme physique.", exampleEn: "I am in excellent physical shape.", category: "Wellness" },
    { fr: "le conseil", en: "advice / tip", exampleFr: "Suivez ce conseil pour rester motivée.", exampleEn: "Follow this advice to stay motivated.", category: "General" },
    { fr: "sain / saine", en: "healthy", exampleFr: "Une alimentation saine favorise la concentration.", exampleEn: "A healthy diet fosters concentration.", category: "Adjectives" }
  ],
  "Hotels, Airbnb & Checking In": [
    { fr: "l'hôtel (m)", en: "hotel", exampleFr: "L'hôtel est situé en plein centre-ville.", exampleEn: "The hotel is located right in the city center.", category: "Travel" },
    { fr: "la réservation", en: "reservation / booking", exampleFr: "J'ai confirmé ma réservation en ligne.", exampleEn: "I confirmed my booking online.", category: "Travel" },
    { fr: "la chambre d'hôte", en: "guesthouse / B&B", exampleFr: "Nous avons séjourné dans une charmante chambre d'hôte.", exampleEn: "We stayed in a charming guesthouse.", category: "Travel" },
    { fr: "le passeport", en: "passport", exampleFr: "Veuillez présenter votre passeport à l'accueil.", exampleEn: "Please present your passport at reception.", category: "Documents" },
    { fr: "le bagage / la valise", en: "luggage / suitcase", exampleFr: "Ma valise est prête pour le départ.", exampleEn: "My suitcase is ready for departure.", category: "Travel" },
    { fr: "l'arrivée (f)", en: "arrival", exampleFr: "L'heure d'arrivée est prévue à quatorze heures.", exampleEn: "Arrival time is scheduled for 2 PM.", category: "Travel" },
    { fr: "le départ", en: "departure", exampleFr: "Le départ aura lieu tôt demain matin.", exampleEn: "Departure will take place early tomorrow morning.", category: "Travel" },
    { fr: "le billet", en: "ticket", exampleFr: "J'ai téléchargé mon billet électronique.", exampleEn: "I downloaded my e-ticket.", category: "Travel" },
    { fr: "réserver", en: "to book / reserve", exampleFr: "Je souhaite réserver une chambre calme.", exampleEn: "I would like to book a quiet room.", category: "Verbs" },
    { fr: "confirmer", en: "to confirm", exampleFr: "Pouvez-vous confirmer la réception du document ?", exampleEn: "Can you confirm receipt of the document?", category: "Verbs" },
    { fr: "demander", en: "to ask / request", exampleFr: "Je demande des informations sur les horaires.", exampleEn: "I ask for information regarding schedules.", category: "Verbs" },
    { fr: "pratique", en: "practical / convenient", exampleFr: "Cet emplacement est très pratique.", exampleEn: "This location is very convenient.", category: "Adjectives" }
  ],
  "Art, Cinema, Books & Music": [
    { fr: "l'art (m)", en: "art", exampleFr: "L'art et le design spatial se complètent.", exampleEn: "Art and spatial design complement each other.", category: "Culture" },
    { fr: "l'architecture (f)", en: "architecture", exampleFr: "L'architecture contemporaine privilégie la lumière.", exampleEn: "Contemporary architecture favors light.", category: "Architecture" },
    { fr: "le cinéma", en: "cinema / movies", exampleFr: "J'aime regarder des films français sous-titrés.", exampleEn: "I like watching French movies with subtitles.", category: "Culture" },
    { fr: "la musique", en: "music", exampleFr: "J'écoute de la musique douce pour me concentrer.", exampleEn: "I listen to gentle music to focus.", category: "Culture" },
    { fr: "le style", en: "style", exampleFr: "Ce style épuré apporte une ambiance sereine.", exampleEn: "This sleek style brings a serene atmosphere.", category: "Design" },
    { fr: "la créativité", en: "creativity", exampleFr: "Ce projet stimule ma créativité.", exampleEn: "This project stimulates my creativity.", category: "General" },
    { fr: "l'opinion (f)", en: "opinion", exampleFr: "À mon avis, cet aménagement est exemplaire.", exampleEn: "In my opinion, this layout is exemplary.", category: "Opinion" },
    { fr: "la préférence", en: "preference", exampleFr: "Ma préférence va aux espaces ouverts.", exampleEn: "My preference goes to open spaces.", category: "Opinion" },
    { fr: "préférer", en: "to prefer", exampleFr: "Je préfère les environnements calmes.", exampleEn: "I prefer quiet environments.", category: "Verbs" },
    { fr: "penser", en: "to think", exampleFr: "Je pense que cette approche est la plus efficace.", exampleEn: "I think this approach is the most effective.", category: "Verbs" },
    { fr: "trouver", en: "to find / deem", exampleFr: "Je trouve cette idée particulièrement novatrice.", exampleEn: "I find this idea particularly innovative.", category: "Verbs" },
    { fr: "intéressant / intéressante", en: "interesting", exampleFr: "C'est une théorie très intéressante.", exampleEn: "It is a very interesting theory.", category: "Adjectives" }
  ],
  "DELF / TCF Exam Instructions & Keywords": [
    { fr: "l'examen (m)", en: "exam / test", exampleFr: "Je prépare l'examen du DELF A2 avec confiance.", exampleEn: "I prepare for the DELF A2 exam with confidence.", category: "Exam" },
    { fr: "la compréhension", en: "comprehension / understanding", exampleFr: "La compréhension orale et écrite est testée.", exampleEn: "Listening and reading comprehension are tested.", category: "Exam" },
    { fr: "l'expression (f)", en: "expression / speaking / writing", exampleFr: "L'expression orale dure une dizaine de minutes.", exampleEn: "Speaking expression lasts about ten minutes.", category: "Exam" },
    { fr: "la consigne", en: "instruction / prompt", exampleFr: "Lisez attentivement chaque consigne avant de répondre.", exampleEn: "Read each instruction carefully before answering.", category: "Exam" },
    { fr: "la réponse", en: "answer / response", exampleFr: "Formulez une réponse claire et structurée.", exampleEn: "Formulate a clear and structured answer.", category: "Exam" },
    { fr: "le document", en: "document / text", exampleFr: "Observez le document et dégagez les idées clés.", exampleEn: "Look at the document and identify key ideas.", category: "Exam" },
    { fr: "le message", en: "message / short letter", exampleFr: "Rédigez un court message pour remercier un ami.", exampleEn: "Write a short message to thank a friend.", category: "Writing" },
    { fr: "expliquer", en: "to explain", exampleFr: "Expliquez vos raisons de manière détaillée.", exampleEn: "Explain your reasons in detail.", category: "Verbs" },
    { fr: "décrire", en: "to describe", exampleFr: "Décrivez votre espace d'étude préféré.", exampleEn: "Describe your favorite study space.", category: "Verbs" },
    { fr: "réussir", en: "to pass / succeed", exampleFr: "Je vais réussir mon examen avec succès.", exampleEn: "I will pass my exam with flying colors.", category: "Verbs" },
    { fr: "prêt / prête", en: "ready", exampleFr: "Je suis totalement prête pour le jour de l'épreuve.", exampleEn: "I am totally ready for the day of the test.", category: "Adjectives" },
    { fr: "efficace", en: "effective / efficient", exampleFr: "Cette méthode d'apprentissage est très efficace.", exampleEn: "This learning method is very effective.", category: "Adjectives" }
  ]
};

// Fallback thematic mapper to ensure every single day gets rich themed vocabulary
function getVocabForTheme(themeName) {
  if (THEMED_VOCAB_POOLS[themeName]) return THEMED_VOCAB_POOLS[themeName];
  for (const key of Object.keys(THEMED_VOCAB_POOLS)) {
    if (themeName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(themeName.toLowerCase())) {
      return THEMED_VOCAB_POOLS[key];
    }
  }
  // Fallback to rich foundational pool
  return THEMED_VOCAB_POOLS["Greetings & Salutations"];
}

// Generate the complete set of daily French mini-lessons
export function generateFrenchLessons(startISO, endISO) {
  const DAY_MS = 86400000;
  const parseISO = (s) => { const [y, m, d] = (s || "2026-08-15").split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
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

    const gIdx = (dayInModule - 1) % mod.grammar.length;
    const vIdx = (dayInModule - 1) % mod.vocabThemes.length;
    const grammarRule = mod.grammar[gIdx];
    const theme = mod.vocabThemes[vIdx];
    const vocabList = getVocabForTheme(theme);

    const title = `${theme} — ${grammarRule.split("(")[0].trim()}`;

    const lessonData = {
      title,
      moduleTitle: mod.title,
      moduleId: mod.id,
      level: mod.level,
      theme,
      grammarPoint: {
        topic: grammarRule,
        summary: `Today's grammar focus: ${grammarRule}. Practice forming clear, correct sentences using this structure in the context of "${theme}".`,
        rules: [
          `Core principle: ${grammarRule}.`,
          `Pay attention to correct agreements (gender/number) and pronoun placement.`,
          `Combine with today's vocabulary list to build natural French sentences.`
        ]
      },
      grammar: [grammarRule],
      vocabulary: vocabList,
      examples: [
        {
          fr: `${vocabList[0]?.exampleFr || `Aujourd'hui, j'étudie ${theme}.`}`,
          en: `${vocabList[0]?.exampleEn || `Today, I am studying ${theme}.`}`
        },
        {
          fr: `${vocabList[1]?.exampleFr || `Cette leçon permet de consolider ${grammarRule}.`}`,
          en: `${vocabList[1]?.exampleEn || `This lesson consolidates ${grammarRule}.`}`
        },
        {
          fr: `${vocabList[2]?.exampleFr || `Je m'exerce à voix haute pour parfaire ma prononciation.`}`,
          en: `${vocabList[2]?.exampleEn || `I practice aloud to perfect my pronunciation.`}`
        }
      ],
      selfStudyGuide: {
        listening: `Listen to today's vocabulary items using the speaker buttons above and repeat each word 3 times aloud.`,
        speaking: `Introduce the topic "${theme}" in 3 French sentences using today's grammar pattern (${grammarRule}).`,
        reading: `Read today's example sentences aloud and focus on smooth pronunciation and natural rhythm.`,
        writing: `Write 3 original sentences in your notebook combining words from today's vocabulary with "${grammarRule}".`
      },
      isReview: dayInModule % 6 === 0,
      status: "PENDING",
      minutesSpent: 0,
      targetMinutes: 60,
    };

    lessons.push({
      id: uid(),
      date,
      dayNumber,
      ...lessonData,
    });

    if (dayInModule >= mod.days && moduleIdx < FRENCH_MODULES.length - 1) {
      moduleIdx++;
      dayInModule = 0;
    }
  }

  return lessons;
}
