import { Guest, DIETARY_LABELS } from '@/types/wedding';

interface SummaryBarProps {
  totalGuests: number;
  totalHeadcount: number;
  confirmed: number;
  unassigned: number;
  tablesCount: number;
  fullTables: number;
  guests: Guest[];
}

export function SummaryBar({ totalGuests, totalHeadcount, confirmed, unassigned, tablesCount, fullTables, guests }: SummaryBarProps) {
  const stats = [
    { label: 'Total Guests', value: totalGuests, sub: `${totalHeadcount} headcount` },
    { label: 'Confirmed', value: confirmed },
    { label: 'Unassigned', value: unassigned },
    { label: 'Tables', value: tablesCount, sub: `${fullTables} full` },
  ];

  // Dietary tally (excluding 'none')
  const safeGuests = guests || [];
  const dietaryCounts = (['vegetarian', 'vegan', 'gluten-free'] as const)
    .map(d => ({ label: DIETARY_LABELS[d], count: safeGuests.filter(g => g.dietary === d).length }))
    .filter(d => d.count > 0);

  return (
    <div className="space-y-3">
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

      {dietaryCounts.length > 0 && (
        <div className="bg-card rounded-lg px-4 py-3 border border-border animate-fade-in flex items-center gap-4 flex-wrap">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-body">Meal counts</span>
          {dietaryCounts.map(d => (
            <span key={d.label} className="text-sm font-body text-foreground">
              {d.label}: <span className="font-semibold text-primary">{d.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
