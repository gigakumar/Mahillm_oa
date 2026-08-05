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
      console.log(`[Firestore Loader] Successfully loaded ${data.length} questions for category: ${categoryKey}${filterTopic ? ` / topic: ${filterTopic}` : ''}`);
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
    let filtered = localData;
    // We don't filter mech topics here anymore because they're pre-split in their own files
    if (categoryKey !== 'Mechanical Engineering' && filterTopic && filterTopic !== 'all') {
      filtered = localData.filter(q => q.topic === filterTopic);
    }
    if (filterDifficulty && filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }
    return { default: filtered };
  }
  
  return { default: [] };
}

// Helper to load multiple JSON files and combine them
async function loadMultipleJSONs(categoryKey, files, filterTopic, filterDifficulty, customFilterFn = null) {
  const promises = files.map(f => fetchQuestionsFromFirestore(categoryKey, filterTopic, filterDifficulty, `/data/mech_topics/${f}`));
  const results = await Promise.all(promises);
  let combined = results.flatMap(r => r.default);
  
  if (customFilterFn) {
    combined = combined.filter(customFilterFn);
  }
  
  return { default: combined };
}

// Mech Engineering subtopic groups with real question counts from the data
export const MECH_TOPIC_GROUPS = [
  {
    group: 'Thermodynamics',
    emoji: '🔥',
    color: 'rgba(239,68,68,0.8)',
    topics: [
      { name: 'Thermodynamics', count: 4900 },
      { name: 'Laws & Cycles of Thermodynamics', count: 15 },
      { name: 'Psychrometrics', count: 5 },
    ]
  },
  {
    group: 'Fluid Mechanics',
    emoji: '💧',
    color: 'rgba(6,182,212,0.8)',
    topics: [
      { name: 'Fluid Mechanics', count: 2835 },
      { name: 'Fluid Dynamics & Statics', count: 35 },
      { name: 'Hydraulic Machines', count: 12 },
    ]
  },
  {
    group: 'Heat Transfer',
    emoji: '♨️',
    color: 'rgba(245,158,11,0.8)',
    topics: [
      { name: 'Heat Transfer', count: 2270 },
      { name: 'Refrigeration & Air Conditioning', count: 22 },
      { name: 'Thermal Systems', count: 8 },
    ]
  },
  {
    group: 'Manufacturing',
    emoji: '🏭',
    color: 'rgba(139,92,246,0.8)',
    topics: [
      { name: 'Manufacturing Engineering', count: 2804 },
      { name: 'Machining & Machine Tools', count: 30 },
    ]
  },
  {
    group: 'Strength of Materials',
    emoji: '🏗️',
    color: 'rgba(16,185,129,0.8)',
    topics: [
      { name: 'Strength of Materials', count: 1755 },
      { name: 'Stress, Strain & Beams', count: 12 },
    ]
  },
  {
    group: 'Machine Design',
    emoji: '⚙️',
    color: 'rgba(255,107,0,0.8)',
    topics: [
      { name: 'Machine Design', count: 1616 },
      { name: 'Theory of Machines & Vibrations', count: 1237 },
    ]
  },
  {
    group: 'Engineering Mechanics',
    emoji: '📐',
    color: 'rgba(236,72,153,0.8)',
    topics: [
      { name: 'Engineering Mechanics', count: 971 },
    ]
  },
  {
    group: 'Industrial & Production',
    emoji: '📊',
    color: 'rgba(99,102,241,0.8)',
    topics: [
      { name: 'Industrial Engineering', count: 62 },
      { name: 'CPM, PERT & Inventory Control', count: 68 },
    ]
  },
  {
    group: 'IC Engines & Power',
    emoji: '🔧',
    color: 'rgba(251,146,60,0.8)',
    topics: [
      { name: 'Internal Combustion Engines', count: 107 },
      { name: 'Power Plant Engineering', count: 29 },
    ]
  },
  {
    group: 'Materials Science',
    emoji: '🔬',
    color: 'rgba(20,184,166,0.8)',
    topics: [
      { name: 'Material Science', count: 39 },
    ]
  },
  {
    group: 'Automotive Engineering',
    emoji: '🚗',
    color: 'rgba(34,197,94,0.8)',
    topics: [
      { name: 'Automotive Engineering', count: 95 },
    ]
  },
];

// Flat list of all mech topics (for registry)
const ALL_MECH_TOPICS = MECH_TOPIC_GROUPS.flatMap(g => g.topics.map(t => t.name));

// Helper to convert topic name to file name matching split script
function getTopicFileName(topic) {
  if (!topic) return 'uncategorized.json';
  return topic.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '.json';
}

