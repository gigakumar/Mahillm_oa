import { jsPDF } from 'jspdf';

/**
 * PDF Test Report Generator
 *
 * Generates an official, publication-grade PDF report after every test,
 * detailing total marks obtained, accuracy, ELO rating, strong topics,
 * weak topics, negative marking breakdown, and question answer matrix.
 */
export function generateTestReportPDF(result, userEmail = 'Candidate') {
  if (!result) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Theme Colors
  const primaryColor = [35, 134, 54]; // #238636
  const darkBg = [22, 27, 34];       // #161b22
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];
  const dangerColor = [214, 48, 49];
  const successColor = [0, 184, 148];

  let y = margin;

  // 1. Header Banner
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MAHILLM MECHANICAL ENGINEERING OA', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(160, 174, 192);
  doc.text('OFFICIAL GRADUATE ENGINEER TRAINEE (GET) TEST SCORECARD', margin, 20);

  doc.setFontSize(8);
  doc.text(`Candidate: ${userEmail} | Date: ${new Date().toLocaleDateString()} | Test Mode: ${result.testName || 'Full Mock'}`, margin, 26);

  y = 38;

  // 2. Score & Marks Summary Box
  const totalMarks = result.totalMarks !== undefined ? Number(result.totalMarks).toFixed(2) : Number(result.correct || 0).toFixed(2);
  const maxMarks = result.maxMarks !== undefined ? Number(result.maxMarks).toFixed(2) : Number(result.total || 0).toFixed(2);
  const percentageMarks = result.maxMarks ? Math.max(0, Math.round((result.totalMarks / result.maxMarks) * 100)) : (result.accuracy || 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 3, 3, 'FD');

  const colWidth = (pageWidth - margin * 2) / 4;

  // Metric 1: Total Marks Obtained
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text(`${totalMarks} / ${maxMarks}`, margin + 6, y + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('TOTAL MARKS OBTAINED', margin + 6, y + 22);

  // Metric 2: Percentage Marks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...textDark);
  doc.text(`${percentageMarks}%`, margin + colWidth + 6, y + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('MARKS PERCENTAGE', margin + colWidth + 6, y + 22);

  // Metric 3: Accuracy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...textDark);
  doc.text(`${result.accuracy || 0}%`, margin + colWidth * 2 + 6, y + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('RAW ACCURACY', margin + colWidth * 2 + 6, y + 22);

  // Metric 4: ELO Rating
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(108, 92, 231);
  doc.text(`${result.performanceElo || 1200} ELO`, margin + colWidth * 3 + 6, y + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('PERFORMANCE ELO RATING', margin + colWidth * 3 + 6, y + 22);

  y += 40;

  // 3. Topic Diagnosis: Strong & Weak Areas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('1. TOPIC DIAGNOSIS: STRONG & WEAK PARTS', margin, y);
  y += 6;

  // Aggregate Topic Statistics
  const topicStats = {};
  (result.report || []).forEach(q => {
    const t = q.topic || 'General';
    if (!topicStats[t]) {
      topicStats[t] = { topic: t, total: 0, correct: 0, incorrect: 0, unattempted: 0, marksEarned: 0, maxMarks: 0 };
    }
    const qMarks = q.marks !== undefined ? q.marks : (q.difficulty === 'HIGH' ? 3 : q.difficulty === 'MEDIUM' ? 2 : 1);
    topicStats[t].total += 1;
    topicStats[t].maxMarks += qMarks;

    if (q.isAttempted) {
      if (q.isCorrect) {
        topicStats[t].correct += 1;
        topicStats[t].marksEarned += qMarks;
      } else {
        topicStats[t].incorrect += 1;
        const neg = q.type === 'NAT' ? 0 : (qMarks * 0.33);
        topicStats[t].marksEarned -= neg;
      }
    } else {
      topicStats[t].unattempted += 1;
    }
  });

  const topicsList = Object.values(topicStats).map(t => ({
    ...t,
    pct: t.maxMarks > 0 ? Math.max(0, Math.round((t.marksEarned / t.maxMarks) * 100)) : 0
  })).sort((a, b) => b.pct - a.pct);

  const strongTopics = topicsList.filter(t => t.pct >= 60);
  const weakTopics = topicsList.filter(t => t.pct < 60);

  const boxWidth = (pageWidth - margin * 2 - 6) / 2;

  // Strong Topics Card
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, boxWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...successColor);
  doc.text('STRONG TOPICS (High Marks)', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  if (strongTopics.length === 0) {
    doc.text('• No topics met the 60% marks threshold in this test.', margin + 4, y + 14);
  } else {
    strongTopics.slice(0, 5).forEach((st, idx) => {
      doc.text(`• ${st.topic}: ${st.marksEarned.toFixed(1)}/${st.maxMarks} Marks (${st.pct}%)`, margin + 4, y + 14 + (idx * 6));
    });
  }

  // Weak Topics Card
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin + boxWidth + 6, y, boxWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...dangerColor);
  doc.text('WEAK TOPICS (Lost Marks / Re-Study)', margin + boxWidth + 10, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  if (weakTopics.length === 0) {
    doc.text('• Excellent! All topics scored above 60%.', margin + boxWidth + 10, y + 14);
  } else {
    weakTopics.slice(0, 5).forEach((wt, idx) => {
      doc.text(`• ${wt.topic}: ${wt.marksEarned.toFixed(1)}/${wt.maxMarks} Marks (${wt.pct}%)`, margin + boxWidth + 10, y + 14 + (idx * 6));
    });
  }

  y += 48;

  // 4. Detailed Question Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('2. QUESTION-BY-QUESTION MARKS & ACCURACY MATRIX', margin, y);
  y += 6;

  // Header Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);

  doc.text('#', margin + 2, y + 5);
  doc.text('Topic', margin + 10, y + 5);
  doc.text('Diff.', margin + 70, y + 5);
  doc.text('Type', margin + 90, y + 5);
  doc.text('Status', margin + 115, y + 5);
  doc.text('Marks', margin + 155, y + 5);

  y += 7;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  (result.report || []).forEach((q, idx) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = margin;

      // Repeat Table Header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textMuted);

      doc.text('#', margin + 2, y + 5);
      doc.text('Topic', margin + 10, y + 5);
      doc.text('Diff.', margin + 70, y + 5);
      doc.text('Type', margin + 90, y + 5);
      doc.text('Status', margin + 115, y + 5);
      doc.text('Marks', margin + 155, y + 5);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');

    doc.setTextColor(...textDark);
    doc.text(`${idx + 1}`, margin + 2, y + 4.5);
    doc.text(String(q.topic || 'General').substring(0, 30), margin + 10, y + 4.5);
    doc.text(String(q.difficulty || 'MED'), margin + 70, y + 4.5);
    doc.text(String(q.type || 'MCQ'), margin + 90, y + 4.5);

    const qMarks = q.marks !== undefined ? q.marks : (q.difficulty === 'HIGH' ? 3 : q.difficulty === 'MEDIUM' ? 2 : 1);

    if (q.isAttempted) {
      if (q.isCorrect) {
        doc.setTextColor(...successColor);
        doc.text('Correct', margin + 115, y + 4.5);
        doc.text(`+${qMarks.toFixed(1)}`, margin + 155, y + 4.5);
      } else {
        doc.setTextColor(...dangerColor);
        doc.text('Incorrect', margin + 115, y + 4.5);
        const neg = q.type === 'NAT' ? 0 : (qMarks * 0.33);
        doc.text(`-${neg.toFixed(2)}`, margin + 155, y + 4.5);
      }
    } else {
      doc.setTextColor(...textMuted);
      doc.text('Skipped', margin + 115, y + 4.5);
      doc.text('0.0', margin + 155, y + 4.5);
    }

    y += 6;
  });

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(`Mahillm Mechanical GET Assessment Scorecard — Page ${i} of ${pageCount}`, margin, pageHeight - 8);
  }

  // Save PDF
  const filename = `Mechanical_Test_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
