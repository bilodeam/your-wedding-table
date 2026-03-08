import { useState } from 'react';
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
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<Guest['rsvp'] | 'all'>('all');
  const [filterDietary, setFilterDietary] = useState<Guest['dietary'] | 'all'>('all');

  const filtered = guests.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !(g.plusOne && g.plusOne.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterRsvp !== 'all' && g.rsvp !== filterRsvp) return false;
    if (filterDietary !== 'all' && g.dietary !== filterDietary) return false;
    return true;
  });

  if (guests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center animate-fade-in">
        <p className="text-muted-foreground font-body text-sm">No unassigned guests yet.</p>
        <p className="text-muted-foreground font-body text-xs mt-1">Add guests above, then drag them to a table.</p>
      </div>
    );
  }

  const selectClass = "bg-secondary border border-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border space-y-2">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Unassigned Guests
          <span className="text-sm font-body font-normal text-muted-foreground ml-2">
            ({filtered.length}{filtered.length !== guests.length ? `/${guests.length}` : ''})
          </span>
        </h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[120px] bg-secondary border border-border rounded px-2.5 py-1 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <select value={filterRsvp} onChange={e => setFilterRsvp(e.target.value as any)} className={selectClass}>
            <option value="all">All RSVP</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
          <select value={filterDietary} onChange={e => setFilterDietary(e.target.value as any)} className={selectClass}>
            <option value="all">All Dietary</option>
            <option value="none">No restrictions</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten Free</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-muted-foreground font-body text-xs">No guests match your filters.</p>
          </div>
        ) : (
          filtered.map(guest => (
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
          ))
        )}
      </div>
    </div>
  );
}