export const QuestionBankRegistry = [
  {
    id: "mechanical",
    label: "Mechanical Engineering",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      // Direct load specific topic file instead of the huge mechEngQuestions.json
      const fileName = (filterTopic && filterTopic !== 'all') ? getTopicFileName(filterTopic) : 'mechanical_engineering.json';
      return fetchQuestionsFromFirestore("Mechanical Engineering", filterTopic, filterDifficulty, `/data/mech_topics/${fileName}`);
    },
    enabled: true,
    estimatedCount: 23489,
    categoryKey: 'Mechanical Engineering',
    topics: ALL_MECH_TOPICS,
    topicGroups: MECH_TOPIC_GROUPS,
  },
  {
    id: "quantitative",
    label: "Quantitative Aptitude",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      // Use the quantitative aptitude split from mechanical as it has answers
      return fetchQuestionsFromFirestore("Quantitative Aptitude", filterTopic, filterDifficulty, "/data/mech_topics/quantitative_aptitude.json");
    },
    enabled: true,
    estimatedCount: 868,
    categoryKey: 'Quantitative Aptitude',
    topics: ["Arithmetic", "Algebra", "Geometry"]
  },
  {
    id: "data-interpretation",
    label: "Data Interpretation",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      // Use DI split from mechanical
      return fetchQuestionsFromFirestore("Data Interpretation", filterTopic, filterDifficulty, "/data/mech_topics/data_interpretation.json");
    },
    enabled: true,
    estimatedCount: 556,
    categoryKey: 'Data Interpretation',
    topics: ["Tables", "Charts"]
  },
  {
    id: "dilr",
    label: "DILR Puzzles",
    loader: async (filterTopic = null, filterDifficulty = null) => {
      // Use our brand new Gemini generated CAT DILR sets!
      return fetchQuestionsFromFirestore("DILR", filterTopic, filterDifficulty, "/data/normalized_dilr.json");
    },
    enabled: true,
    estimatedCount: 20,
    categoryKey: 'DILR',
    topics: ["Seating Arrangements", "Constraint Satisfaction", "Ordering", "Matrix Arrangement", "Multiple Charts"]
  },
  
  // DIGITAL BOOKS CLASSIFICATIONS
  {
    id: "book_thermo_heat",
    label: "Thermodynamics & Heat Transfer",
    isDigitalBook: true,
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return loadMultipleJSONs("Mechanical Engineering", ["thermodynamics.json", "heat_transfer.json"], filterTopic, filterDifficulty);
    },
    enabled: true,
    estimatedCount: 7154,
    categoryKey: 'book_thermo_heat',
    topics: ["Thermodynamics", "Heat Transfer"]
  },
  {
    id: "book_fluids",
    label: "Fluid Mechanics & Hydraulics",
    isDigitalBook: true,
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return loadMultipleJSONs("Mechanical Engineering", ["fluid_mechanics.json", "hydraulic_machines.json", "hydraulic_structures.json"], filterTopic, filterDifficulty);
    },
    enabled: true,
    estimatedCount: 2837,
    categoryKey: 'book_fluids',
    topics: ["Fluid Mechanics", "Hydraulics"]
  },
  {
    id: "book_tom_vib",
    label: "Theory of Machines & Vibrations",
    isDigitalBook: true,
    loader: async (filterTopic = null, filterDifficulty = null) => {
      return loadMultipleJSONs("Mechanical Engineering", ["theory_of_machines.json", "theory_of_machines_vibrations.json"], filterTopic, filterDifficulty);
    },
    enabled: true,
    estimatedCount: 1236,
    categoryKey: 'book_tom_vib',
    topics: ["Theory of Machines", "Vibrations"]
  },
  {
    id: "book_high_yield_nat",
    label: "GATE Top 1000 Numerical PYQs",
    isDigitalBook: true,
    loader: async (filterTopic = null, filterDifficulty = null) => {
      // Load from main mechanical file, filter only NAT questions
      return loadMultipleJSONs("Mechanical Engineering", ["mechanical_engineering.json"], filterTopic, filterDifficulty, (q) => q.type === 'NAT');
    },
    enabled: true,
    estimatedCount: 1000,
    categoryKey: 'book_high_yield_nat',
    topics: ["Numerical Answer Type"]
  }
];

export function getBankByCategory(categoryName) {
  return QuestionBankRegistry.find(b => b.categoryKey === categoryName || b.label === categoryName);
}

export function getBankById(id) {
  return QuestionBankRegistry.find(b => b.id === id);
}
