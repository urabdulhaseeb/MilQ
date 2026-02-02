import { jsPDF } from 'jspdf';
import { TestResult, AdulterantStatus } from '../types';

// Helper to get image dimensions from base64 string
const getImageProperties = (base64: string): Promise<{ width: number; height: number; ratio: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        ratio: img.width / img.height,
      });
    };
    img.onerror = () => resolve({ width: 1, height: 1, ratio: 1 });
    img.src = base64;
  });
};

export const downloadPDF = async (result: TestResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // 1. Header (Compact)
  doc.setFillColor(30, 136, 229); // #1E88E5
  doc.rect(0, 0, pageWidth, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MILQ TEST REPORT', 15, 13);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Via Multi Test Milk Adulteration Card', 15, 19);
  
  // 2. Test Meta & Status Summary
  doc.setTextColor(33, 37, 41);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const date = new Date(result.timestamp);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  doc.text(`Test ID: ${result.id}`, 15, 32);
  if (result.tag) doc.text(`Reference: ${result.tag}`, 15, 37);
  doc.text(`Date: ${dateStr}  Time: ${timeStr}`, 15, result.tag ? 42 : 37);

  // Overall Score & Status Badge
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 85, 28, 70, 18, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OVERALL STATUS', pageWidth - 80, 34);
  
  const statusColor = result.status === 'SAFE' ? [76, 175, 80] : [229, 57, 53];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFontSize(12);
  doc.text(result.status, pageWidth - 80, 42);
  
  doc.setTextColor(33, 37, 41);
  doc.setFontSize(14);
  doc.text(`Score: ${result.overallScore}/5`, pageWidth - 45, 42);

  // 3. Visual Analysis (Images)
  let yPos = 54;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('VISUAL ANALYSIS', 15, yPos);
  
  const maxSlotWidth = (pageWidth - 40) / 2;
  const maxSlotHeight = 45;
  
  const processImage = async (imgData: string | undefined, x: number, label: string) => {
    if (!imgData) return;
    const props = await getImageProperties(imgData);
    let drawWidth = maxSlotWidth;
    let drawHeight = drawWidth / props.ratio;
    if (drawHeight > maxSlotHeight) {
      drawHeight = maxSlotHeight;
      drawWidth = drawHeight * props.ratio;
    }
    const offsetX = (maxSlotWidth - drawWidth) / 2;
    const offsetY = (maxSlotHeight - drawHeight) / 2;
    doc.addImage(imgData, 'JPEG', x + offsetX, yPos + 4 + offsetY, drawWidth, drawHeight);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + maxSlotWidth / 2, yPos + maxSlotHeight + 8, { align: 'center' });
  };

  await processImage(result.beforeImage, 15, 'BEFORE SAMPLE');
  await processImage(result.afterImage, 25 + maxSlotWidth, 'AFTER REACTION');

  // 4. Adulterant Analysis Table
  yPos += 62;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CHEMICAL SCREENING RESULTS', 15, yPos);
  
  doc.setFillColor(30, 136, 229);
  doc.rect(15, yPos + 4, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('ADULTERANT', 20, yPos + 9.5);
  doc.text('STATUS', 75, yPos + 9.5);
  doc.text('CONFIDENCE', 115, yPos + 9.5);
  doc.text('VERDICT', 150, yPos + 9.5);
  
  let rowY = yPos + 12;
  result.results.forEach((res, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 247, i % 2 === 0 ? 255 : 250);
    doc.rect(15, rowY, pageWidth - 30, 8, 'F');
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(res.adulterant, 20, rowY + 5.5);
    const resColor = res.status === AdulterantStatus.DETECTED ? [229, 57, 53] : [76, 175, 80];
    doc.setTextColor(resColor[0], resColor[1], resColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(res.status, 75, rowY + 5.5);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(`${res.confidence}%`, 115, rowY + 5.5);
    doc.text(res.status === AdulterantStatus.DETECTED ? 'REJECT' : 'PASS', 150, rowY + 5.5);
    rowY += 8;
  });
  
  // 5. Summary Section (Replaces detailed health boxes to prevent overflow)
  const detected = result.results.filter(r => r.status === AdulterantStatus.DETECTED);
  rowY += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('REPORT SUMMARY', 15, rowY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  if (detected.length > 0) {
    const summaryText = `Based on the chemical analysis, ${detected.length} adulterant(s) were identified in this sample: ${detected.map(d => d.adulterant).join(', ')}. ` +
      detected.map(d => {
        const risk = d.healthRisk ? `Primary health concern: ${d.healthRisk}` : "Potential health risk detected.";
        return `${d.adulterant} presence suggests ${d.colorChange}. ${risk}`;
      }).join(' ');

    doc.text(summaryText, 15, rowY + 6, { 
      maxWidth: pageWidth - 30, 
      align: 'justify',
      lineHeightFactor: 1.5 
    });
  } else {
    doc.text("The visual and chemical analysis of the milk card did not detect significant levels of common adulterants (Water, Formalin, Detergent, Starch, Hydrogen Peroxide). The sample appears consistent with pure milk standards within the limitations of this screening tool.", 15, rowY + 6, { 
      maxWidth: pageWidth - 30, 
      align: 'justify',
      lineHeightFactor: 1.5 
    });
  }
  
  // 6. Footer
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.setFont('helvetica', 'normal');
  const footerBaseY = pageHeight - 18;
  doc.text(`Innovation by: Abdul Haseeb  |  Contact: abdulhaseeb0825@gmail.com`, pageWidth / 2, footerBaseY, { align: 'center' });
  doc.text(`This report is generated by MilQ Milk Adulterant Test System.`, pageWidth / 2, footerBaseY + 4, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.text(`For screening only. Lab confirmation recommended.`, pageWidth / 2, footerBaseY + 8, { align: 'center' });
  
  doc.save(`MilQ_Report_${result.id}.pdf`);
};