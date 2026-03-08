import { Guest, Table } from '@/types/wedding';
import { useRef, useState } from 'react';

interface TableCardProps {
  table: Table;
  guests: Guest[];
  seatsUsed: number;
  onDropGuest: (guestId: string, tableId: string) => void;
  onUnassignGuest: (guestId: string) => void;
  onRemoveTable: (tableId: string) => void;
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void;
  onPositionChange: (tableId: string, position: { x: number; y: number }) => void;
  onSwapSeats: (tableId: string, fromIndex: number, toIndex: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TableCard({
  table, guests, seatsUsed,
  onDropGuest, onUnassignGuest, onRemoveTable, onUpdateTable,
  onPositionChange, onSwapSeats, containerRef,
}: TableCardProps) {
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [capacityValue, setCapacityValue] = useState(String(table.capacity));
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(table.name);

  const fillRatio = seatsUsed / table.capacity;
  const statusColor =
    fillRatio >= 1
      ? 'border-success/60 bg-success/5'
      : fillRatio >= 0.7
      ? 'border-warning/60 bg-warning/5'
      : 'border-border bg-card';

  const statusDot =
    fillRatio >= 1 ? 'bg-success' : fillRatio >= 0.7 ? 'bg-warning' : 'bg-neutral';

  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [draggingSeatIndex, setDraggingSeatIndex] = useState<number | null>(null);
  const [hoverSeatIndex, setHoverSeatIndex] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // FIX: Shared drag logic used by both mouse and touch events
  const startTableDrag = (clientX: number, clientY: number, targetEl: HTMLElement) => {
    setIsDraggingTable(true);
    const rect = targetEl.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const moveTable = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x =
      clientX - containerRect.left - dragOffset.current.x + containerRef.current.scrollLeft;
    const y =
      clientY - containerRect.top - dragOffset.current.y + containerRef.current.scrollTop;
    onPositionChange(table.id, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [data-seat]')) return;
    e.preventDefault();
    startTableDrag(e.clientX, e.clientY, e.currentTarget as HTMLElement);

    const handleMouseMove = (ev: MouseEvent) => moveTable(ev.clientX, ev.clientY);
    const handleMouseUp = () => {
      setIsDraggingTable(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // FIX: Touch drag support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [data-seat]')) return;
    const touch = e.touches[0];
    startTableDrag(touch.clientX, touch.clientY, e.currentTarget as HTMLElement);

    const handleTouchMove = (ev: TouchEvent) => {
      ev.preventDefault(); // prevent page scroll while dragging
      const t = ev.touches[0];
      moveTable(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => {
      setIsDraggingTable(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const guestId = e.dataTransfer.getData('guestId');
    if (guestId) onDropGuest(guestId, table.id);
  };

  // Build seat data from seatOrder
  const guestMap = new Map(guests.map(g => [g.id, g]));
  const seatData: {
    key: string;
    initials: string;
    filled: boolean;
    label: string;
    orderIndex: number;
    notes?: string;
  }[] = [];

  table.seatOrder.forEach((entry, i) => {
    const isPlus = entry.endsWith(':plus');
    const guestId = isPlus ? entry.replace(':plus', '') : entry;
    const guest = guestMap.get(guestId);
    if (!guest) return;
    const name = isPlus ? guest.plusOne : guest.name;
    if (!name) return;
    seatData.push({
      key: entry,
      initials: getInitials(name),
      filled: true,
      label: name,
      orderIndex: i,
      notes: !isPlus ? guest.notes : undefined,
    });
  });

  while (seatData.length < table.capacity) {
    seatData.push({
      key: `empty-${seatData.length}`,
      initials: '',
      filled: false,
      label: 'Empty seat',
      orderIndex: -1,
    });
  }

  const isRound = table.shape === 'round';

  const seatEl = (seat: (typeof seatData)[0], i: number, style: React.CSSProperties, extraClass?: string) => {
    const isDragSource = draggingSeatIndex === i;
    const isDropTarget =
      hoverSeatIndex === i && draggingSeatIndex !== null && draggingSeatIndex !== i;
    return (
      <div
        key={seat.key}
        data-seat
        draggable={seat.filled}
        onDragStart={e => {
          if (!seat.filled) return;
          e.stopPropagation();
          setDraggingSeatIndex(i);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setHoverSeatIndex(i); }}
        onDragLeave={() => setHoverSeatIndex(null)}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          if (draggingSeatIndex !== null && seat.filled && seat.orderIndex >= 0) {
            const fromOrder = seatData[draggingSeatIndex]?.orderIndex;
            if (fromOrder !== undefined && fromOrder >= 0)
              onSwapSeats(table.id, fromOrder, seat.orderIndex);
          }
          setDraggingSeatIndex(null);
          setHoverSeatIndex(null);
        }}
        onDragEnd={() => { setDraggingSeatIndex(null); setHoverSeatIndex(null); }}
        className={`absolute w-7 h-7 rounded-full border flex items-center justify-center text-[9px] font-body font-medium transition-all ${
          seat.filled
            ? 'bg-primary/30 border-primary/50 text-primary cursor-grab active:cursor-grabbing'
            : 'bg-secondary border-border text-muted-foreground'
        } ${isDragSource ? 'opacity-40 scale-90' : ''} ${isDropTarget ? 'ring-2 ring-primary scale-110' : ''} ${extraClass || ''}`}
        style={style}
        title={seat.notes ? `${seat.label} — ${seat.notes}` : seat.label}
      >
        {seat.filled ? seat.initials : ''}
      </div>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`rounded-lg border-2 p-4 transition-all animate-scale-in w-[240px] select-none ${statusColor} ${
        isDraggingTable ? 'shadow-lg shadow-primary/20 z-20' : ''
      }`}
      style={{ cursor: isDraggingTable ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot}`} />
          {editingName ? (
            <input
              autoFocus
              type="text"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={() => {
                const val = nameValue.trim() || table.name;
                onUpdateTable(table.id, { name: val });
                setNameValue(val);
                setEditingName(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setNameValue(table.name); setEditingName(false); }
              }}
              className="w-24 h-6 text-sm bg-secondary border border-border rounded px-1.5 font-display font-semibold text-foreground"
            />
          ) : (
            <h4
              onClick={() => { setNameValue(table.name); setEditingName(true); }}
              className="font-display text-base font-semibold text-foreground cursor-text hover:text-primary/80 transition-colors"
              title="Click to rename"
            >
              {table.name}
            </h4>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editingCapacity ? (
            <input
              autoFocus
              type="number"
              min={seatsUsed || 1}
              value={capacityValue}
              onChange={e => setCapacityValue(e.target.value)}
              onBlur={() => {
                const val = Math.max(seatsUsed || 1, parseInt(capacityValue) || 1);
                onUpdateTable(table.id, { capacity: val });
                setCapacityValue(String(val));
                setEditingCapacity(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setCapacityValue(String(table.capacity)); setEditingCapacity(false); }
              }}
              className="w-10 h-5 text-[10px] text-center bg-secondary border border-border rounded font-body text-foreground"
            />
          ) : (
            <button
              onClick={() => { setCapacityValue(String(table.capacity)); setEditingCapacity(true); }}
              className="text-[10px] font-body text-muted-foreground hover:text-foreground transition-colors"
              title="Click to edit capacity"
            >
              {isRound ? '○' : '▭'} {seatsUsed}/{table.capacity}
            </button>
          )}
          <button
            onClick={() => onRemoveTable(table.id)}
            className="text-muted-foreground hover:text-destructive text-xs transition-colors"
            title="Remove table"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Seat visualization */}
      {isRound ? (
        <div className="relative w-[140px] h-[140px] mx-auto mb-3">
          <div className="absolute inset-[25px] rounded-full border-2 border-border bg-secondary/30" />
          {seatData.map((seat, i) => {
            const angle = (i / table.capacity) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const cx = 70 + 55 * Math.cos(rad);
            const cy = 70 + 55 * Math.sin(rad);
            return seatEl(seat, i, { left: cx - 14, top: cy - 14 });
          })}
        </div>
      ) : (
        <div className="mb-3">
          <div className="border-2 border-border bg-secondary/30 rounded-md px-2 py-3 min-h-[60px]">
            <div className="flex flex-wrap gap-1.5 justify-center relative">
              {seatData.map((seat, i) => {
                const isDragSource = draggingSeatIndex === i;
                const isDropTarget =
                  hoverSeatIndex === i && draggingSeatIndex !== null && draggingSeatIndex !== i;
                return (
                  <div
                    key={seat.key}
                    data-seat
                    draggable={seat.filled}
                    onDragStart={e => {
                      if (!seat.filled) return;
                      e.stopPropagation();
                      setDraggingSeatIndex(i);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setHoverSeatIndex(i); }}
                    onDragLeave={() => setHoverSeatIndex(null)}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggingSeatIndex !== null && seat.filled && seat.orderIndex >= 0) {
                        const fromOrder = seatData[draggingSeatIndex]?.orderIndex;
                        if (fromOrder !== undefined && fromOrder >= 0)
                          onSwapSeats(table.id, fromOrder, seat.orderIndex);
                      }
                      setDraggingSeatIndex(null);
                      setHoverSeatIndex(null);
                    }}
                    onDragEnd={() => { setDraggingSeatIndex(null); setHoverSeatIndex(null); }}
                    className={`w-7 h-7 rounded border flex items-center justify-center text-[9px] font-body font-medium transition-all ${
                      seat.filled
                        ? 'bg-primary/30 border-primary/50 text-primary cursor-grab active:cursor-grabbing'
                        : 'bg-secondary border-border text-muted-foreground'
                    } ${isDragSource ? 'opacity-40 scale-90' : ''} ${isDropTarget ? 'ring-2 ring-primary scale-110' : ''}`}
                    title={seat.notes ? `${seat.label} — ${seat.notes}` : seat.label}
                  >
                    {seat.filled ? seat.initials : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assigned guests list */}
      {guests.length > 0 ? (
        <div className="space-y-1.5">
          {guests.map(guest => (
            <div
              key={guest.id}
              className="flex items-center justify-between bg-secondary/50 rounded px-2.5 py-1.5 group"
            >
              <div className="min-w-0">
                <span className="text-xs font-body text-foreground truncate block">
                  {guest.name}
                  {guest.plusOne && (
                    <span className="text-cream-muted"> + {guest.plusOne}</span>
                  )}
                </span>
                {guest.notes && (
                  <span className="text-[10px] text-muted-foreground truncate block">
                    📝 {guest.notes}
                  </span>
                )}
              </div>
              <button
                onClick={() => onUnassignGuest(guest.id)}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 text-xs transition-all ml-2 flex-shrink-0"
                title="Remove from table"
              >
                ↩
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-body text-center py-2 border border-dashed border-border rounded">
          Drag guests here
        </p>
      )}
    </div>
  );
}
