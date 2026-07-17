export const QuestionBankRegistry = [
  {
    id: "mechanical",
    label: "Mechanical Engineering",
    loader: async () => {
      const res = await fetch('/data/mechEngQuestions.json');
      const data = await res.json();
      return { default: data };
    },
    enabled: true,
    estimatedCount: 27368,
    categoryKey: 'Mechanical Engineering',
    topics: ["Thermodynamics", "Fluid Mechanics", "SOM", "Manufacturing", "Machine Design"]
  },
  {
    id: "quantitative",
    label: "Quantitative Aptitude",
    loader: async () => {
      const res = await fetch('/data/quantsQuestions.json');
      const data = await res.json();
      return { default: data };
    },
    enabled: true,
    estimatedCount: 3404,
    categoryKey: 'Quantitative Aptitude',
    topics: ["Percentages", "Profit & Loss", "Time & Work", "Algebra", "Geometry"]
  },
  {
    id: "data-interpretation",
    label: "Data Interpretation",
    loader: async () => {
      const res = await fetch('/data/dataInterpretationQuestions.json');
      const data = await res.json();
      return { default: data };
    },
    enabled: true,
    estimatedCount: 1500,
    categoryKey: 'Data Interpretation',
    topics: ["Tables", "Bar Charts", "Pie Charts", "Line Graphs"]
  },
  {
    id: "dilr",
    label: "DILR Puzzles",
    loader: async () => {
      const res = await fetch('/data/dilrQuestions.json');
      const data = await res.json();
      return { default: data };
    },
    enabled: true,
    estimatedCount: 2000,
    categoryKey: 'DILR',
    topics: ["Seating Arrangements", "Constraint Satisfaction", "Ordering"]
  },
  {
    id: "logical-reasoning",
    label: "Logical Reasoning",
    loader: async () => {
      const res = await fetch('/data/logicalReasoningQuestions.json');
      const data = await res.json();
      return { default: data };
    },
    enabled: true,
    estimatedCount: 3000,
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
