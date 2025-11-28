import React, { useState } from 'react';
import { Table, TerrainBox, TableSize, TerrainCategory, User } from '../types';
import * as firebaseService from '../services/firebaseService';

interface AdminViewProps {
  tables: Table[];
  terrainBoxes: TerrainBox[];
  users: User[];
  cancelledDates: string[];
  specialEventDates: string[];
  onTablesChange: (tables: Table[]) => void;
  onTerrainChange: (terrainBoxes: TerrainBox[]) => void;
  onUsersChange: () => void;
  onCancelledDatesChange: (dates: string[]) => void;
  onSpecialEventDatesChange: (dates: string[]) => void;
  currentUser: User;
}

const defaultTable: Omit<Table, 'id'> = { name: '', size: TableSize.LARGE };
const defaultTerrain: Omit<TerrainBox, 'id'> = { name: '', category: TerrainCategory.SCIFI, imageUrl: '' };
const defaultUser: Partial<User> = { email: '', name: '', isMember: true, isAdmin: false };

const DragHandle: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const AdminView: React.FC<AdminViewProps> = ({ 
    tables, terrainBoxes, users, cancelledDates, specialEventDates,
    onTablesChange, onTerrainChange, onUsersChange, onCancelledDatesChange, onSpecialEventDatesChange, 
    currentUser 
}) => {
  const [editingTable, setEditingTable] = useState<Table | Partial<Table> | null>(null);
  const [editingTerrain, setEditingTerrain] = useState<TerrainBox | Partial<TerrainBox> | null>(null);
  const [editingUser, setEditingUser] = useState<User | Partial<User> | null>(null);
  const [userPassword, setUserPassword] = useState<string>('');
  
  const [dateToCancel, setDateToCancel] = useState<string>(new Date().toISOString().split('T')[0]);
  const [specialDateToAdd, setSpecialDateToAdd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  const handleSaveUser = async () => {
    if (!editingUser || !editingUser.name || !editingUser.email) return;

    try {
        if ('id' in editingUser) { // Editing
            await firebaseService.updateUserProfile(editingUser.id as string, {
                name: editingUser.name,
                isMember: editingUser.isMember,
                isAdmin: editingUser.isAdmin
            });
        } else { // New
            if (!userPassword) { alert("Password required"); return; }
            await firebaseService.createUser(
                editingUser.email!, 
                userPassword, 
                editingUser.name!, 
                editingUser.isMember!, 
                editingUser.isAdmin!
            );
        }
        onUsersChange();
        setEditingUser(null);
        setUserPassword('');
    } catch (e) {
        alert("Error saving user. Check console.");
        console.error(e);
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) return alert("Cannot delete self.");
    if(confirm('Delete this user?')) {
        await firebaseService.deleteUser(id);
        onUsersChange();
    }
  }

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

  const renderUserForm = () => (
     <div className="bg-neutral-800 p-4 rounded-lg mt-4 border border-amber-700/50 space-y-3">
        <h3 className="font-bold text-amber-500">{editingUser && 'id' in editingUser ? `Edit ${editingUser.name}` : 'Add New Member'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Name" value={editingUser?.name || ''} onChange={(e) => setEditingUser({...editingUser, name: e.target.value })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
            <input type="email" placeholder="Email" value={editingUser?.email || ''} onChange={(e) => setEditingUser({...editingUser, email: e.target.value })} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" disabled={!!(editingUser && 'id' in editingUser)} />
        </div>
        {!(editingUser && 'id' in editingUser) && (
            <input type="password" placeholder="Initial Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white" />
        )}
        <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={editingUser?.isMember || false} onChange={e => setEditingUser({...editingUser, isMember: e.target.checked})} className="bg-neutral-900" /> Paid Member</label>
            <label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={editingUser?.isAdmin || false} onChange={e => setEditingUser({...editingUser, isAdmin: e.target.checked})} className="bg-neutral-900" /> Admin</label>
        </div>
        <div className="flex gap-2 pt-2">
            <button onClick={handleSaveUser} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-sm">Save</button>
            <button onClick={() => setEditingUser(null)} className="bg-neutral-700 text-white px-4 py-1.5 rounded text-sm">Cancel</button>
        </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
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
                            <span className="text-neutral-300">{date}</span>
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
                            <span className="text-neutral-300">{date}</span>
                            <button onClick={() => handleReopenDate(date)} className="text-xs text-green-400 font-bold">OPEN</button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>
      {/* Users */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Manage Members ({users.length})</h2>
            <button onClick={() => setEditingUser(defaultUser)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm">+ Add Member</button>
        </div>
        {editingUser && renderUserForm()}
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
            {users.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-neutral-800 p-2 rounded">
                    <div className="flex items-center gap-3">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-neutral-400">{user.email}</span>
                        {user.isMember ? <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full">Paid</span> : <span className="text-xs text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded-full">Lapsed</span>}
                        {user.isAdmin && <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setEditingUser(user)} className="text-xs text-neutral-400 hover:text-white">Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                    </div>
                </div>
            ))}
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
    </div>
  );
};