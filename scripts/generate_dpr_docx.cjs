const path = require("path");
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, TableOfContents, PageBreak,
  LevelFormat, convertInchesToTwip, VerticalAlign, Header, Footer, PageNumber,
} = require("docx");

// ---------- Style constants ----------
const NAVY = "1F2A44";
const ORANGE = "C2540A";
const LIGHT_GREY = "F2F2F2";
const MID_GREY = "666666";
const BORDER_GREY = "CCCCCC";

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GREY },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GREY },
  left: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GREY },
  right: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GREY },
};

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: NAVY, color: "auto" },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorder,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 19 })],
    })],
  });
}

function bodyCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorder,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: (Array.isArray(text) ? text : [text]).map(t =>
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: t, size: 19, bold: !!opts.bold, color: opts.color })],
      })
    ),
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullet-list", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text })],
  });
}

// ---------- Findings table builder ----------
function findingsTable(rows) {
  const widths = [500, 3000, 2600, 2926];
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("#", widths[0]),
          headerCell("Observation", widths[1]),
          headerCell("Why it matters", widths[2]),
          headerCell("Recommendation", widths[3]),
        ],
      }),
      ...rows.map((r, i) => new TableRow({
        children: [
          bodyCell(String(i + 1), widths[0], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
          bodyCell(r[0], widths[1], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
          bodyCell(r[1], widths[2], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
          bodyCell(r[2], widths[3], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
        ],
      })),
    ],
  });
}

// ---------- Content data ----------
const homeFindings = [
  ["The XP counter (\"1476\") in the top bar has no label, icon legend, or link explaining what it is or how it's earned/spent.", "Users can't tell if it's a score, currency, or vanity metric, so it can't motivate behaviour it isn't understood.", "Add a short label (\"XP\" or \"Coins\") plus a tooltip/modal: what it's for, how to earn more, and what it unlocks."],
  ["The Daily Goal path (30/30 Qs) uses a flag \u2192 walking \u2192 running \u2192 finish-line icon sequence with no numbers on the milestones.", "The metaphor is decorative rather than informative \u2014 progress at a glance requires reading the \"(30/30 Qs)\" text separately.", "Print the running count at each milestone node (e.g. \"8\", \"15\", \"23\", \"30\") so the visual and the number tell the same story."],
  ["The six Digital Book cards use green, blue, purple, dark-grey and red backgrounds with no visible logic tying colour to subject, tier or difficulty.", "Colour is a strong signal; using it decoratively trains users to ignore it, weakening it for cases where it should mean something (e.g. \"Pro-only\").", "Adopt a small, consistent colour system \u2014 e.g. colour = subject family, and reserve one accent colour strictly for \"Pro / locked\" content."],
  ["\"Chapter wise PYQ Bank\" is a full section on the Home tab, and \"Practice & PYQs\" also exists as its own sidebar item.", "Unclear where a returning user should go for PYQs \u2014 duplicated entry points usually mean duplicated upkeep and inconsistent content over time.", "Make Home show a compact \"Recommended for you\" strip (3\u20134 cards) and move the full, filterable PYQ bank exclusively under Practice & PYQs."],
  ["Home stacks a hero carousel, 6 book cards, 8 PYQ-bank cards, 4 AI-module cards and an AI Coach card in one continuous scroll.", "A first-time visitor lands on a wall of equally-weighted options with no clear \"start here\" \u2014 raises drop-off risk before the value is felt.", "Lead with a single personalised module (\"Continue Thermodynamics \u2014 Q14/30\") above the generic browse sections; collapse lower-priority sections behind a \"View all\"."],
  ["The trophy icon beside the XP counter has no text label and no visible destination context.", "Icon-only controls with ambiguous meaning (leaderboard? rewards? achievements?) increase hesitation to click and hurt discoverability.", "Add a text label on hover/tap, or a one-word caption under the icon (\"Rank\")."],
];

