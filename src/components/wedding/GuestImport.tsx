import { useRef } from 'react';
import { read, utils } from 'xlsx';
import { Guest } from '@/types/wedding';
import { toast } from 'sonner';

interface GuestImportProps {
  onImport: (guests: Omit<Guest, 'id' | 'tableId'>[]) => void;
}

export function GuestImport({ onImport }: GuestImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

      if (rows.length === 0) {
        toast.error('No data found in the file.');
        return;
      }

      const guests: Omit<Guest, 'id' | 'tableId'>[] = rows
        .map(row => {
          // Flexible column matching (case-insensitive, partial match)
          const get = (keys: string[]) => {
            const found = Object.keys(row).find(k =>
              keys.some(key => k.toLowerCase().trim().includes(key))
            );
            return found ? String(row[found]).trim() : '';
          };

          const name = get(['name', 'guest', 'invitee', 'first']);
          if (!name) return null;

          const plusOne = get(['plus', 'companion', 'partner', '+1']);
          const dietaryRaw = get(['diet', 'food', 'restriction', 'allerg']).toLowerCase();
          const rsvpRaw = get(['rsvp', 'status', 'confirm', 'response']).toLowerCase();

          let dietary: Guest['dietary'] = 'none';
          if (dietaryRaw.includes('vegan')) dietary = 'vegan';
          else if (dietaryRaw.includes('vegetar')) dietary = 'vegetarian';
          else if (dietaryRaw.includes('gluten')) dietary = 'gluten-free';

          let rsvp: Guest['rsvp'] = 'pending';
          if (rsvpRaw.includes('confirm') || rsvpRaw.includes('yes')) rsvp = 'confirmed';
          else if (rsvpRaw.includes('declin') || rsvpRaw.includes('no')) rsvp = 'declined';

          return { name, plusOne, dietary, rsvp };
        })
        .filter(Boolean) as Omit<Guest, 'id' | 'tableId'>[];

      if (guests.length === 0) {
        toast.error('No valid guest names found. Make sure there\'s a "Name" column.');
        return;
      }

      onImport(guests);
      toast.success(`Imported ${guests.length} guest${guests.length > 1 ? 's' : ''} successfully!`);
    } catch {
      toast.error('Could not read the file. Please try a .xlsx, .xls, or .csv file.');
    }

    // Reset input so same file can be re-imported
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="hidden"
        id="guest-import"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2.5 border border-border bg-secondary text-foreground font-body font-medium text-sm rounded-md hover:bg-accent/50 transition-colors flex items-center gap-2"
      >
        <span>📄</span>
        Import Excel / CSV
      </button>
      <p className="text-[10px] text-muted-foreground font-body mt-1.5">
        Columns: Name, Plus One, Dietary, RSVP
      </p>
    </div>
  );
}
