/**
 * Subject-wise Formulas Database
 *
 * Each formula includes:
 * - id: unique string key
 * - name: human-readable name of equation
 * - subject: topic domain
 * - formula: LaTeX string for rendering equations
 * - readable: plain-text fallback format for screen readers / instant reading
 * - variables: array of parameter definitions
 * - units: array of parameter SI units
 * - conditions: prerequisite conditions & boundary limits
 * - common_trap: common conceptual/unit mistakes
 * - linkedQuestions: associated static question IDs
 */

export const FORMULA_SHEETS = [
  // ==========================================
  // Thermodynamics
  // ==========================================
  {
    id: "thermo_first_law",
    name: "First Law of Thermodynamics",
    subject: "Thermodynamics",
    formula: "dQ = dU + dW",
    readable: "dQ = dU + dW",
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
    conditions: "Applicable to any closed system undergoing a thermodynamic process or cycle.",
    common_trap: "Sign convention! Heat entering the system (+dQ) is positive; heat leaving (-dQ) is negative. Work done BY system (+dW) is positive; work done ON system (-dW) is negative.",
    linkedQuestions: [4]
  },
  {
    id: "thermo_polytropic_work",
    name: "Polytropic Process Work Done",
    subject: "Thermodynamics",
    formula: "W = \\frac{P_1 V_1 - P_2 V_2}{n - 1}",
    readable: "W = (P₁V₁ - P₂V₂) / (n - 1)",
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
    common_trap: "Pressures MUST be absolute pressures (not gauge). If n = 1 (isothermal), use W = P1*V1*ln(V2/V1).",
    linkedQuestions: [3]
  },
  {
    id: "thermo_isothermal_work",
    name: "Isothermal Process Work Done",
    subject: "Thermodynamics",
    formula: "W = P_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right)",
    readable: "W = P₁V₁ · ln(V₂ / V₁)",
    variables: [
      "W = Work done at constant temperature",
      "P1 = Initial absolute pressure",
      "V1, V2 = Initial and final volumes"
    ],
    units: [
      "Pressure (P): Pascals (Pa)",
      "Volume (V): m³",
      "Work (W): Joules (J)"
    ],
    conditions: "Reversible constant-temperature process for an ideal gas (n = 1).",
    common_trap: "Natural logarithm (ln) must be used, not log base 10 (log10).",
    linkedQuestions: []
  },
  {
    id: "thermo_carnot_efficiency",
    name: "Carnot Engine Efficiency",
    subject: "Thermodynamics",
    formula: "\\eta_{\\text{Carnot}} = 1 - \\frac{T_L}{T_H}",
    readable: "η = 1 - (T_L / T_H)",
    variables: [
      "\\eta_{\\text{Carnot}} = Maximum theoretical efficiency",
      "T_L = Absolute temperature of cold reservoir",
      "T_H = Absolute temperature of hot reservoir"
    ],
    units: [
      "Temperature (T_L, T_H): Kelvin (K)",
      "Efficiency (\\eta): Dimensionless fraction (or %)"
    ],
    conditions: "Reversible heat engine operating between two constant-temperature reservoirs.",
    common_trap: "Temperatures MUST be converted to Kelvin (K = °C + 273.15). Never use Celsius directly!",
    linkedQuestions: []
  },
  {
    id: "thermo_free_expansion",
    name: "Free Expansion Work",
    subject: "Thermodynamics",
    formula: "W = 0",
    readable: "W = 0,  dU = 0,  dQ = 0",
    variables: [
      "W = Work done by gas expanding into vacuum",
      "dU = Internal energy change (ideal gas)",
      "dQ = Heat transfer across adiabatic vacuum wall"
    ],
    units: [
      "Work (W): Joules (J)"
    ],
    conditions: "Unrestrained expansion into an evacuated space (vacuum).",
    common_trap: "Even though dV > 0, work is ZERO because external resisting pressure P_ext = 0.",
    linkedQuestions: [2]
  },
  {
    id: "thermo_third_law",
    name: "Third Law of Thermodynamics",
    subject: "Thermodynamics",
    formula: "S_{0\\text{K}} = 0",
    readable: "S (at 0 K) = 0",
    variables: [
      "S = Entropy of a pure crystalline substance"
    ],
    units: [
      "Entropy (S): J/K"
    ],
    conditions: "At absolute zero temperature (0 Kelvin) for a perfectly ordered crystal.",
    common_trap: "Applies ONLY to perfect crystals. Amorphous solids or mixed crystals retain residual entropy > 0.",
    linkedQuestions: [5]
  },
  {
    id: "thermo_ideal_gas",
    name: "Ideal Gas State Equation",
    subject: "Thermodynamics",
    formula: "P V = m R T",
    readable: "P · V = m · R · T",
    variables: [
      "P = Absolute pressure",
      "V = Volume",
      "m = Mass of gas",
      "R = Specific gas constant",
      "T = Absolute temperature"
    ],
    units: [
      "Pressure (P): Pa (N/m²)",
      "Volume (V): m³",
      "Mass (m): kg",
      "Gas Constant (R): J/(kg·K)",
      "Temperature (T): K"
    ],
    conditions: "Low pressure and high temperature relative to critical point.",
    common_trap: "Confusing specific gas constant R (e.g., R_air = 287 J/kg·K) with universal gas constant R_u = 8.314 J/mol·K.",
    linkedQuestions: []
  },

  // ==========================================
  // Strength of Materials (SOM)
  // ==========================================
  {
    id: "som_axial_deformation",
    name: "Axial Deformation of a Bar",
    subject: "Strength of Materials",
    formula: "\\delta = \\frac{P L}{A E}",
    readable: "δ = (P · L) / (A · E)",
    variables: [
      "\\delta = Elongation or contraction length",
      "P = Axial force applied",
      "L = Initial length of bar",
      "A = Cross-sectional area",
      "E = Young's Modulus of elasticity"
    ],
    units: [
      "Deformation (\\delta): meters (m) or mm",
      "Load (P): Newtons (N)",
      "Length (L): meters (m)",
      "Area (A): m² or mm²",
      "Modulus (E): Pascals (Pa or N/m²)"
    ],
    conditions: "Linear elastic material, constant cross-section, concentric axial force.",
    common_trap: "Unit mismatches! If E is in MPa (N/mm²), keep A in mm² and L in mm to get deformation directly in mm.",
    linkedQuestions: []
  },
  {
    id: "som_hookes_law",
    name: "Hooke's Law (Normal Stress)",
    subject: "Strength of Materials",
    formula: "\\sigma = E \\cdot \\epsilon",
    readable: "σ = E · ε",
    variables: [
      "\\sigma = Normal stress",
      "E = Young's Modulus",
      "\\epsilon = Normal strain (\\Delta L / L)"
    ],
    units: [
      "Stress (\\sigma): N/m² (Pa) or MPa",
      "Modulus (E): N/m² (Pa)",
      "Strain (\\epsilon): Dimensionless ratio"
    ],
    conditions: "Valid up to proportional limit of material.",
    common_trap: "Hooke's law ceases to be linear beyond the proportional limit and yield point.",
    linkedQuestions: []
  },
  {
    id: "som_bending_equation",
    name: "Flexure / Bending Formula",
    subject: "Strength of Materials",
    formula: "\\frac{M}{I} = \\frac{\\sigma}{y} = \\frac{E}{R}",
    readable: "M / I = σ / y = E / R",
    variables: [
      "M = Bending moment at section",
      "I = Area Moment of Inertia about neutral axis",
      "\\sigma = Bending stress at distance y from neutral axis",
      "y = Distance from neutral axis",
      "E = Young's Modulus",
      "R = Radius of curvature of neutral axis"
    ],
    units: [
      "Bending Moment (M): N·m",
      "Moment of Inertia (I): m⁴ or mm⁴",
      "Bending Stress (\\sigma): Pa or N/mm²",
      "Distance (y): m or mm"
    ],
    conditions: "Pure bending, homogeneous linear-elastic material, symmetric cross-section.",
    common_trap: "Maximum stress occurs at extreme fiber (y_max = d/2 for circular/rectangular beams).",
    linkedQuestions: []
  },
  {
    id: "som_torsion_equation",
    name: "Torsion Equation for Circular Shafts",
    subject: "Strength of Materials",
    formula: "\\frac{T}{J} = \\frac{\\tau}{r} = \\frac{G \\theta}{L}",
    readable: "T / J = τ / r = G · θ / L",
    variables: [
      "T = Applied torque",
      "J = Polar moment of inertia (\\pi d⁴ / 32 for solid shaft)",
      "\\tau = Shear stress at radius r",
      "r = Radial distance from central axis",
      "G = Shear modulus (Modulus of Rigidity)",
      "\\theta = Angle of twist in radians",
      "L = Length of shaft"
    ],
    units: [
      "Torque (T): N·m",
      "Polar Inertia (J): m⁴",
      "Shear Stress (\\tau): Pa",
      "Twist (\\theta): Radians (rad)"
    ],
    conditions: "Pure torsion of uniform solid or hollow circular shafts within elastic limit.",
    common_trap: "Angle of twist (\\theta) MUST be in radians when using G*\\theta/L (1 rad = 180° / \\pi).",
    linkedQuestions: []
  },
  {
    id: "som_elastic_moduli_relation",
    name: "Elastic Constants Relationship",
    subject: "Strength of Materials",
    formula: "E = 2 G (1 + \\nu) = 3 K (1 - 2\\nu)",
    readable: "E = 2G(1 + ν) = 3K(1 - 2ν)",
    variables: [
      "E = Young's Modulus",
      "G = Shear Modulus",
      "K = Bulk Modulus",
      "\\nu = Poisson's ratio"
    ],
    units: [
      "Moduli (E, G, K): Pascals (Pa or GPa)",
      "Poisson's Ratio (\\nu): Dimensionless (-1 to 0.5)"
    ],
    conditions: "Homogeneous and isotropic linear elastic material.",
    common_trap: "For incompressible materials (e.g. rubber), Poisson's ratio \\nu = 0.5, so Bulk Modulus K -> \\infty.",
    linkedQuestions: [49]
  },
  {
    id: "som_castigliano_second",
    name: "Castigliano's Second Theorem",
    subject: "Strength of Materials",
    formula: "\\delta_i = \\frac{\\partial U}{\\partial P_i}",
    readable: "δᵢ = ∂U / ∂Pᵢ",
    variables: [
      "\\delta_i = Displacement at point of force application in force direction",
      "U = Total strain energy of elastic structure",
      "P_i = Applied force at point i"
    ],
    units: [
      "Displacement (\\delta): meters (m)",
      "Strain Energy (U): Joules (J)",
      "Force (P): Newtons (N)"
    ],
    conditions: "Linearly elastic structure, constant temperature, small deformations.",
    common_trap: "Derivative must be taken with respect to the specific point load in the direction of desired displacement.",
    linkedQuestions: [48]
  },

  // ==========================================
  // Fluid Mechanics
  // ==========================================
  {
    id: "fluid_continuity",
    name: "Continuity Equation (Incompressible Flow)",
    subject: "Fluid Mechanics",
    formula: "A_1 v_1 = A_2 v_2",
    readable: "A₁ · v₁ = A₂ · v₂",
    variables: [
      "A1, A2 = Cross-sectional area at section 1 and 2",
      "v1, v2 = Mean flow velocity at section 1 and 2"
    ],
    units: [
      "Area (A): m²",
      "Velocity (v): m/s",
      "Volumetric Flow Rate (Q): m³/s"
    ],
    conditions: "Steady 1D flow of incompressible fluid (constant density).",
    common_trap: "If fluid is compressible, density change must be included: \\rho_1 A_1 v_1 = \\rho_2 A_2 v_2.",
    linkedQuestions: []
  },
  {
    id: "fluid_bernoulli",
    name: "Bernoulli's Energy Equation",
    subject: "Fluid Mechanics",
    formula: "\\frac{P}{\\rho g} + \\frac{v^2}{2g} + z = \\text{Constant}",
    readable: "P/(ρg) + v²/(2g) + z = Constant",
    variables: [
      "P / (\\rho g) = Pressure head",
      "v² / (2g) = Velocity / Dynamic head",
      "z = Potential / Datum head",
      "\\rho = Fluid density",
      "g = Acceleration due to gravity"
    ],
    units: [
      "Heads: meters of fluid column (m)",
      "Pressure (P): Pa",
      "Velocity (v): m/s"
    ],
    conditions: "Steady, incompressible, inviscid (frictionless) flow along a streamline.",
    common_trap: "Bernoulli equation cannot be directly applied across pumps, turbines, or regions with heavy friction without adding head loss terms.",
    linkedQuestions: []
  },
  {
    id: "fluid_reynolds_number",
    name: "Reynolds Number",
    subject: "Fluid Mechanics",
    formula: "Re = \\frac{\\rho v D}{\\mu}",
    readable: "Re = (ρ · v · D) / μ",
    variables: [
      "Re = Reynolds number (inertial force / viscous force ratio)",
      "\\rho = Fluid density",
      "v = Mean flow velocity",
      "D = Characteristic diameter of pipe",
      "\\mu = Dynamic viscosity"
    ],
    units: [
      "Reynolds Number (Re): Dimensionless ratio",
      "Viscosity (\\mu): Pa·s or N·s/m²"
    ],
    conditions: "Internal pipe flow (laminar if Re < 2000, turbulent if Re > 4000).",
    common_trap: "For non-circular conduits, use hydraulic diameter D_h = 4A/P_w instead of geometric diameter D.",
    linkedQuestions: []
  },
  {
    id: "fluid_darcy_weisbach",
    name: "Darcy-Weisbach Head Loss",
    subject: "Fluid Mechanics",
    formula: "h_f = \\frac{f L v^2}{2 g D}",
    readable: "h_f = (f · L · v²) / (2 · g · D)",
    variables: [
      "h_f = Head loss due to pipe skin friction",
      "f = Darcy friction factor (f = 4 * f_fanning)",
      "L = Length of pipe",
      "v = Average flow velocity",
      "D = Internal pipe diameter"
    ],
    units: [
      "Head loss (h_f): meters (m)",
      "Friction factor (f): Dimensionless"
    ],
    conditions: "Fully developed steady flow through circular pipe of length L.",
    common_trap: "Watch out for Darcy friction factor f vs Fanning friction factor f'. f_darcy = 4 * f_fanning!",
    linkedQuestions: []
  },

  // ==========================================
  // Heat Transfer
  // ==========================================
  {
    id: "ht_fouriers_law",
    name: "Fourier's Law of Heat Conduction",
    subject: "Heat Transfer",
    formula: "q = -k A \\frac{dT}{dx}",
    readable: "q = -k · A · (dT / dx)",
    variables: [
      "q = Heat conduction rate",
      "k = Thermal conductivity of material",
      "A = Cross-sectional area perpendicular to heat flow",
      "dT / dx = Temperature gradient along flow direction"
    ],
    units: [
      "Heat rate (q): Watts (W) or J/s",
      "Conductivity (k): W/(m·K)",
      "Gradient (dT/dx): K/m or °C/m"
    ],
    conditions: "1D steady-state thermal conduction.",
    common_trap: "The negative sign indicates heat flows in direction of decreasing temperature (from high T to low T).",
    linkedQuestions: []
  },
  {
    id: "ht_newtons_cooling",
    name: "Newton's Law of Cooling (Convection)",
    subject: "Heat Transfer",
    formula: "q = h A (T_s - T_\\infty)",
    readable: "q = h · A · (T_s - T_∞)",
    variables: [
      "q = Convective heat transfer rate",
      "h = Convective heat transfer coefficient",
      "A = Surface contact area",
      "T_s = Surface temperature",
      "T_\\infty = Bulk fluid temperature far from surface"
    ],
    units: [
      "Heat rate (q): Watts (W)",
      "Convection coef (h): W/(m²·K)",
      "Temperature: K or °C"
    ],
    conditions: "Fluid moving over a solid boundary surface.",
    common_trap: "h is not a material property! It depends on fluid velocity, viscosity, geometry, and flow regime.",
    linkedQuestions: []
  },
  {
    id: "ht_stefan_boltzmann",
    name: "Stefan-Boltzmann Law of Radiation",
    subject: "Heat Transfer",
    formula: "E = \\epsilon \\sigma A T^4",
    readable: "E = ε · σ · A · T⁴",
    variables: [
      "E = Emissive power / thermal radiation energy rate",
      "\\epsilon = Surface emissivity (0 <= \\epsilon <= 1, for blackbody \\epsilon = 1)",
      "\\sigma = Stefan-Boltzmann constant (5.67 \\times 10^{-8} \\text{ W/m}^2\\text{K}^4)",
      "A = Surface area",
      "T = Absolute temperature of body"
    ],
    units: [
      "Energy rate (E): Watts (W)",
      "Temperature (T): Kelvin (K)"
    ],
    conditions: "Thermal radiation emission from surface.",
    common_trap: "Radiation calculations ALWAYS require absolute temperature in Kelvin (T in K). Never use °C!",
    linkedQuestions: []
  },

  // ==========================================
  // Quantitative Aptitude
  // ==========================================
  {
    id: "quant_successive_profit_loss",
    name: "Same Price Selling Successive Change",
    subject: "Quantitative Aptitude",
    formula: "\\text{Net Loss \\%} = \\left(\\frac{x}{10}\\right)^2 \\%",
    readable: "Net Loss % = (x / 10)² %",
    variables: [
      "x = Common gain and loss percentage"
    ],
    units: [
      "Loss: percentage (%)"
    ],
    conditions: "Two distinct items sold at the SAME selling price (SP), one at x% profit and the other at x% loss.",
    common_trap: "This scenario ALWAYS results in a net loss! The trap is picking 'No profit, no loss'.",
    linkedQuestions: [20001]
  },
  {
    id: "quant_classical_probability",
    name: "Classical Probability Formula",
    subject: "Quantitative Aptitude",
    formula: "P(A) = \\frac{N(A)}{N(S)}",
    readable: "P(A) = N(A) / N(S)",
    variables: [
      "P(A) = Probability of event A occurring",
      "N(A) = Number of favorable outcome cases",
      "N(S) = Total number of outcomes in sample space"
    ],
    units: [
      "Probability: Dimensionless ratio between 0 and 1"
    ],
    conditions: "Equally likely finite outcomes in sample space S.",
    common_trap: "Forgetting to reduce total sample space count during consecutive draws without replacement.",
    linkedQuestions: [20003]
  },
  {
    id: "quant_compound_interest",
    name: "Compound Interest Amount Formula",
    subject: "Quantitative Aptitude",
    formula: "A = P \\left(1 + \\frac{r}{100}\\right)^n",
    readable: "A = P · (1 + r / 100)ⁿ",
    variables: [
      "A = Final compound amount",
      "P = Initial principal sum",
      "r = Annual interest rate percentage",
      "n = Number of compounding periods (years)"
    ],
    units: [
      "Amount (A) & Principal (P): Currency units",
      "Rate (r): percentage per period (%)"
    ],
    conditions: "Compounded annually. For semi-annual compounding: rate becomes r/2 and periods become 2n.",
    common_trap: "This formula yields total maturity amount A. To get interest CI alone: CI = A - P.",
    linkedQuestions: []
  },
  {
    id: "quant_quadratic_formula",
    name: "Quadratic Equation Roots Formula",
    subject: "Quantitative Aptitude",
    formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    readable: "x = (-b ± √(b² - 4ac)) / (2a)",
    variables: [
      "a, b, c = Coefficients in standard quadratic ax² + bx + c = 0",
      "b² - 4ac = Discriminant (D)"
    ],
    units: [
      "Roots (x): Numerical values"
    ],
    conditions: "Quadratic equation with a ≠ 0.",
    common_trap: "If D = b² - 4ac < 0, roots are complex conjugate pairs; if D >= 0, roots are real numbers.",
    linkedQuestions: []
  },
  {
    id: "quant_speed_distance_time",
    name: "Speed, Distance, and Time Relation",
    subject: "Quantitative Aptitude",
    formula: "\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}",
    readable: "Speed = Distance / Time",
    variables: [
      "Speed = Rate of travel",
      "Distance = Total path length covered",
      "Time = Time duration elapsed"
    ],
    units: [
      "Speed: m/s or km/h",
      "Distance: m or km",
      "Time: s or hours"
    ],
    conditions: "Uniform speed motion.",
    common_trap: "Conversion unit error! To convert km/h to m/s, multiply by 5/18. To convert m/s to km/h, multiply by 18/5.",
    linkedQuestions: []
  }
];