const testsFindings = [
  ["Every Scheduled Mock card shows a lock icon in the corner while simultaneously showing a live-styled orange \"Start Mock\" button.", "This is a direct visual contradiction \u2014 it isn't clear whether the test is actually accessible, which erodes trust in every other status indicator on the page.", "If locked: grey out the button and replace its label with \"Unlocks 28 Jul\". If unlocked: remove the lock icon entirely."],
  ["Copy states tests \"unlock automatically on their scheduled release dates\" but no date or countdown appears on the individual cards.", "Users can't plan a study schedule around a release they can't see the date for.", "Surface the exact unlock date (or a countdown, e.g. \"Unlocks in 3 days\") directly on each locked card."],
  ["The \u201c-1/3 MARK\u201d negative-marking badge is shown with no explanation.", "Not every visitor is already fluent in GATE-style negative marking conventions, especially newer PSU/ESE aspirants browsing other exam tracks.", "Add a small info icon with a one-line tooltip: \"1 mark deducted for every 3 wrong answers.\""],
  ["Four tabs sit at the same visual weight (Mock Series, Exam Presets, Custom Test Builder, My Scorecards) with no indication of which the user has used before.", "New vs. returning users likely want different defaults \u2014 a first-timer wants Mock Series, a regular test-taker may want Scorecards.", "Remember and default to the user's last-used tab; add a subtle \"last visited\" indicator."],
];

const plannerFindings = [
  ["The planner opens to \"0 Due for Review\", \"0 High Decay Risk\" and \"All clear for this selection!\" with no further guidance.", "This empty state reads as \"nothing to do here,\" which is misleading \u2014 it's actually because the spaced-repetition engine has no practice history to work from yet.", "Replace the generic empty state with an onboarding prompt: \"Complete your first practice set to activate personalised reviews\" plus a direct CTA into Practice."],
  ["All seven day-cards (Today \u2192 Tue) show identical \"Clear\" status with the only differentiator being a border highlight on \"Today.\"", "Low visual distinction between days makes the weekly view harder to scan at a glance, especially once cards start carrying real task counts.", "Once tasks exist, show a task count and a small filled/outline state per day; keep future days visually \"lighter\" until reached."],
  ["The Subject Filter row (All, Thermodynamics, Fluid Mechanics, Strength of Materials, Theory of Machines, Manufacturing Science) shows no per-subject counts.", "Users can't judge subject-wise workload or backlog before selecting a filter.", "Add a count badge per subject chip, e.g. \"Thermodynamics (12)\", sourced from the same due-for-review logic."],
];

const practiceFindings = [
  ["There is no \"Question X of Y\" or progress bar anywhere on the practice screen.", "Without a sense of position in the set, users lose pacing awareness during longer practice sessions, which can increase abandonment.", "Add a slim progress indicator or \"Q 4 of 20\" label near the timer."],
  ["The 0:51 timer counts down with no visible total/target duration and no colour change as time runs low.", "A bare countdown with no reference point can create ambiguous or unnecessary time pressure rather than a clear pacing signal.", "Show total allotted time (e.g. \"0:51 / 1:30\") and shift the timer to amber/red as it depletes."],
  ["The \"AI Tutor & Real-Time Hint Assistant\" panel, including its chat history and input box, is expanded by default and occupies roughly the bottom half of the screen.", "On smaller screens this pushes the \"Check Answer\" button out of the initial view for a feature most users won't touch on every question.", "Collapse the AI Tutor panel by default; expand on tapping \"Get Step Hint\" or \"Clarification Chat.\""],
  ["No selected-state styling is distinguishable for the four answer options (A\u2013D) in the current layout.", "Users need immediate, unambiguous confirmation of what they've selected before submitting.", "Give the chosen option a clear filled/bordered state that's visually distinct from hover and from the other three options."],
  ["The AI Tutor's replies have no lightweight feedback control (e.g. thumbs up/down) attached.", "As a \"BETA\" feature, this is the cheapest way to collect quality signal on hint accuracy before wider rollout.", "Add a small thumbs up/down under each AI Tutor response, logged against the question ID."],
];

