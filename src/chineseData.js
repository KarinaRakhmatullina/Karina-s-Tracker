/* =========================================================================
   CHINESE HSK 3 FLASHCARDS & CONTROLLED REVIEW QUEUE
   Controls daily workload with configurable new words/day and max reviews/day,
   preventing the pile-up explosion of review cards.
   ========================================================================= */

export const CHINESE_SEED_VOCAB = [
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

export const CHINESE_STATUS_LABELS = {
  NEW: "New",
  DIFFICULT: "Difficult",
  NEED_REVIEW: "Need Review",
  LEARNED: "Learned",
  MASTERED: "Mastered",
};

// Spaced repetition intervals in days
export const CHINESE_REVIEW_INTERVALS = {
  DIFFICULT: 1,
  NEED_REVIEW: 2,
  LEARNED: 4,
  MASTERED: 8,
};

export function blankChineseFlashcard() {
  return {
    id: null,
    hanzi: "",
    pinyin: "",
    meaning: "",
    exampleSentence: "",
    exampleTranslation: "",
    status: "NEW",
    nextReviewDate: null,
    lastReviewedDate: null,
    addedDate: new Date().toISOString().slice(0, 10),
    isCustom: false,
  };
}

export function blankChineseExam() {
  return {
    registrationDate: "2026-12-01",
    examDate: "2027-01-15",
    isTBC: true,
    resultsDate: "",
    confirmed: false,
  };
}

/**
 * Intelligent, bounded review queue:
 * Selects up to `dailyNewWords` new cards + up to `maxReviews` due review cards.
 * Prioritizes: OVERDUE / DIFFICULT -> NEED_REVIEW -> LEARNED -> MASTERED.
 * Prevents explosion of review cards!
 */
export function getDailyChineseSessionCards(chinese, settings, todayIso) {
  const cards = chinese.flashcards || [];
  const maxNew = Number(settings.dailyChineseWords) || 5;
  const maxReviews = Number(settings.dailyChineseMaxReviews) || 10;

  // 1. New cards for today (unreviewed)
  const newCards = cards
    .filter((c) => c.status === "NEW" || !c.lastReviewedDate)
    .slice(0, maxNew);

  // 2. Due review cards
  const statusPriority = { DIFFICULT: 1, NEED_REVIEW: 2, LEARNED: 3, MASTERED: 4 };
  const dueReviews = cards
    .filter((c) => c.status !== "NEW" && c.lastReviewedDate && (!c.nextReviewDate || c.nextReviewDate <= todayIso))
    .sort((a, b) => {
      // Sort by priority first (Difficult before Learned)
      const pA = statusPriority[a.status] || 5;
      const pB = statusPriority[b.status] || 5;
      if (pA !== pB) return pA - pB;
      // Then by oldest due date
      return (a.nextReviewDate || "").localeCompare(b.nextReviewDate || "");
    })
    .slice(0, maxReviews);

  return {
    newCards,
    dueReviews,
    allSessionCards: [...newCards, ...dueReviews],
    totalDueCount: cards.filter((c) => c.status === "NEW" || !c.nextReviewDate || c.nextReviewDate <= todayIso).length,
    maxNew,
    maxReviews,
  };
}
