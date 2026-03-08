import { Guest, Table, DIETARY_LABELS } from '@/types/wedding';
import jsPDF from 'jspdf';

interface ExportPdfProps {
  tables: Table[];
  guests: Guest[];
  getTableGuests: (tableId: string) => Guest[];
  getSeatsUsed: (tableId: string) => number;
}

// Warm palette inspired by the app's ivory/sage theme
const COLORS = {
  ivory: [245, 240, 230] as const,      // warm background
  sage: [88, 130, 100] as const,         // primary accent
  sageLighter: [160, 190, 165] as const, // lighter sage
  sageLight: [220, 235, 222] as const,   // very light sage fill
  charcoal: [45, 40, 35] as const,       // dark text
  warmGray: [140, 130, 120] as const,    // muted text
  cream: [250, 247, 240] as const,       // card fill
  border: [215, 210, 200] as const,      // subtle borders
  gold: [180, 155, 100] as const,        // decorative accent
};

function setColor(doc: jsPDF, color: readonly [number, number, number], type: 'text' | 'draw' | 'fill' = 'text') {
  if (type === 'text') doc.setTextColor(...color);
  else if (type === 'draw') doc.setDrawColor(...color);
  else doc.setFillColor(...color);
}

function drawDecorativeLine(doc: jsPDF, x: number, y: number, width: number) {
  const cx = x + width / 2;
  setColor(doc, COLORS.sageLighter, 'draw');
  doc.setLineWidth(0.3);
  // Left line
  doc.line(cx - width * 0.35, y, cx - 8, y);
  // Right line
  doc.line(cx + 8, y, cx + width * 0.35, y);
  // Center diamond
  setColor(doc, COLORS.sage, 'fill');
  const d = 2;
  doc.triangle(cx, y - d, cx + d, y, cx, y + d, 'F');
  doc.triangle(cx, y - d, cx - d, y, cx, y + d, 'F');
}

