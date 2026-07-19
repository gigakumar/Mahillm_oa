/**
 * Mock Test Series Configuration
 *
 * Defines scheduled exams with specific unlock dates, durations, negative marking rules,
 * question counts, and subject distributions.
 */

export const MOCK_TESTS = [
  {
    id: "mahi_oa_mock_01",
    name: "Mahi OA Mock 01",
    unlockDate: "2026-07-01T00:00:00Z", // Past date, unlocked
    duration: 60, // in minutes
    count: 30, // total questions
    negativeMarking: true,
    description: "Full syllabus mock covering Core Engineering, Quant, Reasoning, and Data Interpretation.",
    distribution: {
      "Mechanical Engineering": 40, // 40% of questions
      "Quantitative Aptitude": 30,
      "Logical Reasoning": 20,
      "Data Interpretation": 10
    }
  },
  {
    id: "mech_core_mock_01",
    name: "Mechanical Core Mock 01",
    unlockDate: "2026-07-06T12:00:00Z", // Future date relative to July 5, 2026
    duration: 45,
    count: 25,
    negativeMarking: true,
    description: "Focus exam targeting Mechanical Engineering core topics: Thermodynamics, SOM, Heat Transfer.",
    distribution: {
      "Mechanical Engineering": 100
    }
  },
  {
    id: "aptitude_sprint_01",
    name: "Aptitude Sprint 01",
    unlockDate: "2026-07-08T09:00:00Z",
    duration: 30,
    count: 20,
    negativeMarking: false,
    description: "Speed run targeting Quantitative Aptitude and Logical Reasoning. No negative marks.",
    distribution: {
      "Quantitative Aptitude": 60,
      "Logical Reasoning": 40
    }
  },
  {
    id: "grad_engineer_mock_01",
    name: "Graduate Engineer Mock 01",
    unlockDate: "2026-07-12T00:00:00Z",
    duration: 90,
    count: 50,
    negativeMarking: true,
    description: "Comprehensive 50-question mock simulating standard corporate Graduate Engineer Trainee (GET) tests.",
    distribution: {
      "Mechanical Engineering": 30,
      "Quantitative Aptitude": 30,
      "Logical Reasoning": 20,
      "DILR": 20
    }
  },
  {
    id: "advanced_thermo_mock_01",
    name: "Advanced Thermodynamics Mock",
    unlockDate: "2026-08-05T09:00:00Z",
    duration: 45,
    count: 25,
    negativeMarking: true,
    description: "Deep-dive mock on Thermodynamics and Heat Transfer — the most common weak point for GATE & PSU aspirants.",
    distribution: { "Mechanical Engineering": 100 }
  },
  {
    id: "full_syllabus_mock_02",
    name: "Mahi OA Mock 02",
    unlockDate: "2026-08-15T00:00:00Z",
    duration: 60,
    count: 30,
    negativeMarking: true,
    description: "Second full-syllabus mock with updated question pool and harder aptitude section.",
    distribution: {
      "Mechanical Engineering": 40,
      "Quantitative Aptitude": 30,
      "Logical Reasoning": 20,
      "Data Interpretation": 10
    }
  }
];
