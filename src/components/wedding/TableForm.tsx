import { useState } from 'react';

interface TableFormProps {
  onAdd: (name: string, capacity: number, shape: 'round' | 'rectangular') => void;
}

export function TableForm({ onAdd }: TableFormProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [shape, setShape] = useState<'round' | 'rectangular'>('round');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), capacity, shape);
    setName('');
    setCapacity(8);
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 font-body";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Add Table</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className={labelClass}>Table Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Table 1"
            className={inputClass}
            required
          />
        </div>
        <div className="w-full sm:w-28">
          <label className={labelClass}>Seats</label>
          <input
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={e => setCapacity(parseInt(e.target.value) || 8)}
            className={inputClass}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className={labelClass}>Shape</label>
          <div className="flex gap-1.5 h-[42px]">
            <button
              type="button"
              onClick={() => setShape('round')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-body transition-colors ${
                shape === 'round'
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-4 h-4 rounded-full border-2 border-current inline-block" />
              Round
            </button>
            <button
              type="button"
              onClick={() => setShape('rectangular')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-body transition-colors ${
                shape === 'rectangular'
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-4 h-3 rounded-sm border-2 border-current inline-block" />
              Rect
            </button>
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-body font-medium text-sm rounded-md hover:opacity-90 transition-opacity"
          >
            Add Table
          </button>
        </div>
      </div>
    </form>
  );
}
