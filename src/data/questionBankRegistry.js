import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";

// Helper function to query questions from Firestore on-demand
async function fetchQuestionsFromFirestore(categoryKey, filterTopic = null, filterDifficulty = null, fallbackPath = null) {
  try {
    const qRef = collection(db, "questions");
    const constraints = [where("category", "==", categoryKey)];
    
    if (filterTopic && filterTopic !== 'all') {
      constraints.push(where("topic", "==", filterTopic));
    }
    
    if (filterDifficulty && filterDifficulty !== 'all') {
      constraints.push(where("difficulty", "==", filterDifficulty));
    }
    
    const q = query(qRef, ...constraints, limit(600));
    const snap = await getDocs(q);
    const data = [];
    snap.forEach((doc) => {
      data.push(doc.data());
    });
    
    if (data.length > 0) {
      console.log(`[Firestore Loader] Successfully loaded ${data.length} questions for category: ${categoryKey}`);
      return { default: data };
    }
    
    console.warn(`[Firestore Loader] No questions found in Firestore for ${categoryKey}, using fallback.`);
  } catch (err) {
    console.error(`[Firestore Loader] Error fetching questions for ${categoryKey}:`, err);
  }

  // Fallback to local public JSON files
  if (fallbackPath) {
    console.log(`[Firestore Loader] Fetching fallback from: ${fallbackPath}`);
    const res = await fetch(fallbackPath);
    const localData = await res.json();
    return { default: localData };
  }
  
  return { default: [] };
}

export const QuestionBankRegistry = [
  {
    id: "mechanical",
    label: "Mechanical Engineering",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return fetchQuestionsFromFirestore("Mechanical Engineering", filterTopic, filterDifficulty, "/data/mechEngQuestions.json");
    },
    enabled: true,
    estimatedCount: 23489,
    categoryKey: 'Mechanical Engineering',
    topics: [
      "Thermodynamics", "Fluid Mechanics", "Strength of Materials",
      "Manufacturing Engineering", "Machine Design", "Heat Transfer",
      "Theory of Machines", "Engineering Mechanics", "Industrial Engineering",
      "Materials Science", "Refrigeration & AC", "IC Engines",
      "Power Plant Engineering", "Theory of Machines & Vibrations",
      "Automation & CIM", "Automotive Engineering", "Production Management"
    ]
  },
  {
    id: "quantitative",
    label: "Quantitative Aptitude",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return fetchQuestionsFromFirestore("Quantitative Aptitude", filterTopic, filterDifficulty, "/data/quantsQuestions.json");
    },
    enabled: true,
    estimatedCount: 348,
    categoryKey: 'Quantitative Aptitude',
    topics: ["Percentages", "Profit & Loss", "Time & Work", "Algebra", "Geometry"]
  },
  {
    id: "data-interpretation",
    label: "Data Interpretation",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return fetchQuestionsFromFirestore("Data Interpretation", filterTopic, filterDifficulty, "/data/dataInterpretationQuestions.json");
    },
    enabled: true,
    estimatedCount: 5,
    categoryKey: 'Data Interpretation',
    topics: ["Tables", "Bar Charts", "Pie Charts", "Line Graphs"]
  },
  {
    id: "dilr",
    label: "DILR Puzzles",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return fetchQuestionsFromFirestore("DILR", filterTopic, filterDifficulty, "/data/dilrQuestions.json");
    },
    enabled: true,
    estimatedCount: 14,
    categoryKey: 'DILR',
    topics: ["Seating Arrangements", "Constraint Satisfaction", "Ordering"]
  },
  {
    id: "logical-reasoning",
    label: "Logical Reasoning",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return fetchQuestionsFromFirestore("Logical Reasoning", filterTopic, filterDifficulty, "/data/logicalReasoningQuestions.json");
    },
    enabled: true,
    estimatedCount: 59,
    categoryKey: 'Logical Reasoning',
    topics: ["Series", "Coding-Decoding", "Direction Sense", "Syllogisms"]
  }
];

export function getBankByCategory(categoryName) {
  return QuestionBankRegistry.find(b => b.categoryKey === categoryName || b.label === categoryName);
}

export function getBankById(id) {
  return QuestionBankRegistry.find(b => b.id === id);
}