const crossCutting = [
  ["Badge/pill sprawl: BESTSELLER, VERIFIED, HIGH YIELD, 2026 QS ADDED, NEW 2026, MUST PRACTICE, TARGET AIR<100 and more all appear as similarly-weighted coloured pills across different modules.", "Too many badge types dilute the signal value of any one of them and add visual noise to already dense pages.", "Define a small badge taxonomy (max 3\u20134 types \u2014 e.g. New, Popular, Recommended, Verified) with one consistent style each, reused everywhere."],
  ["Playful emoji in section headers (e.g. the trophy in \"Online Assessments & Practice Tests \ud83c\udfc6\") sit next to a genuinely high-stakes context for GATE/ESE/PSU aspirants.", "Tone mismatch is a real risk for a segment of serious, exam-stressed users, even if it delights others.", "Reserve playful/gamified tone for modules that are explicitly game-like (Speed Duel, streaks); keep exam-critical screens (Tests, Scorecards) tonally neutral."],
  ["No persistent global search is visible anywhere in the header across the screens reviewed.", "With 8+ PYQ categories, several mock series, a digital book library and notebooks, users who know exactly what they want have no fast path to it.", "Add a persistent search field in the top bar that spans books, PYQs, mocks and notebooks."],
  ["The left sidebar shows no responsive/collapsed treatment in any of the captures, and no breadcrumb beyond the single highlighted item.", "GATE aspirants very commonly study from a phone between classes or during a commute; a fixed, always-expanded sidebar doesn't obviously adapt to that.", "Confirm a mobile layout (hamburger or bottom tab bar) exists or is planned, and validate it with real devices, not just a narrower browser window."],
  ["Status is frequently communicated through colour alone (card left-borders on the Study Planner, red vs green vs blue badge fills) against a dark background.", "Colour-only signalling is an accessibility risk (contrast and colour-blindness) and hasn't been verified against WCAG 2.1 AA in this review.", "Run a contrast audit on the dark theme; pair every colour-coded status with an icon or text label, not colour alone."],
];

const roadmap = [
  ["Phase 1 \u2014 Quick Wins", "1\u20132 weeks", "Fix the locked/unlocked contradiction on Tests; label the XP counter; add a progress indicator and total-time display to the practice screen; add a negative-marking tooltip; rewrite the Study Planner empty state.", "Removes the most confusing/contradictory signals with no structural changes \u2014 low engineering cost, immediate trust gain."],
  ["Phase 2 \u2014 Structural", "3\u20136 weeks", "Consolidate PYQ Bank navigation between Home and Practice & PYQs; ship a badge design system; add global search; make the AI Tutor panel collapsible; confirm/build responsive mobile nav.", "Cleans up information architecture and visual system so future features slot into clear patterns instead of adding more one-off components."],
  ["Phase 3 \u2014 Strategic", "6\u201312 weeks", "Personalise the Home tab (\"continue where you left off\"); run a full accessibility/contrast audit; A/B test tonal variants (emoji vs. neutral) on exam-critical screens; instrument analytics on empty-state \u2192 activation funnels.", "Moves from fixing what's visibly broken to actively growing activation, retention and inclusivity using real usage data."],
];

const metrics = [
  ["Tests-page confusion rate", "Support tickets / rage-clicks referencing \"locked\" tests", "Trend to zero after Phase 1"],
  ["Study Planner activation", "% of new users who receive a personalised review task within 7 days", "Upward trend post Phase 1\u20132"],
  ["Practice completion rate", "% of started question sets finished vs. abandoned mid-way", "Increase after progress-indicator + AI panel changes"],
  ["AI Tutor engagement quality", "Thumbs-up ratio on hint/clarification responses", "Baseline in Phase 1, track improvement in Phase 3"],
  ["Mock-test conversion", "% of users who attempt a mock within 24h of it unlocking", "Increase once unlock dates are visible"],
  ["Home \u2192 first action time", "Median time from landing on Home to starting any practice/test", "Decrease after Home restructuring (Phase 2\u20133)"],
];

