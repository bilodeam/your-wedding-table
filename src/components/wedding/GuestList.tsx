import { useState } from 'react';
import { Guest, RSVP_LABELS } from '@/types/wedding';

interface GuestListProps {
  guests: Guest[];
  mealOptions: string[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Guest>) => void;
  onDragStart: (guestId: string) => void;
}

const rsvpColors: Record<Guest['rsvp'], string> = {
  confirmed: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  declined: 'bg-destructive/20 text-destructive',
};

// FIX: Dynamic meal icon — falls back gracefully for custom meal options
const DEFAULT_MEAL_ICONS: Record<string, string> = {
  Vegetarian: '🌿',
  Vegan: '🌱',
  'Gluten Free': '🌾',
};

function getMealIcon(meal: string): string {
  return DEFAULT_MEAL_ICONS[meal] || '🍽️';
}

interface EditingState {
  name: string;
  plusOne: string;
  meal: string;
  rsvp: Guest['rsvp'];
  notes: string;
}

export function GuestList({ guests, mealOptions, onRemove, onUpdate, onDragStart }: GuestListProps) {
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<Guest['rsvp'] | 'all'>('all');
  const [filterMeal, setFilterMeal] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const filtered = guests.filter(g => {
    if (
      search &&
      !g.name.toLowerCase().includes(search.toLowerCase()) &&
      !(g.plusOne && g.plusOne.toLowerCase().includes(search.toLowerCase()))
    )
      return false;
    if (filterRsvp !== 'all' && g.rsvp !== filterRsvp) return false;
    if (filterMeal !== 'all' && g.meal !== filterMeal) return false;
    return true;
  });

  const startEditing = (guest: Guest) => {
    setEditingId(guest.id);
    setEditingState({
      name: guest.name,
      plusOne: guest.plusOne,
      meal: guest.meal,
      rsvp: guest.rsvp,
      notes: guest.notes || '',
    });
  };

  const saveEditing = (id: string) => {
    if (!editingState || !editingState.name.trim()) return;
    onUpdate(id, {
      name: editingState.name.trim(),
      plusOne: editingState.plusOne.trim(),
      meal: editingState.meal,
      rsvp: editingState.rsvp,
      notes: editingState.notes.trim(),
    });
    setEditingId(null);
    setEditingState(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingState(null);
  };

  const handleLinkClick = (guest: Guest) => {
    if (!linkingId) {
      // Start linking mode — this guest will become the primary
      setLinkingId(guest.id);
      return;
    }
    if (linkingId === guest.id) {
      // Cancel linking
      setLinkingId(null);
      return;
    }
    // Merge: linkingId guest becomes primary, clicked guest becomes their plus-one
    const primary = guests.find(g => g.id === linkingId);
    if (!primary) { setLinkingId(null); return; }
    onUpdate(linkingId, { plusOne: guest.name });
    onRemove(guest.id);
    setLinkingId(null);
  };

  if (guests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center animate-fade-in">
        <p className="text-muted-foreground font-body text-sm">No unassigned guests yet.</p>
        <p className="text-muted-foreground font-body text-xs mt-1">
          Add guests above, then drag them to a table.
        </p>
      </div>
    );
  }

  const selectClass =
    'bg-secondary border border-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50';
  const editInputClass =
    'w-full bg-background border border-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50';

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
          <select
            value={filterRsvp}
            onChange={e => setFilterRsvp(e.target.value as any)}
            className={selectClass}
          >
            <option value="all">All RSVP</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={filterMeal}
            onChange={e => setFilterMeal(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Meals</option>
            <option value="">No preference</option>
            {(mealOptions || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-muted-foreground font-body text-xs">No guests match your filters.</p>
          </div>
        ) : (
          filtered.map(guest => {
            const isEditing = editingId === guest.id;

            if (isEditing && editingState) {
              return (
                <div key={guest.id} className="px-4 py-3 bg-secondary/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Name *</label>
                      <input
                        autoFocus
                        type="text"
                        value={editingState.name}
                        onChange={e => setEditingState(s => s ? { ...s, name: e.target.value } : s)}
                        className={editInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Plus One</label>
                      <input
                        type="text"
                        value={editingState.plusOne}
                        onChange={e => setEditingState(s => s ? { ...s, plusOne: e.target.value } : s)}
                        className={editInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Meal</label>
                      <select
                        value={editingState.meal}
                        onChange={e => setEditingState(s => s ? { ...s, meal: e.target.value } : s)}
                        className={editInputClass}
                      >
                        <option value="">No preference</option>
                        {(mealOptions || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">RSVP</label>
                      <select
                        value={editingState.rsvp}
                        onChange={e => setEditingState(s => s ? { ...s, rsvp: e.target.value as Guest['rsvp'] } : s)}
                        className={editInputClass}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Notes</label>
                      <input
                        type="text"
                        value={editingState.notes}
                        onChange={e => setEditingState(s => s ? { ...s, notes: e.target.value } : s)}
                        placeholder="Special requirements…"
                        className={editInputClass}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEditing(guest.id)}
                      className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded font-body hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-xs px-3 py-1 bg-secondary border border-border text-foreground rounded font-body hover:bg-accent/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            const isLinkTarget = linkingId && linkingId !== guest.id && !guest.plusOne;
            const isLinkSource = linkingId === guest.id;

            return (
              <div
                key={guest.id}
                draggable={!linkingId}
                onDragStart={e => {
                  if (linkingId) { e.preventDefault(); return; }
                  e.dataTransfer.setData('guestId', guest.id);
                  onDragStart(guest.id);
                }}
                onClick={() => { if (linkingId) handleLinkClick(guest); }}
                className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                  isLinkSource
                    ? 'bg-primary/10 ring-1 ring-primary/40'
                    : isLinkTarget
                    ? 'hover:bg-primary/5 cursor-pointer'
                    : linkingId
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-secondary/50 cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLinkSource ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {guest.name}
                      {guest.plusOne && (
                        <span className="text-cream-muted font-normal"> + {guest.plusOne}</span>
                      )}
                      {guest.meal && (
                        <span className="ml-1.5" title={guest.meal}>
                          {getMealIcon(guest.meal)}
                        </span>
                      )}
                    </p>
                    {isLinkSource && (
                      <p className="text-[11px] text-primary font-body mt-0.5">
                        Click another guest to pair as plus-one · click again to cancel
                      </p>
                    )}
                    {guest.notes && !isLinkSource && (
                      <p className="text-[11px] text-muted-foreground font-body truncate mt-0.5">
                        📝 {guest.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rsvpColors[guest.rsvp]}`}>
                    {RSVP_LABELS[guest.rsvp]}
                  </span>
                  {!linkingId && !guest.plusOne && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLinkClick(guest); }}
                      className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
                      title="Link as plus-one pair"
                    >
                      🔗
                    </button>
                  )}
                  {!linkingId && (
                    <>
                      <button
                        onClick={() => startEditing(guest)}
                        className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
                        title="Edit guest"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onRemove(guest.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all text-sm px-1"
                        title="Remove guest"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
