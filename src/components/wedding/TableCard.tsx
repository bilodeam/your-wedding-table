import { Guest, Table } from '@/types/wedding';

interface TableCardProps {
  table: Table;
  guests: Guest[];
  seatsUsed: number;
  onDropGuest: (guestId: string, tableId: string) => void;
  onUnassignGuest: (guestId: string) => void;
  onRemoveTable: (tableId: string) => void;
}

export function TableCard({ table, guests, seatsUsed, onDropGuest, onUnassignGuest, onRemoveTable }: TableCardProps) {
  const fillRatio = seatsUsed / table.capacity;
  const statusColor = fillRatio >= 1
    ? 'border-success/60 bg-success/5'
    : fillRatio >= 0.7
      ? 'border-warning/60 bg-warning/5'
      : 'border-border bg-card';

  const statusDot = fillRatio >= 1
    ? 'bg-success'
    : fillRatio >= 0.7
      ? 'bg-warning'
      : 'bg-neutral';

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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg border-2 p-4 transition-all animate-scale-in ${statusColor}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot}`} />
          <h4 className="font-display text-base font-semibold text-foreground">{table.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-muted-foreground">
            {seatsUsed}/{table.capacity} seats
          </span>
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
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Array.from({ length: table.capacity }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border transition-colors flex items-center justify-center text-[9px] font-body ${
              i < seatsUsed
                ? 'bg-primary/30 border-primary/50 text-primary'
                : 'bg-secondary border-border text-muted-foreground'
            }`}
          >
            {i < seatsUsed ? '●' : '○'}
          </div>
        ))}
      </div>

      {/* Assigned guests */}
      {guests.length > 0 ? (
        <div className="space-y-1.5">
          {guests.map(guest => (
            <div
              key={guest.id}
              className="flex items-center justify-between bg-secondary/50 rounded px-2.5 py-1.5 group"
            >
              <span className="text-xs font-body text-foreground truncate">
                {guest.name}
                {guest.plusOne && (
                  <span className="text-cream-muted"> + {guest.plusOne}</span>
                )}
              </span>
              <button
                onClick={() => onUnassignGuest(guest.id)}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 text-xs transition-all ml-2"
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
