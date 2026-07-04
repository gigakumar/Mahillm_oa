export const topicDependencies = {
  // Strength of Materials & Mechanics
  "Strength of Materials": ["Engineering Mechanics"],
  "Principal Stress": ["Strength of Materials"],
  "Mohr Circle": ["Principal Stress"],
  "Failure Theories": ["Principal Stress", "Mohr Circle"],

  // Machine Design
  "Machine Design": ["Strength of Materials", "Failure Theories"],
  "Soderberg Criterion": ["Failure Theories", "Machine Design"],
  "Shaft Design": ["Machine Design", "Strength of Materials"],
  "Bearings & Lubrication": ["Machine Design", "Fluid Mechanics"],

  // Thermo & Fluids
  "Thermodynamics": [],
  "Rankine Cycle": ["Thermodynamics"],
  "Brayton Cycle": ["Thermodynamics"],
  "Fluid Mechanics": [],
  "Pipe Flow & Losses": ["Fluid Mechanics"],
  "Boundary Layer Theory": ["Fluid Mechanics"],
  "Heat Transfer": ["Thermodynamics", "Fluid Mechanics"],
  "Convective Heat Transfer": ["Heat Transfer", "Fluid Mechanics"],

  // Quantitative Aptitude
  "Probability": [],
  "Binomial & Normal Distributions": ["Probability"]
};
