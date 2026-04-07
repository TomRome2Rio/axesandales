import React, { useState } from 'react';
import { ClubEvent, User } from '../types';
import { AddEventModal } from './AddEventModal';
import * as firebaseService from '../services/firebaseService';

interface EventsViewProps {
  events: ClubEvent[];
  user: User | null;
  eventTags: string[];
  nextClubDate: string | null;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateRange = (start: string, end: string): string => {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} — ${formatDate(end)}`;
};

const formatMonthHeading = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

/** Return every month key an event spans (e.g. Apr–Jun → 3 keys). */
const getMonthKeys = (start: string, end: string): string[] => {
  const [sY, sM] = start.split('-').map(Number);
  const [eY, eM] = end.split('-').map(Number);
  const keys: string[] = [];
  let y = sY, m = sM;
  while (y < eY || (y === eY && m <= eM)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return keys;
};

const isUpcoming = (event: ClubEvent): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return event.endDate >= today;
};

export const EventsView: React.FC<EventsViewProps> = ({ events, user, eventTags, nextClubDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const canManageEvents = user?.isAdmin || import.meta.env.DEV;

  const upcomingEvents = events.filter(isUpcoming).filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedTags.length > 0 && !selectedTags.some(tag => event.tags?.includes(tag))) return false;
    return true;
  });

  // Group events by month — multi-month events appear in each month they span
  const groupedByMonth: Map<string, ClubEvent[]> = new Map();
  for (const event of upcomingEvents) {
    for (const key of getMonthKeys(event.startDate, event.endDate)) {
      const group = groupedByMonth.get(key) || [];
      group.push(event);
      groupedByMonth.set(key, group);
    }
  }
  // Sort events within each month by start date
  for (const [, group] of groupedByMonth) {
    group.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  const monthKeys = [...groupedByMonth.keys()].sort();

  const handleSave = async (event: ClubEvent) => {
    await firebaseService.saveEvent(event);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setDeletingId(id);
      try {
        await firebaseService.deleteEvent(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Next club night banner */}
      {nextClubDate && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-900/40 border border-amber-800/50">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Next Club Night</h3>
            <p className="text-amber-400 text-sm">{formatDate(nextClubDate)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Upcoming Events
        </h1>
        {canManageEvents && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2 px-5 rounded-lg shadow-lg shadow-amber-900/40 transform transition hover:-translate-y-0.5"
          >
            + Add Event
          </button>
        )}
      </div>

      {/* Search & tag filters */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-neutral-900 border border-neutral-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none placeholder-neutral-500"
          />
        </div>
        {eventTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {eventTags.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-amber-900/50 border-amber-700 text-amber-300'
                      : 'bg-neutral-900 border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedTags([]); }}
                className="text-xs px-2.5 py-1 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-neutral-400">No upcoming events scheduled.</p>
          {canManageEvents && (
            <button onClick={() => setIsModalOpen(true)} className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">
              Add the first event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {monthKeys.map(monthKey => (
            <div key={monthKey}>
              <h2 className="text-lg font-bold text-neutral-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatMonthHeading(monthKey)}
              </h2>
              <div className="space-y-3">
                {groupedByMonth.get(monthKey)!.map(event => {
            const isMultiDay = event.startDate !== event.endDate;
            return (
              <div key={event.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 hover:border-neutral-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">{event.title}</h3>
                      {isMultiDay && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 border border-amber-800 text-amber-400 whitespace-nowrap">
                          Multi-day
                        </span>
                      )}
                    </div>
                    {event.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {event.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-700/50 border border-neutral-600 text-neutral-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-amber-400 mb-2">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateRange(event.startDate, event.endDate)}
                    </div>
                    {event.description && (
                      <p className="text-neutral-300 text-sm whitespace-pre-wrap">{event.description}</p>
                    )}
                  </div>
                  {canManageEvents && (
                    <div className="shrink-0 flex flex-col gap-1">
                      <button
                        onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                        className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-900/20 transition-colors"
                        title="Edit event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {canManageEvents && user && (
        <AddEventModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
          onSave={handleSave}
          userId={user.id}
          userName={user.name}
          availableTags={eventTags}
          onAddTag={async (tag) => { await firebaseService.addEventTag(tag); }}
          onDeleteTag={async (tag) => { await firebaseService.deleteEventTag(tag); }}
          editingEvent={editingEvent}
        />
      )}
    </div>
  );
};
