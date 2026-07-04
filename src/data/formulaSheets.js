/**
 * Subject-wise Formulas Database
 *
 * Each formula has formula details, variable mappings, units, conditions,
 * common traps, and linked question IDs from the static bundles.
 */

export const FORMULA_SHEETS = [
  // Thermodynamics
  {
    id: "thermo_first_law",
    name: "First Law of Thermodynamics",
    subject: "Thermodynamics",
    formula: "dQ = dU + dW",
    variables: [
      "dQ = Heat transfer across boundaries",
      "dU = Change in internal energy",
      "dW = Work transfer across boundaries"
    ],
    units: [
      "Heat (dQ): Joules (J) or kJ",
      "Internal Energy (dU): Joules (J)",
      "Work (dW): Joules (J)"
    ],
    conditions: "Applicable to any system undergoing a thermodynamic cycle or process.",
    common_trap: "Sign convention! Heat entering the system is positive (+dQ), heat leaving is negative (-dQ). Work done BY the system is positive (+dW), work done ON the system is negative (-dW).",
    linkedQuestions: [4] // battery charging question uses dU = dQ - dW
  },
  {
    id: "thermo_polytropic_work",
    name: "Polytropic Process Work done",
    subject: "Thermodynamics",
    formula: "W = \\frac{P_1 V_1 - P_2 V_2}{n - 1}",
    variables: [
      "W = Work done in polytropic process",
      "P1, P2 = Initial and final absolute pressures",
      "V1, V2 = Initial and final volumes",
      "n = Polytropic index"
    ],
    units: [
      "Pressure (P): Pascals (Pa or N/m²)",
      "Volume (V): cubic meters (m³)",
      "Work (W): Joules (J)"
    ],
    conditions: "Reversible polytropic process in a closed system where n ≠ 1.",
    common_trap: "Pressures MUST be absolute pressures (not gauge pressures). If n = 1, this formula is undefined; use the isothermal work formula: W = P1*V1*ln(V2/V1).",
    linkedQuestions: [3] // constant volume polytropic index
  },
  {
    id: "thermo_free_expansion",
    name: "Free Expansion Work",
    subject: "Thermodynamics",
    formula: "W = 0",
    variables: [
      "W = Work done by gas expanding into vacuum"
    ],
    units: [
      "Work (W): Joules (J)"
    ],
    conditions: "Expansion of gas into a completely evacuated chamber (vacuum). No external constraint.",
    common_trap: "Even though there is a change in volume (dV > 0), no work is performed because there is no external resistance (P_external = 0). Thus, W = ∫P_ext dV = 0.",
    linkedQuestions: [2] // work done in free expansion is zero
  },
  {
    id: "thermo_third_law",
    name: "Third Law of Thermodynamics (Absolute Entropy)",
    subject: "Thermodynamics",
    formula: "S_{0K} = 0",
    variables: [
      "S = Entropy of a pure crystalline substance"
    ],
    units: [
      "Entropy (S): J/K"
    ],
    conditions: "At absolute zero temperature (0 Kelvin) for a perfectly crystalline substance.",
    common_trap: "Applies only to perfectly crystalline substances. If there is any disorder/residual entropy (e.g. ice, CO), S at 0K is greater than 0.",
    linkedQuestions: [5] // entropy of water at 0K is assumed to be 0
  },

  // Strength of Materials (SOM)
  {
    id: "som_axial_deformation",
    name: "Axial Deformation of a Bar",
    subject: "Strength of Materials",
    formula: "\\delta = \\frac{P L}{A E}",
    variables: [
      "\\delta = Deformation / change in length",
      "P = Axial tensile or compressive load",
      "L = Original length of the bar",
      "A = Cross-sectional area",
      "E = Young's Modulus of elasticity"
    ],
    units: [
      "Deformation (\\delta): meters (m) or millimeters (mm)",
      "Load (P): Newtons (N)",
      "Length (L): meters (m)",
      "Area (A): square meters (m²)",
      "Young's Modulus (E): Pascals (Pa or N/m²)"
    ],
    conditions: "Linear elastic material behavior, homogeneous cross section, axial load passes through centroid.",
    common_trap: "Using incompatible units! Ensure that length is converted to mm if area is in mm² and Young's Modulus is in MPa (N/mm²).",
    linkedQuestions: []
  },

  // Quantitative Aptitude
  {
    id: "quant_successive_profit_loss",
    name: "Same Price Selling Successive Change",
    subject: "Quantitative Aptitude",
    formula: "\\text{Net Loss \\%} = \\left(\\frac{x}{10}\\right)^2 \\%",
    variables: [
      "x = Common profit and loss percentage percentage"
    ],
    units: [
      "Loss: percentage (%)"
    ],
    conditions: "Two items are sold at the same selling price (SP), one at x% profit and the other at x% loss.",
    common_trap: "This scenario ALWAYS results in a net loss. The common trap is selecting 'No profit, no loss' because of the matching percentages.",
    linkedQuestions: [20001] // person sold two different items at same price (10% profit, 10% loss)
  },
  {
    id: "quant_classical_probability",
    name: "Classical Probability",
    subject: "Quantitative Aptitude",
    formula: "P(A) = \\frac{N(A)}{N(S)}",
    variables: [
      "P(A) = Probability of event A occurring",
      "N(A) = Number of favorable outcomes",
      "N(S) = Total number of outcomes in the sample space"
    ],
    units: [
      "Probability: Dimensionless ratio between 0 and 1"
    ],
    conditions: "Equally likely finite outcomes.",
    common_trap: "Forgetting to adjust the sample space size in consecutive draws without replacement.",
    linkedQuestions: [20003] // probability of orange ball in consecutive draws
  }
];
