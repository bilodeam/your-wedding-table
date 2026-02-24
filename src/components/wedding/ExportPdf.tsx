import { Guest, Table } from '@/types/wedding';
import jsPDF from 'jspdf';

interface ExportPdfProps {
  tables: Table[];
  guests: Guest[];
  getTableGuests: (tableId: string) => Guest[];
  getSeatsUsed: (tableId: string) => number;
}

export function ExportPdf({ tables, guests, getTableGuests, getSeatsUsed }: ExportPdfProps) {
  const handleExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Seating Chart', pageW / 2, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${guests.length} guests · ${tables.length} tables · Generated ${new Date().toLocaleDateString()}`, pageW / 2, 27, { align: 'center' });
    doc.setTextColor(0);

    // Layout tables in a grid
    const colCount = Math.min(tables.length, 4);
    const colW = (pageW - margin * 2) / colCount;
    const startY = 35;
    let x = margin;
    let y = startY;
    let rowMaxH = 0;

    tables.forEach((table, idx) => {
      const tableGuests = getTableGuests(table.id);
      const seatsUsed = getSeatsUsed(table.id);
      const shapeLabel = table.shape === 'round' ? '○' : '▭';

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(table.name, x + colW / 2, y, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`${shapeLabel} ${seatsUsed}/${table.capacity} seats`, x + colW / 2, y + 5, { align: 'center' });
      doc.setTextColor(0);

      // Draw a subtle box
      const boxX = x + 4;
      const boxW = colW - 8;
      const lineH = 5;
      const guestLines: string[] = [];

      table.seatOrder.forEach(entry => {
        const isPlus = entry.endsWith(':plus');
        const guestId = isPlus ? entry.replace(':plus', '') : entry;
        const guest = guests.find(g => g.id === guestId);
        if (!guest) return;
        const name = isPlus ? guest.plusOne : guest.name;
        if (name) guestLines.push(name);
      });

      const boxH = Math.max(15, guestLines.length * lineH + 10);
      doc.setDrawColor(200);
      doc.roundedRect(boxX, y + 8, boxW, boxH, 2, 2);

      // Guest names
      doc.setFontSize(9);
      guestLines.forEach((name, i) => {
        doc.text(`${i + 1}. ${name}`, boxX + 4, y + 15 + i * lineH);
      });

      if (guestLines.length === 0) {
        doc.setTextColor(160);
        doc.setFontSize(8);
        doc.text('No guests assigned', x + colW / 2, y + 17, { align: 'center' });
        doc.setTextColor(0);
      }

      const blockH = boxH + 14;
      rowMaxH = Math.max(rowMaxH, blockH);

      // Move to next column or row
      if ((idx + 1) % colCount === 0) {
        x = margin;
        y += rowMaxH + 6;
        rowMaxH = 0;
        // New page if needed
        if (y + 40 > pageH && idx < tables.length - 1) {
          doc.addPage();
          y = margin;
        }
      } else {
        x += colW;
      }
    });

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
