import { useRef, useState } from 'react';
import { useWeddingData } from '@/hooks/useWeddingData';
import { SummaryBar } from '@/components/wedding/SummaryBar';
import { GuestForm } from '@/components/wedding/GuestForm';
import { GuestImport } from '@/components/wedding/GuestImport';
import { GuestList } from '@/components/wedding/GuestList';
import { TableForm } from '@/components/wedding/TableForm';
import { TableCard } from '@/components/wedding/TableCard';
import { ExportPdf } from '@/components/wedding/ExportPdf';
import { MealOptionsEditor } from '@/components/wedding/MealOptionsEditor';

const Index = () => {
  const {
    guests, tables, mealOptions,
    addGuest, addGuestsBulk, removeGuest, updateGuest,
    assignGuestToTable, addTable, removeTable, updateTable, swapSeats,
    getTableGuests, getSeatsUsed, updateTablePosition, updateMealOptions,
    unassignedGuests, confirmedGuests,
    totalHeadcount, fullTables,
  } = useWeddingData();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [roomExpanded, setRoomExpanded] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);

  const roomWidth = Math.max(800, ...tables.map(t => t.position.x + 280));
  const roomHeight = Math.max(400, ...tables.map(t => t.position.y + 300));

  return (
    <div className="min-h-screen bg-background">
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
        <SummaryBar
          totalGuests={guests.length}
          totalHeadcount={totalHeadcount}
          confirmed={confirmedGuests.length}
          unassigned={unassignedGuests.length}
          tablesCount={tables.length}
          fullTables={fullTables}
          guests={guests}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <GuestForm
              onAdd={addGuest}
              mealOptions={mealOptions}
              importElement={<GuestImport onImport={addGuestsBulk} mealOptions={mealOptions} />}
            />
          </div>
          <div className="space-y-3">
            <MealOptionsEditor options={mealOptions} onUpdate={updateMealOptions} />
            <TableForm onAdd={addTable} />
            <ExportPdf tables={tables} guests={guests} getTableGuests={getTableGuests} getSeatsUsed={getSeatsUsed} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <GuestList
              guests={unassignedGuests}
              mealOptions={mealOptions}
              onRemove={removeGuest}
              onUpdate={updateGuest}
              onDragStart={setDraggingId}
            />
          </div>

          <div className={roomExpanded ? 'fixed inset-0 z-50 bg-background flex flex-col' : 'lg:col-span-2'}>
            <div className={`flex items-center justify-between ${roomExpanded ? 'px-6 py-4 border-b border-border' : 'mb-4'}`}>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Room Layout
                </h2>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Drag guests onto tables · Drag tables to rearrange the room
                </p>
              </div>
              <button
                onClick={() => setRoomExpanded(!roomExpanded)}
                className="text-xs font-body text-primary hover:text-primary/80 border border-primary/30 rounded px-3 py-1.5 transition-colors"
              >
                {roomExpanded ? '✕ Close' : '⤢ Expand'}
              </button>
            </div>

            {tables.length === 0 ? (
              <div className={`bg-card border border-dashed border-border rounded-lg p-12 text-center animate-fade-in ${roomExpanded ? 'mx-6' : ''}`}>
                <p className="text-muted-foreground font-body">No tables yet.</p>
                <p className="text-muted-foreground font-body text-sm mt-1">
                  Create your first table above to get started.
                </p>
              </div>
            ) : (
              <div
                ref={roomRef}
                className={`relative bg-card/30 border border-border rounded-lg overflow-auto ${roomExpanded ? 'flex-1 mx-6 mb-6' : ''}`}
                style={{ minHeight: roomExpanded ? undefined : roomHeight, minWidth: 0 }}
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
                        onUpdateTable={(tid, updates) => updateTable(tid, updates)}
                        onSwapSeats={swapSeats}
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

      <footer className="border-t border-border mt-12 py-6 text-center">
        <p className="text-xs text-muted-foreground font-body">
          Your seating plan is saved automatically in your browser ✦
        </p>
      </footer>
    </div>
  );
};

export default Index;
