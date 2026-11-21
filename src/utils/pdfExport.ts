import { jsPDF } from 'jspdf';
import { RevisionPack } from '../types/study';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function sanitizeFileName(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'revision-pack'}-study-buddy.pdf`;
}

// Convert unicode punctuation and math symbols into standard Latin-1 safe characters for jsPDF Helvetica
function toPdfSafeText(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2194/g, '<->')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u2260/g, '!=')
    .replace(/\u2248/g, '~=')
    .replace(/\u00D7/g, 'x')
    .replace(/\u00F7/g, '/')
    .replace(/\u221E/g, 'infinity')
    .replace(/[^\x20-\xFF\n]/g, '');
}

export function exportRevisionPackToPdf(pack: RevisionPack): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 56;
  let y = 52;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 52;
    }
  };

  // Top Header Banner
  doc.setFillColor(12, 17, 38);
  doc.rect(0, 0, pageWidth, 108, 'F');

  // Subtle accent bar at top
  doc.setFillColor(121, 87, 255);
  doc.rect(0, 0, pageWidth * 0.65, 4, 'F');
  doc.setFillColor(0, 217, 255);
  doc.rect(pageWidth * 0.65, 0, pageWidth * 0.35, 4, 'F');

  doc.setTextColor(0, 217, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('AI STUDY BUDDY  |  SMART REVISION PACK', marginX, 34);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  const titleLines = doc.splitTextToSize(toPdfSafeText(pack.topicTitle), contentWidth);
  doc.text(titleLines.slice(0, 2), marginX, 60);

  const dateLabel = new Date(pack.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const sourceLabel =
    pack.sourceType === 'pdf' && pack.fileName
      ? `PDF: ${pack.fileName}`
      : 'Pasted Study Notes';
  doc.setTextColor(166, 174, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    toPdfSafeText(
      `${pack.subjectArea}   |   ${dateLabel}   |   ${sourceLabel}   |   ${pack.sourceWordCount.toLocaleString()} source words`
    ),
    marginX,
    92
  );

  y = 136;

  // Section Helper
  const drawSectionHeading = (num: string, title: string) => {
    ensureSpace(44);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(121, 87, 255);
    doc.text(num, marginX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX + 26, y);
    y += 8;
    doc.setDrawColor(218, 224, 240);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;
  };

  // SECTION 1: Quick Summary
  drawSectionHeading('01.', 'Quick Summary');

  pack.summary.forEach((point, index) => {
    const headingLines = doc.splitTextToSize(
      toPdfSafeText(`${index + 1}. ${point.heading}`),
      contentWidth
    );
    const bodyLines = doc.splitTextToSize(
      toPdfSafeText(point.explanation),
      contentWidth - 14
    );
    const defLines = point.highlightedDefinition
      ? doc.splitTextToSize(
          toPdfSafeText(`Key Definition: ${point.highlightedDefinition}`),
          contentWidth - 26
        )
      : [];

    const estHeight =
      headingLines.length * 15 +
      bodyLines.length * 14 +
      (defLines.length > 0 ? defLines.length * 13 + 16 : 0) +
      18;
    ensureSpace(estHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(headingLines, marginX, y);
    y += headingLines.length * 14 + 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(bodyLines, marginX + 12, y);
    y += bodyLines.length * 13.5 + 4;

    if (defLines.length > 0) {
      const boxHeight = defLines.length * 13 + 12;
      doc.setFillColor(243, 241, 255);
      doc.setDrawColor(208, 198, 255);
      doc.roundedRect(marginX + 12, y - 4, contentWidth - 12, boxHeight, 4, 4, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(78, 52, 185);
      doc.text(defLines, marginX + 20, y + 9);
      y += boxHeight + 6;
    }

    y += 8;
  });

  y += 10;

  // SECTION 2: Important Key Terms
  drawSectionHeading('02.', 'Important Key Terms');

  pack.keyTerms.forEach((item, index) => {
    const defLines = doc.splitTextToSize(toPdfSafeText(item.definition), contentWidth - 20);
    const exLines = item.example
      ? doc.splitTextToSize(toPdfSafeText(`Example: ${item.example}`), contentWidth - 20)
      : [];
    const blockHeight =
      20 + defLines.length * 13.5 + (exLines.length ? exLines.length * 13 + 8 : 0) + 14;
    ensureSpace(blockHeight);

    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(220, 227, 243);
    doc.roundedRect(marginX, y - 6, contentWidth, blockHeight - 6, 5, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(toPdfSafeText(`${index + 1}. ${item.term}`), marginX + 12, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(defLines, marginX + 12, y + 26);

    if (exLines.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 120, 160);
      doc.text(exLines, marginX + 12, y + 30 + defLines.length * 13.5);
    }

    y += blockHeight + 6;
  });

  y += 10;

  // SECTION 3: Practice Quiz (with Answers & Explanations)
  drawSectionHeading('03.', 'Practice Quiz & Answer Key');

  pack.quiz.forEach((q, qIdx) => {
    const safeCorrectIndex =
      q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0;
    const qLines = doc.splitTextToSize(
      toPdfSafeText(`Q${qIdx + 1}. ${q.question}`),
      contentWidth
    );
    const optHeights = q.options.reduce((acc, opt) => {
      const lines = doc.splitTextToSize(toPdfSafeText(`A) ${opt}`), contentWidth - 20);
      return acc + lines.length * 13 + 3;
    }, 0);
    const expLines = doc.splitTextToSize(
      toPdfSafeText(`Answer: ${OPTION_LETTERS[safeCorrectIndex]} - ${q.explanation}`),
      contentWidth - 20
    );
    const totalEst = qLines.length * 14 + optHeights + expLines.length * 13 + 34;
    ensureSpace(totalEst);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(qLines, marginX, y);
    y += qLines.length * 14 + 5;

    q.options.forEach((opt, optIdx) => {
      const isCorrect = optIdx === safeCorrectIndex;
      const optText = toPdfSafeText(
        `${OPTION_LETTERS[optIdx]}.  ${opt}${isCorrect ? '  [Correct]' : ''}`
      );
      const optLines = doc.splitTextToSize(optText, contentWidth - 18);
      doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
      doc.setFontSize(9.8);
      if (isCorrect) {
        doc.setTextColor(16, 128, 72);
      } else {
        doc.setTextColor(51, 65, 85);
      }
      doc.text(optLines, marginX + 14, y);
      y += optLines.length * 13 + 3;
    });

    y += 4;
    const expBoxH = expLines.length * 12.5 + 12;
    doc.setFillColor(240, 250, 255);
    doc.setDrawColor(190, 230, 245);
    doc.roundedRect(marginX + 12, y - 4, contentWidth - 12, expBoxH, 4, 4, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 76, 110);
    doc.text(expLines, marginX + 20, y + 8);
    y += expBoxH + 14;
  });

  // Page numbers in footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 140, 165);
    doc.text('AI Study Buddy - Smart Revision Assistant', marginX, pageHeight - 24);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX - 52, pageHeight - 24);
  }

  doc.save(sanitizeFileName(pack.topicTitle));
}
