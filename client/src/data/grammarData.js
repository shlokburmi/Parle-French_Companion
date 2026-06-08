export const grammarData = [
  {
    id: "#001",
    title: "Le Présent",
    subtitle: "Present Tense",
    level: "A1",
    category: "Verbs",
    description: "The present tense (le présent) is used to express current actions, habitual behaviors, and general truths. Regular verbs belong to three main groups (-er, -ir, -re) and have predictable ending patterns.",
    conjugations: {
      headers: ["Pronoun", "-er (parler)", "-ir (finir)", "-re (vendre)"],
      rows: [
        ["Je / J'", "parle", "finis", "vends"],
        ["Tu", "parles", "finis", "vends"],
        ["Il / Elle / On", "parle", "finit", "vend"],
        ["Nous", "parlons", "finissons", "vendons"],
        ["Vous", "parlez", "finissez", "vendez"],
        ["Ils / Elles", "parlent", "finissent", "vendent"]
      ]
    },
    examples: [
      { textFr: "Je parle français tous les jours.", textEn: "I speak French every day." },
      { textFr: "Nous finissons notre repas.", textEn: "We are finishing our meal." },
      { textFr: "Ils vendent des livres anciens.", textEn: "They sell old books." }
    ],
    quiz: {
      question: "Complete the sentence: 'Vous ____ (finir) votre travail.'",
      options: ["finis", "finissez", "finissons", "finissent"],
      answer: "finissez",
      explanation: "For '-ir' verbs matching 'Vous', the ending is '-issez'. Therefore, 'finissez' is correct."
    }
  },
  {
    id: "#002",
    title: "Le Passé Composé",
    subtitle: "Past Tense",
    level: "A2",
    category: "Verbs",
    description: "The passé composé is the most common past tense in French. It is used to describe completed actions in the past. It is formed using an auxiliary verb (avoir or être) in the present tense, followed by the past participle of the main verb.",
    conjugations: {
      headers: ["Pronoun", "with Avoir (manger)", "with Être (aller)*"],
      rows: [
        ["Je / J'", "ai mangé", "suis allé(e)"],
        ["Tu", "as mangé", "es allé(e)"],
        ["Il / Elle / On", "a mangé", "est allé(e)"],
        ["Nous", "avons mangé", "sommes allé(e)s"],
        ["Vous", "avez mangé", "êtes allé(e)(s)"],
        ["Ils / Elles", "ont mangé", "sont allé(e)s"]
      ]
    },
    examples: [
      { textFr: "J'ai mangé une pomme rouge.", textEn: "I ate a red apple." },
      { textFr: "Elle est allée à Paris hier.", textEn: "She went to Paris yesterday." }
    ],
    quiz: {
      question: "Which auxiliary verb is used for 'partir' (to leave) in: 'Nous ____ partis.'?",
      options: ["avons", "sommes", "somme", "avez"],
      answer: "sommes",
      explanation: "'Partir' is a verb of motion (Dr. & Mrs. Vandertramp) and uses 'être' as its auxiliary verb in passé composé."
    }
  },
  {
    id: "#003",
    title: "L'Imparfait",
    subtitle: "Imperfect Tense",
    level: "B1",
    category: "Verbs",
    description: "The imperfect tense (l'imparfait) is used for descriptions in the past, ongoing actions with no specific start or end, and habitual past actions (used to / was doing). To form it, take the 'nous' present tense stem and add: -ais, -ais, -ait, -ions, -iez, -aient.",
    conjugations: {
      headers: ["Pronoun", "parler (stem: parl-)", "finir (stem: finiss-)", "être (irregular stem: ét-)"],
      rows: [
        ["Je / J'", "parlais", "finissais", "étais"],
        ["Tu", "parlais", "finissais", "étais"],
        ["Il / Elle / On", "parlait", "finissait", "était"],
        ["Nous", "parlions", "finissions", "étions"],
        ["Vous", "parliez", "finissiez", "étiez"],
        ["Ils / Elles", "parlaient", "finissaient", "étaient"]
      ]
    },
    examples: [
      { textFr: "Quand j'étais jeune, je jouais au tennis.", textEn: "When I was young, I used to play tennis." },
      { textFr: "Il faisait beau à Nice.", textEn: "The weather was beautiful in Nice." }
    ],
    quiz: {
      question: "Choose the correct form: 'Pendant que tu ____ (lire), je dormais.'",
      options: ["lisais", "lisait", "lisions", "lisez"],
      answer: "lisais",
      explanation: "For 'tu', the imparfait ending is '-ais'. The stem of 'lire' is 'lis-' (from 'nous lisons'). Hence, 'lisais' is correct."
    }
  },
  {
    id: "#004",
    title: "Les Articles Partitifs",
    subtitle: "Partitive Articles",
    level: "A1",
    category: "Articles",
    description: "Partitive articles (du, de la, de l', des) are used to express an unspecified quantity of something, usually food, drink, or mass nouns (some / any). Under negation, they all change to 'de' or 'd''.",
    conjugations: {
      headers: ["Gender/Type", "Positive Article", "Negative Form", "Example"],
      rows: [
        ["Masculine", "du (du pain)", "de (pas de pain)", "Je mange du pain."],
        ["Feminine", "de la (de la confiture)", "de (pas de confiture)", "Je prends de la confiture."],
        ["Before Vowel", "de l' (de l'eau)", "d' (pas d'eau)", "Il boit de l'eau."],
        ["Plural", "des (des frites)", "de (pas de frites)", "Elles mangent des frites."]
      ]
    },
    examples: [
      { textFr: "Je veux du café et de la brioche.", textEn: "I want some coffee and some brioche." },
      { textFr: "Je ne bois pas de lait.", textEn: "I don't drink any milk." }
    ],
    quiz: {
      question: "Complete the sentence: 'Je ne mange pas ____ viande.' (viande is feminine)",
      options: ["de la", "de", "du", "des"],
      answer: "de",
      explanation: "Under negation (ne... pas), partitive articles are replaced by 'de' regardless of the gender or number of the noun."
    }
  },
  {
    id: "#005",
    title: "Pronoms COD / COI",
    subtitle: "Object Pronouns",
    level: "B1",
    category: "Pronouns",
    description: "Direct Object Pronouns (COD) replace nouns that directly receive the action of the verb. Indirect Object Pronouns (COI) replace nouns preceded by the preposition 'à' (to/for someone). Pronouns are placed *before* the conjugated verb.",
    conjugations: {
      headers: ["Person", "Direct Pronoun (COD)", "Indirect Pronoun (COI)", "Example (COD / COI)"],
      rows: [
        ["1st Sing (Me)", "me / m'", "me / m'", "Il me voit. / Il me parle."],
        ["2nd Sing (You)", "te / t'", "te / t'", "Je te cherche. / Je te donne."],
        ["3rd Sing (Him/Her)", "le / la / l'", "lui", "Je la connais. / Je lui réponds."],
        ["1st Plur (Us)", "nous", "nous", "Elle nous aide. / Elle nous écrit."],
        ["2nd Plur (You)", "vous", "vous", "Je vous écoute. / Je vous parle."],
        ["3rd Plur (Them)", "les", "leur", "Il les achète. / Il leur téléphone."]
      ]
    },
    examples: [
      { textFr: "Le livre ? Je le lis.", textEn: "The book? I am reading it." },
      { textFr: "J'ai vu Marie et je lui ai parlé.", textEn: "I saw Marie and I spoke to her." }
    ],
    quiz: {
      question: "Replace the object in: 'J'écris à ma mère.' -> 'Je ____ écris.'",
      options: ["la", "lui", "leur", "le"],
      answer: "lui",
      explanation: "'à ma mère' is a singular indirect object (COI), so it is replaced by 'lui' placed before the verb."
    }
  },
  {
    id: "#006",
    title: "Le Subjonctif",
    subtitle: "Subjunctive Mood",
    level: "B2",
    category: "Verbs",
    description: "The subjunctive mood (le subjonctif) is used to express subjective attitudes like necessity, doubt, emotion, desires, or possibilities. It is almost always introduced by 'que'. To form, use the present 'ils' stem + -e, -es, -e, -ions, -iez, -aient.",
    conjugations: {
      headers: ["Pronoun", "parler (stem: parl-)", "finir (stem: finiss-)", "faire (irregular: fass-)"],
      rows: [
        ["que je", "parle", "finisse", "fasse"],
        ["que tu", "parles", "finisses", "fasses"],
        ["qu'il / elle", "parle", "finisse", "fasse"],
        ["que nous", "parlions", "finissions", "fassions"],
        ["que vous", "parliez", "finissiez", "fassiez"],
        ["qu'ils / elles", "parlent", "finissent", "fassent"]
      ]
    },
    examples: [
      { textFr: "Il faut que tu fasses tes devoirs.", textEn: "It is necessary that you do your homework." },
      { textFr: "Je veux que nous parlions français.", textEn: "I want us to speak French." }
    ],
    quiz: {
      question: "Complete: 'Je crains qu'elle ne ____ (partir) trop tôt.'",
      options: ["parles", "part", "parte", "partes"],
      answer: "parte",
      explanation: "'partir' in subjunctive singular for 'elle' is 'parte' (stem: part- from present plural 'ils partent' + '-e')."
    }
  }
];
