import { Guest, Table, DIETARY_LABELS } from '@/types/wedding';
import jsPDF from 'jspdf';

interface ExportPdfProps {
  tables: Table[];
  guests: Guest[];
  getTableGuests: (tableId: string) => Guest[];
  getSeatsUsed: (tableId: string) => number;
}

const COLORS = {
  ivory: [245, 240, 230] as const,
  sage: [88, 130, 100] as const,
  sageLighter: [160, 190, 165] as const,
  sageLight: [220, 235, 222] as const,
  charcoal: [45, 40, 35] as const,
  warmGray: [140, 130, 120] as const,
  cream: [250, 247, 240] as const,
  border: [215, 210, 200] as const,
};

function setColor(doc: jsPDF, color: readonly [number, number, number], type: 'text' | 'draw' | 'fill' = 'text') {
  if (type === 'text') doc.setTextColor(...color);
  else if (type === 'draw') doc.setDrawColor(...color);
  else doc.setFillColor(...color);
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function drawDecorativeLine(doc: jsPDF, x: number, y: number, width: number) {
  const cx = x + width / 2;
  setColor(doc, COLORS.sageLighter, 'draw');
  doc.setLineWidth(0.3);
  doc.line(cx - width * 0.35, y, cx - 4, y);
  doc.line(cx + 4, y, cx + width * 0.35, y);
  setColor(doc, COLORS.sage, 'fill');
  doc.circle(cx, y, 1.2, 'F');
}

interface SeatInfo {
  initials: string;
  name: string;
  filled: boolean;
  dietary: string;
  isPlus: boolean;
}

function buildSeatData(table: Table, guests: Guest[]): SeatInfo[] {
  const guestMap = new Map(guests.map(g => [g.id, g]));
  const seats: SeatInfo[] = [];

  table.seatOrder.forEach(entry => {
    const isPlus = entry.endsWith(':plus');
    const guestId = isPlus ? entry.replace(':plus', '') : entry;
    const guest = guestMap.get(guestId);
    if (!guest) return;
    const name = isPlus ? guest.plusOne : guest.name;
    const dietary = isPlus ? 'none' : guest.dietary;
    if (!name) return;
    seats.push({
      initials: getInitials(name),
      name,
      filled: true,
      dietary: dietary !== 'none' ? DIETARY_LABELS[dietary] : '',
      isPlus,
    });
  });

  while (seats.length < table.capacity) {
    seats.push({ initials: '', name: '', filled: false, dietary: '', isPlus: false });
  }

  return seats;
}

function drawRoundTable(doc: jsPDF, cx: number, cy: number, radius: number, seats: SeatInfo[]) {
  // Table circle
  setColor(doc, COLORS.border, 'draw');
  setColor(doc, [240, 237, 230], 'fill');
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, radius, 'FD');

  // Seats around the circle
  const seatRadius = Math.min(4, radius * 0.35);
  const orbitRadius = radius + seatRadius + 2;

  seats.forEach((seat, i) => {
    const angle = (i / seats.length) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const sx = cx + orbitRadius * Math.cos(rad);
    const sy = cy + orbitRadius * Math.sin(rad);

    if (seat.filled) {
      setColor(doc, COLORS.sageLight, 'fill');
      setColor(doc, COLORS.sage, 'draw');
    } else {
      setColor(doc, [240, 237, 230], 'fill');
      setColor(doc, COLORS.border, 'draw');
    }
    doc.setLineWidth(0.3);
    doc.circle(sx, sy, seatRadius, 'FD');

    if (seat.filled) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.min(5.5, seatRadius * 1.4));
      setColor(doc, COLORS.sage);
      doc.text(seat.initials, sx, sy + 0.8, { align: 'center' });
    }
  });
}

