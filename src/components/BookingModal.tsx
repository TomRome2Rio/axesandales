import React, { useState, useEffect } from 'react';
import { Booking, TerrainCategory, User, Table, TerrainBox } from '../types';
import { GameSystemAutocomplete } from './GameSystemAutocomplete';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  user: User;
  editingBooking?: Booking | null;
  tables: Table[];
  terrainBoxes: TerrainBox[];
  cancelledDates: string[];
  bookableDates: string[];
  initialDate: string;
  allBookings: Booking[];
  gameSystems: string[];
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
    isOpen, onClose, onSave, user, editingBooking, tables, 
    terrainBoxes, cancelledDates, bookableDates, initialDate, allBookings,
    gameSystems 
}) => {
  const [date, setDate] = useState(editingBooking?.date || initialDate || bookableDates[0]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedTerrainId, setSelectedTerrainId] = useState<string>('');
  const [gameSystem, setGameSystem] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [error, setError] = useState('');
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [unavailableTables, setUnavailableTables] = useState<Map<string, string>>(new Map());
  const [unavailableTerrain, setUnavailableTerrain] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (isOpen) {
        if (editingBooking) {
            setDate(editingBooking.date);
            setSelectedTableId(editingBooking.tableId);
            setSelectedTerrainId(editingBooking.terrainBoxId || '');
            setGameSystem(editingBooking.gameSystem);
            setPlayerCount(editingBooking.playerCount);
        } else {
            setGameSystem('');
            setSelectedTableId('');
            setSelectedTerrainId('');
            setPlayerCount(2);
            setDate(bookableDates.includes(initialDate) ? initialDate : bookableDates[0]);
        }
        setActiveCategory('All');
        setError('');
    }
  }, [isOpen, editingBooking, initialDate, bookableDates]);

  useEffect(() => {
    const bookings = allBookings.filter(b => b.date === date);
    const takenTables = new Map<string, string>();
    const takenTerrain = new Map<string, string>();

    bookings.forEach(b => {
        if (editingBooking && b.id === editingBooking.id) return;
        takenTables.set(b.tableId, b.memberName);
        if (b.terrainBoxId) takenTerrain.set(b.terrainBoxId, b.memberName);
    });

    setUnavailableTables(takenTables);
    setUnavailableTerrain(takenTerrain);
  }, [date, editingBooking, isOpen]);

  const handleSave = () => {
    if (cancelledDates.includes(date)) {
        setError("This date has been cancelled. Bookings are not allowed.");
        return;
    }
    if (!user.isMember) {
        setError("Your membership is not active. Please contact an admin.");
        return;
    }
    if (!selectedTableId || !gameSystem) {
        setError('Please select a table and enter a game system.');
        return;
    }

    const newBooking: Booking = {
        id: editingBooking ? editingBooking.id : crypto.randomUUID(),
        date,
        tableId: selectedTableId,
        terrainBoxId: selectedTerrainId || null,
        memberName: user.name,
        memberId: user.id,
        gameSystem,
        playerCount,
        timestamp: Date.now(),
        status: editingBooking ? editingBooking.status : 'active',
    };
    onSave(newBooking);
    onClose();
  };

  if (!isOpen) return null;

  const filteredTerrain = activeCategory === 'All' 
    ? terrainBoxes
    : terrainBoxes.filter(b => b.category === activeCategory);
    
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSelectedTableId('');
    setSelectedTerrainId('');
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-2 md:p-4 overflow-y-auto">
      <div className="bg-neutral-800 rounded-xl shadow-2xl max-w-5xl xl:max-w-7xl w-full border border-neutral-700 overflow-hidden flex flex-col max-h-[calc(100vh-1rem)] md:max-h-[calc(100vh-2rem)] mx-auto mt-2 md:mt-8 xl:mt-12">
        <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-800 shrink-0">
            <h2 className="text-xl font-bold text-white">{editingBooking ? 'Edit Booking' : 'New Reservation'}</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-4">
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3">1. Event Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Date</label>
                                    <select value={date} onChange={(e) => handleDateChange(e.target.value)} className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none text-sm">
                                        {bookableDates.map(d => ( <option key={d} value={d}>{new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Game System</label>
                                    <div className="mb-3">
                                      <GameSystemAutocomplete
                                        value={gameSystem}
                                        onChange={setGameSystem}
                                        gameSystems={gameSystems}
                                      />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-neutral-400">Players:</span>
                                        <input type="number" min="1" max="10" value={playerCount} onChange={(e) => setPlayerCount(parseInt(e.target.value))} className="w-20 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-8">
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 h-full">
                             <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">2. Select Table</h3>
                                <div className="text-xs text-neutral-400">
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-600 mr-1"></span>Selected
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-900/50 ml-3 mr-1"></span>Taken
                                </div>
                             </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xl:gap-3 max-h-60 xl:max-h-72 overflow-y-auto pr-1">
                                {tables.map(table => {
                                    const takenBy = unavailableTables.get(table.id);
                                    const isTaken = !!takenBy;
                                    const isSelected = selectedTableId === table.id;
                                    return (
                                        <button key={table.id} disabled={isTaken} onClick={() => setSelectedTableId(table.id)} className={`p-2 rounded border text-left transition-all relative group ${isSelected ? 'bg-amber-600 border-amber-500 text-white ring-1 ring-amber-400' : ''} ${isTaken ? 'bg-neutral-800 border-neutral-700 opacity-60 cursor-not-allowed' : 'bg-neutral-800 border-neutral-600 hover:border-amber-500/50 hover:bg-neutral-700'}`}>
                                            <div className="font-bold text-sm">{table.name.replace('Table ', '')}</div>
                                            <div className="text-[10px] opacity-70">{table.size}</div>
                                            {isTaken && (
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded backdrop-blur-[1px]">
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-neutral-400 leading-tight">Booked by</div>
                                                        <div className="text-[10px] text-red-400 font-semibold truncate px-1 max-w-[80px]">{takenBy}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">3. Select Terrain (Optional)</h3>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...Object.values(TerrainCategory)].map(cat => ( <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-neutral-700'}`}>{cat}</button>))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 xl:max-h-[28rem] overflow-y-auto pr-2">
                        {activeCategory === 'All' && (<button onClick={() => setSelectedTerrainId('')} className={`relative rounded-lg border-2 overflow-hidden h-36 xl:h-44 flex flex-col items-center justify-center transition-all group ${selectedTerrainId === '' ? 'border-amber-500 bg-neutral-700 shadow-lg shadow-amber-900/20' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'}`}><span className="text-2xl mb-2 opacity-70 group-hover:opacity-100 transition-opacity">🚫</span><span className={`text-xs font-bold ${selectedTerrainId === '' ? 'text-amber-500' : 'text-neutral-400'}`}>No Box Needed</span></button>)}
                        {filteredTerrain.map(box => {
                             const takenBy = unavailableTerrain.get(box.id);
                             const isTaken = !!takenBy;
                             const isSelected = selectedTerrainId === box.id;
                             return (
                                <button key={box.id} disabled={isTaken} onClick={() => setSelectedTerrainId(box.id)} className={`relative rounded-lg border-2 overflow-hidden h-36 xl:h-44 text-left transition-all group ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50 transform scale-[1.02] z-10' : 'border-neutral-700 hover:border-neutral-500'} ${isTaken ? 'opacity-75 cursor-not-allowed' : ''}`}>
                                    <img src={box.imageUrl} alt={box.name} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isTaken ? 'grayscale' : ''}`} />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? 'from-amber-900/90' : 'from-black/90'} via-black/10 to-transparent`} />
                                    <div className="absolute bottom-0 left-0 p-3 w-full">
                                        <div className={`font-bold text-xs leading-tight ${isSelected ? 'text-amber-400' : 'text-white'}`}>{box.name}</div>
                                        <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">{box.category}</div>
                                    </div>
                                    {isSelected && (<div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1 shadow-lg"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>)}
                                    {isTaken && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-2 text-center"><span className="text-red-500 text-[10px] font-bold border border-red-500/50 px-2 py-0.5 rounded bg-black/50 mb-1">IN USE</span><span className="text-neutral-300 text-[10px] font-medium truncate w-full">{takenBy}</span></div>)}
                                </button>
                             );
                        })}
                    </div>
                </div>
            </div>
        </div>
        {error && (
            <div className="px-6 py-3 bg-red-900/20 border-t border-red-900/50 flex items-center gap-3 shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-red-200 text-sm font-medium">{error}</span>
            </div>
        )}
        <div className="p-6 border-t border-neutral-700 bg-neutral-800 flex justify-end gap-3 z-20 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors font-medium text-sm">Cancel</button>
            <button onClick={handleSave} disabled={!selectedTableId || !gameSystem || cancelledDates.includes(date)} className="px-8 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all hover:translate-y-px text-sm">Confirm Booking</button>
        </div>
      </div>
    </div>
  );
};