// ---------- Build document ----------
(async () => {
  const doc = new Document({
    creator: "MahiLLM AI Team",
    title: "MahiLLM Product & UX Detailed Project Report",
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21 } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, color: NAVY, font: "Calibri" },
          paragraph: { spacing: { before: 360, after: 180 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 4 } } },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, color: NAVY, font: "Calibri" },
          paragraph: { spacing: { before: 280, after: 140 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "MahiLLM \u2014 UX & Product DPR", size: 16, color: MID_GREY })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 16, color: MID_GREY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MID_GREY }),
              new TextRun({ text: " of ", size: 16, color: MID_GREY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MID_GREY }),
            ],
          })],
        }),
      },
      children: [
        // ---- Title Page ----
        new Paragraph({ spacing: { before: 1600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "MahiLLM", size: 64, bold: true, color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Product & UX Detailed Project Report (DPR)", size: 32, bold: true, color: ORANGE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
          children: [new TextRun({ text: "A heuristic audit and improvement roadmap for the GATE Mechanical exam-prep platform", size: 22, italics: true, color: MID_GREY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Prepared for: MahiLLM Product Team", size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Basis: Home, Tests, Study Planner & Practice screens captured 22 July 2026", size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Date: 22 July 2026", size: 20 })],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ---- Table of Contents ----
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Table of Contents")] }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ---- 1. Executive Summary ----
        sectionHeading("1. Executive Summary"),
        body("MahiLLM is a gamified, AI-assisted exam-preparation platform for GATE Mechanical and adjacent PSU/ESE/defence exams, combining a digital book library, chapter-wise PYQ banks, mock tests, a spaced-repetition study planner, and an in-question AI tutor. The core proposition \u2014 practice, testing and AI coaching in one product \u2014 is genuinely differentiated from static PDF- or PYQ-book-based competitors, and the underlying feature set is already broad and ambitious."),
        body("This report reviews five screens \u2014 Home/Dashboard, Tests, Study Planner and a live Practice question \u2014 captured on 22 July 2026, and sets out a prioritised list of UX, information-architecture and trust-signal fixes. The most urgent issues are: (1) a direct visual contradiction on the Tests page, where cards marked \u201clocked\u201d still display an active-looking \u201cStart Mock\u201d button; (2) an XP/rewards counter with no label or explanation of its purpose; and (3) empty states on the Study Planner that read as \u201cnothing to do\u201d rather than guiding a new user toward activating the feature. None of these require a visual redesign \u2014 all are fixable within the existing design language, most within days rather than weeks."),
        body("Findings are organised by screen (Sections 4\u20137), followed by cross-cutting issues that span the whole product (Section 8), a phased roadmap (Section 9) and suggested success metrics (Section 10)."),

        // ---- 2. Scope & Methodology ----
        sectionHeading("2. Scope & Methodology"),
        body("This is a heuristic (expert-review) audit based on five screenshots of the live product, evaluated against standard usability heuristics \u2014 visibility of system status, consistency, error prevention, recognition over recall, and aesthetic/minimalist design \u2014 rather than on analytics, session recordings or moderated user testing. It should be read as a fast, low-cost first pass that surfaces the highest-confidence issues, not as a replacement for usability testing with real GATE aspirants."),
        body("Screens reviewed:"),
        bullet("Home / Dashboard (two views, covering the goal tracker, book library, PYQ bank and AI modules)"),
        bullet("Tests (Scheduled Mock Test Series view)"),
        bullet("Study Planner (Intelligent Daily Study Planner / spaced-repetition view)"),
        bullet("Practice / live question screen (Thermodynamics MCQ with AI Tutor panel)"),
        body("Not covered, and recommended as immediate follow-ups: the mobile app or responsive web experience, the Notebooks, GATE Predictor, 1v1 Speed Duel and Profile screens, the Pro/paid-tier upsell flow, and any backend or performance considerations.", { italics: true, color: MID_GREY }),

        // ---- 3. Platform Snapshot ----
        sectionHeading("3. Platform Snapshot"),
        body("As observed across the reviewed screens, the product currently offers:"),
        bullet("Home dashboard \u2014 daily goal tracker, promotional carousel, a digital book storefront (6+ titles), a chapter-wise PYQ bank (8 categories spanning GATE, ESE, PSU, DRDO/ISRO/BARC and general aptitude), an AI-module directory, and an AI Study Coach summary."),
        bullet("Tests \u2014 Mock Series, Exam Presets, Custom Test Builder and My Scorecards tabs, with a scheduled mock series that unlocks over time."),
        bullet("Study Planner \u2014 an Ebbinghaus-curve-based spaced-repetition engine with a 7-day schedule, subject filters and a due-for-review / decay-risk summary."),
        bullet("Practice screen \u2014 tagged MCQs (subject, difficulty, beta status) with a timer, bookmarking, and an embedded \u201cAI Tutor & Real-Time Hint Assistant\u201d offering step hints and open clarification chat."),
        bullet("Gamification layer \u2014 an XP/points counter and a trophy icon in the global header, plus a milestone-based daily goal path."),
        bullet("Navigation \u2014 Home, Tests, Practice & PYQs, Notebooks, 1v1 Speed Duel, GATE Predictor, Study Planner and Profile, with a light-mode toggle."),

        // ---- 4. Home / Dashboard Findings ----
        sectionHeading("4. Home / Dashboard \u2014 Findings"),
        body("The Home tab is doing the most work of any screen in the product \u2014 it's simultaneously a progress dashboard, a storefront, a PYQ library and a features directory. That breadth is the source of most of its issues."),
        findingsTable(homeFindings),

        // ---- 5. Tests Findings ----
        sectionHeading("5. Tests \u2014 Findings"),
        body("The Tests tab's core structure (Mock Series / Presets / Custom Builder / Scorecards) is sound; the issues here are about signal clarity rather than layout."),
        findingsTable(testsFindings),

        // ---- 6. Study Planner Findings ----
        sectionHeading("6. Study Planner \u2014 Findings"),
        body("The spaced-repetition concept is a strong differentiator, but the screen as captured looks identical whether the engine genuinely has nothing due, or simply hasn't been fed enough practice data yet \u2014 and today it reads as the former."),
        findingsTable(plannerFindings),

        // ---- 7. Practice / Quiz Findings ----
        sectionHeading("7. Practice Screen \u2014 Findings"),
        body("This is the highest-frequency screen in the product \u2014 the one a user will see hundreds of times \u2014 so small friction here compounds the most."),
        findingsTable(practiceFindings),

        // ---- 8. Cross-Cutting ----
        sectionHeading("8. Cross-Cutting Issues"),
        body("These patterns recur across multiple screens and are best fixed once, centrally, rather than screen by screen."),
        findingsTable(crossCutting),

        // ---- 9. Roadmap ----
        sectionHeading("9. Prioritised Roadmap"),
        body("Sequenced by dependency and effort rather than by section number \u2014 Phase 1 items are all independent, low-effort fixes that can ship in parallel."),
        (function () {
          const widths = [1800, 1300, 4300, 1626];
          return new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: widths,
            rows: [
              new TableRow({ tableHeader: true, children: [headerCell("Phase", widths[0]), headerCell("Timeframe", widths[1]), headerCell("Key Actions", widths[2]), headerCell("Outcome", widths[3])] }),
              ...roadmap.map((r, i) => new TableRow({
                children: [
                  bodyCell(r[0], widths[0], { shade: i % 2 ? LIGHT_GREY : "FFFFFF", bold: true }),
                  bodyCell(r[1], widths[1], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
                  bodyCell(r[2], widths[2], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
                  bodyCell(r[3], widths[3], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
                ],
              })),
            ],
          });
        })(),

        // ---- 10. Success Metrics ----
        sectionHeading("10. Success Metrics"),
        body("Recommended metrics to validate that these changes are actually improving the experience, not just the audit's assumptions:"),
        (function () {
          const widths = [2400, 4200, 2426];
          return new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: widths,
            rows: [
              new TableRow({ tableHeader: true, children: [headerCell("Metric", widths[0]), headerCell("What it tells us", widths[1]), headerCell("Target direction", widths[2])] }),
              ...metrics.map((r, i) => new TableRow({
                children: [
                  bodyCell(r[0], widths[0], { shade: i % 2 ? LIGHT_GREY : "FFFFFF", bold: true }),
                  bodyCell(r[1], widths[1], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
                  bodyCell(r[2], widths[2], { shade: i % 2 ? LIGHT_GREY : "FFFFFF" }),
                ],
              })),
            ],
          });
        })(),

        // ---- 11. Conclusion ----
        sectionHeading("11. Conclusion & Next Steps"),
        body("MahiLLM's feature set is already ahead of most GATE-prep competitors \u2014 the gap is in signal clarity, not capability. The single highest-leverage move is Phase 1: it costs little to build, removes the most trust-damaging inconsistencies (locked-but-clickable tests, an unexplained XP counter, an unhelpfully empty Study Planner), and can ship without waiting on the larger information-architecture work in Phase 2."),
        body("Suggested immediate next steps:"),
        bullet("Validate these findings against real analytics (drop-off points, rage-clicks, support tickets) before committing engineering time to Phase 2\u20133."),
        bullet("Run a short moderated usability test with 5\u20138 actual GATE/ESE aspirants on the Tests and Study Planner flows specifically, since both currently carry the highest-confusion-risk issues."),
        bullet("Extend this same heuristic pass to the screens not covered here \u2014 Notebooks, GATE Predictor, 1v1 Speed Duel, Profile and the Pro upsell \u2014 before finalising the Phase 2 scope."),
      ],
    }],
  });

  const targetPath = path.join(__dirname, "..", "MahiLLM_UX_DPR.docx");
  const artifactPath = "/Users/harsh/.gemini/antigravity/brain/6ab09dec-796c-4ef8-a4ac-6e4540419976/MahiLLM_UX_DPR.docx";

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buf);
  fs.writeFileSync(artifactPath, buf);
  console.log("Successfully generated DPR Word document at:", targetPath);
})();
