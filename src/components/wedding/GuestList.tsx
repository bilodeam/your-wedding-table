import { Guest, DIETARY_LABELS, RSVP_LABELS } from '@/types/wedding';

interface GuestListProps {
  guests: Guest[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Guest>) => void;
  onDragStart: (guestId: string) => void;
}

const rsvpColors: Record<Guest['rsvp'], string> = {
  confirmed: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  declined: 'bg-destructive/20 text-destructive',
};

const dietaryIcon: Record<Guest['dietary'], string> = {
  none: '',
  vegetarian: '🌿',
  vegan: '🌱',
  'gluten-free': '🌾',
};

export function GuestList({ guests, onRemove, onUpdate, onDragStart }: GuestListProps) {
  if (guests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center animate-fade-in">
        <p className="text-muted-foreground font-body text-sm">No unassigned guests yet.</p>
        <p className="text-muted-foreground font-body text-xs mt-1">Add guests above, then drag them to a table.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Unassigned Guests
          <span className="text-sm font-body font-normal text-muted-foreground ml-2">
            ({guests.length})
          </span>
        </h3>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {guests.map(guest => (
          <div
            key={guest.id}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('guestId', guest.id);
              onDragStart(guest.id);
            }}
            className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 cursor-grab active:cursor-grabbing transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {guest.name}
                  {guest.plusOne && (
                    <span className="text-cream-muted font-normal"> + {guest.plusOne}</span>
                  )}
                  {dietaryIcon[guest.dietary] && (
                    <span className="ml-1.5">{dietaryIcon[guest.dietary]}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rsvpColors[guest.rsvp]}`}>
                {RSVP_LABELS[guest.rsvp]}
              </span>
              <button
                onClick={() => onRemove(guest.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all text-sm px-1"
                title="Remove guest"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
