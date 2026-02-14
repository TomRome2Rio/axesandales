import React, { useState } from 'react';
import { Table, TerrainBox, TableSize, TerrainCategory, User, Booking } from '../types';
import * as firebaseService from '../services/firebaseService';

interface AdminViewProps {
  tables: Table[];
  terrainBoxes: TerrainBox[];
  users: User[];
  allBookings: Booking[];
  cancelledDates: string[];
  specialEventDates: string[];
  onTablesChange: (tables: Table[]) => void;
  onTerrainChange: (terrainBoxes: TerrainBox[]) => void;
  onUsersChange: () => void;
  onCancelledDatesChange: (dates: string[]) => void;
  onSpecialEventDatesChange: (dates: string[]) => void;
  currentUser: User;
  gameSystems: string[];
}

const defaultTable: Omit<Table, 'id'> = { name: '', size: TableSize.LARGE };
const defaultTerrain: Omit<TerrainBox, 'id'> = { name: '', category: TerrainCategory.SCIFI, imageUrl: '' };


const DragHandle: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const AdminView: React.FC<AdminViewProps> = ({ 
    tables, terrainBoxes, users, allBookings, cancelledDates, specialEventDates,
    onTablesChange, onTerrainChange, onUsersChange, onCancelledDatesChange, onSpecialEventDatesChange, 
    currentUser, gameSystems 
}) => {
  const [editingTable, setEditingTable] = useState<Table | Partial<Table> | null>(null);
  const [editingTerrain, setEditingTerrain] = useState<TerrainBox | Partial<TerrainBox> | null>(null);
  const [userFilter, setUserFilter] = useState<'all' | 'pending' | 'member' | 'admin'>('all');
  
  const [dateToCancel, setDateToCancel] = useState<string>(new Date().toISOString().split('T')[0]);
  const [specialDateToAdd, setSpecialDateToAdd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [renamingGame, setRenamingGame] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [gameRenameLoading, setGameRenameLoading] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string, type: 'table' | 'terrain') => {
    e.dataTransfer.setData(type, id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleTableDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('table');
    if (!draggedItemId || draggedItemId === dropTargetId) return;
    const items = [...tables];
    const draggedIndex = items.findIndex(item => item.id === draggedItemId);
    const targetIndex = items.findIndex(item => item.id === dropTargetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, reorderedItem);
    onTablesChange(items);
  };
  
  const handleTerrainDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('terrain');
    if (!draggedItemId || draggedItemId === dropTargetId) return;
    const items = [...terrainBoxes];
    const draggedIndex = items.findIndex(item => item.id === draggedItemId);
    const targetIndex = items.findIndex(item => item.id === dropTargetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, reorderedItem);
    onTerrainChange(items);
  };

  const handleSaveTable = () => {
    if (!editingTable || !editingTable.name) return;
    if ('id' in editingTable) { 
      onTablesChange(tables.map(t => t.id === editingTable.id ? editingTable as Table : t));
    } else { 
      const newTable = { ...editingTable, id: `custom-${crypto.randomUUID()}` } as Table;
      onTablesChange([...tables, newTable]);
    }
    setEditingTable(null);
  };
  
  const handleDeleteTable = (id: string) => {
    if(confirm('Delete this table?')) onTablesChange(tables.filter(t => t.id !== id));
  }

  const handleSaveTerrain = () => {
    if (!editingTerrain || !editingTerrain.name || !editingTerrain.category) return;
    if ('id' in editingTerrain) {
        onTerrainChange(terrainBoxes.map(t => t.id === editingTerrain.id ? editingTerrain as TerrainBox : t));
    } else {
        const newTerrain = { ...editingTerrain, id: `custom-${crypto.randomUUID()}` } as TerrainBox;
        onTerrainChange([...terrainBoxes, newTerrain]);
    }
    setEditingTerrain(null);
  }

  const handleDeleteTerrain = (id: string) => {
    if(confirm('Delete this terrain box?')) onTerrainChange(terrainBoxes.filter(t => t.id !== id));
  }

  const getMembershipExpiry = (paidDate: string): string => {
    const paid = new Date(paidDate + 'T00:00:00');
    const year = paid.getFullYear();
    // Financial year runs July 1 - June 30
    // If paid on or after July 1, expires June 30 of next year
    // If paid before July 1, expires June 30 of same year
    const expiryYear = paid.getMonth() >= 6 ? year + 1 : year; // getMonth() is 0-indexed, so 6 = July
    return `${expiryYear}-06-30`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateWithDay = (dateStr: string): string => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleSetRole = async (uid: string, role: 'pending' | 'member' | 'admin') => {
    if (uid === currentUser.id) return alert("Cannot change your own role.");
    try {
      const today = new Date().toISOString().split('T')[0];
      const updates: Record<string, unknown> = {
        isMember: role === 'member' || role === 'admin',
        isAdmin: role === 'admin',
      };
      if ((role === 'member' || role === 'admin') && !users.find(u => u.id === uid)?.membershipPaidDate) {
        updates.membershipPaidDate = today;
      }
      if (role === 'pending') {
        updates.membershipPaidDate = null;
      }
      await firebaseService.updateUserProfile(uid, updates as Partial<User>);
      onUsersChange();
    } catch (e) {
      alert('Error updating user role. Check console.');
      console.error(e);
    }
  };

  const handleRenewMembership = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await firebaseService.updateUserProfile(uid, { membershipPaidDate: today } as Partial<User>);
      onUsersChange();
    } catch (e) {
      alert('Error renewing membership. Check console.');
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) return alert("Cannot delete self.");
    if(confirm('Delete this user? This only removes their profile data, not their authentication account.')) {
        await firebaseService.deleteUser(id);
        onUsersChange();
    }
  };

  const getUserRole = (u: User): 'pending' | 'member' | 'admin' => {
    if (u.isAdmin) return 'admin';
    if (u.isMember) return 'member';
    return 'pending';
  };

  const filteredUsers = userFilter === 'all' ? users : users.filter(u => getUserRole(u) === userFilter);
  const pendingCount = users.filter(u => !u.isMember && !u.isAdmin).length;

  const handleCancelDate = () => {
    if (dateToCancel && !cancelledDates.includes(dateToCancel)) {
        onCancelledDatesChange([...cancelledDates, dateToCancel].sort());
    }
  };

  const handleReopenDate = (date: string) => {
    onCancelledDatesChange(cancelledDates.filter(d => d !== date));
  };
  
  const handleAddSpecialDate = () => {
    if (specialDateToAdd && !specialEventDates.includes(specialDateToAdd)) {
        onSpecialEventDatesChange([...specialEventDates, specialDateToAdd].sort());
    }
  };

  const handleRemoveSpecialDate = (date: string) => {
    onSpecialEventDatesChange(specialEventDates.filter(d => d !== date));
  };

  const handleRenameGame = async (oldName: string) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) return;
    setGameRenameLoading(true);
    try {
      await firebaseService.renameGameSystem(oldName, newName);
      setRenamingGame(null);
    } catch (e) {
      alert('Error renaming game system. Check console.');
      console.error(e);
    } finally {
      setGameRenameLoading(false);
    }
  };

  const handleDeleteGame = async (name: string) => {
    if (confirm(`Delete "${name}" from the game systems list? This will NOT remove it from existing bookings.`)) {
      try {
        await firebaseService.deleteGameSystem(name);
      } catch (e) {
        alert('Error deleting game system. Check console.');
        console.error(e);
      }
    }
  };

  // Render Helpers
  const renderTableForm = () => (
    <div className="bg-neutral-800 p-4 rounded-lg mt-4 border border-amber-700/50 space-y-3">
        <h3 className="font-bold text-amber-500">{'id' in (editingTable || {}) ? 'Edit Table' : 'Add New Table'}</h3>
        <input type="text" placeholder="Name" value={editingTable?.name} onChange={(e) => setEditingTable({...editingTable, name: e.target.value })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
        <select value={editingTable?.size} onChange={(e) => setEditingTable({...editingTable, size: e.target.value as TableSize })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white">
            {Object.values(TableSize).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
            <button onClick={handleSaveTable} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-sm">Save</button>
            <button onClick={() => setEditingTable(null)} className="bg-neutral-700 text-white px-4 py-1.5 rounded text-sm">Cancel</button>
        </div>
    </div>
  )

  const renderTerrainForm = () => (
    <div className="bg-neutral-800 p-4 rounded-lg mt-4 border border-amber-700/50 space-y-3">
        <h3 className="font-bold text-amber-500">{'id' in (editingTerrain || {}) ? 'Edit Terrain' : 'Add New Terrain'}</h3>
        <input type="text" placeholder="Name" value={editingTerrain?.name} onChange={(e) => setEditingTerrain({...editingTerrain, name: e.target.value })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
        <select value={editingTerrain?.category} onChange={(e) => setEditingTerrain({...editingTerrain, category: e.target.value as TerrainCategory })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white">
            {Object.values(TerrainCategory).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="text" placeholder="Image URL" value={editingTerrain?.imageUrl} onChange={(e) => setEditingTerrain({...editingTerrain, imageUrl: e.target.value })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
        <div className="flex gap-2">
            <button onClick={handleSaveTerrain} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-sm">Save</button>
            <button onClick={() => setEditingTerrain(null)} className="bg-neutral-700 text-white px-4 py-1.5 rounded text-sm">Cancel</button>
        </div>
    </div>
  )



  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-amber-500">Admin Panel</h1>
      {/* Schedule */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h2 className="text-xl font-bold mb-4">Manage Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <h3 className="text-lg font-bold text-amber-500 mb-2">Add Special Date</h3>
                <div className="flex gap-2 items-center bg-neutral-800 p-3 rounded-lg">
                    <input type="date" value={specialDateToAdd} onChange={e => setSpecialDateToAdd(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
                    <button onClick={handleAddSpecialDate} className="bg-sky-700 hover:bg-sky-600 text-white px-4 py-2 rounded text-sm">Add</button>
                </div>
                 <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2 bg-neutral-800 p-3 rounded-lg">
                    {specialEventDates.map(date => (
                        <div key={date} className="flex justify-between items-center bg-neutral-900 p-2 rounded">
                            <span className="text-neutral-300">{formatDateWithDay(date)}</span>
                            <button onClick={() => handleRemoveSpecialDate(date)} className="text-xs text-red-400 font-bold">X</button>
                        </div>
                    ))}
                 </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-amber-500 mb-2">Cancel Date</h3>
                <div className="flex gap-2 items-center bg-neutral-800 p-3 rounded-lg">
                    <input type="date" value={dateToCancel} onChange={e => setDateToCancel(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
                    <button onClick={handleCancelDate} className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">Cancel</button>
                </div>
            </div>
            <div>
                 <h3 className="text-lg font-bold text-amber-500 mb-2">Cancelled Dates</h3>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-neutral-800 p-3 rounded-lg">
                    {cancelledDates.map(date => (
                        <div key={date} className="flex justify-between items-center bg-neutral-900 p-2 rounded">
                            <span className="text-neutral-300">{formatDateWithDay(date)}</span>
                            <button onClick={() => handleReopenDate(date)} className="text-xs text-green-400 font-bold">REMOVE</button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>
      {/* Users */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Manage Users ({users.length})</h2>
                {pendingCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">{pendingCount} unpaid</span>
                )}
            </div>
            <div className="flex gap-1 bg-neutral-900 rounded-lg p-1">
                {(['all', 'pending', 'member', 'admin'] as const).map(f => (
                    <button key={f} onClick={() => setUserFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${userFilter === f ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
                        {f === 'all' ? `All (${users.length})` : f === 'pending' ? `Unpaid (${users.filter(u => !u.isMember && !u.isAdmin).length})` : f === 'member' ? `Paid (${users.filter(u => u.isMember && !u.isAdmin).length})` : `Admins (${users.filter(u => u.isAdmin).length})`}
                    </button>
                ))}
            </div>
        </div>
        <div className="mt-4 space-y-2 max-h-[32rem] overflow-y-auto pr-2">
            {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-neutral-500">No users in this category.</div>
            )}
            {filteredUsers.map(u => {
                const role = getUserRole(u);
                const isSelf = u.id === currentUser.id;
                return (
                    <div key={u.id} className={`flex flex-col md:flex-row md:items-center justify-between bg-neutral-800 p-3 rounded-lg border ${role === 'pending' ? 'border-amber-700/40' : 'border-neutral-700'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${role === 'admin' ? 'bg-amber-600 text-black' : role === 'member' ? 'bg-green-800 text-green-200' : 'bg-neutral-700 text-neutral-400'}`}>
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-white truncate">{u.name}</span>
                                    {isSelf && <span className="text-xs text-neutral-500">(you)</span>}
                                    {role === 'pending' && <span className="text-xs text-orange-400 bg-orange-900/50 px-2 py-0.5 rounded-full border border-orange-800">Unpaid Member</span>}
                                    {role === 'member' && <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full border border-green-800">Paid Member</span>}
                                    {role === 'admin' && <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-800">Admin</span>}
                                </div>
                                <span className="text-xs text-neutral-500 truncate block">{u.email}</span>
                                <div className="flex gap-3 mt-1">
                                  <span className="text-xs text-neutral-500">Bookings: <span className="text-neutral-300">{allBookings.filter(b => b.memberId === u.id && b.status === 'active').length}</span></span>
                                  <span className="text-xs text-neutral-500">Cancellations: <span className="text-neutral-300">{allBookings.filter(b => b.memberId === u.id && b.status === 'cancelled' && b.cancelledBy === u.id).length}</span></span>
                                </div>
                                {u.membershipPaidDate && (role === 'member' || role === 'admin') && (
                                  <div className="flex gap-3 mt-1">
                                    <span className="text-xs text-neutral-500">Paid: <span className="text-neutral-300">{formatDate(u.membershipPaidDate)}</span></span>
                                    <span className="text-xs text-neutral-500">Expires: <span className={`${new Date(getMembershipExpiry(u.membershipPaidDate) + 'T00:00:00') < new Date() ? 'text-red-400' : 'text-neutral-300'}`}>{formatDate(getMembershipExpiry(u.membershipPaidDate))}</span></span>
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0 flex-shrink-0 flex-wrap">
                            {isSelf && (role === 'member' || role === 'admin') && (
                                <button onClick={() => handleRenewMembership(u.id)} className="text-xs bg-green-800 hover:bg-green-700 text-green-100 px-3 py-1.5 rounded font-medium transition-colors">Renew Membership</button>
                            )}
                            {!isSelf && (
                              <>
                                {role === 'pending' && (
                                    <button onClick={() => handleSetRole(u.id, 'member')} className="text-xs bg-green-800 hover:bg-green-700 text-green-100 px-3 py-1.5 rounded font-medium transition-colors">Mark as Paid</button>
                                )}
                                {(role === 'member' || role === 'admin') && (
                                    <button onClick={() => handleRenewMembership(u.id)} className="text-xs bg-green-800 hover:bg-green-700 text-green-100 px-3 py-1.5 rounded font-medium transition-colors">Renew Membership</button>
                                )}
                                {role === 'member' && (
                                    <button onClick={() => handleSetRole(u.id, 'admin')} className="text-xs bg-amber-800 hover:bg-amber-700 text-amber-100 px-3 py-1.5 rounded font-medium transition-colors">Make Admin</button>
                                )}
                                {role === 'admin' && (
                                    <button onClick={() => handleSetRole(u.id, 'member')} className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-3 py-1.5 rounded font-medium transition-colors">Remove Admin Status</button>
                                )}
                                {role !== 'pending' && (
                                    <button onClick={() => handleSetRole(u.id, 'pending')} className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-3 py-1.5 rounded font-medium transition-colors">Remove Membership</button>
                                )}
                                <button onClick={() => handleDeleteUser(u.id)} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded font-medium transition-colors">Delete</button>
                              </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
      {/* Tables */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Manage Tables ({tables.length})</h2>
            <button onClick={() => setEditingTable(defaultTable)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm">+ Add Table</button>
        </div>
        {editingTable && renderTableForm()}
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
            {tables.map(table => (
                <div key={table.id} draggable onDragStart={(e) => handleDragStart(e, table.id, 'table')} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleTableDrop(e, table.id)} className={`flex items-center justify-between bg-neutral-800 p-2 rounded ${draggedId === table.id ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2"><div className="cursor-grab text-neutral-500 p-1"><DragHandle /></div><span className="font-medium">{table.name}</span><span className="text-xs text-neutral-400 ml-2 bg-neutral-700 px-2 py-0.5 rounded-full">{table.size}</span></div>
                    <div className="flex gap-2"><button onClick={() => setEditingTable(table)} className="text-xs text-neutral-400">Edit</button><button onClick={() => handleDeleteTable(table.id)} className="text-xs text-red-500">Delete</button></div>
                </div>
            ))}
        </div>
      </div>
      {/* Terrain */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Manage Terrain ({terrainBoxes.length})</h2><button onClick={() => setEditingTerrain(defaultTerrain)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm">+ Add Terrain</button></div>
        {editingTerrain && renderTerrainForm()}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 max-h-[40rem] overflow-y-auto pr-2">
            {terrainBoxes.map(box => (
                <div key={box.id} draggable onDragStart={(e) => handleDragStart(e, box.id, 'terrain')} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleTerrainDrop(e, box.id)} className={`bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 relative ${draggedId === box.id ? 'opacity-40' : ''}`}>
                    <div className="absolute top-2 left-2 cursor-grab text-neutral-300 bg-black/30 rounded-full p-1 z-10"><DragHandle /></div>
                    <img src={box.imageUrl} alt={box.name} className="w-full h-32 object-cover" />
                    <div className="p-3"><p className="font-bold text-sm truncate">{box.name}</p><p className="text-xs text-neutral-400">{box.category}</p><div className="flex gap-3 mt-3"><button onClick={() => setEditingTerrain(box)} className="text-xs text-neutral-400">Edit</button><button onClick={() => handleDeleteTerrain(box.id)} className="text-xs text-red-500">Delete</button></div></div>
                </div>
            ))}
        </div>
      </div>
      {/* Game Systems */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h2 className="text-xl font-bold mb-4">Manage Game Systems ({gameSystems.length})</h2>
        <p className="text-sm text-neutral-400 mb-4">Rename game systems to normalize data across all bookings. Renaming will update all existing bookings that use the old name.</p>
        {gameSystems.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">No game systems yet. They are created automatically when members make bookings.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {gameSystems.map(name => (
              <div key={name} className="flex items-center justify-between bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                {renamingGame === name ? (
                  <div className="flex items-center gap-2 flex-grow mr-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-grow bg-neutral-900 border border-neutral-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameGame(name);
                        } else if (e.key === 'Escape') {
                          setRenamingGame(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleRenameGame(name)}
                      disabled={gameRenameLoading || !renameValue.trim() || renameValue.trim() === name}
                      className="text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-1.5 rounded font-medium transition-colors"
                    >
                      {gameRenameLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setRenamingGame(null)} className="text-xs bg-neutral-700 text-white px-3 py-1.5 rounded font-medium">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-white">{name}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setRenamingGame(name); setRenameValue(name); }}
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteGame(name)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};