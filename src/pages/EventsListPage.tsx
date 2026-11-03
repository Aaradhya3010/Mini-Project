import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { useHallsAndEquipment } from '../hooks/useHallsAndEquipment';
import { useAuth } from '../context/AuthContext';
import { EventCard } from '../components/EventCard';
import { EventDetailModal } from '../components/EventDetailModal';
import { LoadingSpinner, ErrorBanner } from '../components/Feedback';
import { Event, EventStatus } from '../types';

export const EventsListPage: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const {
    events,
    isLoading,
    error,
    refreshEvents,
    registerForEvent,
    unregisterFromEvent,
    approveEvent,
    rejectEvent,
    cancelEvent,
  } = useEvents();

  const { halls } = useHallsAndEquipment();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHall, setSelectedHall] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EventStatus>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search filter
      const matchesSearch =
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.hall_details?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.organizer_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Hall filter
      const matchesHall = selectedHall === 'all' || ev.hall === Number(selectedHall);

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;

      return matchesSearch && matchesHall && matchesStatus;
    });
  }, [events, searchTerm, selectedHall, statusFilter]);

  const isStudent = role === 'STUDENT';
  const canCreate = isAuthenticated && (role === 'FACULTY' || role === 'ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Events</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse upcoming workshops, conferences, seminars, and club activities
          </p>
        </div>

        {canCreate && (
          <Link
            to="/events/new"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Booking</span>
          </Link>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={refreshEvents} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event title, hall, or speaker..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Hall Dropdown */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 sm:w-64">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full text-xs text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">All Halls ({halls.length})</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Segmented Control Buttons (Interactive filter controls allowed) */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          {(['ALL', 'APPROVED', 'PENDING', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Events' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading && events.length === 0 ? (
        <LoadingSpinner message="Loading events..." className="min-h-[400px]" />
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No events matched</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or clear active filters.
          </p>
          {(searchTerm || selectedHall !== 'all' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedHall('all');
                setStatusFilter('ALL');
              }}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={setSelectedEvent}
              onRegister={isStudent ? registerForEvent : undefined}
            />
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={registerForEvent}
        onUnregister={unregisterFromEvent}
        onApprove={approveEvent}
        onReject={rejectEvent}
        onCancel={cancelEvent}
      />
    </div>
  );
};
