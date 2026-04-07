import React, { useState, useEffect } from 'react';
import { ClubEvent } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ClubEvent) => void;
  userId: string;
  userName: string;
  availableTags: string[];
  onAddTag: (tag: string) => void;
  editingEvent?: ClubEvent | null;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSave, userId, userName, availableTags, onAddTag, editingEvent }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description);
      setStartDate(editingEvent.startDate);
      setEndDate(editingEvent.endDate);
      setSelectedTags(editingEvent.tags || []);
      setNewTag('');
      setError('');
    } else if (isOpen) {
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setSelectedTags([]);
      setNewTag('');
      setError('');
    }
  }, [isOpen, editingEvent]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!startDate) { setError('Start date is required.'); return; }
    if (!endDate) { setError('End date is required.'); return; }
    if (endDate < startDate) { setError('End date cannot be before start date.'); return; }

    const event: ClubEvent = {
      id: editingEvent?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
      tags: selectedTags,
      createdBy: editingEvent?.createdBy || userId,
      createdByName: editingEvent?.createdByName || userName,
      createdAt: editingEvent?.createdAt || Date.now(),
    };

    onSave(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="e.g. Tournament Weekend"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              placeholder="Details about the event..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-amber-900/50 border-amber-700 text-amber-300'
                        : 'bg-neutral-800 border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = newTag.trim();
                    if (trimmed && !availableTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
                      onAddTag(trimmed);
                    }
                    if (trimmed && !selectedTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
                      setSelectedTags(prev => [...prev, trimmed]);
                    }
                    setNewTag('');
                  }
                }}
                className="flex-1 bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Add new tag..."
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newTag.trim();
                  if (!trimmed) return;
                  if (!availableTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
                    onAddTag(trimmed);
                  }
                  if (!selectedTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
                    setSelectedTags(prev => [...prev, trimmed]);
                  }
                  setNewTag('');
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-sm transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold transition-colors"
          >
            {editingEvent ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
};
