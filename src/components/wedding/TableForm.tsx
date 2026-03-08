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
    "w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
  const labelClass = "block text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-body";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg px-4 py-3 animate-fade-in">
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
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
        <div className="w-20">
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
        <div className="flex gap-1 h-[34px]">
          <button
            type="button"
            onClick={() => setShape('round')}
            className={`px-2 py-1 rounded border text-xs font-body transition-colors ${
              shape === 'round'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
            title="Round"
          >
            <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current inline-block" />
          </button>
          <button
            type="button"
            onClick={() => setShape('rectangular')}
            className={`px-2 py-1 rounded border text-xs font-body transition-colors ${
              shape === 'rectangular'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
            title="Rectangular"
          >
            <span className="w-3.5 h-2.5 rounded-sm border-[1.5px] border-current inline-block" />
          </button>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground font-body font-medium text-sm rounded-md hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </form>
  );
}
