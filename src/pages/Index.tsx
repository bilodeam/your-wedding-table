import { useRef, useState } from 'react';
import { useWeddingData } from '@/hooks/useWeddingData';
import { SummaryBar } from '@/components/wedding/SummaryBar';
import { GuestForm } from '@/components/wedding/GuestForm';
import { GuestImport } from '@/components/wedding/GuestImport';
import { GuestList } from '@/components/wedding/GuestList';
import { TableForm } from '@/components/wedding/TableForm';
import { TableCard } from '@/components/wedding/TableCard';

const Index = () => {
  const {
    guests, tables,
    addGuest, addGuestsBulk, removeGuest, updateGuest,
    assignGuestToTable, addTable, removeTable,
    getTableGuests, getSeatsUsed, updateTablePosition,
    unassignedGuests, confirmedGuests,
    totalHeadcount, fullTables,
  } = useWeddingData();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  // Calculate room size based on table positions
  const roomWidth = Math.max(800, ...tables.map(t => t.position.x + 280));
  const roomHeight = Math.max(400, ...tables.map(t => t.position.y + 300));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
          <div className="text-center">
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Seating Plan
            </h1>
            <p className="text-sm text-cream-muted font-body mt-1">
              Arrange your guests with care ✦
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Summary */}
        <SummaryBar
          totalGuests={guests.length}
          totalHeadcount={totalHeadcount}
          confirmed={confirmedGuests.length}
          unassigned={unassignedGuests.length}
          tablesCount={tables.length}
          fullTables={fullTables}
        />

        {/* Forms row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <GuestForm onAdd={addGuest} />
            <GuestImport onImport={addGuestsBulk} />
          </div>
          <TableForm onAdd={addTable} />
        </div>

        {/* Main content: guests + tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest list sidebar */}
          <div className="lg:col-span-1">
            <GuestList
              guests={unassignedGuests}
              onRemove={removeGuest}
              onUpdate={updateGuest}
              onDragStart={setDraggingId}
            />
          </div>

          {/* Room layout */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Room Layout
              </h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Drag guests onto tables · Drag tables to rearrange the room
              </p>
            </div>

            {tables.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center animate-fade-in">
                <p className="text-muted-foreground font-body">No tables yet.</p>
                <p className="text-muted-foreground font-body text-sm mt-1">
                  Create your first table above to get started.
                </p>
              </div>
            ) : (
              <div
                ref={roomRef}
                className="relative bg-card/30 border border-border rounded-lg overflow-auto"
                style={{ minHeight: roomHeight, minWidth: 0 }}
              >
                <div className="relative" style={{ width: roomWidth, height: roomHeight }}>
                  {tables.map(table => (
                    <div
                      key={table.id}
                      className="absolute"
                      style={{ left: table.position.x, top: table.position.y }}
                    >
                      <TableCard
                        table={table}
                        guests={getTableGuests(table.id)}
                        seatsUsed={getSeatsUsed(table.id)}
                        onDropGuest={assignGuestToTable}
                        onUnassignGuest={(guestId) => assignGuestToTable(guestId, null)}
                        onRemoveTable={removeTable}
                        onPositionChange={updateTablePosition}
                        containerRef={roomRef}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center">
        <p className="text-xs text-muted-foreground font-body">
          Your seating plan is saved automatically in your browser ✦
        </p>
      </footer>
    </div>
  );
};

export default Index;
