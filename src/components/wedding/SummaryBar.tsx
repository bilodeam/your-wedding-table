import { Guest } from '@/types/wedding';

interface SummaryBarProps {
  totalGuests: number;
  totalHeadcount: number;
  confirmed: number;
  unassigned: number;
  tablesCount: number;
  fullTables: number;
}

export function SummaryBar({ totalGuests, totalHeadcount, confirmed, unassigned, tablesCount, fullTables }: SummaryBarProps) {
  const stats = [
    { label: 'Total Guests', value: totalGuests, sub: `${totalHeadcount} headcount` },
    { label: 'Confirmed', value: confirmed },
    { label: 'Unassigned', value: unassigned },
    { label: 'Tables', value: tablesCount, sub: `${fullTables} full` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-card rounded-lg p-4 border border-border animate-fade-in"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-1">
            {stat.label}
          </p>
          <p className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-cream-muted mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
