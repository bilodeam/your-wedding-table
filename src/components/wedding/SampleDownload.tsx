import { utils, writeFile } from 'xlsx';

const SAMPLE_GUESTS = [
  { Name: 'Alice Martin', 'Plus One': 'Bob Martin', Meal: 'Vegetarian', RSVP: 'Confirmed' },
  { Name: 'Charles Dupont', 'Plus One': '', Meal: '', RSVP: 'Confirmed' },
  { Name: 'Emma Johnson', 'Plus One': 'James Johnson', Meal: 'Vegan', RSVP: 'Pending' },
  { Name: 'Sophie Laurent', 'Plus One': 'Pierre Laurent', Meal: '', RSVP: 'Confirmed' },
  { Name: 'Lucas Bernard', 'Plus One': '', Meal: 'Gluten Free', RSVP: 'Declined' },
  { Name: 'Marie Petit', 'Plus One': 'Antoine Petit', Meal: '', RSVP: 'Pending' },
  { Name: 'Hugo Moreau', 'Plus One': '', Meal: '', RSVP: 'Confirmed' },
  { Name: 'Clara Leroy', 'Plus One': 'Thomas Leroy', Meal: 'Vegetarian', RSVP: 'Confirmed' },
  { Name: 'Julien Roux', 'Plus One': '', Meal: '', RSVP: 'Pending' },
  { Name: 'Camille Fournier', 'Plus One': 'Léa Fournier', Meal: '', RSVP: 'Confirmed' },
];

export function SampleDownload() {
  const handleDownload = () => {
    const ws = utils.json_to_sheet(SAMPLE_GUESTS);
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 12 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Guests');
    writeFile(wb, 'sample-guest-list.xlsx');
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="text-[11px] text-primary underline underline-offset-2 font-body hover:opacity-70 transition-opacity"
    >
      Download sample file
    </button>
  );
}