export function ExportPdf({ tables, guests, getTableGuests, getSeatsUsed }: ExportPdfProps) {
  const handleExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;

    // ─── Background ───
    setColor(doc, COLORS.ivory, 'fill');
    doc.rect(0, 0, pageW, pageH, 'F');

    // ─── Header band ───
    setColor(doc, COLORS.cream, 'fill');
    doc.rect(0, 0, pageW, 38, 'F');
    setColor(doc, COLORS.border, 'draw');
    doc.setLineWidth(0.3);
    doc.line(0, 38, pageW, 38);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    setColor(doc, COLORS.charcoal);
    doc.text('Seating Chart', pageW / 2, 18, { align: 'center' });

    // Subtitle stats
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.warmGray);
    const totalHeadcount = guests.reduce((a, g) => a + 1 + (g.plusOne ? 1 : 0), 0);
    const confirmed = guests.filter(g => g.rsvp === 'confirmed').length;
    doc.text(
      `${guests.length} guests · ${totalHeadcount} headcount · ${confirmed} confirmed · ${tables.length} tables`,
      pageW / 2, 25, { align: 'center' }
    );

    // Decorative line
    drawDecorativeLine(doc, margin, 32, pageW - margin * 2);

    // Date
    doc.setFontSize(7);
    setColor(doc, COLORS.warmGray);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 35, { align: 'right' });

    // ─── Table cards grid ───
    const colCount = Math.min(tables.length, 4);
    const gapX = 6;
    const gapY = 8;
    const colW = (pageW - margin * 2 - gapX * (colCount - 1)) / colCount;
    let currentX = margin;
    let currentY = 44;
    let rowMaxH = 0;

    tables.forEach((table, idx) => {
      const tableGuests = getTableGuests(table.id);
      const seatsUsed = getSeatsUsed(table.id);
      const isFull = seatsUsed >= table.capacity;

      // Build guest lines from seat order
      const guestLines: { name: string; dietary: string; isPlus: boolean }[] = [];
      table.seatOrder.forEach(entry => {
        const isPlus = entry.endsWith(':plus');
        const guestId = isPlus ? entry.replace(':plus', '') : entry;
        const guest = guests.find(g => g.id === guestId);
        if (!guest) return;
        const name = isPlus ? guest.plusOne : guest.name;
        const dietary = isPlus ? 'none' : guest.dietary;
        if (name) guestLines.push({ name, dietary: dietary !== 'none' ? DIETARY_LABELS[dietary] : '', isPlus });
      });

      const lineH = 5.5;
      const headerH = 16;
      const bodyH = Math.max(16, guestLines.length * lineH + 6);
      const cardH = headerH + bodyH + 4;

      // Check for page break
      if (currentY + cardH > pageH - 10 && idx > 0) {
        doc.addPage();
        setColor(doc, COLORS.ivory, 'fill');
        doc.rect(0, 0, pageW, pageH, 'F');
        currentX = margin;
        currentY = margin;
        rowMaxH = 0;
      }

      // Card shadow
      setColor(doc, [210, 205, 195], 'fill');
      doc.roundedRect(currentX + 0.8, currentY + 0.8, colW, cardH, 2.5, 2.5, 'F');

      // Card background
      setColor(doc, COLORS.cream, 'fill');
      doc.roundedRect(currentX, currentY, colW, cardH, 2.5, 2.5, 'F');

      // Card border
      setColor(doc, isFull ? COLORS.sage : COLORS.border, 'draw');
      doc.setLineWidth(isFull ? 0.6 : 0.3);
      doc.roundedRect(currentX, currentY, colW, cardH, 2.5, 2.5, 'S');

      // Status indicator dot
      const dotX = currentX + 6;
      const dotY = currentY + 7;
      if (isFull) {
        setColor(doc, COLORS.sage, 'fill');
      } else if (seatsUsed / table.capacity >= 0.7) {
        doc.setFillColor(200, 170, 80);
      } else {
        setColor(doc, COLORS.warmGray, 'fill');
      }
      doc.circle(dotX, dotY, 1.5, 'F');

      // Table name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setColor(doc, COLORS.charcoal);
      doc.text(table.name, currentX + 10, currentY + 8);

      // Seat count badge
      const badgeText = `${seatsUsed}/${table.capacity}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const badgeW = doc.getTextWidth(badgeText) + 6;
      const badgeX = currentX + colW - badgeW - 5;
      const badgeY = currentY + 4;
      setColor(doc, isFull ? COLORS.sageLight : [240, 237, 230], 'fill');
      doc.roundedRect(badgeX, badgeY, badgeW, 6, 1.5, 1.5, 'F');
      setColor(doc, isFull ? COLORS.sage : COLORS.warmGray);
      doc.text(badgeText, badgeX + badgeW / 2, badgeY + 4.3, { align: 'center' });

      // Shape icon
      const shapeIcon = table.shape === 'round' ? '○' : '▭';
      doc.setFontSize(7);
      setColor(doc, COLORS.warmGray);
      doc.text(shapeIcon, badgeX - 5, currentY + 8.3);

      // Divider line
      const divY = currentY + headerH - 1;
      setColor(doc, COLORS.border, 'draw');
      doc.setLineWidth(0.2);
      doc.line(currentX + 5, divY, currentX + colW - 5, divY);

      // Guest list
      const listY = currentY + headerH + 3;
      if (guestLines.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        setColor(doc, [180, 175, 165]);
        doc.text('No guests assigned', currentX + colW / 2, listY + 6, { align: 'center' });
      } else {
        guestLines.forEach((line, i) => {
          const ly = listY + i * lineH + 3.5;

          // Seat number circle
          const circleX = currentX + 7;
          setColor(doc, COLORS.sageLight, 'fill');
          doc.circle(circleX, ly - 1.2, 2.2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          setColor(doc, COLORS.sage);
          doc.text(String(i + 1), circleX, ly, { align: 'center' });

          // Name
          doc.setFont('helvetica', line.isPlus ? 'italic' : 'normal');
          doc.setFontSize(8.5);
          setColor(doc, COLORS.charcoal);
          const displayName = line.isPlus ? `↳ ${line.name}` : line.name;
          doc.text(displayName, currentX + 12, ly);

          // Dietary tag
          if (line.dietary) {
            const tagX = currentX + colW - 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            setColor(doc, COLORS.sage);
            doc.text(line.dietary, tagX, ly, { align: 'right' });
          }
        });
      }

      rowMaxH = Math.max(rowMaxH, cardH);

      // Advance position
      if ((idx + 1) % colCount === 0) {
        currentX = margin;
        currentY += rowMaxH + gapY;
        rowMaxH = 0;
      } else {
        currentX += colW + gapX;
      }
    });

    // ─── Footer on last page ───
    const footY = pageH - 6;
    setColor(doc, COLORS.border, 'draw');
    doc.setLineWidth(0.2);
    doc.line(margin, footY - 4, pageW - margin, footY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor(doc, COLORS.warmGray);
    doc.text('Generated with Seating Plan ✦', pageW / 2, footY, { align: 'center' });

    doc.save('seating-chart.pdf');
  };

  return (
    <button
      onClick={handleExport}
      disabled={tables.length === 0}
      className="w-full bg-primary text-primary-foreground font-body text-sm font-medium py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
    >
      📄 Export Seating Chart (PDF)
    </button>
  );
}
