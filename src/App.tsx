import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { BookingModal } from './components/BookingModal';
import { LoginModal } from './components/LoginModal';
import { StatsView } from './components/StatsView';
import { AdminView } from './components/AdminView';
import { ProfileView } from './components/ProfileView';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import * as firebaseService from './services/firebaseService';
import { 
    getBookings, deleteBooking, saveBooking, 
    getTables, getTerrainBoxes, initInventory, saveTables, saveTerrainBoxes,
    getCancelledDates, saveCancelledDates,
    getSpecialEventDates, saveSpecialEventDates
} from './services/storageService';
import { getSelectableDates, getUpcomingTuesdays } from './constants';
import { Booking, User, Table, TerrainBox } from './types';

// Initialize local inventory data (Bookings/Tables are still local for now)
initInventory();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App-level state for local data
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [terrainBoxes, setTerrainBoxes] = useState<TerrainBox[]>([]);
  
  // Users state (Fetched from Firebase for Admins)
  const [users, setUsers] = useState<User[]>([]); 
  
  const [cancelledDates, setCancelledDates] = useState<string[]>([]);
  const [specialEventDates, setSpecialEventDates] = useState<string[]>([]);
  
  const selectableDates = getSelectableDates(specialEventDates, allBookings, cancelledDates);
  const [selectedDate, setSelectedDate] = useState(selectableDates[0]?.value || new Date().toISOString().split('T')[0]);

  // Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const loadLocalData = () => {
    setAllBookings(getBookings());
    setTables(getTables());
    setTerrainBoxes(getTerrainBoxes());
    setCancelledDates(getCancelledDates());
    setSpecialEventDates(getSpecialEventDates());
  };
  
  useEffect(() => {
    loadLocalData();
    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Get rich profile from Firestore
            const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
            if (userProfile) {
                setUser(userProfile);
                // If Admin, fetch all users
                if(userProfile.isAdmin) {
                    const allUsers = await firebaseService.getAllUsers();
                    setUsers(allUsers);
                }
            } else {
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectableDates.find(d => d.value === selectedDate) && selectableDates.length > 0) {
        setSelectedDate(selectableDates[0].value);
    }
  }, [selectableDates, selectedDate]);

  const handleBookingSave = (booking: Booking) => {
    saveBooking(booking);
    loadLocalData();
  };

  const handleLogout = async () => {
    await firebaseService.logout();
    setUser(null);
    setCurrentPage('home');
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
        deleteBooking(id);
        loadLocalData();
    }
  };

  const openNewBooking = () => {
    setEditingBooking(null);
    setIsBookingModalOpen(true);
  };
  
  const handleTablesUpdate = (updatedTables: Table[]) => { saveTables(updatedTables); setTables(updatedTables); };
  const handleTerrainUpdate = (updatedTerrain: TerrainBox[]) => { saveTerrainBoxes(updatedTerrain); setTerrainBoxes(updatedTerrain); };
  const handleCancelledDatesUpdate = (dates: string[]) => { saveCancelledDates(dates); setCancelledDates(dates); };
  const handleSpecialEventDatesUpdate = (dates: string[]) => { saveSpecialEventDates(dates); setSpecialEventDates(dates); };
  
  // Function to refresh the user list from Firebase (passed to AdminView)
  const refreshUsers = async () => {
      if(user?.isAdmin) {
          setUsers(await firebaseService.getAllUsers());
      }
  }

  const bookingsForSelectedDate = allBookings.filter(b => b.date === selectedDate);
  const isDateCancelled = cancelledDates.includes(selectedDate);
  
  const bookableDates = [ ...new Set([...getUpcomingTuesdays(), ...specialEventDates]) ]
    .filter(d => !cancelledDates.includes(d) && d >= new Date().toISOString().split('T')[0])
    .sort();

  if (loading) {
      return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Loading...</div>;
  }

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700 shadow-lg">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-neutral-400 font-medium whitespace-nowrap">Viewing Date:</label>
                <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none w-full md:w-auto"
                >
                    {selectableDates.map(d => (
                         <option key={d.value} value={d.value} disabled={d.isCancelled}>
                            {new Date(d.value + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            {d.isCancelled ? ' (Closed)' : ''}
                         </option>
                    ))}
                </select>
            </div>
            {user && user.isMember && (
                <button onClick={openNewBooking} className="w-full md:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-amber-900/40 transform transition hover:-translate-y-0.5">
                    + New Booking
                </button>
            )}
        </div>
        <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
                Table Status
            </h2>
            {isDateCancelled ? (
                <div className="bg-neutral-800 border-2 border-red-900/50 rounded-xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-red-400">Club Closed</h3>
                    <p className="text-neutral-400 mt-2">The club is closed on this date. Bookings are not available.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tables.map(table => {
                        const booking = bookingsForSelectedDate.find(b => b.tableId === table.id);
                        const isMyBooking = user && booking?.memberId === user.id;

                        return (
                            <div key={table.id} className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${booking ? (isMyBooking ? 'bg-amber-900/20 border-amber-600/50' : 'bg-red-900/10 border-red-900/30') : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-neutral-200">{table.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-neutral-700">{table.size}</span>
                                </div>
                                {booking ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="font-medium text-amber-100">{booking.gameSystem}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <span>{booking.memberName} ({booking.playerCount}p)</span>
                                        </div>
                                        {booking.terrainBoxId && (
                                             <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                <span>{terrainBoxes.find(t => t.id === booking.terrainBoxId)?.name || 'Terrain'}</span>
                                             </div>
                                        )}
                                        {(isMyBooking || user?.isAdmin) && user.isMember && (
                                            <div className="pt-3 mt-3 border-t border-amber-900/30 flex gap-2">
                                                <button onClick={() => handleEdit(booking)} className="flex-1 text-xs bg-neutral-800 hover:bg-neutral-700 py-1.5 rounded text-neutral-300 transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(booking.id)} className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/50 py-1.5 rounded text-red-300 transition-colors">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-20 flex items-center justify-center text-neutral-600 text-sm">Available</div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <>
      <Layout user={user} onLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage}>
          {currentPage === 'home' && renderDashboard()}
          {currentPage === 'stats' && <StatsView />}
          {currentPage === 'profile' && user && !user.isAdmin && <ProfileView user={user} />}
          {currentPage === 'admin' && user?.isAdmin && (
              <AdminView 
                  tables={tables}
                  terrainBoxes={terrainBoxes}
                  users={users}
                  cancelledDates={cancelledDates}
                  specialEventDates={specialEventDates}
                  onTablesChange={handleTablesUpdate}
                  onTerrainChange={handleTerrainUpdate}
                  onUsersChange={refreshUsers}
                  onCancelledDatesChange={handleCancelledDatesUpdate}
                  onSpecialEventDatesChange={handleSpecialEventDatesUpdate}
                  currentUser={user}
              />
          )}
      </Layout>
      {user && (
          <BookingModal 
              isOpen={isBookingModalOpen}
              onClose={() => setIsBookingModalOpen(false)}
              onSave={handleBookingSave}
              user={user}
              editingBooking={editingBooking}
              tables={tables}
              terrainBoxes={terrainBoxes}
              cancelledDates={cancelledDates}
              bookableDates={bookableDates}
              initialDate={selectedDate}
          />
      )}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default App;