function drawRectTable(doc: jsPDF, cx: number, cy: number, tableW: number, tableH: number, seats: SeatInfo[]) {
  // Table rectangle
  setColor(doc, COLORS.border, 'draw');
  setColor(doc, [240, 237, 230], 'fill');
  doc.setLineWidth(0.4);
  doc.roundedRect(cx - tableW / 2, cy - tableH / 2, tableW, tableH, 2, 2, 'FD');

  const seatR = 3.5;
  const gap = 1.5;
  const totalSeats = seats.length;

  // Distribute seats: top, bottom, left side, right side
  const longSide = Math.ceil(totalSeats / 2);
  const topCount = Math.ceil(longSide / 1);
  const bottomCount = totalSeats - topCount;

  // Actually let's split evenly: half top, half bottom
  const top = Math.ceil(totalSeats / 2);
  const bottom = totalSeats - top;

  const drawSeatAt = (sx: number, sy: number, seat: SeatInfo) => {
    if (seat.filled) {
      setColor(doc, COLORS.sageLight, 'fill');
      setColor(doc, COLORS.sage, 'draw');
    } else {
      setColor(doc, [240, 237, 230], 'fill');
      setColor(doc, COLORS.border, 'draw');
    }
    doc.setLineWidth(0.3);
    doc.circle(sx, sy, seatR, 'FD');

    if (seat.filled) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      setColor(doc, COLORS.sage);
      doc.text(seat.initials, sx, sy + 0.8, { align: 'center' });
    }
  };

  // Top row
  const topY = cy - tableH / 2 - seatR - gap;
  const topSpacing = tableW / (top + 1);
  for (let i = 0; i < top; i++) {
    const sx = cx - tableW / 2 + topSpacing * (i + 1);
    drawSeatAt(sx, topY, seats[i]);
  }

  // Bottom row
  const bottomY = cy + tableH / 2 + seatR + gap;
  const bottomSpacing = tableW / (bottom + 1);
  for (let i = 0; i < bottom; i++) {
    const sx = cx - tableW / 2 + bottomSpacing * (i + 1);
    drawSeatAt(sx, bottomY, seats[top + i]);
  }
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

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.warmGray);
    const totalHeadcount = guests.reduce((a, g) => a + 1 + (g.plusOne ? 1 : 0), 0);
    const confirmed = guests.filter(g => g.rsvp === 'confirmed').length;
    doc.text(
      `${guests.length} guests  |  ${totalHeadcount} headcount  |  ${confirmed} confirmed  |  ${tables.length} tables`,
      pageW / 2, 25, { align: 'center' }
    );

    drawDecorativeLine(doc, margin, 32, pageW - margin * 2);

    doc.setFontSize(7);
    setColor(doc, COLORS.warmGray);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 35, { align: 'right' });

    // ─── Table cards with visual seat layout ───
    const colCount = Math.min(tables.length, 4);
    const gapX = 5;
    const gapY = 6;
    const colW = (pageW - margin * 2 - gapX * (colCount - 1)) / colCount;
    let currentX = margin;
    let currentY = 42;
    let rowMaxH = 0;

    tables.forEach((table, idx) => {
      const seatsUsed = getSeatsUsed(table.id);
      const isFull = seatsUsed >= table.capacity;
      const tableGuestsFiltered = guests.filter(g => g.tableId === table.id);
      const seatData = buildSeatData(table, tableGuestsFiltered);

      // Compact card heights
      const visualH = table.shape === 'round' ? 30 : 26;
      const nameLineH = 3.8;
      const filledSeats = seatData.filter(s => s.filled);
      const nameListH = Math.max(6, filledSeats.length * nameLineH + 3);
      const headerH = 10;
      const cardH = headerH + visualH + nameListH + 4;

      // Page break check
      if (currentY + cardH > pageH - 12 && idx > 0) {
        doc.addPage();
        setColor(doc, COLORS.ivory, 'fill');
        doc.rect(0, 0, pageW, pageH, 'F');
        currentX = margin;
        currentY = margin;
        rowMaxH = 0;
      }

      // Card shadow
      setColor(doc, [210, 205, 195], 'fill');
      doc.roundedRect(currentX + 0.5, currentY + 0.5, colW, cardH, 2, 2, 'F');

      // Card background
      setColor(doc, COLORS.cream, 'fill');
      doc.roundedRect(currentX, currentY, colW, cardH, 2, 2, 'F');
      setColor(doc, isFull ? COLORS.sage : COLORS.border, 'draw');
      doc.setLineWidth(isFull ? 0.4 : 0.2);
      doc.roundedRect(currentX, currentY, colW, cardH, 2, 2, 'S');

      // Status dot + Table name on one line, compact
      const dotX = currentX + 4;
      const dotY = currentY + 5.5;
      if (isFull) {
        setColor(doc, COLORS.sage, 'fill');
      } else if (seatsUsed / table.capacity >= 0.7) {
        doc.setFillColor(200, 170, 80);
      } else {
        setColor(doc, COLORS.warmGray, 'fill');
      }
      doc.circle(dotX, dotY, 1, 'F');

      // Table name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setColor(doc, COLORS.charcoal);
      doc.text(table.name, currentX + 7, currentY + 6.5);

      // Seat count
      const badgeText = `${seatsUsed}/${table.capacity}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      setColor(doc, isFull ? COLORS.sage : COLORS.warmGray);
      doc.text(badgeText, currentX + colW - 4, currentY + 6.5, { align: 'right' });

      // ─── Visual seat layout ───
      const vizCx = currentX + colW / 2;
      const vizCy = currentY + headerH + visualH / 2;

      if (table.shape === 'round') {
        const radius = Math.min(8, (colW - 24) / 2 * 0.4);
        drawRoundTable(doc, vizCx, vizCy, radius, seatData);
      } else {
        const tw = Math.min(colW - 24, 40);
        const th = 7;
        drawRectTable(doc, vizCx, vizCy, tw, th, seatData);
      }

      // Divider
      const divY = currentY + headerH + visualH + 1;
      setColor(doc, COLORS.border, 'draw');
      doc.setLineWidth(0.1);
      doc.line(currentX + 3, divY, currentX + colW - 3, divY);

      // ─── Name list below ───
      const listStartY = divY + 2;
      if (filledSeats.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        setColor(doc, [180, 175, 165]);
        doc.text('Empty', currentX + colW / 2, listStartY + 3, { align: 'center' });
      } else {
        filledSeats.forEach((seat, i) => {
          const ly = listStartY + i * nameLineH + 2;
          doc.setFont('helvetica', seat.isPlus ? 'italic' : 'normal');
          doc.setFontSize(6.5);
          setColor(doc, COLORS.charcoal);
          doc.text(`${i + 1}. ${seat.name}`, currentX + 4, ly);

          if (seat.dietary) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(4.5);
            setColor(doc, COLORS.sage);
            doc.text(seat.dietary, currentX + colW - 4, ly, { align: 'right' });
          }
        });
      }

      rowMaxH = Math.max(rowMaxH, cardH);

      if ((idx + 1) % colCount === 0) {
        currentX = margin;
        currentY += rowMaxH + gapY;
        rowMaxH = 0;
      } else {
        currentX += colW + gapX;
      }
    });

    // ─── Footer ───
    const footY = pageH - 6;
    setColor(doc, COLORS.border, 'draw');
    doc.setLineWidth(0.2);
    doc.line(margin, footY - 4, pageW - margin, footY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor(doc, COLORS.warmGray);
    doc.text('Generated with Seating Plan', pageW / 2, footY, { align: 'center' });

    doc.save('seating-chart.pdf');
  };

  return (
    <button
      onClick={handleExport}
      disabled={tables.length === 0}
      className="w-full bg-primary text-primary-foreground font-body text-sm font-medium py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Export Seating Chart (PDF)
    </button>
  );
}
