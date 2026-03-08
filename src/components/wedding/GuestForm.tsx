import { useState } from 'react';
import { Guest } from '@/types/wedding';

interface GuestFormProps {
  onAdd: (guest: Omit<Guest, 'id' | 'tableId'>) => void;
  mealOptions: string[];
  importElement?: React.ReactNode;
}

export function GuestForm({ onAdd, mealOptions, importElement }: GuestFormProps) {
  const [name, setName] = useState('');
  const [plusOne, setPlusOne] = useState('');
  const [meal, setMeal] = useState('');
  const [rsvp, setRsvp] = useState<Guest['rsvp']>('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), plusOne: plusOne.trim(), meal, rsvp });
    setName('');
    setPlusOne('');
    setMeal('');
    setRsvp('pending');
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 font-body";
  const selectClass = inputClass + " appearance-none cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Add Guest</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Guest Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Plus One</label>
          <input
            type="text"
            value={plusOne}
            onChange={e => setPlusOne(e.target.value)}
            placeholder="e.g. James Johnson"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Meal</label>
          <select value={meal} onChange={e => setMeal(e.target.value)} className={selectClass}>
            <option value="">No preference</option>
            {(mealOptions || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>RSVP Status</label>
          <select value={rsvp} onChange={e => setRsvp(e.target.value as Guest['rsvp'])} className={selectClass}>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3 flex-wrap">
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-primary-foreground font-body font-medium text-sm rounded-md hover:opacity-90 transition-opacity"
        >
          Add Guest
        </button>
        {importElement}
      </div>
    </form>
  );
}
