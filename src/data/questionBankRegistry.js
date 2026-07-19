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

  // Fallback to local public JSON files (filter client-side for topic)
  if (fallbackPath) {
    console.log(`[Firestore Loader] Fetching fallback from: ${fallbackPath}`);
    const res = await fetch(fallbackPath);
    const localData = await res.json();
    let filtered = localData;
    if (filterTopic && filterTopic !== 'all') {
      filtered = localData.filter(q => q.topic === filterTopic);
    }
    if (filterDifficulty && filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }
    return { default: filtered };
  }
  
  return { default: [] };
}

// Mech Engineering subtopic groups with real question counts from the data
export const MECH_TOPIC_GROUPS = [
  {
    group: 'Thermodynamics',
    emoji: '🔥',
    color: 'rgba(239,68,68,0.8)',
    topics: [
      { name: 'Thermodynamics', count: 5313 },
      { name: 'First Law of Thermodynamics', count: 1 },
      { name: 'Second Law of Thermodynamics', count: 2 },
      { name: 'Laws of Thermodynamics', count: 1 },
      { name: 'Thermodynamic Cycles', count: 2 },
      { name: 'Thermodynamic Processes', count: 4 },
      { name: 'Thermodynamic Properties', count: 2 },
      { name: 'Thermodynamic Systems', count: 1 },
      { name: 'Thermodynamic Equilibrium', count: 2 },
      { name: 'Entropy Change in Thermodynamics', count: 2 },
      { name: 'Entropy Change in Irreversible Processes', count: 1 },
      { name: 'Reversible Processes', count: 1 },
      { name: 'Reversible and Quasi-Static Processes', count: 1 },
      { name: 'Kinetic Theory of Gases', count: 1 },
      { name: 'Psychrometrics', count: 5 },
    ]
  },
  {
    group: 'Fluid Mechanics',
    emoji: '💧',
    color: 'rgba(6,182,212,0.8)',
    topics: [
      { name: 'Fluid Mechanics', count: 3030 },
      { name: 'Fluid Dynamics', count: 13 },
      { name: 'Fluid Statics', count: 7 },
      { name: 'Fluid Kinematics', count: 3 },
      { name: 'Fluid Measurement', count: 7 },
      { name: 'Fluid Properties', count: 5 },
      { name: 'Hydraulic Machines', count: 6 },
      { name: 'Hydraulic Structures', count: 6 },
      { name: 'Open Channel Flow', count: 1 },
    ]
  },
  {
    group: 'Heat Transfer',
    emoji: '♨️',
    color: 'rgba(245,158,11,0.8)',
    topics: [
      { name: 'Heat Transfer', count: 2457 },
      { name: 'Convection', count: 1 },
      { name: 'Reheat in Steam Turbines', count: 5 },
      { name: 'Refrigeration & AC', count: 22 },
      { name: 'Thermal Expansion', count: 1 },
      { name: 'Thermal Stress', count: 1 },
    ]
  },
  {
    group: 'Manufacturing',
    emoji: '🏭',
    color: 'rgba(139,92,246,0.8)',
    topics: [
      { name: 'Manufacturing Engineering', count: 2932 },
      { name: 'Manufacturing Science', count: 1 },
      { name: 'Machining & Machine Tools', count: 30 },
    ]
  },
  {
    group: 'Strength of Materials',
    emoji: '🏗️',
    color: 'rgba(16,185,129,0.8)',
    topics: [
      { name: 'Strength of Materials', count: 1893 },
      { name: 'Mechanical Properties of Materials', count: 1 },
      { name: 'Elastic Constants', count: 1 },
      { name: "Poisson's Ratio", count: 1 },
      { name: 'Section Modulus', count: 2 },
      { name: 'Shear Stress in Beams', count: 1 },
      { name: 'Bending Moment', count: 1 },
      { name: 'Torsion', count: 1 },
      { name: "Mohr's Circle", count: 1 },
      { name: 'Column Buckling', count: 2 },
      { name: 'Riveted Joints', count: 2 },
    ]
  },
  {
    group: 'Machine Design',
    emoji: '⚙️',
    color: 'rgba(255,107,0,0.8)',
    topics: [
      { name: 'Machine Design', count: 1687 },
      { name: 'Theory of Machines', count: 1388 },
      { name: 'Theory of Machines & Vibrations', count: 60 },
      { name: 'Vibration and Dynamics', count: 1 },
    ]
  },
  {
    group: 'Engineering Mechanics',
    emoji: '📐',
    color: 'rgba(236,72,153,0.8)',
    topics: [
      { name: 'Engineering Mechanics', count: 1043 },
      { name: 'Energy and Work', count: 2 },
      { name: 'Friction', count: 1 },
    ]
  },
  {
    group: 'Industrial & Production',
    emoji: '📊',
    color: 'rgba(99,102,241,0.8)',
    topics: [
      { name: 'Industrial Engineering', count: 59 },
      { name: 'Production Management', count: 4 },
      { name: 'Inventory Control', count: 8 },
      { name: 'CPM and PERT', count: 30 },
      { name: 'Automation & CIM', count: 30 },
    ]
  },
  {
    group: 'IC Engines & Power',
    emoji: '🔧',
    color: 'rgba(251,146,60,0.8)',
    topics: [
      { name: 'Internal Combustion Engines', count: 99 },
      { name: 'IC Engines', count: 8 },
      { name: 'Power Plant Engineering', count: 29 },
    ]
  },
  {
    group: 'Materials Science',
    emoji: '🔬',
    color: 'rgba(20,184,166,0.8)',
    topics: [
      { name: 'Materials Science', count: 14 },
      { name: 'Material Science', count: 29 },
      { name: 'Structural Analysis', count: 10 },
    ]
  },
  {
    group: 'Automotive Engineering',
    emoji: '🚗',
    color: 'rgba(34,197,94,0.8)',
    topics: [
      { name: 'Automotive Engineering', count: 21 },
      { name: 'Automotive Body Engineering', count: 2 },
      { name: 'Automotive Braking Systems', count: 15 },
      { name: 'Automotive Cooling Systems', count: 4 },
      { name: 'Automotive Electrical Systems', count: 25 },
      { name: 'Automotive Fuel Systems', count: 1 },
      { name: 'Automotive Fuels', count: 13 },
      { name: 'Automotive Lubrication', count: 11 },
      { name: 'Automotive Maintenance', count: 3 },
      { name: 'Automotive Transmission', count: 5 },
    ]
  },
];

// Flat list of all mech topics (for registry)
const ALL_MECH_TOPICS = MECH_TOPIC_GROUPS.flatMap(g => g.topics.map(t => t.name));

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
    topics: ALL_MECH_TOPICS,
    topicGroups: MECH_TOPIC_GROUPS,
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
