import { useState } from 'react';

interface MealOptionsEditorProps {
  options: string[];
  onUpdate: (options: string[]) => void;
}

export function MealOptionsEditor({ options, onUpdate }: MealOptionsEditorProps) {
  const [newOption, setNewOption] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    const val = newOption.trim();
    if (!val || options.some(o => o.toLowerCase() === val.toLowerCase())) return;
    onUpdate([...options, val]);
    setNewOption('');
  };

  const handleRemove = (opt: string) => {
    onUpdate(options.filter(o => o !== opt));
  };

  const inputClass =
    "flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full"
      >
        <h3 className="font-display text-lg font-semibold text-foreground">Meal Options</h3>
        <span className="text-xs text-muted-foreground font-body">
          {options.length} option{options.length !== 1 ? 's' : ''} {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {options.map(opt => (
              <span
                key={opt}
                className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5 text-sm font-body text-foreground"
              >
                {opt}
                <button
                  onClick={() => handleRemove(opt)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-xs ml-0.5"
                  title={`Remove ${opt}`}
                >
                  ✕
                </button>
              </span>
            ))}
            {options.length === 0 && (
              <p className="text-xs text-muted-foreground font-body">No meal options defined yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={e => setNewOption(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
              placeholder="e.g. Fish, Chicken, Halal..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-primary text-primary-foreground font-body font-medium text-sm rounded-md hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
